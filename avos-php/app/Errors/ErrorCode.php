<?php
declare(strict_types=1);
namespace AvOS\Errors;

/** Stable API error codes (API-CONTRACT §1). Values are part of the contract. */
final class ErrorCode
{
    public const UNAUTHENTICATED   = 'UNAUTHENTICATED';    // 401
    public const FORBIDDEN         = 'FORBIDDEN';          // 403
    public const CSRF_FAILED       = 'CSRF_FAILED';        // 419
    public const VALIDATION_ERROR  = 'VALIDATION_ERROR';   // 422
    public const NOT_FOUND         = 'NOT_FOUND';          // 404
    public const CONFLICT          = 'CONFLICT';           // 409
    public const RATE_LIMITED      = 'RATE_LIMITED';       // 429
    public const PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE';  // 413
    public const UNSUPPORTED_MEDIA = 'UNSUPPORTED_MEDIA';  // 415
    public const SERVER_ERROR      = 'SERVER_ERROR';       // 500
    public const CONFIGURATION_ERROR = 'CONFIGURATION_ERROR';
}
