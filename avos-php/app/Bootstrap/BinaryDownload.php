<?php
declare(strict_types=1);
namespace AvOS\Bootstrap;

/**
 * Marker for a response that is a file rather than a JSON envelope (§3F.24).
 *
 * It carries only the descriptor produced by DownloadService::prepare(). The
 * bytes are not read until the front controller streams it, so every
 * authorization and existence check has already completed while a normal error
 * envelope was still possible.
 */
final class BinaryDownload
{
    public function __construct(public readonly array $descriptor) {}
}
