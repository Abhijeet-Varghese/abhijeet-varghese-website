<?php
declare(strict_types=1);
namespace AvOS\Http\Controllers;

use AvOS\Api\ApiException;
use AvOS\Api\ApiResult;
use AvOS\Api\ErrorCatalog;
use AvOS\Domain\Media\AssetService;
use AvOS\Domain\Media\AssetUsageService;
use AvOS\Domain\Media\DownloadService;
use AvOS\Domain\Media\OrphanService;
use AvOS\Http\Request;

/**
 * Media endpoints (Phase 3F §3F.26).
 *
 * Thin by rule: no filesystem access, no SQL, no permission logic. Its one real
 * job is turning an HTTP upload — which arrives as either `multipart/form-data`
 * or a base64 JSON body — into `(filename, bytes)` for the service.
 *
 * Both transports are supported deliberately. `multipart` is what a browser
 * form sends; base64 JSON is what a fetch-based admin sends and what makes the
 * endpoint testable over plain HTTP without a multipart encoder.
 */
final class MediaController
{
    public function __construct(
        private readonly AssetService $assets,
        private readonly AssetUsageService $usage,
        private readonly OrphanService $orphans,
        private readonly DownloadService $downloads,
    ) {}

    // ------------------------------------------------------------- reads

    public function index(Request $r): ApiResult
    { return ApiResult::ok($this->assets->listAdmin($r->query), $r->requestId); }

    public function show(Request $r): ApiResult
    { return ApiResult::ok($this->assets->getAdmin($r->intParam('id')), $r->requestId); }

    public function capabilities(Request $r): ApiResult
    { return ApiResult::ok($this->assets->capabilities(), $r->requestId); }

    public function usage(Request $r): ApiResult
    { return ApiResult::ok($this->usage->forAsset($r->intParam('id')), $r->requestId); }

    public function orphans(Request $r): ApiResult
    {
        return ApiResult::ok([
            'orphans'     => $this->orphans->report(),
            'unreferenced' => $this->orphans->unreferenced(),
            'duplicates'  => $this->orphans->duplicateCandidates(),
        ], $r->requestId);
    }

    // ------------------------------------------------------------ public

    public function publicIndex(Request $r): ApiResult
    { return ApiResult::ok($this->assets->listPublic($r->query), $r->requestId); }

    public function publicShow(Request $r): ApiResult
    { return ApiResult::ok($this->assets->getPublic($r->intParam('id')), $r->requestId); }

    // ------------------------------------------------------------ writes

    public function upload(Request $r): ApiResult
    {
        [$name, $bytes, $options] = $this->extractFile($r);
        return ApiResult::ok($this->assets->upload($name, $bytes, $options), $r->requestId, 201);
    }

    public function replace(Request $r): ApiResult
    {
        [$name, $bytes, $options] = $this->extractFile($r);
        return ApiResult::ok(
            $this->assets->replace($r->intParam('id'), $name, $bytes, $options),
            $r->requestId,
        );
    }

    public function update(Request $r): ApiResult
    { return ApiResult::ok($this->assets->updateMetadata($r->intParam('id'), $r->json()), $r->requestId); }

    public function destroy(Request $r): ApiResult
    {
        // Hard delete must be asked for explicitly; the default is reversible.
        $force = in_array(strtolower($r->queryValue('force')), ['1', 'true', 'yes'], true);
        return ApiResult::ok($this->assets->delete($r->intParam('id'), $force), $r->requestId);
    }

    public function restore(Request $r): ApiResult
    { return ApiResult::ok($this->assets->restore($r->intParam('id')), $r->requestId); }

    public function attach(Request $r): ApiResult
    {
        $body = $r->json();
        $type = (string)($body['entity_type'] ?? '');
        $entityId = (int)($body['entity_id'] ?? 0);
        if ($type === '' || $entityId <= 0) {
            throw ApiException::validation([
                'entity_type' => 'is required', 'entity_id' => 'is required',
            ]);
        }
        $this->usage->attach($r->intParam('id'), $type, $entityId, (string)($body['field'] ?? ''));
        return ApiResult::ok($this->usage->forAsset($r->intParam('id')), $r->requestId);
    }

