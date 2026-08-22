<?php
declare(strict_types=1);
namespace AvOS\Errors;

final class DatabaseException extends AppException
{
    public function __construct(string $message)
    { parent::__construct($message, 'SERVER_ERROR', 500); }
}
