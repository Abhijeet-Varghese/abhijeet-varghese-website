<?php
declare(strict_types=1);
namespace AvOS\Content\Events;

/**
 * A content lifecycle event (Phase 3E §3E.9 / §3E.13).
 *
 * Deliberately a plain immutable value object with no transport attached. The
 * Phase 3P queue will be able to serialise it into `jobs` without this class
 * knowing that a queue exists — and, critically, without the content engine
 * ever depending on Redis or an external broker (locked decision D1).
 */
final class ContentEvent
{
    public const CREATED     = 'content.created';
    public const UPDATED     = 'content.updated';
    public const DELETED     = 'content.deleted';
    public const PUBLISHED   = 'content.published';
    public const UNPUBLISHED = 'content.unpublished';
    public const RESTORED    = 'content.restored';
    public const SLUG_CHANGED = 'content.slug_changed';

    public const ALL = [
        self::CREATED, self::UPDATED, self::DELETED,
        self::PUBLISHED, self::UNPUBLISHED, self::RESTORED, self::SLUG_CHANGED,
    ];

    public function __construct(
        public readonly string $name,
        public readonly string $entityType,
        public readonly int $entityId,
        public readonly ?int $actorId,
        public readonly string $requestId,
        /** @var array<string,scalar|null> non-secret context only */
        public readonly array $context = [],
        public readonly string $occurredAt = '',
    ) {}

    public static function make(
        string $name,
        string $entityType,
        int $entityId,
        ?int $actorId,
        string $requestId,
        array $context = [],
    ): self {
        return new self($name, $entityType, $entityId, $actorId, $requestId, $context, gmdate('c'));
    }

    /** Queue-ready payload. Contains no credential and no email address. */
    public function toArray(): array
    {
        return [
            'name'        => $this->name,
            'entity_type' => $this->entityType,
            'entity_id'   => $this->entityId,
            'actor_id'    => $this->actorId,
            'request_id'  => $this->requestId,
            'context'     => \AvOS\Security\AuditEvent::redact($this->context),
            'occurred_at' => $this->occurredAt !== '' ? $this->occurredAt : gmdate('c'),
        ];
    }
}