    public function detach(Request $r): ApiResult
    {
        $body = $r->json();
        $this->usage->detach(
            $r->intParam('id'),
            (string)($body['entity_type'] ?? ''),
            (int)($body['entity_id'] ?? 0),
            (string)($body['field'] ?? ''),
        );
        return ApiResult::ok($this->usage->forAsset($r->intParam('id')), $r->requestId);
    }

    // ---------------------------------------------------------- download

    /**
     * Returns a prepared descriptor rather than streaming here, so the kernel
     * can stream it outside the JSON envelope. Every failure still produces a
     * normal error response because nothing has been emitted yet.
     */
    public function prepareDownload(Request $r): array
    {
        $inline = in_array(strtolower($r->queryValue('inline')), ['1', 'true', 'yes'], true);
        return $this->downloads->prepare($r->intParam('id'), asAttachment: !$inline);
    }

    // ----------------------------------------------------------- helpers

    /**
     * Pull the file out of either transport.
     *
     * @return array{0:string,1:string,2:array<string,mixed>}
     */
    private function extractFile(Request $r): array
    {
        $contentType = strtolower($r->header('content-type'));

        // ---- multipart/form-data (browser form) ------------------------
        if (str_contains($contentType, 'multipart/form-data')) {
            $file = $_FILES['file'] ?? null;
            if (!is_array($file)) {
                throw ApiException::validation(['file' => 'no file was supplied']);
            }
            $error = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
            if ($error !== UPLOAD_ERR_OK) {
                throw new ApiException(
                    in_array($error, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
                        ? ErrorCatalog::PAYLOAD_TOO_LARGE : ErrorCatalog::VALIDATION_ERROR,
                    self::uploadErrorMessage($error),
                    ['file' => self::uploadErrorMessage($error)],
                );
            }
            $tmp = (string)($file['tmp_name'] ?? '');
            // is_uploaded_file() is what stops a crafted request naming an
            // arbitrary server path as its "temp file".
            if ($tmp === '' || !is_uploaded_file($tmp)) {
                throw ApiException::validation(['file' => 'the upload could not be verified']);
            }
            $bytes = (string)@file_get_contents($tmp);
            @unlink($tmp);
            return [
                (string)($file['name'] ?? 'upload'),
                $bytes,
                $this->optionsFrom($_POST),
            ];
        }

        // ---- JSON with base64 content ----------------------------------
        $body = $r->json();
        $name = (string)($body['filename'] ?? '');
        $encoded = (string)($body['content_base64'] ?? '');
        if ($name === '' || $encoded === '') {
            throw ApiException::validation([
                'filename'       => 'is required',
                'content_base64' => 'is required when not sending multipart/form-data',
            ]);
        }
        // Strict decode: a malformed payload must be an error, not silently
        // truncated bytes that then fail a confusing signature check.
        $bytes = base64_decode($encoded, true);
        if ($bytes === false) {
            throw ApiException::validation(['content_base64' => 'is not valid base64']);
        }
        return [$name, $bytes, $this->optionsFrom($body)];
    }

    /** @return array<string,mixed> */
    private function optionsFrom(array $source): array
    {
        $out = [];
        foreach (['visibility', 'alt_text', 'credit'] as $key) {
            if (isset($source[$key]) && is_string($source[$key])) $out[$key] = $source[$key];
        }
        return $out;
    }

    private static function uploadErrorMessage(int $code): string
    {
        return match ($code) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'The file exceeds the upload size limit.',
            UPLOAD_ERR_PARTIAL    => 'The file was only partially uploaded.',
            UPLOAD_ERR_NO_FILE    => 'No file was supplied.',
            UPLOAD_ERR_NO_TMP_DIR => 'The server has no temporary directory available.',
            UPLOAD_ERR_CANT_WRITE => 'The server could not write the uploaded file.',
            UPLOAD_ERR_EXTENSION  => 'The upload was blocked by a server extension.',
            default               => 'The upload failed.',
        };
    }
}
