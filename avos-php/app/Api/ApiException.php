<?php
declare(strict_types=1);
namespace AvOS\Api;

/**
 * The only exception type controllers/services should throw for a client-facing
 * failure. Status and default message come from ErrorCatalog, so an endpoint
 * cannot accidentally return an inconsistent shape or a wrong status.
 */
final class ApiException extends \RuntimeException
{
    public function __construct(
        private readonly string $errorCode,
        string $message = '',
        private readonly ?array $details = null,
        private readonly ?int $statusOverride = null,
    ) {
        parent::__construct($message !== '' ? $message : ErrorCatalog::defaultMessage($errorCode));
    }

    /** Named errorCode(): Exception already owns $code. */
    public function code(): string { return $this->errorCode; }
    public function details(): ?array { return $this->details; }
    public function status(): int
    { return $this->statusOverride ?? ErrorCatalog::status($this->errorCode); }

    // Convenience constructors — keep call sites readable.
    public static function unauthorized(string $m = ''): self
    { return new self(ErrorCatalog::UNAUTHORIZED, $m); }
    public static function forbidden(string $m = ''): self
    { return new self(ErrorCatalog::FORBIDDEN, $m); }
    public static function notFound(string $m = ''): self
    { return new self(ErrorCatalog::NOT_FOUND, $m); }
    public static function validation(array $details, string $m = ''): self
    { return new self(ErrorCatalog::VALIDATION_ERROR, $m, $details); }
    public static function conflict(string $m = ''): self
    { return new self(ErrorCatalog::CONFLICT, $m); }
    public static function rateLimited(?int $retryAfterSeconds = null): self
    { return new self(ErrorCatalog::RATE_LIMITED, '', $retryAfterSeconds !== null
        ? ['retry_after_seconds' => $retryAfterSeconds] : null); }
}
