<?php
declare(strict_types=1);
namespace AvOS\Media\Image;

/**
 * Image processing contract (Phase 3F §3F.8).
 *
 * Two real implementations (Imagick, GD) and one honest null. The interface is
 * deliberately narrow: resize-and-encode, plus metadata. Anything richer would
 * be speculative until the builder needs it.
 *
 * `encode()` returns null on failure rather than throwing, because a format
 * that will not encode is an expected condition on shared hosting — the caller
 * skips that format and records nothing, which is what keeps the API's format
 * reporting truthful.
 */
interface ImageProcessorInterface
{
    public function name(): string;

    public function available(): bool;

    /** @return array{width:int,height:int,orientation:int}|null */
    public function probe(string $bytes): ?array;

    /**
     * Resize to fit within $targetWidth (never upscaling) and encode.
     *
     * Implementations MUST strip metadata: EXIF can carry GPS coordinates and
     * a derivative is a public artefact (§3F.9).
     *
     * @return string|null encoded bytes, or null when this driver cannot
     *                     produce that format
     */
    public function encode(string $bytes, int $targetWidth, string $format, int $quality): ?string;

    public function supports(string $format): bool;
}
