<?php
declare(strict_types=1);
namespace AvOS\Security;

use AvOS\Database\Connection;
use AvOS\Identity\EmailIdentity;
use Throwable;

/**
 * Persists security events (Phase 2 §3C.11).
 *
 * Two hard rules:
 *   1. detail is passed through AuditEvent::redact(), so a password, token or
 *      key can never be written even if a caller passes one by mistake;
 *   2. recording must NEVER break the request it is describing — a logging
 *      failure is swallowed and reported to the error log.
 */
final class SecurityEventRecorder
{
    public function __construct(
        private readonly Connection $db,
        private readonly EmailIdentity $identity,
    ) {}

    public function record(
        string $type,
        ?int $userId = null,
        ?string $email = null,
        string $ip = '',
        string $userAgent = '',
        string $requestId = '',
        array $detail = [],
    ): void {
        try {
            $clean = AuditEvent::redact($detail);
            // Never store the owner address in a table an admin screen renders.
            $json = json_encode($clean, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            if ($json !== false) $json = $this->identity->redact($json);

            $storedEmail = $email === null ? null : $this->identity->redact($email);

            $this->db->run(
                'INSERT INTO security_events
                   (event_type, severity, user_id, email, ip, user_agent, request_id, detail)
                 VALUES (?,?,?,?,?,?,?,?)',
                [
                    substr($type, 0, 60),
                    SecurityEvent::severityFor($type),
                    $userId,
                    $storedEmail === null ? null : substr($storedEmail, 0, 190),
                    substr($ip, 0, 45),
                    substr($userAgent, 0, 250),
                    substr($requestId, 0, 40),
                    $json === false || $clean === [] ? null : $json,
                ],
            );
        } catch (Throwable $e) {
            error_log('[AVOS][security-event] failed to record ' . $type . ': ' . $e->getMessage());
        }
    }

    /** @return array<int,array<string,mixed>> */
    public function recent(int $limit = 50, ?string $type = null): array
    {
        $limit = max(1, min(500, $limit));
        if ($type !== null) {
            return $this->db->all(
                'SELECT id, event_type, severity, user_id, ip, request_id, created_at
                   FROM security_events WHERE event_type=? ORDER BY id DESC LIMIT ' . $limit,
                [$type],
            );
        }
        return $this->db->all(
            'SELECT id, event_type, severity, user_id, ip, request_id, created_at
               FROM security_events ORDER BY id DESC LIMIT ' . $limit
        );
    }

    public function countOfType(string $type): int
    {
        return (int)$this->db->scalar('SELECT COUNT(*) FROM security_events WHERE event_type=?', [$type]);
    }
}
