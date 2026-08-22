<?php
/**
 * AV OS — INTEGRATION ADAPTERS (v2.4)
 * Search · Analytics · Monitoring · Business · Development.
 *
 * Every adapter: real API contracts only, free tiers first, graceful
 * failure, no fake data. `test()` makes a REAL request; `sync()` pulls
 * + normalizes + stores. All requests go through IntegrationHub::http
 * (logging + cache + retry). If an API needs credentials that are not
 * configured, the adapter returns ok=false with a clear message —
 * never fabricated data.
 */

/* ============================================================
   GOOGLE SEARCH CONSOLE
   ============================================================ */
final class SearchConsoleAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'gsc'; }

    public function publicType(): bool { return false; }

    private function token(array $cfg): string
    {
        if (!empty($cfg['access_token'])) return $cfg['access_token'];
        if (!empty($cfg['service_account_json'])) {
            $sa = json_decode((string)$cfg['service_account_json'], true);
            if (!$sa || empty($sa['client_email']) || empty($sa['private_key'])) {
                throw new RuntimeException('Service account JSON is invalid');
            }
            // test-only override: point OAuth + API at a fixture host
            $tokenUrl = !empty($cfg['api_base']) ? rtrim($cfg['api_base'], '/') . '/token' : 'https://oauth2.googleapis.com/token';
            $token = OAuth2::googleServiceAccountAt($sa, 'https://www.googleapis.com/auth/webmasters.readonly', $tokenUrl);
            return $token;
        }
        throw new RuntimeException('Missing credentials: service account JSON (recommended) or access token');
    }

    private function base(array $cfg): string
    {
        return rtrim((string)($cfg['api_base'] ?? 'https://searchconsole.googleapis.com'), '/');
    }

    public function capabilities(): array
    {
        return ['read' => 'queries, pages, clicks, impressions, CTR, position, country, device (16k rows/day, free)'];
    }

    public function test(array $config): array
    {
        try {
            $token = $this->token($config);
            $res = IntegrationHub::http('GET', $this->base($config) . '/webmasters/v3/sites', ['Authorization: Bearer ' . $token]);
            if (!$res['ok']) return ['ok' => false, 'error' => 'Search Console API error: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
            $d = IntegrationHub::json($res['body']);
            $sites = $d['siteEntry'] ?? [];
            $siteUrl = $config['site_url'] ?? 'https://abhijeetvarghese.com/';
            $found = false;
            foreach ($sites as $s) {
                if (($s['siteUrl'] ?? '') === $siteUrl || ($s['siteUrl'] ?? '') === rtrim($siteUrl, '/') . '/') { $found = true; break; }
            }
            return ['ok' => $found, 'message' => $found ? "Verified property {$siteUrl}" : "Property {$siteUrl} not found in your Search Console account (available: " . implode(', ', array_map(fn($s) => $s['siteUrl'] ?? '?', array_slice($sites, 0, 5))) . ')',
                    'error' => $found ? '' : 'Property not found'];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public function sync(array $config): array
    {
        try {
            $token = $this->token($config);
            $siteUrl = $config['site_url'] ?? 'https://abhijeetvarghese.com/';
            $days = max(3, min(90, (int)($config['days'] ?? 28)));
            $from = date('Y-m-d', strtotime("-{$days} days"));
            $to = date('Y-m-d');

            $body = json_encode([
                'startDate' => $from, 'endDate' => $to,
                'dimensions' => ['query', 'page', 'date', 'country', 'device'],
                'rowLimit' => 25000, 'dataState' => 'final',
            ]);
            $res = IntegrationHub::http('POST',
                $this->base($config) . '/webmasters/v3/sites/' . rawurlencode($siteUrl) . '/searchAnalytics/query',
                ['Authorization: Bearer ' . $token, 'Content-Type: application/json'], $body, 60);
            if (!$res['ok']) return ['ok' => false, 'error' => 'GSC query failed: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];

            $rows = IntegrationHub::json($res['body'])['rows'] ?? [];
            $imported = 0;
            $agg = [];
            foreach ($rows as $r) {
                [$q, $page, $d, $country, $device] = array_pad($r['keys'] ?? [], 5, '');
                $clicks = (int)($r['clicks'] ?? 0); $imp = (int)($r['impressions'] ?? 0);
                $ctr = (float)($r['ctr'] ?? 0); $pos = (float)($r['position'] ?? 0);
                Database::q("INSERT INTO search_console_queries (source, property, query, page, clicks, impressions, ctr, position, country, device, ddate, retrieved_at)
                             VALUES ('google',?,?,?,?,?,?,?,?,?,?,NOW())
                             ON DUPLICATE KEY UPDATE clicks=VALUES(clicks), impressions=VALUES(impressions), ctr=VALUES(ctr), position=VALUES(position), retrieved_at=NOW()",
                    [$siteUrl, $q, $page, $clicks, $imp, $ctr, $pos, $country, $device, $d]);
                Database::q("INSERT INTO search_console_pages (source, property, page, clicks, impressions, ctr, position, ddate, retrieved_at)
                             VALUES ('google',?,?,?,?,?,?,?,NOW())
                             ON DUPLICATE KEY UPDATE clicks=clicks+VALUES(clicks), impressions=impressions+VALUES(impressions),
                             ctr=(ctr*impressions+VALUES(ctr)*VALUES(impressions))/(impressions+VALUES(impressions)),
                             position=(position*impressions+VALUES(position)*VALUES(impressions))/(impressions+VALUES(impressions)),
                             retrieved_at=NOW()",
                    [$siteUrl, $page, $clicks, $imp, $ctr, $pos, $d]);
                $agg[$d] = [($agg[$d][0] ?? 0) + $clicks, ($agg[$d][1] ?? 0) + $imp, ($agg[$d][2] ?? 0) + $ctr * $imp, ($agg[$d][3] ?? 0) + $pos * $imp];
                $imported++;
            }
            foreach ($agg as $d => [$c, $i, $ctrW, $posW]) {
                Database::q("INSERT INTO search_console_daily (source, property, ddate, clicks, impressions, ctr, position, retrieved_at)
                             VALUES ('google',?,?,?,?,?,?,NOW())
                             ON DUPLICATE KEY UPDATE clicks=VALUES(clicks), impressions=VALUES(impressions),
                             ctr=VALUES(ctr), position=VALUES(position), retrieved_at=NOW()",
                    [$siteUrl, $d, $c, $i, $i ? $ctrW / $i : 0, $i ? $posW / $i : 0]);
            }
            return ['ok' => true, 'imported' => $imported, 'message' => "Imported {$imported} query rows (" . count($agg) . " days)"];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public function triggers(): array { return ['seo', 'search-intel', 'keyword-intel']; }
}

/* ============================================================
   GOOGLE ANALYTICS 4 (Data API)
   ============================================================ */
final class Ga4Adapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'ga4'; }

    private function token(array $cfg): string
    {
        if (!empty($cfg['access_token'])) return $cfg['access_token'];
        if (!empty($cfg['service_account_json'])) {
            $sa = json_decode((string)$cfg['service_account_json'], true);
            if (!$sa || empty($sa['client_email']) || empty($sa['private_key'])) {
                throw new RuntimeException('Service account JSON is invalid');
            }
            $tokenUrl = !empty($cfg['api_base']) ? rtrim($cfg['api_base'], '/') . '/token' : 'https://oauth2.googleapis.com/token';
            return OAuth2::googleServiceAccountAt($sa, 'https://www.googleapis.com/auth/analytics.readonly', $tokenUrl);
        }
        throw new RuntimeException('Missing credentials: service account JSON (recommended) or access token');
    }

    public function publicType(): bool { return false; }

    private function base(array $cfg): string
    {
        return rtrim((string)($cfg['api_base'] ?? 'https://analyticsdata.googleapis.com'), '/');
    }

    public function capabilities(): array
    {
        return ['read' => 'users, sessions, engaged sessions, pageviews, engagement rate, landing pages, sources, countries, devices'];
    }

    public function test(array $config): array
    {
        try {
            $token = $this->token($config);
            $property = (string)($config['property_id'] ?? '');
            if ($property === '') return ['ok' => false, 'error' => 'GA4 property ID is required (Settings → Admin → Data streams)'];
            $res = IntegrationHub::http('POST',
                $this->base($config) . "/v1beta/properties/{$property}:runReport",
                ['Authorization: Bearer ' . $token, 'Content-Type: application/json'],
                json_encode(['dateRanges' => [['startDate' => 'yesterday', 'endDate' => 'yesterday']],
                             'metrics' => [['name' => 'sessions']]]), 30);
            if (!$res['ok']) return ['ok' => false, 'error' => 'GA4 Data API error: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
            $d = IntegrationHub::json($res['body']);
            $rows = $d['rows'] ?? [];
            return ['ok' => true, 'message' => 'GA4 property ' . $property . ' verified (sessions: ' . ($rows[0]['metricValues'][0]['value'] ?? 'n/a') . ' yesterday)'];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public function sync(array $config): array
    {
        try {
            $token = $this->token($config);
            $property = (string)($config['property_id'] ?? '');
            if ($property === '') return ['ok' => false, 'error' => 'GA4 property ID required'];
            $days = max(3, min(90, (int)($config['days'] ?? 28)));

            $dimDate = ['name' => 'date'];
            $dimPage = ['name' => 'pagePath'];
            $dimSrc = ['name' => 'sessionDefaultChannelGroup'];
            $dimCountry = ['name' => 'country'];
            $dimDevice = ['name' => 'deviceCategory'];
            $metrics = [
                ['name' => 'totalUsers'], ['name' => 'sessions'], ['name' => 'engagedSessions'],
                ['name' => 'screenPageViews'], ['name' => 'engagementRate'],
            ];
            $run = function (array $dims, int $limit) use ($token, $property, $days, $metrics, $config): array {
                $res = IntegrationHub::http('POST',
                    $this->base($config) . "/v1beta/properties/{$property}:runReport",
                    ['Authorization: Bearer ' . $token, 'Content-Type: application/json'],
                    json_encode([
                        'dateRanges' => [['startDate' => date('Y-m-d', strtotime("-{$days} days")), 'endDate' => date('Y-m-d')]],
                        'dimensions' => $dims, 'metrics' => $metrics, 'limit' => $limit,
                    ]), 60);
                if (!$res['ok']) throw new RuntimeException('GA4 report failed: ' . ($res['error'] ?: ('HTTP ' . $res['status'])));
                return IntegrationHub::json($res['body'])['rows'] ?? [];
            };

            $imported = 0;
            // daily totals → intelligence_metrics
            foreach ($run([$dimDate], 90) as $r) {
                $keys = $r['dimensionValues'] ?? []; $vals = $r['metricValues'] ?? [];
                $date = $keys[0]['value'] ?? '';
                $users = (int)($vals[0]['value'] ?? 0); $sessions = (int)($vals[1]['value'] ?? 0);
                $engaged = (int)($vals[2]['value'] ?? 0); $views = (int)($vals[3]['value'] ?? 0);
                $er = (float)($vals[4]['value'] ?? 0);
                if ($date) {
                    Database::q("INSERT INTO intelligence_metrics (metric, scope, value, details, period_start, period_end)
                                 VALUES ('ga4:users',?,?,?,?,?), ('ga4:sessions',?,?,?,?,?), ('ga4:engaged_sessions',?,?,?,?,?),
                                        ('ga4:pageviews',?,?,?,?,?), ('ga4:engagement_rate',?,?,?,?,?)
                                 ON DUPLICATE KEY UPDATE value=VALUES(value), details=VALUES(details)",
                        [$property, $users, null, $date, $date, $property, $sessions, null, $date, $date,
                         $property, $engaged, null, $date, $date, $property, $views, null, $date, $date,
                         $property, $er, null, $date, $date]);
                    $imported++;
                }
            }
            // page-level pageviews → intelligence_metrics (scope = page path)
            foreach ($run([$dimPage], 1000) as $r) {
                $keys = $r['dimensionValues'] ?? []; $vals = $r['metricValues'] ?? [];
                $page = $keys[0]['value'] ?? '';
                $views = (int)($vals[3]['value'] ?? 0);
                if ($page) {
                    Database::q("INSERT INTO intelligence_metrics (metric, scope, value, details, period_start, period_end)
                                 VALUES ('ga4:page_views',?,?,?,?,?)
                                 ON DUPLICATE KEY UPDATE value=VALUES(value), details=VALUES(details)",
                        [$property . '|' . $page, $views, json_encode(['page' => $page, 'source' => 'ga4']), date('Y-m-d', strtotime("-{$days} days")), date('Y-m-d')]);
                    $imported++;
                }
            }
            // sources / countries / devices → intelligence_metrics
            foreach (['sources' => $dimSrc, 'countries' => $dimCountry, 'devices' => $dimDevice] as $kind => $dim) {
                foreach ($run([$dim], 100) as $r) {
                    $keys = $r['dimensionValues'] ?? []; $vals = $r['metricValues'] ?? [];
                    $k = $keys[0]['value'] ?? '';
                    $sessions = (int)($vals[1]['value'] ?? 0);
                    if ($k !== '') {
                        Database::q("INSERT INTO intelligence_metrics (metric, scope, value, details, period_start, period_end)
                                     VALUES (?,?,?,?,?,?)
                                     ON DUPLICATE KEY UPDATE value=VALUES(value), details=VALUES(details)",
                            ["ga4:{$kind}", $property . '|' . $k, $sessions, json_encode(['dimension' => $k]), date('Y-m-d', strtotime("-{$days} days")), date('Y-m-d')]);
                    }
                }
            }
            return ['ok' => true, 'imported' => $imported, 'message' => "Imported {$imported} daily rows + page/source aggregates from GA4"];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public function triggers(): array { return ['analytics', 'engagement', 'cro']; }
}

/* ============================================================
   BING WEBMASTER (free API key; GSC-linked import is supported)
   ============================================================ */
final class BingWebmasterAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'bing'; }

    public function publicType(): bool { return false; }

    public function capabilities(): array
    {
        return ['read' => 'queries, clicks, impressions, position, crawl/indexation signals (free API key from Bing Webmaster)'];
    }

    public function test(array $config): array
    {
        $key = (string)($config['api_key'] ?? '');
        if ($key === '') return ['ok' => false, 'error' => 'Bing API key required (Bing Webmaster → Settings → API access)'];
        $base = rtrim((string)($config['api_base'] ?? 'https://ssl.bing.com/webmaster/api.svc'), '/');
        $res = IntegrationHub::http('GET', $base . '/GetUserSites?apikey=' . rawurlencode($key));
        if (!$res['ok']) return ['ok' => false, 'error' => 'Bing API error: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
        $d = IntegrationHub::json($res['body']);
        $sites = $d['d'] ?? $d['sites'] ?? [];
        return ['ok' => true, 'message' => 'Bing verified — ' . count(is_array($sites) ? $sites : []) . ' site(s)'];
    }

    public function sync(array $config): array
    {
        $key = (string)($config['api_key'] ?? '');
        if ($key === '') return ['ok' => false, 'error' => 'Bing API key required'];
        $site = (string)($config['site_url'] ?? 'https://abhijeetvarghese.com/');
        $days = max(3, min(90, (int)($config['days'] ?? 28)));
        try {
            $base = rtrim((string)($config['api_base'] ?? 'https://ssl.bing.com/webmaster/api.svc'), '/');
            $res = IntegrationHub::http('POST',
                $base . '/GetUrlTraffic?apikey=' . rawurlencode($key),
                ['Content-Type: application/json'],
                json_encode(['siteUrl' => $site, 'query' => '', 'from' => date('Y-m-d', strtotime("-{$days} days")), 'to' => date('Y-m-d')]), 60);
            if (!$res['ok']) return ['ok' => false, 'error' => 'Bing traffic API failed: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
            $d = IntegrationHub::json($res['body']);
            $rows = $d['d'] ?? $d['traffic'] ?? [];
            $imported = 0;
            foreach (is_array($rows) ? $rows : [] as $r) {
                if (!isset($r['Query']) && !isset($r['query'])) continue;
                $q = $r['Query'] ?? $r['query'] ?? '';
                $page = $r['Page'] ?? $r['page'] ?? '';
                $ddate = substr((string)($r['Date'] ?? $r['date'] ?? ''), 0, 10);
                if (!$ddate || !$q) continue;
                $clicks = (int)($r['Clicks'] ?? $r['clicks'] ?? 0);
                $imp = (int)($r['Impressions'] ?? $r['impressions'] ?? 0);
                $pos = (float)($r['AveragePosition'] ?? $r['position'] ?? 0);
                $ctr = $imp ? $clicks / $imp : 0;
                Database::q("INSERT INTO search_console_queries (source, property, query, page, clicks, impressions, ctr, position, ddate, retrieved_at)
                             VALUES ('bing',?,?,?,?,?,?,?,?,NOW())
                             ON DUPLICATE KEY UPDATE clicks=VALUES(clicks), impressions=VALUES(impressions), ctr=VALUES(ctr), position=VALUES(position), retrieved_at=NOW()",
                    [$site, $q, $page, $clicks, $imp, $ctr, $pos, $ddate]);
                $imported++;
            }
            return ['ok' => true, 'imported' => $imported, 'message' => "Imported {$imported} Bing query rows"];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public function triggers(): array { return ['search-intel', 'seo']; }
}

/* ============================================================
   MICROSOFT CLARITY (API currently in preview; free)
   ============================================================ */
final class ClarityAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'clarity'; }

    public function capabilities(): array
    {
        return ['read' => 'rage clicks, dead clicks, scroll depth, popular sections (Clarity API — preview; requires Azure AD app)',
                'note' => 'If the API is unavailable on your account, Clarity data can still be imported manually from the Clarity dashboard export.'];
    }

    public function publicType(): bool { return false; }

    public function test(array $config): array
    {
        $project = (string)($config['project_id'] ?? '');
        $token = (string)($config['access_token'] ?? '');
        if ($project === '' || $token === '') {
            return ['ok' => false, 'error' => 'Clarity project ID + access token required (Clarity → Settings → API; requires Azure AD app registration)'];
        }
        $res = IntegrationHub::http('GET', "https://api.clarity.ms/insights/{$project}/summary",
            ['Authorization: Bearer ' . $token, 'x-api-version: 1.0']);
        if (!$res['ok']) return ['ok' => false, 'error' => 'Clarity API error: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
        return ['ok' => true, 'message' => 'Clarity project verified'];
    }

    public function sync(array $config): array
    {
        return ['ok' => false, 'error' => 'Clarity metrics sync requires the Clarity Insights API (preview). Configure project ID + token, or import behaviour manually.'];
    }

    public function triggers(): array { return ['cro', 'engagement']; }
}

/* ============================================================
   CLOUDFLARE (free tier; fallback = internal HTTP checks always on)
   ============================================================ */
final class CloudflareAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'cloudflare'; }

    public function publicType(): bool { return false; }

    public function capabilities(): array
    {
        return ['read' => 'DNS, SSL, cache, traffic, security events, performance (free API token)',
                'fallback' => 'internal HTTP checks run regardless of Cloudflare availability'];
    }

    public function test(array $config): array
    {
        $token = (string)($config['api_token'] ?? '');
        if ($token === '') return ['ok' => false, 'error' => 'Cloudflare API token required (My Profile → API Tokens → Create Token: Zone Read + Analytics Read)'];
        $base = rtrim((string)($config['api_base'] ?? 'https://api.cloudflare.com/client/v4'), '/');
        $res = IntegrationHub::http('GET', $base . '/user/tokens/verify',
            ['Authorization: Bearer ' . $token]);
        if (!$res['ok']) return ['ok' => false, 'error' => 'Cloudflare API error: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
        $d = IntegrationHub::json($res['body']);
        return ['ok' => ($d['success'] ?? false) === true, 'message' => 'Cloudflare token verified'];
    }

    public function sync(array $config): array
    {
        $token = (string)($config['api_token'] ?? '');
        $zone = (string)($config['zone_id'] ?? '');
        if ($token === '' || $zone === '') return ['ok' => false, 'error' => 'Cloudflare token + zone ID required'];
        try {
            $base = rtrim((string)($config['api_base'] ?? 'https://api.cloudflare.com/client/v4'), '/');
            $res = IntegrationHub::http('GET', "{$base}/zones/{$zone}/analytics/dashboard?since=-720&continuous=true",
                ['Authorization: Bearer ' . $token]);
            if (!$res['ok']) return ['ok' => false, 'error' => 'Cloudflare analytics failed: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
            $d = IntegrationHub::json($res['body']);
            $totals = $d['result']['totals'] ?? [];
            $imported = 0;
            foreach (['requests' => 'cf:requests', 'pageviews' => 'cf:pageviews', 'uniques' => 'cf:uniques', 'threats' => 'cf:threats'] as $k => $metric) {
                if (isset($totals[$k])) {
                    Database::q("INSERT INTO intelligence_metrics (metric, scope, value, period_start, period_end)
                                 VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
                        [$metric, $zone, (float)$totals[$k], date('Y-m-d', strtotime('-12 hours')), date('Y-m-d')]);
                    $imported++;
                }
            }
            return ['ok' => true, 'imported' => $imported, 'message' => "Imported {$imported} Cloudflare metrics"];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public function triggers(): array { return ['health', 'security']; }
}

/* ============================================================
   CALENDLY (free; PAT optional — public booking URL always shown)
   ============================================================ */
final class CalendlyAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'calendly'; }

    public function capabilities(): array
    {
        return ['read' => 'event types, scheduled events (personal access token, free)',
                'webhook' => 'inbound webhooks (invitee.created / canceled / rescheduled) already supported natively',
                'fallback' => 'public booking URL always displayed; live availability marked unavailable without API access'];
    }

    public function publicType(): bool { return false; }

    public function test(array $config): array
    {
        $pat = (string)($config['api_key'] ?? '');
        if ($pat === '') return ['ok' => false, 'error' => 'Calendly Personal Access Token required (Calendly → Integrations → API)'];
        $base = rtrim((string)($config['api_base'] ?? 'https://api.calendly.com'), '/');
        $res = IntegrationHub::http('GET', $base . '/users/me', ['Authorization: Bearer ' . $pat]);
        if (!$res['ok']) return ['ok' => false, 'error' => 'Calendly API error: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
        $d = IntegrationHub::json($res['body']);
        $u = $d['resource'] ?? [];
        return ['ok' => true, 'message' => 'Calendly verified as ' . ($u['name'] ?? $u['email'] ?? 'user')];
    }

    public function sync(array $config): array
    {
        $pat = (string)($config['api_key'] ?? '');
        if ($pat === '') return ['ok' => false, 'error' => 'Calendly PAT required for API sync (booking URL works without it)'];
        try {
            $base = rtrim((string)($config['api_base'] ?? 'https://api.calendly.com'), '/');
            $me = IntegrationHub::json(IntegrationHub::http('GET', $base . '/users/me', ['Authorization: Bearer ' . $pat])['body']);
            $userUri = $me['resource']['uri'] ?? '';
            if (!$userUri) return ['ok' => false, 'error' => 'Calendly user lookup failed'];
            $imported = 0;
            // event types
            $ets = IntegrationHub::json(IntegrationHub::http('GET', $base . '/event_types?user=' . rawurlencode($userUri) . '&count=100', ['Authorization: Bearer ' . $pat])['body']);
            foreach (($ets['collection'] ?? []) as $et) {
                $slug = basename(parse_url((string)($et['scheduling_url'] ?? ''), PHP_URL_PATH) ?: '');
                Database::q("INSERT INTO intelligence_metrics (metric, scope, value, details, period_start, period_end)
                             VALUES ('calendly:event_type',?,?,?,?,?) ON DUPLICATE KEY UPDATE details=VALUES(details)",
                    [$et['name'] ?? 'event', 1, json_encode(['slug' => $slug, 'active' => ($et['active'] ?? false) === true, 'duration' => $et['duration'] ?? null]), date('Y-m-d', strtotime('-30 days')), date('Y-m-d')]);
                $imported++;
            }
            // scheduled events (last 30 days) → CRM meetings via external_event_id (idempotent)
            $evs = IntegrationHub::http('GET',
                $base . '/scheduled_events?user=' . rawurlencode($userUri) . '&status=active&count=100&min_start_time=' . urlencode(date('c', strtotime('-30 days'))),
                ['Authorization: Bearer ' . $pat]);
            $evs = IntegrationHub::json($evs['body']);
            foreach (($evs['collection'] ?? []) as $ev) {
                $evId = (string)($ev['uri'] ?? '');
                if (!$evId) continue;
                $start = (string)($ev['start_time'] ?? '');
                $inviteeName = ''; $inviteeEmail = '';
                $inv = IntegrationHub::http('GET', (string)($ev['invitees'][0]['uri'] ?? ''), ['Authorization: Bearer ' . $pat]);
                if ($inv['ok']) {
                    $invD = IntegrationHub::json($inv['body']);
                    $res = $invD['resource'] ?? [];
                    $inviteeName = (string)($res['name'] ?? '');
                    $inviteeEmail = (string)($res['email'] ?? '');
                }
                try {
                    InboundWebhookModel::upsertBooking(
                        'Calendly: ' . ($ev['name'] ?? 'Meeting'),
                        $start !== '' ? date('Y-m-d H:i:s', strtotime($start)) : null,
                        preg_replace('~^https?://[^/]+/~', '', $evId),
                        'Imported from Calendly API sync',
                        $inviteeName ?: 'Calendly invitee', $inviteeEmail
                    );
                    $imported++;
                } catch (Throwable $e) { /* idempotent — skip duplicates */ }
            }
            return ['ok' => true, 'imported' => $imported, 'message' => "Imported {$imported} event types + scheduled meetings"];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public function triggers(): array { return ['lead-intel', 'business-intel']; }
}

/* ============================================================
   GITHUB (public API free — no token needed for public repos)
   ============================================================ */
final class GithubAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'github'; }

    public function publicType(): bool { return true; }

    public function capabilities(): array
    {
        return ['read' => 'repositories, commits, branches, issues, releases, workflow runs (public API: 60 req/h unauthenticated, 5000/h with token)',
                'write' => 'none — no autonomous Git operations, ever'];
    }

    private function headers(array $cfg): array
    {
        $h = ['Accept: application/vnd.github+json', 'X-GitHub-Api-Version: 2022-11-28'];
        if (!empty($cfg['api_key'])) $h[] = 'Authorization: Bearer ' . $cfg['api_key'];
        return $h;
    }

    public function test(array $config): array
    {
        $user = (string)($config['username'] ?? 'Abhijeet-Varghese');
        $res = IntegrationHub::http('GET', "https://api.github.com/users/{$user}", $this->headers($config), null, 20, true);
        if (!$res['ok']) return ['ok' => false, 'error' => 'GitHub API error: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
        $d = IntegrationHub::json($res['body']);
        return ['ok' => true, 'message' => 'GitHub user ' . $user . ' verified (' . ($d['public_repos'] ?? 0) . ' public repos)'];
    }

    public function sync(array $config): array
    {
        $user = (string)($config['username'] ?? 'Abhijeet-Varghese');
        $imported = 0;
        try {
            // rate-limit-aware check first
            $rl = IntegrationHub::http('GET', 'https://api.github.com/rate_limit', $this->headers($config), null, 15, true);
            if ($rl['ok']) {
                $rd = IntegrationHub::json($rl['body']);
                $remaining = $rd['resources']['core']['remaining'] ?? 60;
                if ($remaining < 10) {
                    IntegrationHub::setStatus('github', 'rate_limited', 'GitHub rate limit nearly exhausted — sync deferred');
                    return ['ok' => false, 'error' => 'GitHub rate limit low (' . $remaining . ' remaining) — respecting quota'];
                }
            }
            $res = IntegrationHub::http('GET', "https://api.github.com/users/{$user}/repos?per_page=100&sort=pushed", $this->headers($config), null, 30, true);
            if (!$res['ok']) return ['ok' => false, 'error' => 'GitHub repos failed: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
            foreach (IntegrationHub::json($res['body']) as $repo) {
                $name = (string)($repo['full_name'] ?? '');
                if (!$name) continue;
                Database::q("INSERT INTO dev_repos (repo, owner, url, description, language, stars, forks, open_issues, default_branch, pushed_at, source, updated_at)
                             VALUES (?,?,?,?,?,?,?,?,?,?, 'github', NOW())
                             ON DUPLICATE KEY UPDATE description=VALUES(description), language=VALUES(language), stars=VALUES(stars),
                             forks=VALUES(forks), open_issues=VALUES(open_issues), default_branch=VALUES(default_branch),
                             pushed_at=VALUES(pushed_at), updated_at=NOW()",
                    [$name, $user, (string)($repo['html_url'] ?? ''), mb_substr((string)($repo['description'] ?? ''), 0, 300),
                     (string)($repo['language'] ?? ''), (int)($repo['stargazers_count'] ?? 0), (int)($repo['forks_count'] ?? 0),
                     (int)($repo['open_issues_count'] ?? 0), (string)($repo['default_branch'] ?? ''), (string)($repo['pushed_at'] ?? '')]);
                $imported++;
                // recent commits (public)
                $commits = IntegrationHub::http('GET', "https://api.github.com/repos/{$name}/commits?per_page=5", $this->headers($config), null, 15, true);
                if ($commits['ok']) {
                    foreach (array_slice(IntegrationHub::json($commits['body']), 0, 5) as $c) {
                        $sha = (string)($c['sha'] ?? '');
                        if (!$sha) continue;
                        Database::q("INSERT INTO dev_events (repo, kind, title, url, state, meta, created_at)
                                     VALUES (?, 'commit', ?, ?, 'open', ?, ?) ON DUPLICATE KEY UPDATE meta=VALUES(meta)",
                            [$name, mb_substr((string)($c['commit']['message'] ?? 'commit'), 0, 200), (string)($c['html_url'] ?? ''),
                             json_encode(['sha' => $sha, 'date' => $c['commit']['author']['date'] ?? '']), $c['commit']['author']['date'] ?? date('Y-m-d H:i:s')]);
                        $imported++;
                    }
                }
                // open issues
                $issues = IntegrationHub::http('GET', "https://api.github.com/repos/{$name}/issues?state=open&per_page=10", $this->headers($config), null, 15, true);
                if ($issues['ok']) {
                    foreach (IntegrationHub::json($issues['body']) as $iss) {
                        if (!empty($iss['pull_request'])) continue;
                        $num = (int)($iss['number'] ?? 0);
                        Database::q("INSERT INTO dev_events (repo, kind, title, url, state, meta, created_at)
                                     VALUES (?, 'issue', ?, ?, 'open', ?, ?) ON DUPLICATE KEY UPDATE meta=VALUES(meta)",
                            [$name, mb_substr((string)($iss['title'] ?? 'issue'), 0, 200), (string)($iss['html_url'] ?? ''),
                             json_encode(['number' => $num, 'comments' => (int)($iss['comments'] ?? 0)]), (string)($iss['created_at'] ?? date('Y-m-d H:i:s'))]);
                        $imported++;
                    }
                }
            }
            return ['ok' => true, 'imported' => $imported, 'message' => "Imported {$imported} repo/commit/issue signals from GitHub"];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public function triggers(): array { return ['developer', 'security']; }
}

/* ============================================================
   GOOGLE DRIVE (approved folders only → knowledge base)
   ============================================================ */
final class DriveAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'drive'; }

    public function capabilities(): array
    {
        return ['read' => 'approved folders/files only — metadata + text export (docs/txt/md); no blind ingestion',
                'note' => 'PDFs/DOCX are recorded with hashes; text extraction is best-effort pure PHP'];
    }

    public function publicType(): bool { return false; }

    private function token(array $cfg): string
    {
        if (!empty($cfg['access_token'])) return $cfg['access_token'];
        if (!empty($cfg['service_account_json'])) {
            $sa = json_decode((string)$cfg['service_account_json'], true);
            if (!$sa || empty($sa['client_email']) || empty($sa['private_key'])) {
                throw new RuntimeException('Service account JSON is invalid');
            }
            return OAuth2::googleServiceAccount($sa, 'https://www.googleapis.com/auth/drive.readonly');
        }
        throw new RuntimeException('Drive credentials required: service account JSON with Drive read access to approved folders');
    }

    public function test(array $config): array
    {
        try {
            $token = $this->token($config);
            $res = IntegrationHub::http('GET', 'https://www.googleapis.com/drive/v3/about?fields=user',
                ['Authorization: Bearer ' . $token]);
            if (!$res['ok']) return ['ok' => false, 'error' => 'Drive API error: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
            $d = IntegrationHub::json($res['body']);
            return ['ok' => true, 'message' => 'Drive verified as ' . (($d['user']['emailAddress'] ?? '') ?: 'service account')];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public function sync(array $config): array
    {
        try {
            $token = $this->token($config);
            $folderId = (string)($config['folder_id'] ?? '');
            if ($folderId === '') return ['ok' => false, 'error' => 'Approved folder ID required (only approved folders are ever ingested)'];
            $imported = 0;
            $pageToken = '';
            do {
                $q = "'{$folderId}' in parents and trashed=false";
                $res = IntegrationHub::http('GET',
                    'https://www.googleapis.com/drive/v3/files?q=' . rawurlencode($q) . '&fields=files(id,name,mimeType,modifiedTime,size,sha256Checksum,webViewLink)&pageSize=100' . ($pageToken ? '&pageToken=' . $pageToken : ''),
                    ['Authorization: Bearer ' . $token]);
                if (!$res['ok']) return ['ok' => false, 'error' => 'Drive listing failed: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
                $d = IntegrationHub::json($res['body']);
                foreach (($d['files'] ?? []) as $f) {
                    $id = (string)($f['id'] ?? '');
                    $name = (string)($f['name'] ?? '');
                    $mime = (string)($f['mimeType'] ?? '');
                    $hash = (string)($f['sha256Checksum'] ?? '');
                    $modified = (string)($f['modifiedTime'] ?? '');
                    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                    $text = '';
                    $kind = 'document';
                    if (in_array($mime, ['application/vnd.google-apps.document', 'application/vnd.google-apps.presentation', 'application/vnd.google-apps.spreadsheet'], true) || in_array($ext, ['txt', 'md', 'markdown'], true)) {
                        $kind = 'text';
                        $dl = IntegrationHub::http('GET',
                            'https://www.googleapis.com/drive/v3/files/' . $id . '/export?mimeType=text/plain',
                            ['Authorization: Bearer ' . $token], null, 30);
                        if ($dl['ok']) $text = mb_substr($dl['body'], 0, 60000);
                    } else {
                        // binary (pdf/docx/pptx): record hash + metadata; best-effort docx text via zip XML
                        $kind = 'binary';
                        if ($ext === 'docx') {
                            $dl = IntegrationHub::http('GET', 'https://www.googleapis.com/drive/v3/files/' . $id . '?alt=media',
                                ['Authorization: Bearer ' . $token], null, 30);
                            if ($dl['ok']) $text = self::docxText($dl['body']);
                        }
                    }
                    if ($text !== '' || $kind === 'binary') {
                        $contentHash = $hash !== '' ? $hash : hash('sha256', $name . $modified);
                        $existing = KnowledgeIngestModel::status($id);
                        $status = $text !== '' ? 'ingested' : 'pending';
                        KnowledgeIngestModel::record('drive', $id, $name, $kind, $contentHash, $status, $modified);
                        if ($status === 'ingested') {
                            $priorHash = KnowledgeIngestModel::hashOf($id);
                            if ($priorHash !== $contentHash || $priorHash === null) {
                                KnowledgeModel::upsertFromSource('drive', $id, $name, $text, [
                                    'source' => 'Google Drive', 'source_url' => (string)($f['webViewLink'] ?? ''),
                                    'modified' => $modified, 'hash' => $contentHash,
                                ]);
                                $imported++;
                            }
                        } else {
                            KnowledgeModel::upsertFromSource('drive', $id, $name, '',
                                ['source' => 'Google Drive', 'source_url' => (string)($f['webViewLink'] ?? ''),
                                 'modified' => $modified, 'hash' => $contentHash, 'binary' => true]);
                            $imported++;
                        }
                    }
                }
                $pageToken = (string)($d['nextPageToken'] ?? '');
            } while ($pageToken !== '');
            return ['ok' => true, 'imported' => $imported, 'message' => "Ingested/updated {$imported} approved Drive files"];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /** best-effort DOCX → text (pure PHP zip + XML) */
    public static function docxText(string $bin): string
    {
        try {
            $zip = new ZipArchive();
            $tmp = tempnam(sys_get_temp_dir(), 'docx');
            file_put_contents($tmp, $bin);
            if ($zip->open($tmp) !== true) { @unlink($tmp); return ''; }
            $xml = $zip->getFromName('word/document.xml');
            $zip->close();
            @unlink($tmp);
            if ($xml === false) return '';
            $xml = preg_replace('/<w:tab[^>]*\/>/u', ' ', $xml);
            $xml = preg_replace('/<w:br[^>]*\/>/u', "\n", $xml);
            $xml = preg_replace('/<w:p[^>]*>/u', "\n", $xml);
            $text = html_entity_decode(strip_tags($xml), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            return mb_substr(trim(preg_replace('/[ \t]+/u', ' ', $text)), 0, 60000);
        } catch (Throwable $e) {
            return '';
        }
    }

    public function triggers(): array { return ['knowledge', 'case-study']; }
}

/* ============================================================
   NOTION (approved pages only; knowledge states respected)
   ============================================================ */
final class NotionAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'notion'; }

    public function publicType(): bool { return false; }

    public function capabilities(): array
    {
        return ['read' => 'approved pages (integration token); page states APPROVED/DRAFT/PRIVATE/ARCHIVED are respected — only APPROVED pages feed the knowledge base'];
    }

    public function test(array $config): array
    {
        $token = (string)($config['api_key'] ?? '');
        if ($token === '') return ['ok' => false, 'error' => 'Notion integration token required (Notion → Settings → Connections → Develop)'];
        $res = IntegrationHub::http('POST', 'https://api.notion.com/v1/search',
            ['Authorization: Bearer ' . $token, 'Notion-Version: 2022-06-28', 'Content-Type: application/json'],
            json_encode(['page_size' => 1]));
        if (!$res['ok']) return ['ok' => false, 'error' => 'Notion API error: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
        return ['ok' => true, 'message' => 'Notion token verified'];
    }

    public function sync(array $config): array
    {
        $token = (string)($config['api_key'] ?? '');
        if ($token === '') return ['ok' => false, 'error' => 'Notion token required'];
        $approvedIds = array_filter(array_map('trim', explode(',', (string)($config['approved_page_ids'] ?? ''))));
        if (!$approvedIds) return ['ok' => false, 'error' => 'No approved pages configured (comma-separated page IDs) — nothing ingested'];
        $imported = 0;
        try {
            foreach ($approvedIds as $pageId) {
                $res = IntegrationHub::http('GET', "https://api.notion.com/v1/blocks/{$pageId}/children?page_size=100",
                    ['Authorization: Bearer ' . $token, 'Notion-Version: 2022-06-28']);
                if (!$res['ok']) continue;
                $blocks = IntegrationHub::json($res['body'])['results'] ?? [];
                $text = '';
                foreach ($blocks as $b) {
                    $type = (string)($b['type'] ?? '');
                    $rt = $b[$type] ?? [];
                    $parts = [];
                    foreach (($rt['rich_text'] ?? []) as $rtx) $parts[] = $rtx['plain_text'] ?? '';
                    if ($type === 'bulleted_list_item' || $type === 'numbered_list_item') $text .= '- ' . implode('', $parts) . "\n";
                    elseif ($type === 'heading_1') $text .= "\n# " . implode('', $parts) . "\n";
                    elseif ($type === 'heading_2') $text .= "\n## " . implode('', $parts) . "\n";
                    else $text .= implode('', $parts) . "\n";
                }
                $meta = IntegrationHub::json(IntegrationHub::http('GET', "https://api.notion.com/v1/pages/{$pageId}",
                    ['Authorization: Bearer ' . $token, 'Notion-Version: 2022-06-28'])['body']);
                $title = '';
                $props = $meta['properties'] ?? [];
                foreach ($props as $p) {
                    if (($p['type'] ?? '') === 'title') {
                        foreach (($p['title'] ?? []) as $t) $title .= $t['plain_text'] ?? '';
                    }
                }
                $title = $title !== '' ? $title : ('Notion page ' . substr($pageId, 0, 8));
                $lastEdited = (string)($meta['last_edited_time'] ?? '');
                $hash = hash('sha256', $title . $lastEdited . $text);
                $prior = KnowledgeIngestModel::hashOf('notion:' . $pageId);
                KnowledgeIngestModel::record('notion', $pageId, $title, 'text', $hash, 'ingested', $lastEdited);
                if ($prior !== $hash) {
                    KnowledgeModel::upsertFromSource('notion', $pageId, $title, mb_substr($text, 0, 60000), [
                        'source' => 'Notion', 'modified' => $lastEdited, 'hash' => $hash,
                    ]);
                    $imported++;
                }
            }
            return ['ok' => true, 'imported' => $imported, 'message' => "Ingested/updated {$imported} approved Notion page(s)"];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public function triggers(): array { return ['knowledge', 'research', 'content-strategist']; }
}

/* ============================================================
   YOUTUBE (public channel RSS — free, no key)
   ============================================================ */
final class YoutubeAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'youtube'; }

    public function capabilities(): array
    {
        return ['read' => 'videos, titles, descriptions, publication dates (public channel RSS — free, no API key)',
                'note' => 'views/likes are not exposed via RSS; add a YouTube Data API key for metrics'];
    }

    public function publicType(): bool { return true; }

    public function test(array $config): array
    {
        $channelId = self::resolveChannelId($config);
        if (!$channelId) return ['ok' => false, 'error' => 'Could not resolve channel ID from handle/URL'];
        return ['ok' => true, 'message' => 'YouTube channel resolved: ' . $channelId];
    }

    public static function resolveChannelId(array $cfg): string
    {
        $handle = (string)($cfg['handle'] ?? '@AbhijeetVarghese');
        $handle = ltrim($handle, '@');
        $res = IntegrationHub::http('GET', 'https://www.youtube.com/@' . rawurlencode($handle), [], null, 15, true);
        if (!$res['ok']) return '';
        $candidates = [];
        // 1) canonical channel URL (most reliable)
        if (preg_match('#<link[^>]+rel=["\']canonical["\'][^>]+href=["\']https://www\.youtube\.com/channel/(UC[\w-]{22})#', $res['body'], $m)) {
            $candidates[] = $m[1];
        }
        // 2) og:url channel form
        if (preg_match('#og:url["\'][^>]+content=["\']https://www\.youtube\.com/channel/(UC[\w-]{22})#', $res['body'], $m)) {
            $candidates[] = $m[1];
        }
        // 3) first channelId JSON token (verify below before trusting)
        if (preg_match('/"channelId":"(UC[\w-]{22})"/', $res['body'], $m)) {
            $candidates[] = $m[1];
        }
        // verify the feed actually serves before trusting the ID
        foreach (array_unique($candidates) as $id) {
            $feed = IntegrationHub::http('GET', 'https://www.youtube.com/feeds/videos.xml?channel_id=' . rawurlencode($id), [], null, 15, true);
            if ($feed['ok'] && $feed['status'] === 200 && str_contains($feed['body'], '<entry')) {
                return $id;
            }
        }
        return '';
    }

    public function sync(array $config): array
    {
        $channelId = self::resolveChannelId($config);
        if (!$channelId) return ['ok' => false, 'error' => 'Channel ID unresolved'];
        try {
            $res = IntegrationHub::http('GET', 'https://www.youtube.com/feeds/videos.xml?channel_id=' . rawurlencode($channelId), [], null, 20, true);
            if (!$res['ok']) return ['ok' => false, 'error' => 'YouTube feed failed: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
            $xml = @simplexml_load_string($res['body']);
            if ($xml === false) return ['ok' => false, 'error' => 'YouTube feed parse failed'];
            $ns = $xml->getNamespaces(true);
            $media = $xml->children($ns['media'] ?? '');
            $imported = 0;
            foreach ($xml->entry as $entry) {
                $vid = (string)$entry->id;                     // yt:video:ID
                $videoId = preg_replace('/^yt:video:/', '', $vid);
                $title = (string)$entry->title;
                $link = (string)$entry->link['href'];
                $published = (string)$entry->published;
                $desc = '';
                if ($media) { $desc = (string)$media->group->description; }
                $guid = 'yt:' . $videoId;
                Database::q("INSERT INTO research_items (source_id, guid, title, url, author, summary, published_at, fetched_at)
                             VALUES (NULL, ?,?,?,?,?,?,NOW())
                             ON DUPLICATE KEY UPDATE title=VALUES(title), summary=VALUES(summary)",
                    [$guid, mb_substr($title, 0, 300), $link, 'Abhijeet Varghese', mb_substr($desc, 0, 2000),
                     $published ? date('Y-m-d H:i:s', strtotime($published)) : null]);
                Database::q("INSERT INTO dev_events (repo, kind, title, url, state, meta, created_at)
                             VALUES ('youtube', 'video', ?, ?, 'open', ?, ?)
                             ON DUPLICATE KEY UPDATE meta=VALUES(meta)",
                    [mb_substr($title, 0, 200), $link, json_encode(['video_id' => $videoId, 'published' => $published]),
                     $published ? date('Y-m-d H:i:s', strtotime($published)) : date('Y-m-d H:i:s')]);
                $imported++;
            }
            return ['ok' => true, 'imported' => $imported, 'message' => "Imported {$imported} video(s) from YouTube RSS"];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public function triggers(): array { return ['social', 'content-strategist']; }
}

/* ============================================================
   GOOGLE TRENDS (official RSS — free, no key)
   ============================================================ */
final class TrendsAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'trends'; }

    public function publicType(): bool { return true; }

    public function capabilities(): array
    {
        return ['read' => 'trending searches per region (official Google Trends RSS — free, no key)'];
    }

    public function test(array $config): array
    {
        $geo = (string)($config['geo'] ?? 'IN');
        $res = IntegrationHub::http('GET', 'https://trends.google.com/trending/rss?geo=' . rawurlencode($geo), [], null, 15, true);
        if (!$res['ok']) return ['ok' => false, 'error' => 'Trends feed failed: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
        return ['ok' => true, 'message' => 'Google Trends RSS reachable for ' . $geo];
    }

    public function sync(array $config): array
    {
        $geo = (string)($config['geo'] ?? 'IN');
        try {
            $res = IntegrationHub::http('GET', 'https://trends.google.com/trending/rss?geo=' . rawurlencode($geo), [], null, 20, true);
            if (!$res['ok']) return ['ok' => false, 'error' => 'Trends feed failed: ' . ($res['error'] ?: ('HTTP ' . $res['status']))];
            $xml = @simplexml_load_string($res['body']);
            if ($xml === false) return ['ok' => false, 'error' => 'Trends feed parse failed'];
            $srcRow = Database::one("SELECT id FROM research_sources WHERE name LIKE 'Google Trends — %' AND rss_url LIKE ? ORDER BY id LIMIT 1", ['%geo=' . $geo . '%']);
            $sourceId = $srcRow ? (int)$srcRow['id'] : 0;
            $imported = 0;
            foreach ($xml->channel->item as $item) {
                $guid = 'trends:' . md5((string)$item->title . (string)$item->pubDate);
                $summary = trim((string)$item->description);
                Database::q("INSERT INTO research_items (source_id, guid, title, url, author, summary, published_at, fetched_at, processed)
                             VALUES (?,?,?,?,?,?,?,NOW(),1)
                             ON DUPLICATE KEY UPDATE title=VALUES(title), summary=VALUES(summary)",
                    [$sourceId ?: null, $guid, mb_substr((string)$item->title, 0, 300), (string)$item->link, 'Google Trends ' . $geo,
                     mb_substr($summary, 0, 2000), $item->pubDate ? date('Y-m-d H:i:s', strtotime((string)$item->pubDate)) : null]);
                $imported++;
            }
            return ['ok' => true, 'imported' => $imported, 'message' => "Imported {$imported} trending searches (geo {$geo})"];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public function triggers(): array { return ['trend', 'research', 'search-intel']; }
}

/* ============================================================
   RSS RESEARCH ENGINE (any feed — free, open standard)
   ============================================================ */
final class RssAdapter implements IntegrationAdapterInterface
{
    public function code(): string { return 'rss'; }

    public function capabilities(): array
    {
        return ['read' => 'any RSS/Atom feed (research only — never republished)'];
    }

    public function publicType(): bool { return true; }

    public function test(array $config): array
    {
        return ['ok' => true, 'message' => 'RSS engine: per-source feeds fetch on the sync cycle (no global credential needed)'];
    }

    public function sync(array $config): array
    {
        $imported = 0;
        $errors = [];
        $sources = Database::all("SELECT * FROM research_sources WHERE enabled=1 ORDER BY priority='high' DESC, id");
        foreach ($sources as $src) {
            try {
                $n = ResearchModel::fetchSource((int)$src['id']);
                $imported += $n;
            } catch (Throwable $e) {
                $errors[] = $src['name'] . ': ' . $e->getMessage();
                Database::q("UPDATE research_sources SET last_error=? WHERE id=?", [mb_substr($e->getMessage(), 0, 400), (int)$src['id']]);
            }
        }
        return ['ok' => $imported > 0 || count($errors) === 0, 'imported' => $imported,
                'message' => "Fetched {$imported} new item(s) from " . count($sources) . ' source(s)' . ($errors ? ' — ' . implode(' | ', array_slice($errors, 0, 3)) : '')];
    }

    public function triggers(): array { return ['research', 'trend', 'search-intel']; }
}
