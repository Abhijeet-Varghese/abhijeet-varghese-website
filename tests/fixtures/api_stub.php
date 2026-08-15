<?php
/**
 * AV OS — integration fixture stub (TEST ONLY).
 * Mimics the REAL documented API contracts of Google Search Console,
 * GA4 Data API, Bing Webmaster, Cloudflare and Calendly, so adapter
 * request-building, OAuth, normalization, caching and failure handling
 * are verified end-to-end. Never deployed; never reaches production.
 */
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
header('Content-Type: application/json');
$body = file_get_contents('php://input');

$json = function (array $d, int $code = 200): void {
    http_response_code($code);
    echo json_encode($d);
    exit;
};

// ---- OAuth2 token endpoint (service-account JWT exchange) ----
if ($path === '/token' && $method === 'POST') {
    parse_str($body, $p);
    if (!isset($p['assertion']) || $p['assertion'] === '') $json(['error' => 'invalid_grant'], 400);
    // verify the JWT shape we emit (3 dot-separated b64 segments)
    if (substr_count($p['assertion'], '.') !== 2) $json(['error' => 'invalid_grant'], 400);
    $json(['access_token' => 'fixture-access-token-' . bin2hex(random_bytes(6)), 'expires_in' => 3600, 'token_type' => 'Bearer']);
}

// ---- Google Search Console ----
if (str_contains($path, 'webmasters/v3/sites')) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($auth, 'Bearer ')) $json(['error' => ['code' => 401, 'message' => 'Unauthorized']], 401);
    if ($method === 'GET' && str_ends_with($path, '/sites')) {
        $json(['siteEntry' => [
            ['siteUrl' => 'https://abhijeetvarghese.com/', 'permissionLevel' => 'siteFullUser'],
            ['siteUrl' => 'sc-domain:abhijeetvarghese.com', 'permissionLevel' => 'siteFullUser'],
        ]]);
    }
    if ($method === 'POST' && str_contains($path, 'searchAnalytics/query')) {
        $q = json_decode($body, true);
        $from = $q['startDate'] ?? '2026-07-01';
        $json(['rows' => [
            ['keys' => ['experience design consultant', 'https://abhijeetvarghese.com/experience.html', $from, 'IND', 'DESKTOP'], 'clicks' => 21, 'impressions' => 1842, 'ctr' => 0.0114, 'position' => 11.2],
            ['keys' => ['immersive experience design', 'https://abhijeetvarghese.com/experience.html', $from, 'IND', 'MOBILE'], 'clicks' => 14, 'impressions' => 1105, 'ctr' => 0.0127, 'position' => 9.8],
            ['keys' => ['creative technology consultant', 'https://abhijeetvarghese.com/experience.html', $from, 'IND', 'DESKTOP'], 'clicks' => 9, 'impressions' => 742, 'ctr' => 0.0121, 'position' => 13.4],
            ['keys' => ['design leadership', 'https://abhijeetvarghese.com/story.html', $from, 'IND', 'DESKTOP'], 'clicks' => 5, 'impressions' => 402, 'ctr' => 0.0124, 'position' => 8.9],
        ]]);
    }
}

// ---- GA4 Data API ----
if (str_contains($path, 'properties/') && str_contains($path, ':runReport')) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($auth, 'Bearer ')) $json(['error' => ['code' => 401]], 401);
    $q = json_decode($body, true);
    $dims = array_column($q['dimensions'] ?? [], 'name');
    $today = date('Ymd');
    if (in_array('date', $dims, true)) {
        $json(['rows' => [
            ['dimensionValues' => [['value' => $today]], 'metricValues' => [['value' => '120'], ['value' => '156'], ['value' => '98'], ['value' => '410'], ['value' => '0.63']]],
            ['dimensionValues' => [['value' => date('Ymd', strtotime('-1 day'))]], 'metricValues' => [['value' => '105'], ['value' => '142'], ['value' => '90'], ['value' => '380'], ['value' => '0.61']]],
        ]]);
    }
    if (in_array('pagePath', $dims, true)) {
        $json(['rows' => [
            ['dimensionValues' => [['value' => '/experience.html']], 'metricValues' => [['value' => '180'], ['value' => '210'], ['value' => '150'], ['value' => '520'], ['value' => '0.7']]],
            ['dimensionValues' => [['value' => '/story.html']], 'metricValues' => [['value' => '90'], ['value' => '120'], ['value' => '80'], ['value' => '300'], ['value' => '0.6']]],
        ]]);
    }
    if (in_array('sessionDefaultChannelGroup', $dims, true)) {
        $json(['rows' => [
            ['dimensionValues' => [['value' => 'Organic Search']], 'metricValues' => [['value' => '10'], ['value' => '45'], ['value' => '30'], ['value' => '120'], ['value' => '0.6']]],
            ['dimensionValues' => [['value' => 'Direct']], 'metricValues' => [['value' => '8'], ['value' => '60'], ['value' => '40'], ['value' => '150'], ['value' => '0.6']]],
        ]]);
    }
    $json(['rows' => []]);
}

