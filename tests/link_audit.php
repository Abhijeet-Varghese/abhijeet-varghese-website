<?php
/* Link audit: crawl generated site HTML, verify all internal links + assets return 200. */
$base = 'http://127.0.0.1:8092/site/';
$start = $base . 'index.html';

function get(string $url): ?string {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 20]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return $code === 200 ? (string)$body : null;
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
        $url2 = str_starts_with($raw, '/') ? $base . ltrim($raw, '/') : dirname($url) . '/' . $raw;
        $url2 = preg_replace('/\?.*$/', '', $url2);
        if (isset($checked[$url2])) continue;
        $checked[$url2] = get($url2) !== null ? 'ok' : 'BROKEN';
        if ($checked[$url2] === 'BROKEN') $broken[] = "$url → $url2";
        if (preg_match('/\.html?$/', $url2) && $checked[$url2] === 'ok') $queue[] = $url2;
    }
}

echo "Pages crawled: " . count($pages) . "\n";
echo "Links/assets checked: " . count($checked) . "\n";
if ($broken) {
    echo "BROKEN (" . count($broken) . "):\n  " . implode("\n  ", array_slice($broken, 0, 40)) . "\n";
    exit(1);
}
echo "ZERO BROKEN LINKS OR ASSETS\n";
