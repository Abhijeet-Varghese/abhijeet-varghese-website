<?php
declare(strict_types=1);
namespace AvOS\Media;

/**
 * The result of inspecting an upload (Phase 3F §3F.6).
 *
 * Immutable, and it carries only DERIVED facts — the real MIME from the bytes,
 * the normalised extension, the computed hash. Nothing a client claimed
 * survives into it except `originalName`, which is metadata and is already
 * sanitised.
 *
 * A rejection carries a machine code AND a sentence a person can act on,
 * because "upload failed" is the least useful error an application can give.
 */
final class UploadInspection
{
    private function __construct(
        public readonly bool $ok,
        public readonly string $code,
        public readonly string $reason,
        public readonly string $originalName,
        public readonly string $extension,
        public readonly string $mime,
        public readonly string $kind,
        public readonly int $bytes,
        public readonly string $hash,
        public readonly ?int $width,
        public readonly ?int $height,
    ) {}

    public static function rejected(string $code, string $reason): self
    {
        return new self(false, $code, $reason, '', '', '', '', 0, '', null, null);
    }

    public static function accepted(
        string $originalName,
        string $extension,
        string $mime,
        string $kind,
        int $bytes,
        string $hash,
        ?int $width,
        ?int $height,
    ): self {
        return new self(true, '', '', $originalName, $extension, $mime, $kind, $bytes, $hash, $width, $height);
    }

    /** Validation detail map for a 422 response. */
    public function toErrorDetails(): array
    {
        return ['file' => $this->reason, 'code' => $this->code];
    }
}