// ---- Bing Webmaster API ----
if (str_contains($path, 'GetUserSites') || str_contains($path, 'GetUrlTraffic')) {
    $key = $_GET['apikey'] ?? '';
    if ($key !== 'fixture-key') $json(['error' => 'Invalid apikey'], 401);
    if (str_contains($path, 'GetUserSites')) {
        $json(['d' => [['Url' => 'abhijeetvarghese.com'], ['Url' => 'www.abhijeetvarghese.com']]]);
    }
    if (str_contains($path, 'GetUrlTraffic')) {
        $json(['d' => [
            ['Query' => 'experience design consultant', 'Page' => 'https://abhijeetvarghese.com/experience.html', 'Date' => '2026-07-15', 'Clicks' => 8, 'Impressions' => 940, 'AveragePosition' => 12.4],
            ['Query' => 'creative technology', 'Page' => 'https://abhijeetvarghese.com/experience.html', 'Date' => '2026-07-15', 'Clicks' => 4, 'Impressions' => 512, 'AveragePosition' => 14.1],
        ]]);
    }
}

// ---- Cloudflare API v4 ----
if (str_contains($path, '/client/v4/')) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if ($auth !== 'Bearer fixture-token') $json(['success' => false, 'errors' => [['code' => 1000, 'message' => 'Invalid token']]], 400);
    if (str_contains($path, 'user/tokens/verify')) {
        $json(['success' => true, 'result' => ['id' => 'fixture-token', 'status' => 'active']]);
    }
    if (str_contains($path, 'analytics/dashboard')) {
        $json(['success' => true, 'result' => ['totals' => ['requests' => 12500, 'pageviews' => 9800, 'uniques' => 4100, 'threats' => 12]]]);
    }
}

// ---- Calendly API v2 (dedicated /cal base) ----
if (str_starts_with($path, '/cal/')) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if ($auth !== 'Bearer fixture-pat') $json(['message' => 'Unauthenticated'], 401);
    if (str_ends_with($path, '/users/me')) {
        $json(['resource' => ['uri' => 'https://api.calendly.com/users/FIXTURE', 'name' => 'Abhijeet Varghese', 'email' => 'hi@abhijeetvarghese.com']]);
    }
    if (str_contains($path, 'event_types')) {
        $json(['collection' => [
            ['uri' => 'https://api.calendly.com/event_types/FIXTURE-ET1', 'name' => 'Discovery Call', 'scheduling_url' => 'https://calendly.com/abhijeetvarghese/discovery', 'active' => true, 'duration' => 30],
            ['uri' => 'https://api.calendly.com/event_types/FIXTURE-ET2', 'name' => 'Portfolio Review', 'scheduling_url' => 'https://calendly.com/abhijeetvarghese/portfolio', 'active' => true, 'duration' => 45],
        ]]);
    }
    if (str_contains($path, 'scheduled_events')) {
        $json(['collection' => [
            ['uri' => 'https://api.calendly.com/scheduled_events/FIXTURE-EV1', 'name' => 'Discovery Call', 'status' => 'active', 'start_time' => '2026-08-20T10:00:00Z',
             'invitees' => [['uri' => 'https://api.calendly.com/scheduled_events/FIXTURE-EV1/invitees/FIXTURE-INV1']]],
            ['uri' => 'https://api.calendly.com/scheduled_events/FIXTURE-EV2', 'name' => 'Discovery Call', 'status' => 'active', 'start_time' => '2026-08-22T15:30:00Z',
             'invitees' => [['uri' => 'https://api.calendly.com/scheduled_events/FIXTURE-EV2/invitees/FIXTURE-INV2']]],
        ]]);
    }
    if (str_contains($path, 'invitees/')) {
        $json(['resource' => ['name' => 'Fixture Client', 'email' => 'client@fixture.test']]);
    }
}

http_response_code(404);
echo json_encode(['error' => 'fixture not found', 'path' => $path]);
