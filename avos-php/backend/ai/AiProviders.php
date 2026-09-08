<?php
/**
 * AV OS — AI provider abstraction.
 * Add a provider by implementing AiProviderInterface and registering it.
 * Keys are encrypted at rest (openssl + AV_ENC_KEY) and never sent to the
 * browser. AI output ALWAYS requires human approval before publishing.
 */

interface AiProviderInterface
{
    public function code(): string;
    public function label(): string;
    public function defaultModel(): string;
    /** @return array{text:string, tokens_in:int, tokens_out:int} */
    public function chat(string $apiKey, string $model, array $messages, float $temperature, int $maxTokens): array;
}

final class AiService
{
    private static array $registry = [];

    public static function register(AiProviderInterface $p): void
    {
        self::$registry[$p->code()] = $p;
    }

    public static function providers(): array
    {
        $out = [];
        foreach (self::$registry as $p) {
            $out[] = ['code' => $p->code(), 'label' => $p->label(), 'model' => $p->defaultModel()];
        }
        return $out;
    }

    /** Config from DB with key decrypted */
    public static function config(?string $code = null): ?array
    {
        $rows = Database::all("SELECT * FROM ai_providers WHERE enabled=1");
        if (!$rows) return null;
        if ($code) {
            $row = null;
            foreach ($rows as $r) if ($r['code'] === $code) { $row = $r; break; }
            if (!$row) return null;
        } else {
            $row = $rows[0];
            foreach ($rows as $r) if ($r['is_default']) { $row = $r; break; }
        }
        return [
            'code' => $row['code'],
            'model' => $row['model'] ?: self::$registry[$row['code']]->defaultModel(),
            'temperature' => (float)$row['temperature'],
            'max_tokens' => (int)$row['max_tokens'],
            'api_key' => self::decrypt($row['api_key_enc']),
        ];
    }

    /** v3 AES-256-GCM envelope (authenticated); legacy CBC values still decrypt. */
    public static function encrypt(string $plain): string
    {
        if ($plain === '') return '';
        $iv = random_bytes(12);
        $cipher = openssl_encrypt($plain, 'aes-256-gcm', AV_ENC_KEY, OPENSSL_RAW_DATA, $iv, $tag);
        return json_encode(['v' => 3, 'alg' => 'aes-256-gcm', 'iv' => base64_encode($iv), 'tag' => base64_encode($tag), 'ciphertext' => base64_encode($cipher)], JSON_UNESCAPED_SLASHES);
    }

    public static function decrypt(?string $enc): string
    {
        if ($enc === null || $enc === '') return '';
        $d = json_decode($enc, true);
        if (is_array($d) && ($d['v'] ?? 0) === 3 && !empty($d['iv']) && !empty($d['tag']) && isset($d['ciphertext'])) {
            $iv = base64_decode((string)$d['iv']);
            $tag = base64_decode((string)$d['tag']);
            $ct = base64_decode((string)$d['ciphertext']);
            if ($iv === false || $tag === false || $ct === false) return '';
            return openssl_decrypt($ct, 'aes-256-gcm', AV_ENC_KEY, OPENSSL_RAW_DATA, $iv, $tag) ?: '';
        }
        // legacy v2 CBC: {"v":2,"enc":"<b64 iv16+cipher>"} or raw b64(iv16+cipher)
        if (is_array($d) && !empty($d['enc'])) $enc = (string)$d['enc'];
        $raw = base64_decode($enc);
        if ($raw === false || strlen($raw) <= 16) return '';
        $iv = substr($raw, 0, 16);
        return openssl_decrypt(substr($raw, 16), 'aes-256-cbc', AV_ENC_KEY, 0, $iv) ?: '';
    }

    public static function saveConfig(string $code, array $d): void
    {
        $keyEnc = isset($d['api_key']) && $d['api_key'] !== '' ? self::encrypt($d['api_key']) : null;
        $sql = "UPDATE ai_providers SET model=?, temperature=?, max_tokens=?, is_default=?, enabled=?" . ($keyEnc ? ", api_key_enc=?" : "") . " WHERE code=?";
        $params = [$d['model'] ?? '', (float)($d['temperature'] ?? 0.7), (int)($d['max_tokens'] ?? 2000),
                   (int)($d['is_default'] ?? 0), (int)($d['enabled'] ?? 1)];
        if ($keyEnc) $params[] = $keyEnc;
        $params[] = $code;
        Database::q($sql, $params);
    }

    /** Central chat entry: provider abstraction + usage logging */
    public static function chat(string $system, string $user, ?string $providerCode = null, string $action = 'generic'): array
    {
        // hard budget gate FIRST — the system NEVER spends past the configured
        // caps, even with a misconfigured/missing key (enforced at the money exit)
        $settings = AgentSettings::get();
        // 0 = hard zero (no LLM spend allowed); any positive value = cap.
        if (AgentSettings::dailyAiCost() >= $settings['daily_budget']) {
            return ['ok' => false, 'error' => 'AI daily budget reached (₹' . $settings['daily_budget'] . ') — LLM calls blocked. Raise the budget or wait for the reset.'];
        }
        if (AgentSettings::monthlyAiCost() >= $settings['monthly_budget']) {
            return ['ok' => false, 'error' => 'AI monthly budget reached (₹' . $settings['monthly_budget'] . ') — LLM calls blocked.'];
        }
        $cfg = self::config($providerCode);
        if (!$cfg || $cfg['api_key'] === '') {
            return ['ok' => false, 'error' => 'No AI provider configured. Add an API key in Integrations → AI.'];
        }
        $p = self::$registry[$cfg['code']] ?? null;
        if (!$p) return ['ok' => false, 'error' => 'Unknown provider ' . $cfg['code']];

        try {
            $res = $p->chat($cfg['api_key'], $cfg['model'],
                [['role' => 'system', 'content' => $system], ['role' => 'user', 'content' => $user]],
                $cfg['temperature'], $cfg['max_tokens']);
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => 'AI request failed: ' . $e->getMessage()];
        }

