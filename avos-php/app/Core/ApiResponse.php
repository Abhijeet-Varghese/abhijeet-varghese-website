<?php
declare(strict_types=1);
namespace AvOS\Core;

use AvOS\Errors\ErrorCode;

/**
 * The single response envelope (API-CONTRACT §1).
 * Every API response — success or failure — goes through here so the shape
 * cannot drift between endpoints.
 */
final class ApiResponse
{
    public static function success(mixed $data, int $status = 200): array
    { return ['status' => $status, 'body' => ['ok' => true, 'data' => $data, 'error' => null]]; }

    public static function error(
        string $code,
        string $message,
        int $status,
        string $requestId,
        array $fields = [],
        ?array $debug = null,
    ): array {
        $error = ['code' => $code, 'message' => $message, 'request_id' => $requestId];
        if ($fields !== []) $error['fields'] = $fields;
        // Diagnostics are attached ONLY outside production, by the caller.
        if ($debug !== null) $error['debug'] = $debug;
        return ['status' => $status, 'body' => ['ok' => false, 'data' => null, 'error' => $error]];
    }

    /** Emit to the client. Security headers are set by the Kernel, not here. */
    public static function send(array $response, string $requestId): void
    {
        if (!headers_sent()) {
            http_response_code($response['status']);
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-store');
            header('X-Request-Id: ' . $requestId);
        }
        echo json_encode($response['body'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public static function statusFor(string $code): int
    {
        return match ($code) {
            ErrorCode::UNAUTHENTICATED   => 401,
            ErrorCode::FORBIDDEN         => 403,
            ErrorCode::NOT_FOUND         => 404,
            ErrorCode::CONFLICT          => 409,
            ErrorCode::PAYLOAD_TOO_LARGE => 413,
            ErrorCode::UNSUPPORTED_MEDIA => 415,
            ErrorCode::CSRF_FAILED       => 419,
            ErrorCode::VALIDATION_ERROR  => 422,
            ErrorCode::RATE_LIMITED      => 429,
            default                      => 500,
        };
    }
}
