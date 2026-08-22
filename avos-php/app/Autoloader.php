<?php
declare(strict_types=1);
namespace AvOS;

/**
 * PSR-4 autoloader for the AvOS\ namespace.
 *
 * Bespoke rather than Composer: Hostinger shared hosting cannot run
 * `composer install`, and committing a vendor/ directory for one autoloader is
 * disproportionate. Registered once by the Kernel.
 */
final class Autoloader
{
    public static function register(string $baseDir, string $prefix = 'AvOS\\'): void
    {
        $baseDir = rtrim($baseDir, '/') . '/';
        spl_autoload_register(static function (string $class) use ($baseDir, $prefix): void {
            if (!str_starts_with($class, $prefix)) return;
            $rel = substr($class, strlen($prefix));
            $file = $baseDir . str_replace('\\', '/', $rel) . '.php';
            if (is_file($file)) require $file;
        });
    }
}
