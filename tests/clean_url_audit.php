<?php
require __DIR__ . '/../avos-php/includes/bootstrap.php';

echo "========================================================\n";
echo "   CLEAN URL & CANONICAL ROUTING FORENSIC AUDIT\n";
echo "========================================================\n\n";

// 1. Route Registry build & validate
$site = ContentStore::all();
$isDue = fn($e) => true;
$routes = RouteRegistry::build($site, $isDue);
$validationErrors = RouteRegistry::validate($routes);

echo "1. ROUTE REGISTRY VALIDATION:\n";
if ($validationErrors) {
    echo "  [FAIL] Validation Errors:\n";
    foreach ($validationErrors as $e) {
        echo "    - $e\n";
    }
} else {
    echo "  [PASS] RouteRegistry::validate() -> 0 errors across " . count($routes) . " routes\n";
}

// 2. Redirect Chains & Loops
echo "\n2. REDIRECT CHAIN & LOOP AUDIT:\n";
$canonSet = [];
foreach ($routes as $r) {
    $canonSet[$r['canonical']] = $r;
}

$chains = 0;
$loops = 0;
$totalRedirects = 0;
foreach ($routes as $r) {
    foreach ($r['redirects'] as $rd) {
        $totalRedirects++;
        $from = $rd['from'];
        $to = $rd['to'];
        if ($from === $to) {
            echo "  [FAIL] LOOP DETECTED: $from -> $to\n";
            $loops++;
        }
        // Check if $to is a redirect source in any route
        foreach ($routes as $r2) {
            foreach ($r2['redirects'] as $rd2) {
                if ($to === $rd2['from']) {
                    echo "  [FAIL] CHAIN DETECTED: $from -> $to -> " . $rd2['to'] . "\n";
                    $chains++;
                }
            }
        }
    }
}
echo "  Total Redirects: $totalRedirects\n";
echo "  Redirect Chains: $chains\n";
echo "  Redirect Loops: $loops\n";

// 3. Sitemap Audit
echo "\n3. SITEMAP AUDIT:\n";
$sitemapXml = file_get_contents(AV_SITE_OUT . '/sitemap.xml');
preg_match_all('#<loc>([^<]+)</loc>#', $sitemapXml, $matches);
$sitemapUrls = $matches[1] ?? [];
$sitemapHtmlErrors = 0;
foreach ($sitemapUrls as $u) {
    if (preg_match('#\.html$#i', $u)) {
        echo "  [FAIL] Sitemap contains .html: $u\n";
        $sitemapHtmlErrors++;
    }
}
echo "  Total Sitemap URLs: " . count($sitemapUrls) . "\n";
echo "  Sitemap .html Errors: $sitemapHtmlErrors\n";

// 4. Canonical Tag, OG:URL, JSON-LD & Internal Link Audit across all output files
echo "\n4. CANONICAL TAGS, OG:URL, JSON-LD & INTERNAL LINKS AUDIT:\n";
$siteRoot = realpath(AV_SITE_OUT);
$htmlFiles = [];
$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($siteRoot, FilesystemIterator::SKIP_DOTS));
foreach ($it as $f) {
    if ($f->isFile() && $f->getExtension() === 'html') {
        $htmlFiles[] = $f->getPathname();
    }
}

$canonicalTagErrors = 0;
$ogUrlErrors = 0;
$internalHtmlLinkErrors = 0;
$checkedPages = 0;

foreach ($htmlFiles as $file) {
    $rel = substr($file, strlen($siteRoot) + 1);
    $content = file_get_contents($file);
    if (str_contains($content, 'Redirecting…') || $rel === '404.html' || $rel === 'search.html') {
        continue;
    }
    $checkedPages++;

    // Canonical tag
    if (preg_match('#<link\b[^>]*\brel=[\'"]canonical[\'"][^>]*\bhref=[\'"]([^\'"]+)[\'"]#i', $content, $m)) {
        $href = $m[1];
        if (preg_match('#\.html$#i', $href)) {
            echo "  [FAIL] Canonical tag has .html in $rel: $href\n";
            $canonicalTagErrors++;
        }
    }

    // OG:URL
    if (preg_match('#<meta\b[^>]*\bproperty=[\'"]og:url[\'"][^>]*\bcontent=[\'"]([^\'"]+)[\'"]#i', $content, $m)) {
        $href = $m[1];
        if (preg_match('#\.html$#i', $href)) {
            echo "  [FAIL] OG:URL has .html in $rel: $href\n";
            $ogUrlErrors++;
        }
    }

    // Internal links
    preg_match_all('#\bhref=[\'"]([^\'"]+)[\'"]#i', $content, $hrefMatches);
    foreach ($hrefMatches[1] as $href) {
        $h = trim($href);
        if (str_starts_with($h, '#') || str_starts_with($h, 'mailto:') || str_starts_with($h, 'tel:') || str_starts_with($h, 'http://') || str_starts_with($h, 'https://') || str_starts_with($h, '//')) {
            continue;
        }
        if (preg_match('#\.(pdf|png|jpg|jpeg|webp|svg|css|js|woff2)$#i', $h)) {
            continue;
        }
        if (preg_match('#\.html#i', $h)) {
            echo "  [FAIL] Internal .html link found in $rel: $h\n";
            $internalHtmlLinkErrors++;
        }
    }
}

echo "  Pages Checked: $checkedPages\n";
echo "  Canonical Tag .html Errors: $canonicalTagErrors\n";
echo "  OG:URL .html Errors: $ogUrlErrors\n";
echo "  Internal .html Link Errors: $internalHtmlLinkErrors\n";

// 5. Apache .htaccess validation
echo "\n5. APACHE .HTACCESS AUDIT:\n";
$htaccess = file_get_contents(AV_SITE_OUT . '/.htaccess');
$htaccessErrors = 0;
preg_match_all('#RewriteRule\s+\^([^\$]+)\/\?\$\s+([^\s]+)\s+\[R=301,L\]#', $htaccess, $htMatches, PREG_SET_ORDER);
echo "  Total 301 Rules in .htaccess: " . count($htMatches) . "\n";
foreach ($htMatches as $m) {
    $from = $m[1];
    $to = $m[2];
    if (str_ends_with($to, '.html')) {
        echo "  [FAIL] .htaccess redirect targets .html: $from -> $to\n";
        $htaccessErrors++;
    }
    if (!isset($canonSet[$to])) {
        echo "  [FAIL] .htaccess redirect targets non-existent canonical: $from -> $to\n";
        $htaccessErrors++;
    }
}
echo "  .htaccess Rule Errors: $htaccessErrors\n";

// Summary
$totalErrors = count($validationErrors) + $chains + $loops + $sitemapHtmlErrors + $canonicalTagErrors + $ogUrlErrors + $internalHtmlLinkErrors + $htaccessErrors;
echo "\n========================================================\n";
if ($totalErrors === 0) {
    echo "  RESULT: ALL CLEAN URL & ROUTING AUDITS PASSED (0 ERRORS)\n";
} else {
    echo "  RESULT: FAILED WITH $totalErrors TOTAL ERRORS\n";
}
echo "========================================================\n";
exit($totalErrors === 0 ? 0 : 1);
