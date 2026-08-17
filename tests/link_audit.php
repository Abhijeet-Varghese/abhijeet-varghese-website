<?php
/* Link audit: crawl generated site HTML, verify all internal links + assets return 200. */
$base = 'http://127.0.0.1:8092/';
$start = $base . 'index.html';

function get(string $url): ?string {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 20]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return $code === 200 ? (string)$body : null;
}

function resolve_url(string $baseUrl, string $ref): ?string {
    if ($ref === '' || preg_match('#^[a-z][a-z0-9+.-]*:#i', $ref) || str_starts_with($ref, '//')) return null;
    $parts = parse_url($baseUrl);
    if (!$parts || empty($parts['scheme']) || empty($parts['host'])) return null;
    $refPath = parse_url($ref, PHP_URL_PATH) ?? '';
    if ($refPath === '') return null;
    $basePath = $parts['path'] ?? '/';
    $baseDir = str_ends_with($basePath, '/') ? $basePath : dirname($basePath) . '/';
    $combined = str_starts_with($refPath, '/') ? $refPath : $baseDir . $refPath;
    $segments = [];
    foreach (explode('/', $combined) as $segment) {
        if ($segment === '' || $segment === '.') continue;
        if ($segment === '..') { array_pop($segments); continue; }
        $segments[] = $segment;
    }
    $path = '/' . implode('/', $segments);
    if (str_ends_with($refPath, '/') && !str_ends_with($path, '/')) $path .= '/';
    $port = isset($parts['port']) ? ':' . $parts['port'] : '';
    return $parts['scheme'] . '://' . $parts['host'] . $port . $path;
}

$checked = [];   // url => status
$broken = [];
$pages = [];
$queue = [$start];
$seenPages = [];

while ($queue) {
    $url = array_shift($queue);
    if (isset($seenPages[$url])) continue;
    $seenPages[$url] = true;
    $html = get($url);
    if ($html === null) { $broken[] = "PAGE $url"; continue; }
    $pages[] = $url;
    if (!preg_match_all('/\b(?:href|src|data-src)="([^"#]+)"/i', $html, $m)) $m = [[], []];
    $extra = [];
    if (preg_match_all('/\bsrcset="([^"]+)"/i', $html, $ms)) {
        foreach ($ms[1] as $set) {
            foreach (preg_split('/\s*,\s*/', $set) as $cand) {
                $cand = preg_replace('/\s+[0-9.]+[wx]$/', '', trim($cand));
                if ($cand !== '') $extra[] = $cand;
            }
        }
    }
    $m[1] = array_merge($m[1], $extra);
    foreach ($m[1] as $raw) {
        $raw = trim($raw);
        if ($raw === '' || str_starts_with($raw, 'http') || str_starts_with($raw, 'mailto:') || str_starts_with($raw, 'tel:') || str_starts_with($raw, 'data:') || str_starts_with($raw, 'javascript:')) continue;
        $url2 = resolve_url($url, $raw);
        if ($url2 === null || isset($checked[$url2])) continue;
        $checked[$url2] = get($url2) !== null ? 'ok' : 'BROKEN';
        if ($checked[$url2] === 'BROKEN') $broken[] = "$url → $url2";
        $path2 = parse_url($url2, PHP_URL_PATH) ?: '';
        if ((preg_match('/\.html?$/', $path2) || str_ends_with($path2, '/')) && $checked[$url2] === 'ok') $queue[] = $url2;
    }
}

echo "Pages crawled: " . count($pages) . "\n";
echo "Links/assets checked: " . count($checked) . "\n";
if ($broken) {
    echo "BROKEN (" . count($broken) . "):\n  " . implode("\n  ", array_slice($broken, 0, 40)) . "\n";
    exit(1);
}
echo "ZERO BROKEN LINKS OR ASSETS\n";
