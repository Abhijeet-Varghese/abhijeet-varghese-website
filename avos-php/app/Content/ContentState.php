<?php
declare(strict_types=1);
namespace AvOS\Content;

use AvOS\Api\ApiException;
use AvOS\Api\ErrorCatalog;

/**
 * The content lifecycle state machine (Phase 3E §3E.8).
 *
 * "Do not allow arbitrary state manipulation." Status is therefore never
 * assignable directly through the update API — it changes only through an
 * explicit transition that this class permits.
 *
 * `unpublished` is NEW in migration 011 (contract amendment A5). It is not the
 * same as `archived`: unpublished means "taken down, may come back and keeps
 * its route reserved"; archived means "retired". Collapsing them would make
 * an accidental archive indistinguishable from a deliberate takedown.
 */
final class ContentState
{
    public const DRAFT       = 'draft';
    public const REVIEW      = 'review';
    public const SCHEDULED   = 'scheduled';
    public const PUBLISHED   = 'published';
    public const UNPUBLISHED = 'unpublished';
    public const ARCHIVED    = 'archived';

    public const ALL = [
        self::DRAFT, self::REVIEW, self::SCHEDULED,
        self::PUBLISHED, self::UNPUBLISHED, self::ARCHIVED,
    ];

    /**
     * The ONLY state a public reader may ever see. Kept as a list rather than a
     * scalar so the public read path is a set-membership test that cannot be
     * turned into "status != draft" by a later edit.
     */
    public const PUBLICLY_VISIBLE = [self::PUBLISHED];

    /** from => allowed destinations */
    private const TRANSITIONS = [
        self::DRAFT       => [self::REVIEW, self::SCHEDULED, self::PUBLISHED, self::ARCHIVED],
        self::REVIEW      => [self::DRAFT, self::SCHEDULED, self::PUBLISHED, self::ARCHIVED],
        self::SCHEDULED   => [self::DRAFT, self::PUBLISHED, self::ARCHIVED],
        self::PUBLISHED   => [self::UNPUBLISHED, self::DRAFT, self::ARCHIVED],
        self::UNPUBLISHED => [self::DRAFT, self::PUBLISHED, self::ARCHIVED],
        // Archived is recoverable to draft only — never straight back to live.
        self::ARCHIVED    => [self::DRAFT],
    ];

    public static function isValid(string $state): bool
    { return in_array($state, self::ALL, true); }

    public static function isPublic(string $state): bool
    { return in_array($state, self::PUBLICLY_VISIBLE, true); }

    public static function canTransition(string $from, string $to): bool
    {
        if (!self::isValid($from) || !self::isValid($to)) return false;
        if ($from === $to) return true;                       // idempotent no-op
        return in_array($to, self::TRANSITIONS[$from], true);
    }

    /** @return string[] */
    public static function allowedFrom(string $from): array
    { return self::TRANSITIONS[$from] ?? []; }

    /**
     * A rejected transition is a CONFLICT, not a validation error: the request
     * body was well-formed, the resource is simply in the wrong state.
     */
    public static function requireTransition(string $from, string $to): void
    {
        if (!self::isValid($to)) {
            throw ApiException::validation(['status' => 'must be one of: ' . implode(', ', self::ALL)]);
        }
        if (!self::canTransition($from, $to)) {
            throw new ApiException(
                ErrorCatalog::CONFLICT,
                sprintf('Cannot move content from %s to %s.', $from, $to),
                ['from' => $from, 'to' => $to, 'allowed' => self::allowedFrom($from)],
            );
        }
    }
}
