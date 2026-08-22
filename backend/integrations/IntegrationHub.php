<?php
/**
 * AV OS — INTEGRATION HUB (v2.4)
 *
 * Single registry + dispatcher for every external connection.
 * Rules enforced here:
 *   - Secrets (keys/tokens/passwords) are encrypted at rest (aes-256-cbc, AV_ENC_KEY)
 *     and NEVER returned by any API, logged, or echoed into admin HTML/JS.
 *   - status 'connected' is ONLY set after a real, successful provider request.
 *   - Every external call is logged (integration_calls) with request id + duration,
 *     never with credentials.
 *   - GET-like reads go through api_cache (hash keyed) to dedupe + respect quotas.
 *   - Rate limits / retries / backoff are respected per adapter.
 *   - Failures never break the website: log → retry → fallback → continue.
 */

interface IntegrationAdapterInterface
{
    /** unique registry code, e.g. 'gsc' */
    public function code(): string;

    /** verify credentials with a real request; sets CONNECTED only on success */
    public function test(array $config): array;

    /** pull + normalize + store data; returns ['ok'=>bool,'imported'=>int,'message'=>..] */
    public function sync(array $config): array;

    /** which agent jobs should be enqueued after a successful sync */
    public function triggers(): array;

    /** true when the adapter works fully without any credentials (public/free) */
    public function publicType(): bool;

    /** human list of capabilities on the user's free tier */
    public function capabilities(): array;
}

final class IntegrationHub
{
    /* ================= secrets =================
       config_enc is a JSON column → secrets are stored as a versioned JSON envelope.
       v3 (current): AES-256-GCM — confidentiality + authenticated integrity:
         {"v":3,"alg":"aes-256-gcm","iv":"<b64 12B>","tag":"<b64 16B>","ciphertext":"<b64>"}
       v2 (legacy):  AES-256-CBC  {"v":2,"enc":"<b64 iv+cipher>"} — still decryptable;
       reads of v2 lazily upgrade to v3. Never plaintext. */
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

