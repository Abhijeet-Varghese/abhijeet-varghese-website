<?php
declare(strict_types=1);
namespace AvOS\Security;

use AvOS\Database\Connection;

/**
 * The audit_logs writer (Phase 3E §3E.18).
 *
 * Phase 3A/3B defined AuditEvent and its redaction rule but nothing wrote it;
 * that gap closes here. This is the ONLY class that inserts into audit_logs.
 *
 * Two deliberate properties:
 *  - Append only. There is no update or delete method, so an operator cannot
 *    quietly rewrite history through the application.
 *  - A failed audit write never fails the operation it was describing, but it
 *    is always logged. Losing a page because the audit table is full would be
 *    a worse outcome than a gap in the trail — and the gap is visible.
 */
final class AuditLogger
{
    public function __construct(
        private readonly Connection $db,
        private readonly string $ip = '',
        private readonly string $userAgent = '',
        private readonly string $requestId = '',
    ) {}

    public function record(AuditEvent $event): void
    {
        $row = $event->toRow();
        try {
            $this->db->run(
                'INSERT INTO audit_logs
                   (actor_id, action, resource_type, resource_id, `before`, `after`,
                    ip, user_agent, request_id, result)
                 VALUES (?,?,?,?,?,?,?,?,?,?)',
                [
                    $row['actor_id'], $row['action'], $row['resource_type'], $row['resource_id'],
                    $row['before'], $row['after'], $row['ip'], $row['user_agent'],
                    $row['request_id'], $row['result'],
                ],
            );
        } catch (\Throwable $e) {
            error_log(sprintf('[AVOS][%s] audit write failed for %s: %s',
                $this->requestId, $row['action'], $e->getMessage()));
        }
    }

    /** Convenience: build the event from request context already held here. */
    public function log(
        ?int $actorId,
        string $action,
        string $resourceType,
        string|int $resourceId,
        ?array $before = null,
        ?array $after = null,
        string $result = 'success',
    ): void {
        $this->record(new AuditEvent(
            $actorId, $action, $resourceType, (string)$resourceId,
            $this->ip, $this->userAgent, $this->requestId, $result, $before, $after,
        ));
    }
}
