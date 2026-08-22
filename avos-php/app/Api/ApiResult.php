<?php
declare(strict_types=1);
namespace AvOS\Api;

/**
 * The single API response envelope (Phase 3D §3D.4).
 *
 * CONTRACT AMENDMENT — recorded, not silent:
 * §3D.4 places `request_id` at the TOP LEVEL and renames the validation detail
 * key from `fields` to `details`. The Phase 2 API-CONTRACT.md put `request_id`
 * inside `error` and called the key `fields`. This class implements §3D.4 as
 * authoritative and ALSO retains `error.request_id` as a duplicate, so any
 * Phase 3C client that already reads it keeps working. Documented in
 * API-CONTRACT.md §Amendments.
 */
final class ApiResult
{
    public function __construct(
        public readonly int $status,
        public readonly array $body,
        public readonly array $headers = [],
    ) {}

    public static function ok(mixed $data, string $requestId, int $status = 200, array $headers = []): self
    {
        return new self($status, [
            'ok'         => true,
            'data'       => $data,
            'error'      => null,
            'request_id' => $requestId,
        ], $headers);
    }

    public static function fail(
        string $code,
        string $message,
        string $requestId,
        ?array $details = null,
        ?int $status = null,
        array $headers = [],
    ): self {
        return new self($status ?? ErrorCatalog::status($code), [
            'ok'    => false,
            'data'  => null,
            'error' => [
                'code'       => $code,
                'message'    => $message !== '' ? $message : ErrorCatalog::defaultMessage($code),
                'details'    => $details,
                // Duplicate of the top-level id, kept for Phase 3C compatibility.
                'request_id' => $requestId,
            ],
            'request_id' => $requestId,
        ], $headers);
    }

    public static function fromException(ApiException $e, string $requestId): self
    {
        $headers = [];
        $retry = $e->details()['retry_after_seconds'] ?? null;
        if ($retry !== null) $headers['Retry-After'] = (string)(int)$retry;
        return self::fail($e->code(), $e->getMessage(), $requestId, $e->details(), $e->status(), $headers);
    }

    /** Immutable copy with additional headers merged in. */
    public function withHeaders(array $headers): self
    {
        return new self($this->status, $this->body, array_merge($this->headers, $headers));
    }

    /** Emit. Security headers are added by the middleware, not here. */
    public function send(): void
    {
        if (!headers_sent()) {
            http_response_code($this->status);
            header('Content-Type: application/json; charset=utf-8');
            foreach ($this->headers as $k => $v) header($k . ': ' . $v);
        }
        echo json_encode($this->body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
}
