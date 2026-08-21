<?php
/**
 * AV OS — response + input helpers.
 * Consistent envelope: { ok, data, error: { code, message } }
 */
final class Response
{
    public static function json(mixed $data, int $code = 200): never
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        if (defined('AV_REQUEST_ID')) header('X-Request-Id: ' . AV_REQUEST_ID);
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
        // HSTS only over real HTTPS (never over plain HTTP)
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }
        echo json_encode(['ok' => $code < 400, 'data' => $data, 'error' => null], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $msg, int $code = 400, string $errCode = 'ERROR'): never
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        if (defined('AV_REQUEST_ID')) header('X-Request-Id: ' . AV_REQUEST_ID);
        $err = ['code' => $errCode, 'message' => $msg];
        if (defined('AV_REQUEST_ID')) $err['request_id'] = AV_REQUEST_ID;
        echo json_encode(['ok' => false, 'data' => null, 'error' => $err], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Cached public JSON response (for the public content bridge).
     *
     * Used by GET /api/v1/content — the only response in AV OS that is
     * publicly cacheable. Emits an ETag (caller-supplied, derived from the
     * exact serialized payload) + a short max-age so a publish invalidates
     * within `maxAge` seconds even for clients that do not revalidate, while
     * ETag-aware clients get an instant 304.
     */
    public static function jsonCached(mixed $data, int $code = 200, ?string $etag = null, int $maxAge = 60): never
    {
        $cacheControl = 'public, max-age=' . max(0, $maxAge) . ', must-revalidate';
        if ($etag !== null && $etag !== '') {
            $inm = (string)($_SERVER['HTTP_IF_NONE_MATCH'] ?? '');
            $normalize = static fn(string $v): string => trim($v, " \t\n\r\"");
            if ($inm !== '' && in_array($etag, array_map($normalize, explode(',', $inm)), true)) {
                http_response_code(304);
                header('ETag: "' . $etag . '"');
                header('Cache-Control: ' . $cacheControl);
                header('X-Content-Type-Options: nosniff');
                exit;
            }
            header('ETag: "' . $etag . '"');
        }
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: ' . $cacheControl);
        header('Vary: Accept-Encoding');
        if (defined('AV_REQUEST_ID')) header('X-Request-Id: ' . AV_REQUEST_ID);
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
        echo json_encode(['ok' => $code < 400, 'data' => $data, 'error' => null], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function html(string $html, int $code = 200): never
    {
        http_response_code($code);
        header('Content-Type: text/html; charset=utf-8');
        echo $html;
        exit;
    }
}

final class Input
{
    public static function body(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    public static function str(array $d, string $k, int $max = 5000): string
    {
        return mb_substr(trim((string)($d[$k] ?? '')), 0, $max);
    }

    public static function email(array $d, string $k = 'email'): string
    {
        $v = filter_var(trim((string)($d[$k] ?? '')), FILTER_VALIDATE_EMAIL);
        return $v === false ? '' : $v;
    }

    public static function int(array $d, string $k, int $default = 0): int
    {
        return (int)($d[$k] ?? $default);
    }

    public static function bool(array $d, string $k): bool
    {
        return in_array($d[$k] ?? false, [true, 1, '1', 'true', 'on'], true);
    }

    public static function slug(string $s): string
    {
        $s = strtolower(trim($s));
        $s = preg_replace('/[^a-z0-9]+/', '-', $s);
        return trim($s, '-');
    }

    public static function e(mixed $v): string
    {
        return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8');
    }
}
