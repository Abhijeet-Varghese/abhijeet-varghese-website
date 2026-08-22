<?php
declare(strict_types=1);
namespace AvOS\Errors;

/** Base for exceptions that carry an API error code and HTTP status. */
class AppException extends \RuntimeException
{
    public function __construct(
        string $message,
        private readonly string $errorCode = 'SERVER_ERROR',
        private readonly int $status = 500,
        private readonly array $fields = [],
    ) { parent::__construct($message); }

    public function errorCode(): string { return $this->errorCode; }
    public function status(): int { return $this->status; }
    public function fields(): array { return $this->fields; }
}
