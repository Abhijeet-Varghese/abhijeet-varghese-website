<?php
declare(strict_types=1);
namespace AvOS\Domain\Media;

use AvOS\Api\ApiException;
use AvOS\Media\Storage\StorageManager;
use AvOS\Rbac\Authorizer;
use AvOS\Security\AuditLogger;

/**
 * Controlled download (Phase 3F §3F.24).
 *
 * The rule: "Private assets must not become public merely because someone
 * guesses a URL." This system satisfies that structurally rather than by
 * obscurity — a private asset has NO public copy on disk at all, so there is no
 * URL to guess. This service is the only way its bytes ever reach a client.
 *
 * What it guarantees:
 *  - authorisation is checked before a single byte is read
 *  - the filesystem path is never disclosed, in a header or an error
 *  - the Content-Disposition filename is sanitised and quoted, so it cannot
 *    inject a header or a path
 *  - the body is STREAMED in chunks, so a large document does not have to fit
 *    in the memory limit of a shared host
 *  - private downloads are audited; public ones are not, because auditing every
 *    public image fetch would drown the log
 */
final class DownloadService
{
    private const CHUNK = 262144;   // 256 KB

    public function __construct(
        private readonly AssetRepository $assets,
        private readonly StorageManager $storage,
        private readonly Authorizer $authz,
        private readonly AuditLogger $audit,
    ) {}

    /**
     * Resolve a download without emitting anything, so the controller can turn
     * failures into normal API error envelopes.
     *
     * @param bool $asAttachment force a download rather than inline rendering
     * @return array{
     *   id:int, absolute:string, mime:string, bytes:int,
     *   filename:string, disposition:string, private:bool
     * }
     */
    public function prepare(int $id, bool $asAttachment = true): array
    {
        $row = $this->assets->findById($id);
        // A soft-deleted or absent asset is the same 404 either way.
        if ($row === null) throw ApiException::notFound('Not found.');

        $isPrivate = (string)$row['visibility'] === 'private';

        if ($isPrivate) {
            // Fail closed. An unauthenticated caller gets 404, not 403: telling
            // an anonymous stranger that id 41 exists but is private is itself
            // a disclosure.
            if (!$this->authz->isAuthenticated()) throw ApiException::notFound('Not found.');
            if (!$this->authz->can('media.read')) throw ApiException::forbidden();
        }

        $relative = (string)$row['storage_path'];
        $absolute = $this->storage->privateDisk()->absolute($relative);
        if ($absolute === null || !is_file($absolute)) {
            // The path is never included in the message.
            throw ApiException::notFound('The stored file is no longer available.');
        }

        // Sanitised, quoted, and stripped of anything that could break out of
        // the header or suggest a path.
        $filename = $this->safeFilename((string)$row['original_name'], (string)$row['extension']);

        if ($isPrivate) {
            $this->audit->log(
                $this->authz->userId(), 'media.private_download', 'media', $id,
                null, ['bytes' => (int)$row['bytes'], 'kind' => (string)$row['kind']],
            );
        }

        return [
            'id'          => $id,
            'absolute'    => $absolute,
            'mime'        => (string)$row['mime'] !== '' ? (string)$row['mime'] : 'application/octet-stream',
            'bytes'       => (int)filesize($absolute),
            'filename'    => $filename,
            'disposition' => $asAttachment ? 'attachment' : 'inline',
            'private'     => $isPrivate,
        ];
    }

    /**
     * Emit the file. Separated from prepare() so every failure path can still
     * return JSON — once bytes start flowing it is too late for an error body.
     */
    public function stream(array $prepared): void
    {
        $absolute = $prepared['absolute'];
        $fh = @fopen($absolute, 'rb');
        if ($fh === false) return;

        if (!headers_sent()) {
            header('Content-Type: ' . $prepared['mime']);
            header('Content-Length: ' . $prepared['bytes']);
            header(sprintf(
                '%s; filename="%s"; filename*=UTF-8\'\'%s',
                'Content-Disposition: ' . $prepared['disposition'],
                $prepared['filename'],
                rawurlencode($prepared['filename']),
            ));
            // Never let a shared cache hold a private document.
            header($prepared['private']
                ? 'Cache-Control: private, no-store, max-age=0'
                : 'Cache-Control: public, max-age=86400');
            // The browser must not sniff a document into something executable.
            header('X-Content-Type-Options: nosniff');
            header("Content-Security-Policy: default-src 'none'; sandbox");
        }

        while (!feof($fh)) {
            $chunk = fread($fh, self::CHUNK);
            if ($chunk === false) break;
            echo $chunk;
            // Flushing keeps peak memory flat regardless of file size.
            if (ob_get_level() > 0) @ob_flush();
            @flush();
        }
        fclose($fh);
    }

    /**
     * A filename safe for a header and meaningless as a path. Quotes,
     * backslashes, CR/LF and separators are all removed rather than escaped,
     * because escaping in headers is where injection bugs live.
     */
    private function safeFilename(string $original, string $extension): string
    {
        $name = \AvOS\Media\FileNaming::sanitiseOriginalName($original);
        $name = str_replace(['"', '\\', "\r", "\n", '/', ';'], '', $name);
        $name = trim($name);
        if ($name === '') $name = 'download';

        // Guarantee the extension matches what the bytes actually are, so a
        // document cannot be delivered under a misleading name.
        $ext = strtolower($extension);
        if ($ext !== '' && !str_ends_with(strtolower($name), '.' . $ext)) {
            $name = pathinfo($name, PATHINFO_FILENAME) . '.' . $ext;
        }
        return substr($name, 0, 180);
    }
}
