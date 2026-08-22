<?php
declare(strict_types=1);
namespace AvOS\Errors;

use AvOS\Core\ApiResponse;
use AvOS\Core\RequestContext;
use Throwable;

/**
 * Centralised error handling (Phase 2 §3A.5).
 *
 * Production returns a sanitised message and a request id — never SQL, a
 * stack trace, a class name or a filesystem path. The full detail goes to the
 * server log, correlated by request id.
 */
final class ErrorHandler
{
    public function __construct(
        private readonly RequestContext $ctx,
        private readonly bool $debug,
        private readonly string $logFile,
    ) {}

    public function register(): void
    {
        error_reporting(E_ALL);
        ini_set('display_errors', '0');          // never to the client, ever
        ini_set('log_errors', '1');
        if ($this->logFile !== '') ini_set('error_log', $this->logFile);

        set_exception_handler(fn(Throwable $e) => $this->handle($e));
        set_error_handler(static function (int $no, string $str, string $file, int $line): bool {
            if ((error_reporting() & $no) === 0) return false;
            throw new \ErrorException($str, 0, $no, $file, $line);
        });
        register_shutdown_function(function (): void {
            $e = error_get_last();
            if ($e !== null && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
                $this->handle(new \ErrorException($e['message'], 0, $e['type'], $e['file'], $e['line']));
            }
        });
    }

    public function handle(Throwable $e): void
    {
        $this->log($e);

        $isApp   = $e instanceof AppException;
        $code    = $isApp ? $e->errorCode() : ErrorCode::SERVER_ERROR;
        $status  = $isApp ? $e->status() : 500;
        $fields  = $isApp ? $e->fields() : [];

        // A ConfigurationException message is authored by us and contains no
        // secrets or paths, so it is safe to surface even in production —
        // otherwise the operator cannot tell why the app refused to boot.
        $safeMessage = match (true) {
            $e instanceof ConfigurationException => $e->getMessage(),
            $isApp                               => $e->getMessage(),
            default                              => 'Internal server error',
        };

        $debug = null;
        if ($this->debug) {
            $debug = [
                'exception' => $e::class,
                'message'   => $e->getMessage(),
                'file'      => basename($e->getFile()),   // basename only — no path disclosure
                'line'      => $e->getLine(),
            ];
        }

        if ($this->ctx->isCli) {
            fwrite(STDERR, "[{$this->ctx->requestId}] {$safeMessage}\n");
            if ($this->debug) fwrite(STDERR, $e->getTraceAsString() . "\n");
            exit(1);
        }

        ApiResponse::send(
            ApiResponse::error($code, $safeMessage, $status, $this->ctx->requestId, $fields, $debug),
            $this->ctx->requestId,
        );
        exit;
    }

    private function log(Throwable $e): void
    {
        // Full detail server-side only, correlated by request id.
        error_log(sprintf(
            '[AVOS][%s] %s: %s @ %s:%d | %s %s',
            $this->ctx->requestId, $e::class, $e->getMessage(),
            $e->getFile(), $e->getLine(), $this->ctx->method, $this->ctx->path,
        ));
    }
}