    /** Seal a secrets array into the versioned JSON envelope (AES-256-GCM). */
    public static function seal(array $secret): string
    {
        return self::encrypt(json_encode($secret, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /** Open the secrets envelope; v3 (GCM) → v2 legacy → raw-CBC fallback. */
    public static function open(?string $configEnc): array
    {
        if ($configEnc === null || $configEnc === '') return [];
        $dec = self::decrypt((string)$configEnc);
        if ($dec === '') return [];
        $d = json_decode($dec, true);
        return is_array($d) ? $d : [];
    }

    /* ================= registry ================= */
    public static function all(): array
    {
        $rows = Database::all("SELECT * FROM integrations ORDER BY category, id");
        foreach ($rows as &$r) {
            $r['has_secret'] = !empty($r['config_enc']);
            unset($r['config_enc']);
            $r['configuration'] = $r['configuration'] ? json_decode((string)$r['configuration'], true) : null;
            $r['capabilities'] = $r['capabilities'] ? json_decode((string)$r['capabilities'], true) : null;
            $r['rate_limit'] = $r['rate_limit'] ? json_decode((string)$r['rate_limit'], true) : null;
            $r['status_label'] = self::statusLabel($r['status']);
        }
        return $rows;
    }

    public static function byCode(string $code): ?array
    {
        $r = Database::one("SELECT * FROM integrations WHERE code=?", [$code]);
        if (!$r) return null;
        // lazy crypto upgrade: legacy CBC (v2) envelopes are re-sealed to AES-256-GCM (v3)
        if (!empty($r['config_enc']) && (json_decode((string)$r['config_enc'], true)['v'] ?? 2) < 3) {
            $secrets = self::open((string)$r['config_enc']);
            if ($secrets) {
                Database::q("UPDATE integrations SET config_enc=? WHERE code=?", [self::seal($secrets), $code]);
                $r['config_enc'] = Database::one("SELECT config_enc FROM integrations WHERE code=?", [$code])['config_enc'];
            }
        }
        $r['secret'] = self::open((string)$r['config_enc']);
        $r['has_secret'] = count($r['secret']) > 0;
        unset($r['config_enc']);
        $r['configuration'] = $r['configuration'] ? json_decode((string)$r['configuration'], true) : null;
        $r['capabilities'] = $r['capabilities'] ? json_decode((string)$r['capabilities'], true) : null;
        return $r;
    }

    /** Save config. Secrets go into config_enc (encrypted JSON envelope); public config into configuration JSON. */
    public static function saveConfig(string $code, array $d): void
    {
        $row = Database::one("SELECT * FROM integrations WHERE code=?", [$code]);
        if (!$row) throw new RuntimeException("Unknown integration $code");

        $secretFields = ['api_key', 'api_secret', 'access_token', 'refresh_token', 'client_secret',
                         'token', 'signing_key', 'private_key', 'password',
                         'service_account_json', 'phone_number_id'];
        $secret = self::open((string)$row['config_enc']);
        $public = $row['configuration'] ? json_decode((string)$row['configuration'], true) : [];
        foreach ($d as $k => $v) {
            if (in_array($k, $secretFields, true)) {
                if (is_string($v) && $v !== '') $secret[$k] = $v;      // never store blank
            } else {
                $public[$k] = $v;
            }
        }
        $enc = self::seal($secret);
        Database::q("UPDATE integrations SET config_enc=?, configuration=?, authentication_type=? WHERE code=?",
            [$enc, json_encode($public, JSON_UNESCAPED_UNICODE), (string)($d['authentication_type'] ?? $row['authentication_type']), $code]);
        // a config change drops any prior 'connected' claim until re-verified
        if ($secret) self::setStatus($code, 'not_connected', 'Configuration updated — re-run the connection test.');
    }

    public static function setStatus(string $code, string $status, string $error = ''): void
    {
        Database::q("UPDATE integrations SET status=?, last_error=?
                     WHERE code=?", [$status, mb_substr($error, 0, 500), $code]);
    }

    public static function setEnabled(string $code, bool $enabled): void
    {
        Database::q("UPDATE integrations SET enabled=?, status=CASE WHEN ? THEN status ELSE 'disabled' END WHERE code=?",
            [(int)$enabled, (int)$enabled, $code]);
    }

    public static function markSync(string $code, bool $ok, string $error = ''): void
    {
        if ($ok) {
            Database::q("UPDATE integrations SET last_sync_at=NOW(), last_success_at=NOW(), last_error=''
                         WHERE code=?", [$code]);
        } else {
            Database::q("UPDATE integrations SET last_sync_at=NOW(), last_failure_at=NOW(), last_error=?,
                         status=CASE WHEN status='connected' THEN status ELSE 'error' END
                         WHERE code=?", [mb_substr($error, 0, 500), $code]);
        }
    }

    public static function statusLabel(string $s): string
    {
        return match ($s) {
            'connected' => 'CONNECTED',
            'configured' => 'CONFIGURED',
            'not_connected' => 'NOT CONNECTED',
            'auth_required' => 'AUTH REQUIRED',
            'rate_limited' => 'RATE LIMITED',
            'error' => 'ERROR',
            'disabled' => 'DISABLED',
            'unavailable' => 'UNAVAILABLE',
            'limited' => 'LIMITED — MANUAL / APPROVAL REQUIRED',
            'manual' => 'MANUAL',
            default => strtoupper($s),
        };
    }

    /* ================= adapter registry ================= */
    private static array $adapters = [];

    public static function registerAdapter(IntegrationAdapterInterface $a): void
    {
        self::$adapters[$a->code()] = $a;
    }

    public static function adapter(string $code): ?IntegrationAdapterInterface
    {
        return self::$adapters[$code] ?? null;
    }

    public static function adapters(): array
    {
        return array_keys(self::$adapters);
    }

    /** agents → tools they may touch (permissions live in ai_agents.permissions.tools) */
    public static function agentTools(string $agentSlug): array
    {
        $a = AgentRegistry::bySlug($agentSlug);
        if (!$a) return [];
        $perms = json_decode((string)($a['permissions'] ?? '{}'), true) ?: [];
        return $perms['tools'] ?? [];
    }

    public static function toolGraph(): array
    {
        $out = [];
        foreach (AgentRegistry::all() as $a) {
            $tools = self::agentTools($a['slug']);
            if ($tools) $out[] = ['agent' => $a['slug'], 'label' => $a['name'], 'tools' => $tools];
        }
        return $out;
    }

    /* ================= HTTP + cache + log ================= */
    /**
     * Central HTTP helper: logs every call, honors api_cache for GETs,
     * never logs credentials. Returns ['ok','status','body','ms'].
     */
    public static function http(string $method, string $url, array $headers = [], ?string $body = null,
                                int $timeout = 20, bool $cacheable = false, string $agent = ''): array
    {
        $cacheKey = '';
        if ($cacheable && $method === 'GET') {
            $cacheKey = hash('sha256', $url . '|' . json_encode($headers) . '|' . json_encode($body));
            $hit = Database::one("SELECT payload FROM api_cache WHERE cache_key=? AND expires_at > NOW()", [$cacheKey]);
            if ($hit) {
                $p = json_decode((string)$hit['payload'], true);
                $bodyOut = is_array($p) && isset($p['b64']) ? base64_decode($p['b64']) : (is_array($p) ? json_encode($p) : (string)$hit['payload']);
                IntegrationLog::add('cache', $url, $agent, 0, true, 0, '', 'cache hit');
                return ['ok' => true, 'status' => 200, 'body' => $bodyOut, 'ms' => 0, 'cached' => true];
            }
        }

        $t0 = microtime(true);
        $ch = curl_init($url);
        $h = array_merge(['Accept: application/json', 'User-Agent: AV-OS/2.4 (+https://abhijeetvarghese.com)'], $headers);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTPHEADER => $h,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        if ($method === 'POST') { curl_setopt($ch, CURLOPT_POST, true); if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body); }
        if ($method === 'PUT')  { curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');  if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body); }
        if ($method === 'DELETE'){ curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE'); }
        $res = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $ms = (int)round((microtime(true) - $t0) * 1000);
        $err = curl_errno($ch) ? curl_error($ch) : '';
        curl_close($ch);
        if ($res === false || $res === null) $res = '';

        $ok = $status >= 200 && $status < 300 && $err === '';
        IntegrationLog::add($cacheKey ? 'cache-miss' : 'http', self::redactUrl($url), $agent, $ms, $ok, $status, $err);

        if ($ok && $cacheable && $method === 'GET' && $cacheKey) {
            // payload column is JSON → wrap raw bytes in a base64 envelope
            $payload = json_encode(['b64' => base64_encode($res)], JSON_UNESCAPED_SLASHES);
            Database::q("INSERT INTO api_cache (cache_key, provider, endpoint, payload, expires_at)
                         VALUES (?,?,?,?, NOW() + INTERVAL 15 MINUTE)
                         ON DUPLICATE KEY UPDATE payload=VALUES(payload), expires_at=VALUES(expires_at)",
                [$cacheKey, self::providerFromUrl($url), mb_substr($url, 0, 255), $payload]);
        }
        return ['ok' => $ok, 'status' => $status, 'body' => $res, 'ms' => $ms, 'cached' => false, 'error' => $err];
    }

    /** Strip credential-looking query params (apikey, key, token, signature…) from logged URLs. */
    public static function redactUrl(string $url): string
    {
        $u = parse_url($url);
        if (empty($u['query'])) return $url;
        parse_str($u['query'], $q);
        $redact = ['apikey', 'api_key', 'key', 'token', 'access_token', 'signature', 'sig', 'secret', 'password', 'assertion'];
        foreach ($q as $k => $v) {
            if (in_array(strtolower((string)$k), $redact, true)) $q[$k] = '***';
        }
        $u['query'] = http_build_query($q);
        return (($u['scheme'] ?? 'http') . '://' . ($u['host'] ?? '') . ($u['path'] ?? '') . '?' . $u['query']);
    }

    private static function providerFromUrl(string $url): string
    {
        if (str_contains($url, 'searchconsole.googleapis.com')) return 'gsc';
        if (str_contains($url, 'analyticsdata.googleapis.com')) return 'ga4';
        if (str_contains($url, 'api.github.com')) return 'github';
        if (str_contains($url, 'api.calendly.com')) return 'calendly';
        if (str_contains($url, 'api.cloudflare.com')) return 'cloudflare';
        if (str_contains($url, 'www.googleapis.com/drive')) return 'drive';
        if (str_contains($url, 'api.notion.com')) return 'notion';
        if (str_contains($url, 'ssl.bing.com')) return 'bing';
        if (str_contains($url, 'api.clarity.ms')) return 'clarity';
        if (str_contains($url, 'trends.google.com')) return 'trends';
        return 'http';
    }

    /** graceful JSON parse of an API body */
    public static function json(string $body): array
    {
        $d = json_decode($body, true);
        return is_array($d) ? $d : [];
    }

    /* ================= runner ================= */
    /** Run a sync for one integration (called by cron + API). Returns result array. */
    public static function syncOne(string $code, string $agent = 'cron'): array
    {
        $row = self::byCode($code);
        if (!$row) return ['ok' => false, 'error' => "Unknown integration $code"];
        $adapter = self::adapter($code);
        if (!$adapter) return ['ok' => false, 'error' => "No adapter for $code (virtual/manual)"];
        if (!(int)$row['enabled']) return ['ok' => false, 'error' => 'Integration disabled'];

        $config = array_merge((array)$row['configuration'], $row['secret']);

        try {
            $res = $adapter->sync($config);
            $ok = !empty($res['ok']);
            self::markSync($code, $ok, $res['error'] ?? '');
            if ($ok && $adapter->publicType()) {
                self::setStatus($code, 'connected', '');   // verified by this real request
                Database::q("UPDATE integrations SET last_success_at=NOW() WHERE code=?", [$code]);
            }
            if ($ok) {
                foreach ($adapter->triggers() as $slug) {
                    if (!AgentSettings::isPaused(AgentSettings::scopeOf($slug))) {
                        AgentJobs::enqueue($slug, 'run', ['source' => $code], 'medium');
                    }
                }
            }
            return ['ok' => $ok, 'imported' => $res['imported'] ?? 0, 'message' => $res['message'] ?? '',
                    'error' => $res['error'] ?? ''];
        } catch (Throwable $e) {
            self::markSync($code, false, $e->getMessage());
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /** Test connection with a real request; CONNECTED only on success. */
    public static function testOne(string $code): array
    {
        $row = self::byCode($code);
        if (!$row) return ['ok' => false, 'error' => "Unknown integration $code"];
        $adapter = self::adapter($code);
        if (!$adapter) return ['ok' => false, 'error' => 'No automated test for this integration (manual/limited)',
                               'status' => $row['status']];

        $config = array_merge((array)$row['configuration'], $row['secret']);

        try {
            $res = $adapter->test($config);
            if (!empty($res['ok'])) {
                self::setStatus($code, 'connected', '');
                Database::q("UPDATE integrations SET last_success_at=NOW() WHERE code=?", [$code]);
            } else {
                self::setStatus($code, 'auth_required', $res['error'] ?? 'Connection failed');
                Database::q("UPDATE integrations SET last_failure_at=NOW(), last_error=? WHERE code=?",
                    [mb_substr((string)($res['error'] ?? 'Connection failed'), 0, 500), $code]);
            }
            return $res;
        } catch (Throwable $e) {
            self::setStatus($code, 'error', $e->getMessage());
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /** Which integrations are due for a sync right now (SQL time comparison). */
    public static function due(): array
    {
        return Database::all(
            "SELECT * FROM integrations
             WHERE enabled=1 AND sync_interval_minutes > 0
               AND (last_sync_at IS NULL OR last_sync_at < NOW() - INTERVAL sync_interval_minutes MINUTE)
             ORDER BY last_sync_at IS NULL DESC, id"
        );
    }

    /** overall hub health for the status endpoint */
    public static function health(): array
    {
        $all = Database::all("SELECT status, COUNT(*) n FROM integrations GROUP BY status");
        $connected = 0;
        foreach ($all as $r) if ($r['status'] === 'connected') $connected += (int)$r['n'];
        $errors = Database::one("SELECT COUNT(*) n FROM integrations WHERE status='error'")['n'];
        $calls24h = Database::one("SELECT COUNT(*) n FROM integration_calls WHERE created_at > NOW() - INTERVAL 24 HOUR")['n'];
        return ['total' => (int)Database::one("SELECT COUNT(*) n FROM integrations")['n'],
                'connected' => $connected, 'errors' => (int)$errors, 'calls_24h' => (int)$calls24h];
    }
}

final class IntegrationLog
{
    public static function add(string $provider, string $endpoint, string $agent, int $ms, bool $ok, int $status, string $error, string $requestId = ''): void
    {
        try {
            Database::q("INSERT INTO integration_calls (provider, endpoint, agent, request_id, duration_ms, success, status_code, error)
                         VALUES (?,?,?,?,?,?,?,?)",
                [mb_substr($provider, 0, 60), mb_substr($endpoint, 0, 255), mb_substr($agent, 0, 60),
                 mb_substr($requestId ?: (defined('AV_REQUEST_ID') ? AV_REQUEST_ID : ''), 0, 40),
                 $ms, (int)$ok, $status, mb_substr($error, 0, 500)]);
        } catch (Throwable $e) { /* never break on logging */ }
    }

    public static function recent(string $provider = '', int $limit = 50): array
    {
        if ($provider !== '') {
            return Database::all("SELECT * FROM integration_calls WHERE provider=? ORDER BY id DESC LIMIT ?", [$provider, $limit]);
        }
        return Database::all("SELECT * FROM integration_calls ORDER BY id DESC LIMIT ?", [$limit]);
    }
}

/** OAuth2 helpers (pure PHP — JWT RS256 for Google service accounts). */
final class OAuth2
{
    /** Exchange a Google service-account JWT for an access token. */
    public static function googleServiceAccount(array $sa, string $scope): string
    {
        return self::googleServiceAccountAt($sa, $scope, 'https://oauth2.googleapis.com/token');
    }

    /** Service-account token exchange at a custom token URL (test fixtures). */
    public static function googleServiceAccountAt(array $sa, string $scope, string $tokenUrl): string
    {
        $now = time();
        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $claims = ['iss' => $sa['client_email'], 'scope' => $scope,
                   'aud' => $tokenUrl, 'iat' => $now, 'exp' => $now + 3600];
        $b64 = function (array $a): string { return rtrim(strtr(base64_encode(json_encode($a)), '+/', '-_'), '='); };
        $signingInput = $b64($header) . '.' . $b64($claims);
        $key = openssl_pkey_get_private($sa['private_key']);
        if (!$key) throw new RuntimeException('Invalid service account private key');
        openssl_sign($signingInput, $sig, $key, OPENSSL_ALGO_SHA256);
        $jwt = $signingInput . '.' . rtrim(strtr(base64_encode($sig), '+/', '-_'), '=');

        $res = IntegrationHub::http('POST', $tokenUrl, [
            'Content-Type: application/x-www-form-urlencoded',
        ], 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' . urlencode($jwt));
        if (!$res['ok']) throw new RuntimeException('OAuth token exchange failed: ' . ($res['error'] ?: ('HTTP ' . $res['status'])));
        $d = IntegrationHub::json($res['body']);
        if (empty($d['access_token'])) throw new RuntimeException('OAuth token exchange returned no token');
        return $d['access_token'];
    }

    /** Exchange OAuth client credentials (client_id/secret/refresh_token) for a token. */
    public static function refreshToken(string $tokenUrl, string $clientId, string $clientSecret, string $refreshToken, array $extra = []): string
    {
        $params = array_merge([
            'grant_type' => 'refresh_token',
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'refresh_token' => $refreshToken,
        ], $extra);
        $res = IntegrationHub::http('POST', $tokenUrl, ['Content-Type: application/x-www-form-urlencoded'], http_build_query($params));
        if (!$res['ok']) throw new RuntimeException('Token refresh failed: ' . ($res['error'] ?: ('HTTP ' . $res['status'])));
        $d = IntegrationHub::json($res['body']);
        if (empty($d['access_token'])) throw new RuntimeException('Token refresh returned no token');
        return $d['access_token'];
    }

    /** OAuth2 authorization URL builder (for user-configured client apps). */
    public static function authorizeUrl(string $authUrl, string $clientId, string $redirectUri, string $scope, string $state): string
    {
        return $authUrl . '?' . http_build_query([
            'client_id' => $clientId, 'redirect_uri' => $redirectUri, 'response_type' => 'code',
            'scope' => $scope, 'state' => $state, 'access_type' => 'offline', 'prompt' => 'consent',
        ]);
    }
}
