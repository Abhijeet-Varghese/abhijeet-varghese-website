<?php
declare(strict_types=1);
namespace AvOS\Api;

/**
 * Centralised API error catalog (Phase 3D §3D.5).
 *
 * Controllers may not invent error shapes: they raise ApiException with a code
 * from this catalog, and the status is derived here. That is what keeps the
 * error contract consistent across every future module.
 */
final class ErrorCatalog
{
    public const INVALID_REQUEST        = 'INVALID_REQUEST';
    public const INVALID_JSON           = 'INVALID_JSON';
    public const VALIDATION_ERROR       = 'VALIDATION_ERROR';
    public const UNAUTHORIZED           = 'UNAUTHORIZED';
    public const FORBIDDEN              = 'FORBIDDEN';
    public const NOT_FOUND              = 'NOT_FOUND';
    public const METHOD_NOT_ALLOWED     = 'METHOD_NOT_ALLOWED';
    public const CONFLICT               = 'CONFLICT';
    public const RATE_LIMITED           = 'RATE_LIMITED';
    public const CSRF_FAILED            = 'CSRF_FAILED';
    public const AUTHENTICATION_FAILED  = 'AUTHENTICATION_FAILED';
    public const SESSION_EXPIRED        = 'SESSION_EXPIRED';
    public const INTERNAL_ERROR         = 'INTERNAL_ERROR';
    public const SERVICE_UNAVAILABLE    = 'SERVICE_UNAVAILABLE';
    public const PAYLOAD_TOO_LARGE      = 'PAYLOAD_TOO_LARGE';
    public const UNSUPPORTED_MEDIA_TYPE = 'UNSUPPORTED_MEDIA_TYPE';

    /** code => [http status, default safe message] */
    private const MAP = [
        self::INVALID_REQUEST        => [400, 'The request could not be processed.'],
        self::INVALID_JSON           => [400, 'Request body is not valid JSON.'],
        self::VALIDATION_ERROR       => [422, 'Validation failed.'],
        self::UNAUTHORIZED           => [401, 'Authentication required.'],
        self::AUTHENTICATION_FAILED  => [401, 'Invalid email or password.'],
        self::SESSION_EXPIRED        => [401, 'Your session has expired.'],
        self::FORBIDDEN              => [403, 'You do not have permission to do that.'],
        self::NOT_FOUND              => [404, 'Not found.'],
        self::METHOD_NOT_ALLOWED     => [405, 'Method not allowed.'],
        self::CONFLICT               => [409, 'The request conflicts with the current state.'],
        self::PAYLOAD_TOO_LARGE      => [413, 'Request body is too large.'],
        self::UNSUPPORTED_MEDIA_TYPE => [415, 'Unsupported content type.'],
        self::CSRF_FAILED            => [419, 'Invalid or missing CSRF token.'],
        self::RATE_LIMITED           => [429, 'Too many requests. Try again later.'],
        self::INTERNAL_ERROR         => [500, 'Internal server error.'],
        self::SERVICE_UNAVAILABLE    => [503, 'Service temporarily unavailable.'],
    ];

    public static function status(string $code): int
    { return self::MAP[$code][0] ?? 500; }

    public static function defaultMessage(string $code): string
    { return self::MAP[$code][1] ?? self::MAP[self::INTERNAL_ERROR][1]; }

    public static function isKnown(string $code): bool
    { return isset(self::MAP[$code]); }

    /** @return string[] */
    public static function codes(): array
    { return array_keys(self::MAP); }
}
