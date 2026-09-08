<?php
/**
 * AV OS — SOCIAL & COMMUNICATION ADAPTERS (v2.4)
 * LinkedIn · Instagram · Behance · Dribbble · Canva · WhatsApp · Email.
 *
 * Reality-checked per platform: most social APIs are NOT freely available
 * for posting. These adapters never pretend posting succeeded — they
 * support manual/approval-gated workflows (drafts → human publish) and
 * click-to-chat attribution where that is genuinely possible.
 */

/* ============================================================
   LINKEDIN (manual — posting needs an approved LinkedIn app)
   ============================================================ */
final class LinkedinAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'linkedin'; }

    public function publicType(): bool { return false; }

    public function capabilities(): array
    {
        return ['post' => 'MANUAL — LinkedIn API posting requires an approved LinkedIn developer app + OAuth (rarely granted)',
                'fallback' => 'AI creates draft → admin approval → manual publish on LinkedIn'];
    }

    public function test(array $config): array
    {
        return ['ok' => false, 'error' => 'LinkedIn API posting is not available on a standard free account. Drafts + manual publish flow is used instead.'];
    }

    public function sync(array $config): array
    {
        return ['ok' => false, 'error' => 'No automated LinkedIn sync — profile registered manually'];
    }

    public function triggers(): array { return []; }
}

/* ============================================================
   INSTAGRAM (manual — Graph API needs Business/Creator account)
   ============================================================ */
final class InstagramAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'instagram'; }

    public function capabilities(): array
    {
        return ['post' => 'MANUAL — Instagram Graph API requires a Business/Creator account + Meta app approval',
                'fallback' => 'AI creates draft → admin approval → manual publish'];
    }

    public function publicType(): bool { return false; }

    public function test(array $config): array
    {
        return ['ok' => false, 'error' => 'Instagram Graph API posting is not available on a standard free account. Drafts + manual publish flow is used instead.'];
    }

    public function sync(array $config): array
    {
        return ['ok' => false, 'error' => 'No automated Instagram sync — profile registered manually'];
    }

    public function triggers(): array { return []; }
}

/* ============================================================
   BEHANCE / DRIBBBLE (manual portfolio references)
   ============================================================ */
final class BehanceAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'behance'; }

    public function publicType(): bool { return false; }
    public function capabilities(): array { return ['read' => 'portfolio reference only (manual URL registration — no scraping)']; }
    public function test(array $config): array { return ['ok' => false, 'error' => 'Behance API is not publicly available; profile is a manual authority reference.']; }
    public function sync(array $config): array { return ['ok' => false, 'error' => 'No automated Behance sync — manual URL registration']; }
    public function triggers(): array { return []; }
}

final class DribbbleAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'dribbble'; }

    public function publicType(): bool { return false; }
    public function capabilities(): array { return ['read' => 'portfolio reference only (manual URL registration — no scraping)']; }
    public function test(array $config): array { return ['ok' => false, 'error' => 'Dribbble API requires OAuth app approval; profile is a manual authority reference.']; }
    public function sync(array $config): array { return ['ok' => false, 'error' => 'No automated Dribbble sync — manual URL registration']; }
    public function triggers(): array { return []; }
}

/* ============================================================
   CANVA (Connect API requires app approval — template workflow only)
   ============================================================ */
final class CanvaAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'canva'; }

    public function capabilities(): array
    {
        return ['read' => 'Connect API requires Canva app approval; until then templates/designs are referenced manually',
                'workflow' => 'template → duplicate → populate → review (never overwrite originals)'];
    }

    public function publicType(): bool { return false; }

    public function test(array $config): array
    {
        return ['ok' => false, 'error' => 'Canva Connect API requires an approved app (not available on a standard free account). Use the manual template workflow.'];
    }

    public function sync(array $config): array
    {
        return ['ok' => false, 'error' => 'No automated Canva sync — manual template workflow'];
    }

    public function triggers(): array { return []; }
}

/* ============================================================
   WHATSAPP (click-to-chat attribution always; Cloud API optional)
   ============================================================ */
final class WhatsappAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'whatsapp'; }

    public function publicType(): bool { return true; }

    public function capabilities(): array
    {
        return ['click-to-chat' => 'trackable wa.me links with UTM-style attribution (always available)',
                'cloud-api' => 'optional Meta Cloud API (free tier for service conversations) — only used if configured'];
    }

    public function test(array $config): array
    {
        $token = (string)($config['api_key'] ?? '');
        $phoneId = (string)($config['phone_number_id'] ?? '');
        if ($token === '' || $phoneId === '') {
            return ['ok' => false, 'error' => 'WhatsApp click-to-chat links are available without API. Cloud API messaging requires a Meta app + token + phone number ID (free tier).'];
        }
        $res = IntegrationHub::http('GET', "https://graph.facebook.com/v19.0/{$phoneId}",
            ['Authorization: Bearer ' . $token]);
        if (!$res['ok']) return ['ok' => false, 'error' => 'WhatsApp Cloud API error: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
        return ['ok' => true, 'message' => 'WhatsApp Cloud API verified (phone number ' . $phoneId . ')'];
    }

    public function sync(array $config): array
    {
        // Click-to-chat links live in trackable_links (kind=whatsapp) — nothing to sync from WhatsApp itself.
        $n = (int)Database::one("SELECT COUNT(*) n FROM trackable_links WHERE kind='whatsapp'")['n'];
        return ['ok' => true, 'imported' => 0, 'message' => $n . ' trackable WhatsApp link(s) active'];
    }

    public function triggers(): array { return ['lead-intel']; }
}

/* ============================================================
   EMAIL (Hostinger SMTP / Gmail via existing SmtpClient)
   ============================================================ */
final class EmailAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'email'; }

    public function capabilities(): array
    {
        return ['write' => 'transactional email: lead notifications, admin/agent alerts, password reset, system errors, weekly reports (Hostinger SMTP or Gmail)',
                'note' => 'No automated marketing email without explicit configuration'];
    }

    public function publicType(): bool { return false; }

    public function test(array $config): array
    {
        // prefer the integration's own config, else the global SMTP settings (SiteConfig)
        if (empty($config['host'])) {
            $cfg = SiteConfig::safe('smtp');
            $config = array_merge($config ?: [], $cfg ?: []);
        }
        $host = (string)($config['host'] ?? '');
        if ($host === '') return ['ok' => false, 'error' => 'SMTP not configured (Admin → Integrations → Email / SMTP settings)'];
        try {
            $c = [
                'host' => $host, 'port' => (int)($config['port'] ?? 587), 'encryption' => (string)($config['encryption'] ?? 'tls'),
                'username' => (string)($config['username'] ?? ''), 'password' => (string)($config['password'] ?? ''),
                'from' => (string)($config['from'] ?? ''),
            ];
            $client = new SmtpClient($c);
            $ok = $client->test();
            return ['ok' => $ok, 'message' => $ok ? 'SMTP connection verified' : 'SMTP handshake failed',
                    'error' => $ok ? '' : 'SMTP handshake failed — check host/port/credentials'];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => 'SMTP error: ' . $e->getMessage()];
        }
    }

    public function sync(array $config): array
    {
        return ['ok' => false, 'error' => 'Email is outbound-only — use the test button to verify delivery'];
    }

    public function triggers(): array { return []; }
}
