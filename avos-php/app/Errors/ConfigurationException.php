<?php
declare(strict_types=1);
namespace AvOS\Errors;

final class ConfigurationException extends AppException
{
    public function __construct(string $message)
    { parent::__construct($message, 'CONFIGURATION_ERROR', 500); }
}
