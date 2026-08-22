<?php
declare(strict_types=1);
namespace AvOS\Identity;

use AvOS\Config\Config;

/**
 * The two email identities (Phase 2 §3, contract AUTH-ARCHITECTURE §1).
 *
 *   PUBLIC  — client-facing, safe in HTML/JSON-LD/forms/API.
 *   OWNER   — internal only. Authentication, security alerts, recovery.
 *
 * The owner address is NEVER written into source. It arrives from
 * AV_OWNER_EMAIL or the private config, which is why the CI leak guard can
 * assert its literal absence from the whole repository — impossible if it were
 * hardcoded anywhere.
 *
 * When unconfigured, owner-dependent behaviour fails SAFELY: it is skipped and
 * reported, never guessed and never substituted with the public address.
 */
final class EmailIdentity
{
    public function __construct(
        private readonly string $public,
        private readonly string $noreply,
        private readonly string $owner,      // '' when unconfigured
    ) {}

    public static function fromConfig(Config $c): self
    {
        $owner = trim((string)$c->get('email.owner', ''));
        if ($owner !== '' && filter_var($owner, FILTER_VALIDATE_EMAIL) === false) {
            $owner = '';   // refuse a malformed value rather than half-trust it
        }
        return new self(
            (string)$c->get('email.public', 'hi@abhijeetvarghese.com'),
            (string)$c->get('email.noreply', 'no-reply@abhijeetvarghese.com'),
            $owner,
        );
    }

    public function publicEmail(): string { return $this->public; }
    public function noReplyEmail(): string { return $this->noreply; }

    /** SERVER-SIDE ONLY. Never place the result in a client-bound payload. */
    public function ownerEmail(): string { return $this->owner; }
    public function hasOwner(): bool { return $this->owner !== ''; }

    public function isOwnerEmail(string $email): bool
    {
        return $this->owner !== '' && strcasecmp(trim($email), $this->owner) === 0;
    }

    /** Defence in depth for logs and error payloads. */
    public function redact(string $text): string
    {
        return $this->owner === '' ? $text : str_ireplace($this->owner, '[redacted]', $text);
    }

    /**
     * True when a payload about to leave the server contains the owner address.
     * Callers treat a true result as a bug, not a condition to work around.
     */
    public function leaksOwner(mixed $payload): bool
    {
        if ($this->owner === '') return false;
        $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        return $json !== false && stripos($json, $this->owner) !== false;
    }

    /** Presence only — never the value, never a length. */
    public function status(): array
    {
        return [
            'public_email'    => $this->public,     // public by definition
            'owner_email_set' => $this->hasOwner(),
            'owner_source'    => $this->hasOwner()
                ? (getenv('AV_OWNER_EMAIL') ? 'env' : 'private-config')
                : 'not-configured',
        ];
    }
}
