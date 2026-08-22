<?php
declare(strict_types=1);
namespace AvOS\Http;

use AvOS\Errors\AppException;

/** Immutable HTTP request view. Controllers never touch superglobals. */
final class Request
{
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query,
        public readonly array $headers,
        public readonly string $rawBody,
        public readonly string $ip,
        public readonly string $userAgent,
    ) {}

    public static function fromGlobals(): self
    {
        $headers = [];
        foreach ($_SERVER as $k => $v) {
            if (str_starts_with($k, 'HTTP_')) {
                $headers[strtolower(str_replace('_', '-', substr($k, 5)))] = (string)$v;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) $headers['content-type'] = (string)$_SERVER['CONTENT_TYPE'];

        $uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
        return new self(
            strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')),
            (string)(parse_url($uri, PHP_URL_PATH) ?: '/'),
            $_GET,
            $headers,
            (string)(file_get_contents('php://input') ?: ''),
            (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'),
            substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 250),
        );
    }

    public function header(string $name): string
    { return $this->headers[strtolower($name)] ?? ''; }

    /** Max accepted JSON body. Oversized input is rejected before decoding. */
    public const MAX_BODY_BYTES = 1_048_576;   // 1 MB

    /** @throws AppException on wrong content type, oversize or malformed JSON */
    public function json(): array
    {
        if ($this->rawBody === '') return [];

        if (strlen($this->rawBody) > self::MAX_BODY_BYTES) {
            throw new AppException('Request body is too large.', 'PAYLOAD_TOO_LARGE', 413);
        }
        $ct = strtolower($this->header('content-type'));
        if ($ct !== '' && !str_contains($ct, 'application/json')) {
            throw new AppException('Content-Type must be application/json.', 'UNSUPPORTED_MEDIA', 415);
        }
        $decoded = json_decode($this->rawBody, true);
        if (!is_array($decoded)) {
            throw new AppException('Request body is not valid JSON.', 'VALIDATION_ERROR', 422);
        }
        return $decoded;
    }
}
