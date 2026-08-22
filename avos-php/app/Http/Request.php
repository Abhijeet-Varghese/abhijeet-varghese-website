<?php
declare(strict_types=1);
namespace AvOS\Http;

use AvOS\Api\ApiException;
use AvOS\Api\ErrorCatalog;
use AvOS\Identity\User;

/**
 * Normalised request (Phase 3D §3D.3).
 *
 * Superglobals are read exactly once, here. Nothing downstream touches $_GET,
 * $_POST or $_SERVER. Immutable: `withParams()` / `withUser()` return copies,
 * so a middleware cannot mutate the request another one already inspected.
 */
final class Request
{
    public const MAX_BODY_BYTES = 1_048_576;   // 1 MB

    /** @var array<string,mixed>|null memoised decoded body */
    private ?array $decoded = null;

    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query,
        public readonly array $headers,
        public readonly string $rawBody,
        public readonly string $ip,
        public readonly string $userAgent,
        public readonly string $requestId,
        public readonly array $params = [],
        public readonly ?User $user = null,
        public readonly string $routePattern = '',
    ) {}

    public static function fromGlobals(string $requestId): self
    {
        $headers = [];
        foreach ($_SERVER as $k => $v) {
            if (str_starts_with($k, 'HTTP_')) {
                $headers[strtolower(str_replace('_', '-', substr($k, 5)))] = (string)$v;
            }
        }
        foreach (['CONTENT_TYPE' => 'content-type', 'CONTENT_LENGTH' => 'content-length'] as $sk => $hk) {
            if (isset($_SERVER[$sk])) $headers[$hk] = (string)$_SERVER[$sk];
        }

        $uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
        return new self(
            strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')),
            (string)(parse_url($uri, PHP_URL_PATH) ?: '/'),
            $_GET,
            $headers,
            (string)(file_get_contents('php://input') ?: ''),
            (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'),
            substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 250),
            $requestId,
        );
    }

    // ------------------------------------------------------------ copies

    public function withParams(array $params): self
    {
        return new self($this->method, $this->path, $this->query, $this->headers, $this->rawBody,
            $this->ip, $this->userAgent, $this->requestId, $params, $this->user, $this->routePattern);
    }

    public function withUser(?User $user): self
    {
        return new self($this->method, $this->path, $this->query, $this->headers, $this->rawBody,
            $this->ip, $this->userAgent, $this->requestId, $this->params, $user, $this->routePattern);
    }

    public function withRoute(string $pattern): self
    {
        return new self($this->method, $this->path, $this->query, $this->headers, $this->rawBody,
            $this->ip, $this->userAgent, $this->requestId, $this->params, $this->user, $pattern);
    }

    // ----------------------------------------------------------- accessors

    public function header(string $name): string
    { return $this->headers[strtolower($name)] ?? ''; }

    public function param(string $name, string $default = ''): string
    { return (string)($this->params[$name] ?? $default); }

    public function intParam(string $name): int
    { return (int)($this->params[$name] ?? 0); }

    public function queryValue(string $name, string $default = ''): string
    {
        $v = $this->query[$name] ?? $default;
        return is_scalar($v) ? (string)$v : $default;
    }

    public function isMutating(): bool
    { return in_array($this->method, ['POST', 'PUT', 'PATCH', 'DELETE'], true); }

    /**
     * Decoded JSON body. Fails explicitly on oversize, wrong content type and
     * malformed JSON — never silently returns an empty array for bad input,
     * which would let a malformed request look like an empty one.
     */
    public function json(): array
    {
        if ($this->decoded !== null) return $this->decoded;
        if ($this->rawBody === '') return $this->decoded = [];

        if (strlen($this->rawBody) > self::MAX_BODY_BYTES) {
            throw new ApiException(ErrorCatalog::PAYLOAD_TOO_LARGE);
        }
        $ct = strtolower($this->header('content-type'));
        if ($ct !== '' && !str_contains($ct, 'application/json')) {
            throw new ApiException(ErrorCatalog::UNSUPPORTED_MEDIA_TYPE,
                'Content-Type must be application/json.');
        }
        $decoded = json_decode($this->rawBody, true);
        if (!is_array($decoded)) {
            throw new ApiException(ErrorCatalog::INVALID_JSON);
        }
        return $this->decoded = $decoded;
    }
}
