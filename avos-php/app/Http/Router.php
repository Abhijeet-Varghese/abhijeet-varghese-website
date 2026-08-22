<?php
declare(strict_types=1);
namespace AvOS\Http;

use AvOS\Api\ApiException;
use AvOS\Api\ErrorCatalog;

/**
 * The one canonical router (Phase 3D §3D.2).
 *
 * Every module registers here — there is deliberately no per-module routing
 * implementation. Supports exact routes, `{param}` path parameters, correct
 * 404 vs 405 discrimination, and a per-route middleware chain.
 *
 * Middleware are `callable(Request $req, callable $next): ApiResult` and run
 * outermost-first, so auth can short-circuit before a controller is reached.
 */
final class Router
{
    /** @var array<int,array{method:string,regex:string,params:string[],handler:callable,middleware:array,path:string}> */
    private array $routes = [];

    /** @var array<int,callable> global middleware, applied to every route */
    private array $global = [];

    public function use(callable $middleware): void { $this->global[] = $middleware; }

    public function add(string $method, string $path, callable $handler, array $middleware = []): void
    {
        $path = '/' . trim($path, '/');
        $params = [];
        $regex = preg_replace_callback(
            '#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#',
            static function (array $m) use (&$params): string {
                $params[] = $m[1];
                return '([^/]+)';
            },
            $path,
        ) ?? $path;

        $this->routes[] = [
            'method'     => strtoupper($method),
            'regex'      => '#^' . $regex . '$#',
            'params'     => $params,
            'handler'    => $handler,
            'middleware' => $middleware,
            'path'       => $path,
        ];
    }

    public function get(string $p, callable $h, array $m = []): void { $this->add('GET', $p, $h, $m); }
    public function post(string $p, callable $h, array $m = []): void { $this->add('POST', $p, $h, $m); }
    public function put(string $p, callable $h, array $m = []): void { $this->add('PUT', $p, $h, $m); }
    public function patch(string $p, callable $h, array $m = []): void { $this->add('PATCH', $p, $h, $m); }
    public function delete(string $p, callable $h, array $m = []): void { $this->add('DELETE', $p, $h, $m); }

    /**
     * Resolve and run.
     *
     * GLOBAL middleware wraps the ENTIRE dispatch, including route resolution,
     * so security headers and CORS apply to 404 and 405 responses too. An
     * earlier version composed globals per matched route, which meant an
     * unmatched request returned no security headers at all.
     */
    public function dispatch(Request $request): mixed
    {
        $resolve = fn(Request $r): mixed => $this->resolve($r);
        $next = $resolve;
        foreach (array_reverse($this->global) as $mw) {
            $prev = $next;
            $next = static fn(Request $r): mixed => $mw($r, $prev);
        }
        return $next($request);
    }

    private function resolve(Request $request): mixed
    {
        $path = '/' . trim($request->path, '/');
        $pathMatched = false;
        $allowed = [];

        foreach ($this->routes as $route) {
            if (preg_match($route['regex'], $path, $m) !== 1) continue;
            $pathMatched = true;
            $allowed[] = $route['method'];
            if ($route['method'] === 'GET') $allowed[] = 'HEAD';

            $method = $request->method === 'HEAD' ? 'GET' : $request->method;
            if ($route['method'] !== $method) continue;

            $params = [];
            foreach ($route['params'] as $i => $name) {
                $params[$name] = urldecode($m[$i + 1] ?? '');
            }
            $req = $request->withParams($params)->withRoute($route['path']);

            // Globals already wrap dispatch(); only route middleware here.
            $next = static fn(Request $r): mixed => ($route['handler'])($r);
            foreach (array_reverse($route['middleware']) as $mw) {
                $prev = $next;
                $next = static fn(Request $r): mixed => $mw($r, $prev);
            }
            return $next($req);
        }

        if ($pathMatched) {
            throw new ApiException(
                ErrorCatalog::METHOD_NOT_ALLOWED,
                '',
                ['allowed' => array_values(array_unique($allowed))],
            );
        }
        throw new ApiException(ErrorCatalog::NOT_FOUND);
    }

    /** @return string[] "METHOD /path" — used by the route-inventory test. */
    public function registered(): array
    {
        return array_map(static fn(array $r): string => $r['method'] . ' ' . $r['path'], $this->routes);
    }
}
