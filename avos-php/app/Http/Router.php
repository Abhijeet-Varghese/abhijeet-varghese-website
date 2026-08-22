<?php
declare(strict_types=1);
namespace AvOS\Http;

use AvOS\Errors\AppException;

/**
 * Minimal, explicit router. Routes are registered as
 *   METHOD /literal/path  => callable
 * No regex route table and no controller auto-discovery: the surface must be
 * enumerable by reading one file.
 */
final class Router
{
    /** @var array<string,callable> "METHOD PATH" => handler */
    private array $routes = [];

    public function add(string $method, string $path, callable $handler): void
    {
        $this->routes[strtoupper($method) . ' ' . rtrim($path, '/')] = $handler;
    }

    public function get(string $p, callable $h): void { $this->add('GET', $p, $h); }
    public function post(string $p, callable $h): void { $this->add('POST', $p, $h); }

    /** @return array{status:int,body:array} */
    public function dispatch(Request $req): array
    {
        $path = rtrim($req->path, '/');
        if ($path === '') $path = '/';
        $key = $req->method . ' ' . $path;

        if (!isset($this->routes[$key])) {
            // Distinguish "wrong verb" from "no such route" — useful, and it
            // leaks nothing an attacker cannot learn by trying every verb.
            foreach (array_keys($this->routes) as $registered) {
                if (str_ends_with($registered, ' ' . $path)) {
                    throw new AppException('Method not allowed.', 'NOT_FOUND', 405);
                }
            }
            throw new AppException('Not found.', 'NOT_FOUND', 404);
        }
        return ($this->routes[$key])($req);
    }

    /** @return string[] */
    public function registered(): array { return array_keys($this->routes); }
}
