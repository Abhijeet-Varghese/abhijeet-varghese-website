<?php
declare(strict_types=1);
namespace AvOS\Errors;

final class ValidationException extends AppException
{
    public function __construct(array $fields, string $message = 'Validation failed')
    { parent::__construct($message, 'VALIDATION_ERROR', 422, $fields); }
}
