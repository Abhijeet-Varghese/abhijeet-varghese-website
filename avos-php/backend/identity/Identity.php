<?php
declare(strict_types=1);

/**
 * AV OS — IDENTITY (single source of truth for email identities).
 *
 * Two identities exist and they must never be confused:
 *
 *   PUBLIC  hi@abhijeetvarghese.com
 *           Client-facing. Safe in HTML, JSON-LD, forms, transactional mail
 *           sent to clients, and the public API.
 *
 *   OWNER   private, internal only.
 *           Authentication, owner/security/system notifications, recovery.
 *           MUST NEVER reach a client: not in HTML, JS, JSON, JSON-LD, the
 *           sitemap, a public API response, or a client-facing email template.
 *
 * DESIGN DECISION — the owner address is NEVER written into source.
 * It is supplied at runtime by the private configuration (which lives outside
 * the web root) or by an environment variable. That way the address cannot
 * leak through the git history, the deployment package, a source-map, or an
 * accidental commit — and the CI guard can assert its literal absence from the
 * entire repository, which would be impossible if we hardcoded it.
 *
 * Configure in the PRIVATE config (outside the web root):
 *     $ownerEmail = 'someone@example.com';
 * or via environment:
 *     AV_OWNER_EMAIL=someone@example.com
 */
final class Identity
{
    /** Public, client-facing address. Safe to expose. */
    public const PUBLIC_EMAIL = 'hi@abhijeetvarghese.com';

    /** No-reply sender for client-facing transactional mail. */
    public const PUBLIC_NOREPLY = 'no-reply@abhijeetvarghese.com';

    /** Display name used on outbound client mail. */
    public const PUBLIC_NAME = 'Abhijeet Varghese';

    /** @var string|null resolved lazily so a missing value fails at use, not at boot */
    private static ?string $owner = null;

    /** Public address clients may see. */
    public static function publicEmail(): string
    {
        return defined('AV_PUBLIC_EMAIL') && AV_PUBLIC_EMAIL !== '' ? AV_PUBLIC_EMAIL : self::PUBLIC_EMAIL;
    }

    public static function publicNoReply(): string
    {
        return defined('AV_PUBLIC_NOREPLY') && AV_PUBLIC_NOREPLY !== '' ? AV_PUBLIC_NOREPLY : self::PUBLIC_NOREPLY;
    }

    /**
     * Private owner address — SERVER-SIDE ONLY.
     * Returns '' when unconfigured; callers that require it should use
     * ownerEmailOrFail(). Never echo this into a response.
     */
    public static function ownerEmail(): string
    {
        if (self::$owner === null) {
            $v = '';
            if (defined('AV_OWNER_EMAIL') && is_string(AV_OWNER_EMAIL)) $v = AV_OWNER_EMAIL;
            if ($v === '') $v = (string)(getenv('AV_OWNER_EMAIL') ?: '');
            if ($v === '' && isset($GLOBALS['ownerEmail']) && is_string($GLOBALS['ownerEmail'])) {
                $v = $GLOBALS['ownerEmail'];   // set by the private config file
            }
            $v = trim($v);
            self::$owner = filter_var($v, FILTER_VALIDATE_EMAIL) ? $v : '';
        }
        return self::$owner;
    }

    public static function hasOwnerEmail(): bool
    {
        return self::ownerEmail() !== '';
    }

    /** For internal notification paths that genuinely cannot proceed without it. */
    public static function ownerEmailOrFail(): string
    {
        $v = self::ownerEmail();
        if ($v === '') {
            // Message deliberately contains no address and no path.
            throw new RuntimeException('Owner email is not configured (set AV_OWNER_EMAIL in the private config).');
        }
        return $v;
    }

    /** True when $email is the private owner address. */
    public static function isOwner(string $email): bool
    {
        $o = self::ownerEmail();
        return $o !== '' && strcasecmp(trim($email), $o) === 0;
    }

    /**
     * Redact the owner address from anything about to leave the server.
     * Defence in depth for logs, error payloads and API responses.
     */
    public static function redact(string $text): string
    {
        $o = self::ownerEmail();
        return $o === '' ? $text : str_ireplace($o, '[redacted]', $text);
    }

    /**
     * Assert a client-bound payload does not contain the owner address.
     * Returns the payload unchanged, or throws in non-production so the leak is
     * caught in development/CI rather than shipped.
     */
    public static function assertClientSafe(mixed $payload): mixed
    {
        $o = self::ownerEmail();
        if ($o === '') return $payload;
        $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($json !== false && stripos($json, $o) !== false) {
            if (defined('AV_ENV') && AV_ENV !== 'production') {
                throw new RuntimeException('Owner email present in a client-bound payload.');
            }
            error_log('[AVOS][identity] owner email present in a client-bound payload — redacted');
            return json_decode(str_ireplace($o, '[redacted]', (string)$json), true);
        }
        return $payload;
    }

    /** Secret-free report for diagnostics: presence only, never the value. */
    public static function status(): array
    {
        return [
            'public_email'      => self::publicEmail(),   // safe to expose
            'owner_email_set'   => self::hasOwnerEmail(), // boolean only
            'owner_email_source'=> self::hasOwnerEmail()
                ? (getenv('AV_OWNER_EMAIL') ? 'env' : 'private-config')
                : 'not-configured',
        ];
    }
}