        Database::q(
            "INSERT INTO ai_requests (user_id, provider, action, prompt, response, model, tokens_in, tokens_out, ok)
             VALUES (?,?,?,?,?,?,?,?,1)",
            [Auth::user()['id'] ?? null, $cfg['code'], $action, mb_substr($user, 0, 4000),
             mb_substr($res['text'], 0, 4000), $cfg['model'], $res['tokens_in'], $res['tokens_out']]
        );
        return ['ok' => true, 'text' => $res['text'], 'provider' => $cfg['code'], 'model' => $cfg['model']];
    }
}

/* ---------- OpenAI ---------- */
final class OpenAiProvider implements AiProviderInterface
{
    public function code(): string { return 'openai'; }
    public function label(): string { return 'OpenAI'; }
    public function defaultModel(): string { return 'gpt-4o'; }
    public function chat(string $key, string $model, array $messages, float $temp, int $max): array
    {
        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $key],
            CURLOPT_POSTFIELDS => json_encode(['model' => $model, 'messages' => $messages, 'temperature' => $temp, 'max_tokens' => $max]),
            CURLOPT_TIMEOUT => 60,
        ]);
        $body = curl_exec($ch);
        $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($http !== 200) throw new RuntimeException('OpenAI HTTP ' . $http . ': ' . mb_substr((string)$body, 0, 300));
        $d = json_decode((string)$body, true);
        return [
            'text' => $d['choices'][0]['message']['content'] ?? '',
            'tokens_in' => $d['usage']['prompt_tokens'] ?? 0,
            'tokens_out' => $d['usage']['completion_tokens'] ?? 0,
        ];
    }
}

/* ---------- Anthropic Claude ---------- */
final class ClaudeProvider implements AiProviderInterface
{
    public function code(): string { return 'claude'; }
    public function label(): string { return 'Anthropic Claude'; }
    public function defaultModel(): string { return 'claude-sonnet-4-20250514'; }
    public function chat(string $key, string $model, array $messages, float $temp, int $max): array
    {
        $system = '';
        foreach ($messages as $m) { if ($m['role'] === 'system') $system .= $m['content'] . "\n"; }
        $conv = array_values(array_filter($messages, fn($m) => $m['role'] !== 'system'));
        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'x-api-key: ' . $key, 'anthropic-version: 2023-06-01'],
            CURLOPT_POSTFIELDS => json_encode(['model' => $model, 'system' => $system, 'messages' => $conv, 'temperature' => $temp, 'max_tokens' => $max]),
            CURLOPT_TIMEOUT => 60,
        ]);
        $body = curl_exec($ch);
        $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($http !== 200) throw new RuntimeException('Claude HTTP ' . $http . ': ' . mb_substr((string)$body, 0, 300));
        $d = json_decode((string)$body, true);
        return [
            'text' => $d['content'][0]['text'] ?? '',
            'tokens_in' => $d['usage']['input_tokens'] ?? 0,
            'tokens_out' => $d['usage']['output_tokens'] ?? 0,
        ];
    }
}

/* ---------- Google Gemini ---------- */
final class GeminiProvider implements AiProviderInterface
{
    public function code(): string { return 'gemini'; }
    public function label(): string { return 'Google Gemini'; }
    public function defaultModel(): string { return 'gemini-2.0-flash'; }
    public function chat(string $key, string $model, array $messages, float $temp, int $max): array
    {
        $system = '';
        $parts = [];
        foreach ($messages as $m) {
            if ($m['role'] === 'system') { $system = $m['content']; continue; }
            $parts[] = ['role' => $m['role'] === 'assistant' ? 'model' : 'user', 'parts' => [['text' => $m['content']]]];
        }
        $payload = ['contents' => $parts, 'generationConfig' => ['temperature' => $temp, 'maxOutputTokens' => $max]];
        if ($system !== '') $payload['systemInstruction'] = ['parts' => [['text' => $system]]];
        $ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($key));
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 60,
        ]);
        $body = curl_exec($ch);
        $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($http !== 200) throw new RuntimeException('Gemini HTTP ' . $http . ': ' . mb_substr((string)$body, 0, 300));
        $d = json_decode((string)$body, true);
        $meta = $d['usageMetadata'] ?? [];
        return [
            'text' => $d['candidates'][0]['content']['parts'][0]['text'] ?? '',
            'tokens_in' => $meta['promptTokenCount'] ?? 0,
            'tokens_out' => $meta['candidatesTokenCount'] ?? 0,
        ];
    }
}
