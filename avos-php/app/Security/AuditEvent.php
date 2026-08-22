<?php
declare(strict_types=1);
namespace AvOS\Security;

/**
 * Audit event value object (SECURITY-ARCHITECTURE §7).
 *
 * Construction scrubs anything that must never be persisted. Writing to
 * audit_logs is Phase 3E; the shape and the redaction rule are fixed here so
 * no later module can invent a variant that logs a secret.
 */
final class AuditEvent
{
    /** Keys whose values are dropped wherever they appear in before/after. */
    private const FORBIDDEN_KEYS = [
        'password','password_hash','pass','secret','token','csrf','api_key','apikey',
        'twofa_secret','totp_secret','recovery_code','enc_key','av_enc_key',
        'db_pass','smtp_pass','authorization','cookie','session_id',
    ];

    public function __construct(
        public readonly ?int $actorId,
        public readonly string $action,
        public readonly string $resourceType,
        public readonly string $resourceId,
        public readonly string $ip,
        public readonly string $userAgent,
        public readonly string $requestId,
        public readonly string $result = 'success',
        public readonly ?array $before = null,
        public readonly ?array $after = null,
    ) {}

    public function toRow(): array
    {
        return [
            'actor_id'      => $this->actorId,
            'action'        => substr($this->action, 0, 80),
            'resource_type' => substr($this->resourceType, 0, 60),
            'resource_id'   => substr($this->resourceId, 0, 60),
            'before'        => $this->before === null ? null : json_encode(self::redact($this->before)),
            'after'         => $this->after === null ? null : json_encode(self::redact($this->after)),
            'ip'            => substr($this->ip, 0, 45),
            'user_agent'    => substr($this->userAgent, 0, 250),
            'request_id'    => substr($this->requestId, 0, 40),
            'result'        => $this->result,
        ];
    }

    /** Recursively strip forbidden keys. Never log a secret, at any depth. */
    public static function redact(array $data): array
    {
        $out = [];
        foreach ($data as $k => $v) {
            if (in_array(strtolower((string)$k), self::FORBIDDEN_KEYS, true)) {
                $out[$k] = '[redacted]';
                continue;
            }
            $out[$k] = is_array($v) ? self::redact($v) : $v;
        }
        return $out;
    }
}
