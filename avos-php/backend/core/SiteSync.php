<?php
/**
 * AV OS — SiteSync: static frontend → CMS content store (ONE WAY).
 *
 * The hand-authored static site in AV_SITE_DIR (abhijeetvarghese/) is the
 * single source of truth. This class reads the shipped HTML / search-index /
 * assets and mirrors what it finds into `content_store` so every admin view,
 * agent and API consumer sees exactly what the public site shows.
 *
 *   frontend files  ──parse──▶  content_store (pages, projects, articles, nav,
 *                               settings, clients, media, seo, sections, downloads)
 *
 * Nothing here ever writes to the frontend. Records that exist in the store
 * but no longer exist on the site are kept (never deleted) and moved to
 * `draft`, so nothing an editor wrote is lost — it is simply no longer "live".
 *
 * Triggers
 *   • backend/scripts/agent-runner.php (per-minute cron) → SiteSync::runIfChanged()
 *   • POST /api/system/sync-frontend (admin button)      → SiteSync::run($userId, true)
 *   • php backend/scripts/sync-frontend.php [--force]    → CLI
 *
 * Change detection: a fingerprint (content hash of every text source — html /
 * json / xml / css / js — plus size+mtime of binaries under AV_SITE_DIR) is
 * stored in site_settings.skey='frontend_sync'. When the
 * fingerprint changes the store is re-derived. Per-key writes only happen when
 * the derived JSON actually differs, so `versions` does not churn.
 */
final class SiteSync
{
    public const STATE_KEY = 'frontend_sync';
    /** store keys this class derives (in write order) */
    public const KEYS = ['settings', 'nav', 'clients', 'media', 'pages', 'projects', 'articles', 'seo', 'sections', 'downloads'];

    private static string $now = '';
    /** @var array<string,string> img src (site-relative) → alt text, collected from every page */
    private static array $altMap = [];
    /** @var array<string,array> per-file parsed head cache */
    private static array $headCache = [];

    /* ============================================================
       STATE / FINGERPRINT
       ============================================================ */

    /** @return array{hash:string,files:int,bytes:int,newest:string} */
    public static function fingerprint(): array
    {
        $dir = AV_SITE_DIR;
        if (!is_dir($dir)) return ['hash' => '', 'files' => 0, 'bytes' => 0, 'newest' => ''];
        $parts = [];
        $bytes = 0;
        $newest = 0;
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $f) {
            if (!$f->isFile()) continue;
            $rel = substr($f->getPathname(), strlen($dir) + 1);
            if (preg_match('#(^|/)(node_modules|\.git|\.DS_Store)(/|$)#', $rel)) continue;
            // text sources are content-hashed (robust against same-second edits / identical sizes);
            // binaries (images, fonts, pdf) use size+mtime
            $ext = strtolower($f->getExtension());
            $sig = in_array($ext, ['html', 'htm', 'json', 'xml', 'css', 'js', 'txt', 'svg', 'webmanifest'], true)
                ? md5_file($f->getPathname())
                : $f->getSize() . '|' . $f->getMTime();
            $parts[] = $rel . '|' . $sig;
            $bytes += $f->getSize();
            $newest = max($newest, $f->getMTime());
        }
        sort($parts);
        return ['hash' => md5(implode("\n", $parts)), 'files' => count($parts), 'bytes' => $bytes, 'newest' => $newest ? date('c', $newest) : ''];
    }

    public static function state(): array
    {
        try {
            $row = Database::one("SELECT svalue, updated_at FROM site_settings WHERE skey=?", [self::STATE_KEY]);
        } catch (Throwable $e) { $row = null; }
        $st = $row ? (json_decode((string)$row['svalue'], true) ?: []) : [];
        $st['site_dir'] = AV_SITE_DIR;
        $st['site_present'] = is_file(AV_SITE_DIR . '/index.html');
        return $st;
    }

    private static function saveState(array $st): void
    {
        Database::q(
            "INSERT INTO site_settings (skey, svalue) VALUES (?,?) ON DUPLICATE KEY UPDATE svalue=VALUES(svalue)",
            [self::STATE_KEY, json_encode($st, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)]
        );
    }

    public static function needsSync(): bool
    {
        $fp = self::fingerprint();
        if ($fp['hash'] === '') return false;
        return ($fp['hash'] !== (self::state()['hash'] ?? ''));
    }

    /** Cron entry point: sync only when the site changed. Returns null when nothing to do. */
    public static function runIfChanged(string $reason = 'cron'): ?array
    {
        return self::needsSync() ? self::run(null, false, $reason) : null;
    }

    /* ============================================================
       RUN
       ============================================================ */

    /**
     * @return array{ok:bool,changed:bool,hash:string,files:int,duration_ms:int,keys:array<string,array>,warnings:string[]}
     */
    public static function run(?int $userId = null, bool $force = false, string $reason = 'manual'): array
    {
        $t0 = microtime(true);
        self::$now = date('c');
        self::$altMap = [];
        self::$headCache = [];
        $warnings = [];
        $fp = self::fingerprint();
        if ($fp['hash'] === '' || !is_file(AV_SITE_DIR . '/index.html')) {
            return ['ok' => false, 'changed' => false, 'hash' => '', 'files' => 0, 'duration_ms' => 0, 'keys' => [], 'warnings' => ['Static site not found at ' . AV_SITE_DIR]];
        }
        $prev = self::state();
        if (!$force && ($prev['hash'] ?? '') === $fp['hash']) {
            return ['ok' => true, 'changed' => false, 'hash' => $fp['hash'], 'files' => $fp['files'], 'duration_ms' => 0, 'keys' => [], 'warnings' => []];
        }

        $lock = Lock::acquire('site-sync');
        if ($lock === null) {
            return ['ok' => false, 'changed' => false, 'hash' => $fp['hash'], 'files' => $fp['files'], 'duration_ms' => 0, 'keys' => [], 'warnings' => ['Another sync is already running']];
        }

        $keys = [];
        try {
            $store = ContentStore::all();
            $index = self::searchIndex();
            $files = self::publicFiles($index);          // url => abs file
            self::collectAlts(array_values($files));

            $derived = [];
            $derived['settings'] = self::deriveSettings($store['settings'] ?? []);
            $derived['nav']      = self::deriveNav($store['nav'] ?? []);
            $derived['clients']  = self::deriveClients($store['clients'] ?? []);
            $derived['media']    = self::deriveMedia($store['media'] ?? []);
            $derived['pages']    = self::derivePages($store['pages'] ?? [], $index, $files);
            $derived['projects'] = self::deriveProjects($store['projects'] ?? [], $index, $files);
            $derived['articles'] = self::deriveArticles($store['articles'] ?? [], $index, $files);
            $derived['seo']      = self::deriveSeo($store['seo'] ?? [], $files);
            $derived['sections'] = self::deriveSections($store['sections'] ?? [], $derived);
            $derived['downloads']= self::deriveDownloads($store['downloads'] ?? []);

            foreach (self::KEYS as $k) {
                $old = $store[$k] ?? [];
                $new = $derived[$k];
                $changed = self::canon($old) !== self::canon($new);
                if ($changed) ContentStore::put($k, $new, $userId, 'sync from static frontend (' . $reason . ')');
                $keys[$k] = ['changed' => $changed, 'count' => is_array($new) && array_is_list($new) ? count($new) : count($new)];
            }

            $st = [
                'hash' => $fp['hash'], 'files' => $fp['files'], 'bytes' => $fp['bytes'], 'newest_file' => $fp['newest'],
                'synced_at' => self::$now, 'reason' => $reason, 'user_id' => $userId,
                'changed_keys' => array_keys(array_filter($keys, fn($k) => $k['changed'])),
                'runs' => (int)($prev['runs'] ?? 0) + 1,
            ];
            self::saveState($st);
        } catch (Throwable $e) {
            Lock::release($lock);
            try { ErrorModel::log('error', 'site-sync', $e->getMessage(), ['reason' => $reason]); } catch (Throwable $e2) {}
            return ['ok' => false, 'changed' => false, 'hash' => $fp['hash'], 'files' => $fp['files'], 'duration_ms' => (int)((microtime(true) - $t0) * 1000), 'keys' => $keys, 'warnings' => [$e->getMessage()]];
        }
        Lock::release($lock);

        $changedKeys = array_keys(array_filter($keys, fn($k) => $k['changed']));
        $ms = (int)((microtime(true) - $t0) * 1000);
        try {
            Audit::log($userId, 'sync', 'frontend', $fp['hash'], ['reason' => $reason, 'changed' => $changedKeys, 'files' => $fp['files'], 'ms' => $ms]);
            if ($changedKeys) {
                NotificationModel::push(
                    'Frontend synced into CMS',
                    'Static site changed — updated: ' . implode(', ', $changedKeys) . " ({$ms} ms, {$reason}).",
                    'info', null, '#pages'
                );
            }
        } catch (Throwable $e) { /* never fail a sync on bookkeeping */ }

        return ['ok' => true, 'changed' => (bool)$changedKeys, 'hash' => $fp['hash'], 'files' => $fp['files'], 'duration_ms' => $ms, 'keys' => $keys, 'warnings' => $warnings];
    }

    /* ============================================================
       SOURCE ENUMERATION
       ============================================================ */

    /** @return array{items:array<int,array>,byUrl:array<string,array>} */
    private static function searchIndex(): array
    {
        $f = AV_SITE_DIR . '/search-index.json';
        $items = [];
        if (is_file($f)) {
            $doc = json_decode((string)file_get_contents($f), true);
            $items = is_array($doc['items'] ?? null) ? $doc['items'] : (array_is_list($doc ?? []) ? ($doc ?? []) : []);
        }
        $byUrl = [];
        foreach ($items as $it) {
            if (!empty($it['url'])) $byUrl[self::normUrl($it['url'])] = $it;
        }
        return ['items' => $items, 'byUrl' => $byUrl];
    }

    /** All public (non-stub) html files keyed by site-relative url ('' = home, 'story.html', 'experience/'). */
    private static function publicFiles(array $index): array
    {
        $out = [];
        foreach (SeoCrawlerModel::siteHtmlFiles() as $abs) {
            $rel = self::rel($abs);
            if (in_array(basename($rel), ['404.html', 'search.html'], true)) continue;
            $url = $rel === 'index.html' ? '' : (str_ends_with($rel, '/index.html') ? substr($rel, 0, -strlen('index.html')) : $rel);
            $out[$url] = $abs;
        }
        ksort($out);
        return $out;
    }

    /* ============================================================
       DERIVERS
       ============================================================ */

    private static function deriveSettings(array $old): array
    {
        $home = AV_SITE_DIR . '/index.html';
        $x = self::xp($home);
        $head = self::head($home);
        $s = $old;
        $s['siteName'] = self::txt($x, "//a[contains(concat(' ',normalize-space(@class),' '),' brand ')]//span[contains(@class,'brand__name')]") ?: ($old['siteName'] ?? 'Abhijeet Varghese');
        $s['tagline'] = self::txt($x, "//*[contains(concat(' ',normalize-space(@class),' '),' hp-hero__tagline ')]") ?: ($old['tagline'] ?? '');
        $mail = self::attr($x, "(//a[starts-with(@href,'mailto:')])[1]", 'href');
        if ($mail) $s['email'] = substr($mail, 7);
        $tel = self::attr($x, "(//a[starts-with(@href,'tel:')])[1]", 'href');
        if ($tel) $s['phone'] = self::prettyPhone(substr($tel, 4), $old['phone'] ?? '');
        $avail = self::txt($x, "//*[contains(concat(' ',normalize-space(@class),' '),' hp-hero__avail ')]");
        if ($avail) $s['availability'] = $avail;
        $fav = self::attr($x, "//link[@rel='icon']", 'href');
        if ($fav) { $s['favicon'] = self::mediaRef($fav); $s['logo'] = self::mediaRef(self::attr($x, "//img[contains(@class,'brand__logo')]", 'src') ?: $fav); }
        if ($head['ogImage'] !== '') $s['ogImage'] = self::mediaRef($head['ogImage']);
        if ($head['desc'] !== '') $s['metaDescription'] = $head['desc'];
        if ($head['keywords'] !== '') $s['keywords'] = $head['keywords'];
        // socials — footer "Social" column (fallback: every external social link in #contact)
        $links = self::footerColumn($x, 'Social');
        if (!$links) $links = self::links($x, "//section[@id='contact']//a[starts-with(@href,'http')]");
        $oldSoc = [];
        foreach ($old['socials'] ?? [] as $o) $oldSoc[mb_strtolower($o['label'] ?? '')] = $o;
        $soc = [];
        $i = 0;
        foreach ($links as $l) {
            $i++;
            $key = mb_strtolower($l['label']);
            $soc[] = ['id' => $oldSoc[$key]['id'] ?? ('s' . $i), 'label' => $l['label'], 'href' => $l['href']];
        }
        if ($soc) $s['socials'] = $soc;
        $s['source'] = 'static-frontend';
        return self::stamp($s, $old);
    }

    private static function deriveNav(array $old): array
    {
        $home = AV_SITE_DIR . '/index.html';
        $x = self::xp($home);
        $oldPrimary = [];
        foreach ($old['primary'] ?? [] as $o) $oldPrimary[mb_strtolower($o['label'] ?? '')] = $o;
        $primary = [];
        $n = 0;
        foreach (self::links($x, "//nav[contains(@class,'site-nav__inner')]//ul//a | //nav[contains(@class,'site-nav__inner')]/a[contains(@class,'btn')]") as $l) {
            $n++;
            $slug = self::slugFromHref($l['href']);
            $row = ['id' => $oldPrimary[mb_strtolower($l['label'])]['id'] ?? ('n' . $n), 'label' => $l['label'], 'href' => $l['href'], 'page' => $slug];
            if ($l['cta']) $row['cta'] = true;
            $primary[] = $row;
        }
        $oldCols = [];
        foreach ($old['footerColumns'] ?? [] as $c) {
            $oldCols[mb_strtolower($c['label'] ?? '')] = $c;
        }
        $cols = [];
        $ci = 0;
        foreach (self::query($x, "//footer//*[contains(concat(' ',normalize-space(@class),' '),' footer__col ')]") as $col) {
            $ci++;
            $label = self::txt($x, ".//*[contains(@class,'footer__label')]", $col);
            if ($label === '') continue;
            $oc = $oldCols[mb_strtolower($label)] ?? null;
            $oldLinks = [];
            foreach ($oc['links'] ?? [] as $ol) $oldLinks[mb_strtolower($ol['label'] ?? '')] = $ol;
            $links = [];
            $li = 0;
            foreach (self::links($x, ".//a", $col) as $l) {
                $li++;
                $links[] = ['id' => $oldLinks[mb_strtolower($l['label'])]['id'] ?? ("fl{$ci}_{$li}"), 'label' => $l['label'], 'href' => $l['href']];
            }
            $cols[] = ['id' => $oc['id'] ?? ('fc' . $ci), 'label' => $label, 'links' => $links];
        }
        $copy = self::txt($x, "//footer//*[contains(@class,'footer__copy')]");
        $nav = $old;
        $nav['primary'] = $primary ?: ($old['primary'] ?? []);
        $nav['footerColumns'] = $cols ?: ($old['footerColumns'] ?? []);
        if ($copy !== '') $nav['copyright'] = $copy;
        $nav['source'] = 'static-frontend';
        return self::stamp($nav, $old);
    }

    private static function deriveClients(array $old): array
    {
        $x = self::xp(AV_SITE_DIR . '/index.html');
        $byLogo = []; $byName = [];
        foreach ($old as $c) { if (!empty($c['logo'])) $byLogo[$c['logo']] = $c; $byName[mb_strtolower($c['name'] ?? '')] = $c; }
        $out = [];
        $i = 0;
        foreach (self::query($x, "//section[@id='clients']//img[contains(@src,'logos/')]") as $img) {
            $i++;
            $src = (string)$img->getAttribute('src');
            $logo = basename((string)parse_url($src, PHP_URL_PATH));
            $name = trim((string)$img->getAttribute('alt'));
            $name = preg_replace('/\s+logo$/i', '', $name) ?: pathinfo($logo, PATHINFO_FILENAME);
            $o = $byLogo[$logo] ?? $byName[mb_strtolower($name)] ?? [];
            $out[] = [
                'id' => $o['id'] ?? ('c' . $i),
                'name' => $name,
                'monogram' => $o['monogram'] ?? mb_strtolower(mb_substr($name, 0, 1)),
                'industry' => $o['industry'] ?? '',
                'logo' => $logo,
            ];
        }
        return $out ?: $old;
    }

    private static function deriveMedia(array $old): array
    {
        $root = AV_SITE_DIR . '/assets';
        if (!is_dir($root)) return $old;
        $bySrc = [];
        foreach ($old as $m) if (!empty($m['src'])) $bySrc[$m['src']] = $m;
        $exts = ['webp' => 1, 'jpg' => 1, 'jpeg' => 1, 'png' => 1, 'gif' => 1, 'svg' => 1, 'avif' => 1, 'pdf' => 1, 'mp4' => 1, 'webm' => 1];
        $out = [];
        $i = 0;
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
        $files = [];
        foreach ($it as $f) { if ($f->isFile()) $files[] = $f->getPathname(); }
        sort($files);
        foreach ($files as $abs) {
            $ext = strtolower(pathinfo($abs, PATHINFO_EXTENSION));
            if (!isset($exts[$ext])) continue;
            $rel = substr($abs, strlen($root) + 1);
            $src = 'media/' . $rel;
            $o = $bySrc[$src] ?? [];
            $i++;
            $w = $o['w'] ?? 0; $h = $o['h'] ?? 0;
            if (in_array($ext, ['webp', 'jpg', 'jpeg', 'png', 'gif', 'avif'], true)) {
                $dim = @getimagesize($abs);
                if ($dim) { $w = (int)$dim[0]; $h = (int)$dim[1]; }
            }
            $out[] = [
                'id' => $o['id'] ?? ('med-' . substr(md5($rel), 0, 8)),
                'name' => basename($rel),
                'folder' => $o['folder'] ?? self::mediaFolder($rel),
                'size' => self::humanSize(filesize($abs)),
                'w' => $w, 'h' => $h,
                'src' => $src,
                'alt' => ($o['alt'] ?? '') !== '' ? $o['alt'] : (self::$altMap['assets/' . $rel] ?? ''),
                'tags' => $o['tags'] ?? array_values(array_filter([strtolower(pathinfo($rel, PATHINFO_EXTENSION)), dirname($rel) !== '.' ? strtolower(dirname($rel)) : null])),
                'source' => 'static-frontend',
            ];
        }
        return $out ?: $old;
    }

    private static function derivePages(array $old, array $index, array $files): array
    {
        $bySlug = [];
        foreach ($old as $p) $bySlug[$p['slug'] ?? ''] = $p;
        $out = [];
        $seen = [];
        foreach ($files as $url => $abs) {
            if ($url === '') continue;                                  // home = sections
            if (str_starts_with($url, 'case-studies/') && $url !== 'case-studies/') continue;
            $it = $index['byUrl'][self::normUrl($url)] ?? null;
            $type = $it['type'] ?? 'Page';
            if (in_array($type, ['Essay', 'Journal', 'Case Study'], true)) continue;
            if (preg_match('#^(essay|journal)-#', $url)) continue;
            $slug = self::slugFromHref($url);
            $seen[$slug] = true;
            $o = $bySlug[$slug] ?? [];
            $head = self::head($abs);
            $x = self::xp($abs);
            $h1 = self::txt($x, "(//h1)[1]");
            $lede = self::txt($x, "(//*[contains(@class,'page-hero__lede') or contains(@class,'article-hero__lede') or contains(@class,'chapter__lede')])[1]");
            $kicker = self::txt($x, "(//*[contains(@class,'page-hero__meta')]//*[contains(@class,'chapter__tag')])[1]");
            $title = $it['title'] ?? ($o['title'] ?? self::titleFromHead($head['title'], $h1));
            $blocks = $o['blocks'] ?? [];
            if ($slug === 'experience') $blocks = self::experienceBlocks($x, $blocks);
            if (!$blocks && $h1 !== '') {
                $blocks[] = ['id' => 'b0', 'type' => 'hero', 'content' => ['kicker' => $kicker, 'title' => $h1, 'lede' => $lede]];
            }
            $p = array_merge($o, [
                'id' => $o['id'] ?? ('p-' . $slug),
                'title' => $title,
                'slug' => $slug,
                'status' => 'published',
                'template' => $o['template'] ?? ($type === 'Page' ? 'Page' : $type),
                'url' => '/' . $url,
                'sourceFile' => self::rel($abs),
                'h1' => $h1,
                'seo' => ['title' => $head['title'], 'desc' => $head['desc'], 'keywords' => $head['keywords'] !== '' ? $head['keywords'] : (string)($it['tags'] ?? ($o['seo']['keywords'] ?? '')), 'ogImage' => self::mediaRef($head['ogImage']), 'canonical' => $head['canonical']],
                'blocks' => $blocks,
                'source' => 'static-frontend',
            ]);
            $out[] = self::stamp($p, $o);
        }
        // pages that only exist in the CMS → keep, but they are not live
        foreach ($old as $p) {
            if (isset($seen[$p['slug'] ?? ''])) continue;
            if (($p['status'] ?? '') === 'published') { $p['status'] = 'draft'; $p['updated'] = self::$now; }
            $p['source'] = 'cms-only';
            $out[] = $p;
        }
        return $out;
    }

    /** Experience page: rebuild `job` blocks from article.exp-job; keep non-job blocks (e.g. cta). */
    private static function experienceBlocks(DOMXPath $x, array $oldBlocks): array
    {
        $jobs = self::query($x, "//article[contains(concat(' ',normalize-space(@class),' '),' exp-job ')]");
        if (!$jobs) return $oldBlocks;
        $oldByKey = [];
        foreach ($oldBlocks as $b) {
            if (($b['type'] ?? '') !== 'job') continue;
            $c = $b['content'] ?? [];
            $oldByKey[mb_strtolower(trim(($c['company'] ?? '') . '|' . ($c['role'] ?? '') . '|' . ($c['dates'] ?? '')))] = $b;
        }
        $out = [];
        $ids = [];
        $i = 0;
        foreach ($jobs as $j) {
            $i++;
            $company = self::txt($x, ".//*[contains(@class,'exp-job__company')]/text()", $j);
            $loc = self::txt($x, ".//*[contains(@class,'exp-job__loc')]", $j);
            $role = self::txt($x, ".//*[contains(@class,'exp-job__role') and not(contains(@class,'exp-job__role-sub'))]", $j);
            $dates = self::txt($x, ".//*[contains(@class,'exp-job__date')]", $j);
            $o = $oldByKey[mb_strtolower($company . '|' . $role . '|' . $dates)] ?? [];
            $img = self::attr($x, ".//*[contains(@class,'exp-job__img')]//img", 'src', $j);
            // stable id: company slug + start year (e.g. j-rams-creative-technologies-2024)
            $year = preg_match('/(\d{4})/', $dates, $ym) ? $ym[1] : (string)$i;
            $id = 'j-' . self::slugify($company ?: 'job') . '-' . $year;
            if (isset($ids[$id])) $id .= '-' . $i;
            $ids[$id] = true;
            $out[] = [
                'id' => $id,
                'type' => 'job',
                'content' => [
                    'company' => $company,
                    'role' => $role,
                    'role_sub' => self::txt($x, ".//*[contains(@class,'exp-job__role-sub')]", $j),
                    'dates' => $dates,
                    'location' => $loc,
                    'summary' => self::txt($x, ".//*[contains(@class,'exp-job__summary')]", $j),
                    'disciplines' => self::texts($x, ".//*[contains(@class,'exp-job__disc')]/span", $j),
                    'responsibilities' => self::texts($x, ".//ul[contains(@class,'exp-job__list')]/li", $j),
                    'image' => $img ? self::mediaRef($img) : ($o['content']['image'] ?? ''),
                    'alt' => self::attr($x, ".//*[contains(@class,'exp-job__img')]//img", 'alt', $j),
                ],
            ];
        }
        foreach ($oldBlocks as $b) if (($b['type'] ?? '') !== 'job') $out[] = $b;
        return $out;
    }

    private static function deriveProjects(array $old, array $index, array $files): array
    {
        $home = AV_SITE_DIR . '/index.html';
        $x = self::xp($home);
        // cards on the home page (#work) — richest structured source
        $cards = [];
        $order = 0;
        foreach (self::query($x, "//section[@id='work']//article[contains(concat(' ',normalize-space(@class),' '),' case ')]") as $a) {
            $href = self::attr($x, ".//a[contains(@href,'case-studies/')]", 'href', $a);
            if ($href === '') continue;
            $slug = self::caseSlug($href);
            if ($slug === '') continue;
            $meta = [];
            foreach (self::query($x, ".//dl//div", $a) as $d) {
                $dt = mb_strtolower(self::txt($x, ".//dt", $d));
                $dd = self::txt($x, ".//dd", $d);
                if ($dt !== '') $meta[$dt] = $dd;
            }
            $cards[$slug] = [
                'order' => ++$order,
                'client' => self::txt($x, ".//*[contains(@class,'case__client')]", $a),
                'cardTitle' => self::txt($x, ".//*[contains(@class,'case__title')]", $a),
                'industry' => self::txt($x, ".//*[contains(@class,'case__cat')]", $a),
                'work' => self::txt($x, ".//*[contains(@class,'case__work')]", $a),
                'image' => self::attr($x, ".//img", 'src', $a),
                'imageAlt' => self::attr($x, ".//img", 'alt', $a),
                'challenge' => $meta['problem'] ?? ($meta['challenge'] ?? ''),
                'approach' => $meta['approach'] ?? '',
                'role' => $meta['role'] ?? '',
                'outcome' => $meta['outcome'] ?? '',
            ];
        }
        // case-study directories
        $dirs = [];
        foreach ($files as $url => $abs) {
            if (preg_match('#^case-studies/([^/]+)/$#', $url, $m)) $dirs[$m[1]] = $abs;
        }
        foreach (array_keys($cards) as $slug) if (!isset($dirs[$slug]) && is_file(AV_SITE_DIR . "/case-studies/$slug/index.html")) $dirs[$slug] = AV_SITE_DIR . "/case-studies/$slug/index.html";
        $legacy = self::legacyPaths();

        $norm = fn(string $s) => preg_replace('/[^a-z0-9]+/', '', mb_strtolower($s));
        $used = [];
        $find = function (string $slug, array $card, array $ld) use ($old, &$used, $norm): array {
            $path = "case-studies/$slug/";
            $title = $ld['name'] ?? '';
            foreach ($old as $o) {
                if (isset($used[$o['id']])) continue;
                if (($o['slug'] ?? '') === $slug || ($o['caseStudyPath'] ?? '') === $path) return $o;
            }
            foreach ($old as $o) {
                if (isset($used[$o['id']])) continue;
                if ($title !== '' && $norm($o['title'] ?? '') === $norm($title)) return $o;
                if (($card['cardTitle'] ?? '') !== '' && $norm($o['title'] ?? '') === $norm($card['cardTitle'])) return $o;
            }
            foreach ($old as $o) {
                if (isset($used[$o['id']])) continue;
                $oc = $norm($o['client'] ?? ''); $cc = $norm($card['client'] ?? '');
                if ($oc !== '' && $cc !== '' && ($oc === $cc || str_contains($cc, $oc) || str_contains($oc, $cc))) return $o;
            }
            return [];
        };

        $out = [];
        $n = 0;
        $slugs = array_unique(array_merge(array_keys($cards), array_keys($dirs)));
        foreach ($slugs as $slug) {
            $n++;
            $card = $cards[$slug] ?? [];
            $abs = $dirs[$slug] ?? null;
            $head = $abs ? self::head($abs) : ['title' => '', 'desc' => '', 'keywords' => '', 'ogImage' => '', 'ogTitle' => '', 'canonical' => ''];
            $ld = $abs ? self::jsonLd($abs) : [];
            $o = $find($slug, $card, $ld);
            if ($o) $used[$o['id']] = true;
            $title = $ld['name'] ?: ($head['ogTitle'] !== '' ? self::titleFromHead($head['ogTitle'], '') : ($card['cardTitle'] ?? ($o['title'] ?? $slug)));
            $client = $card['client'] ?? ($o['client'] ?? '');
            $img = $card['image'] ?? '';
            $imageRef = $img !== '' ? self::mediaRef($img) : ($head['ogImage'] !== '' ? self::mediaRef($head['ogImage']) : ($o['image'] ?? ''));
            $year = $o['year'] ?? '';
            if (!empty($ld['datePublished'])) $year = substr($ld['datePublished'], 0, 4);
            $p = array_merge($o, [
                'id' => $o['id'] ?? ('prj-' . $slug),
                'title' => $title,
                'cardTitle' => $card['cardTitle'] ?? ($o['cardTitle'] ?? ''),
                'client' => $client,
                'industry' => $card['industry'] ?? ($o['industry'] ?? ''),
                'services' => $card['work'] ?? ($o['services'] ?? ''),
                'status' => 'published',
                'year' => $year,
                'featured' => isset($cards[$slug]),
                'order' => $card['order'] ?? (100 + $n),
                'image' => $imageRef,
                'imageAlt' => $card['imageAlt'] ?? ($o['imageAlt'] ?? ''),
                'summary' => $ld['description'] ?: ($head['desc'] !== '' ? $head['desc'] : ($o['summary'] ?? '')),
                'role' => $card['role'] ?? ($o['role'] ?? ''),
                'challenge' => $card['challenge'] ?? ($o['challenge'] ?? ''),
                'approach' => $card['approach'] ?? ($o['approach'] ?? ''),
                'outcome' => $card['outcome'] ?? ($o['outcome'] ?? ''),
                'location' => $ld['location'] ?: ($o['location'] ?? ''),
                'slug' => $slug,
                'caseStudyPath' => "case-studies/$slug/",
                'url' => "/case-studies/$slug/",
                'sourceFile' => $abs ? self::rel($abs) : '',
                'legacyPaths' => $legacy["case-studies/$slug/"] ?? ($o['legacyPaths'] ?? []),
                'seo' => ['title' => $head['title'], 'desc' => $head['desc'], 'keywords' => $head['keywords'], 'ogImage' => self::mediaRef($head['ogImage']), 'canonical' => $head['canonical']],
                'source' => 'static-frontend',
            ]);
            unset($p['caseStudyTemplate']);
            if (!isset($p['views'])) $p['views'] = '0';
            $out[] = self::stamp($p, $o);
        }
        usort($out, fn($a, $b) => ($a['order'] <=> $b['order']));
        foreach ($old as $o) {
            if (isset($used[$o['id']])) continue;
            if (($o['status'] ?? '') === 'published') { $o['status'] = 'draft'; $o['updated'] = self::$now; }
            $o['featured'] = false;
            $o['source'] = 'cms-only';
            $out[] = $o;
        }
        return $out;
    }

    private static function deriveArticles(array $old, array $index, array $files): array
    {
        $bySlug = []; $byTitle = [];
        foreach ($old as $a) { if (!empty($a['slug'])) $bySlug[$a['slug']] = $a; $byTitle[mb_strtolower($a['title'] ?? '')] = $a; }
        $out = [];
        $used = [];
        $n = 0;
        foreach ($files as $url => $abs) {
            if (!preg_match('#^(essay|journal)-([a-z0-9-]+)\.html$#', $url, $m)) continue;
            $n++;
            $type = $m[1];
            $slug = $m[2];
            $it = $index['byUrl'][self::normUrl($url)] ?? [];
            $head = self::head($abs);
            $ld = self::jsonLd($abs);
            $x = self::xp($abs);
            $title = self::txt($x, "(//*[contains(@class,'article-hero__title')])[1]") ?: ($it['title'] ?? self::titleFromHead($head['title'], ''));
            $o = $bySlug[$slug] ?? $byTitle[mb_strtolower($title)] ?? [];
            if ($o) $used[$o['id']] = true;
            $tag = self::txt($x, "(//*[contains(@class,'article-hero')]//*[contains(@class,'chapter__tag')])[1]");
            [$category, $readTime] = self::splitTag($tag, $type);
            $paras = [];
            foreach (self::query($x, "//section[contains(@class,'article-body')]//*[contains(@class,'prose')]//p") as $p) {
                $t = self::clean($p->textContent);
                if ($t !== '') $paras[] = $t;
            }
            $img = self::attr($x, "(//*[contains(@class,'article-hero__img')])[1]", 'src');
            if ($img === '') $img = self::attr($x, "(//*[contains(@class,'article-hero')]//img)[1]", 'src');
            $date = substr((string)($ld['datePublished'] ?? ''), 0, 10);
            if ($date === '' && preg_match('/(\d{4}-\d{2}-\d{2})/', self::txt($x, "//*[contains(@class,'article-foot')]//p"), $dm)) $date = $dm[1];
            $a = array_merge($o, [
                'id' => $o['id'] ?? ('art-' . $slug),
                'title' => $title,
                'type' => $type,
                'status' => 'published',
                'category' => $category ?: ($o['category'] ?? ucfirst($type)),
                'readTime' => $readTime ?: ($o['readTime'] ?? ''),
                'date' => $date ?: ($o['date'] ?? ''),
                'image' => $img !== '' ? self::mediaRef($img) : ($head['ogImage'] !== '' ? self::mediaRef($head['ogImage']) : ($o['image'] ?? '')),
                'excerpt' => self::txt($x, "(//*[contains(@class,'article-hero__lede')])[1]") ?: ($head['desc'] !== '' ? $head['desc'] : ($o['excerpt'] ?? '')),
                'body' => $paras ? implode("\n\n", $paras) : ($o['body'] ?? ''),
                'slug' => $slug,
                'url' => '/' . $url,
                'sourceFile' => self::rel($abs),
                'seo' => ['title' => $head['title'], 'desc' => $head['desc'], 'keywords' => $head['keywords'] !== '' ? $head['keywords'] : (string)($it['tags'] ?? ''), 'ogImage' => self::mediaRef($head['ogImage']), 'canonical' => $head['canonical']],
                'source' => 'static-frontend',
            ]);
            if (!isset($a['views'])) $a['views'] = '0';
            $out[] = self::stamp($a, $o);
        }
        usort($out, fn($a, $b) => strcmp($b['date'] ?? '', $a['date'] ?? ''));
        foreach ($old as $o) {
            if (isset($used[$o['id']])) continue;
            if (($o['status'] ?? '') === 'published') { $o['status'] = 'draft'; $o['updated'] = self::$now; }
            $o['source'] = 'cms-only';
            $out[] = $o;
        }
        return $out;
    }

    private static function deriveSeo(array $old, array $files): array
    {
        $byUrl = [];
        foreach ($old as $r) $byUrl[rtrim((string)($r['url'] ?? ''), '/') ?: '/'] = $r;
        $incoming = [];
        try { $incoming = SeoCrawlerModel::incomingLinks(); } catch (Throwable $e) {}
        $out = [];
        $i = 0;
        foreach ($files as $url => $abs) {
            $i++;
            $u = '/' . $url;
            $key = rtrim($u, '/') ?: '/';
            $o = $byUrl[$key] ?? [];
            $head = self::head($abs);
            $kw = array_values(array_filter(array_map('trim', explode(',', $head['keywords']))));
            $tl = mb_strlen($head['title']); $dl = mb_strlen($head['desc']);
            $score = 0;
            $score += ($tl >= 30 && $tl <= 65) ? 30 : ($tl > 0 ? 15 : 0);
            $score += ($dl >= 70 && $dl <= 160) ? 30 : ($dl > 0 ? 15 : 0);
            $score += $kw ? 10 : 0;
            $score += $head['canonical'] !== '' ? 10 : 0;
            $score += $head['ogImage'] !== '' ? 10 : 0;
            $score += self::head($abs)['h1'] !== '' ? 10 : 0;
            $row = array_merge($o, [
                'id' => $o['id'] ?? ('seo-' . $i),
                'title' => $head['title'],
                'url' => $u,
                'score' => $score,
                'keywords' => $kw,
                'desc' => $head['desc'],
                'canonical' => $head['canonical'],
                'ogImage' => self::mediaRef($head['ogImage']),
                'h1' => $head['h1'],
                'inlinks' => $incoming[$u] ?? 0,
                'sourceFile' => self::rel($abs),
                'source' => 'static-frontend',
            ]);
            $out[] = self::stamp($row, $o);
        }
        return $out;
    }

    private static function deriveSections(array $old, array $derived): array
    {
        $home = AV_SITE_DIR . '/index.html';
        $x = self::xp($home);
        $byId = [];
        foreach ($old as $s) $byId[$s['id'] ?? ''] = $s;
        $out = [];
        $seen = [];
        $order = 0;
        $defaultNames = ['hero' => 'Hero', 'clients' => 'Clients', 'capabilities' => 'Capabilities', 'work' => 'Featured Work', 'thinking' => 'Thinking', 'journey' => 'Journey', 'ai' => 'AI', 'focus' => 'CTA', 'contact' => 'Contact'];
        foreach (self::query($x, "//main/section[@id]") as $sec) {
            $id = (string)$sec->getAttribute('id');
            $order++;
            $seen[$id] = true;
            $o = $byId[$id] ?? [];
            unset($o['steps'], $o['articleIds'], $o['items_legacy']);
            if ($id === 'focus') unset($o['items']);
            $cls = ' ' . (string)$sec->getAttribute('class') . ' ';
            $theme = str_contains($cls, ' t-dark ') ? 'dark' : (str_contains($cls, ' t-light ') ? 'light' : ($o['theme'] ?? ($id === 'hero' ? 'dark' : 'light')));
            $kicker = self::txt($x, "(.//*[contains(@class,'chapter__meta')]//*[contains(@class,'chapter__tag')])[1]", $sec);
            $title = self::txt($x, "(.//h2)[1]", $sec);
            $lede = self::txt($x, "(.//*[contains(@class,'chapter__lede')])[1]", $sec);
            $s = array_merge($o, [
                'id' => $id, 'type' => $o['type'] ?? $id, 'name' => $o['name'] ?? ($defaultNames[$id] ?? ucfirst($id)),
                'kicker' => $kicker !== '' ? $kicker : ($o['kicker'] ?? ''),
                'status' => 'published', 'order' => $order, 'theme' => $theme,
                'source' => 'static-frontend',
            ]);
            if ($title !== '') $s['title'] = $title;
            if ($lede !== '') $s['lede'] = $lede;
            // "Title.<em>Second line.</em>" headings → title / title2
            $em = self::txt($x, "(.//h2)[1]//em", $sec);
            if ($em !== '' && $title !== '') {
                $s['title'] = self::clean(str_replace($em, '', $title));
                $s['title2'] = $em;
            }
            switch ($id) {
                case 'hero':
                    $s['title'] = self::txt($x, ".//*[contains(@class,'hp-hero__tagline')]", $sec) ?: ($o['title'] ?? '');
                    $roles = self::texts($x, ".//*[contains(@class,'hero__roles-item')]", $sec);
                    if ($roles) $s['roles'] = $roles;
                    $lede = self::txt($x, ".//*[contains(@class,'hp-hero__lede')]", $sec);
                    if ($lede) $s['lede'] = $lede;
                    $portrait = self::attr($x, "(.//img[contains(@src,'portrait')])[1]", 'src', $sec);
                    if ($portrait) $s['portrait'] = self::mediaRef($portrait);
                    $ctas = self::links($x, ".//*[contains(@class,'hp-hero__actions')]//a", $sec);
                    if (isset($ctas[0])) $s['cta'] = ['label' => $ctas[0]['label'], 'href' => $ctas[0]['href']];
                    if (isset($ctas[1])) $s['cta2'] = ['label' => $ctas[1]['label'], 'href' => $ctas[1]['href']];
                    $avail = self::txt($x, ".//*[contains(@class,'hp-hero__avail')]", $sec);
                    if ($avail) $s['availability'] = $avail;
                    $mq = self::texts($x, ".//*[contains(@class,'marquee__track')]/span[not(contains(@class,'marquee__dot'))]", $sec);
                    if ($mq) $s['marquee'] = array_values(array_unique($mq));
                    break;
                case 'clients':
                    $s['clientIds'] = array_column($derived['clients'] ?? [], 'id');
                    $note = self::txt($x, "(.//*[contains(@class,'clients__note')])[1]", $sec);
                    if ($note) $s['note'] = $note;
                    break;
                case 'work':
                    $s['projectIds'] = array_column(array_filter($derived['projects'] ?? [], fn($p) => !empty($p['featured'])), 'id');
                    break;
                case 'thinking':
                    $slugs = [];
                    foreach (self::links($x, ".//a[contains(@href,'essay-') or contains(@href,'journal-')]", $sec) as $l) {
                        if (preg_match('#(?:essay|journal)-([a-z0-9-]+)\.html#', $l['href'], $m)) $slugs[] = $m[1];
                    }
                    $ids = [];
                    foreach ($derived['articles'] ?? [] as $a) if (in_array($a['slug'] ?? '', $slugs, true)) $ids[$a['slug']] = $a['id'];
                    $s['essayIds'] = array_values(array_map(fn($sl) => $ids[$sl], array_values(array_filter($slugs, fn($sl) => isset($ids[$sl])))));
                    $q = self::txt($x, "(.//blockquote)[1]", $sec);
                    if ($q) $s['quote'] = trim($q, "“”\" ");
                    $l = self::txt($x, "(.//*[contains(@class,'thinking__lede')])[1]", $sec);
                    if ($l) $s['lede'] = $l;
                    $img = self::attr($x, "(.//figure//img)[1]", 'src', $sec);
                    if ($img) { $s['image'] = self::mediaRef($img); $cap = self::txt($x, "(.//figure//figcaption)[1]", $sec); if ($cap) $s['imageCaption'] = $cap; }
                    break;
                case 'capabilities':
                    $items = self::texts($x, ".//*[contains(@class,'cap-list')]//h3", $sec);
                    if ($items) $s['items'] = $items;
                    $caps = [];
                    foreach (self::query($x, ".//*[contains(@class,'cap-list')]//article", $sec) as $c) {
                        $caps[] = ['name' => self::txt($x, ".//h3", $c), 'body' => self::txt($x, ".//p", $c)];
                    }
                    if ($caps) $s['capabilities'] = $caps;
                    break;
                case 'focus':
                    $items = [];
                    foreach (self::query($x, ".//*[contains(@class,'focus__list')]/li", $sec) as $li) {
                        $t = self::clean(preg_replace('/^\s*\d{2}\s*/', '', self::clean($li->textContent)));
                        if ($t !== '') $items[] = $t;
                    }
                    if ($items) $s['list'] = $items;
                    $open = self::texts($x, ".//*[contains(@class,'open__list')]/li", $sec);
                    if ($open) $s['openTo'] = $open;
                    $ol = self::txt($x, "(.//*[contains(@class,'focus__open')]//p[contains(@class,'label')])[1]", $sec);
                    if ($ol) $s['openLabel'] = $ol;
                    $note = self::txt($x, "(.//*[contains(@class,'focus__note')])[1]", $sec);
                    if ($note) $s['note'] = $note;
                    break;
                case 'journey':
                    $eras = [];
                    foreach (self::query($x, ".//li[contains(concat(' ',normalize-space(@class),' '),' era ')]", $sec) as $li) {
                        if (!$li instanceof DOMElement) continue;
                        $e = ['name' => self::txt($x, ".//*[contains(@class,'era__name')]", $li), 'note' => self::txt($x, ".//*[contains(@class,'era__note')]", $li)];
                        if (str_contains((string)$li->getAttribute('class'), 'era--future')) $e['future'] = true;
                        if ($e['name'] !== '') $eras[] = $e;
                    }
                    if ($eras) $s['eras'] = $eras;
                    $coda = self::txt($x, "(.//*[contains(@class,'journey__coda')])[1]", $sec);
                    if ($coda) $s['coda'] = $coda;
                    break;
                case 'ai':
                    $ps = self::texts($x, ".//*[contains(@class,'ai__copy')]/div/p", $sec);
                    if (isset($ps[0])) $s['p1'] = $ps[0];
                    if (isset($ps[1])) $s['p2'] = $ps[1];
                    $chips = self::texts($x, ".//*[contains(@class,'chip-list')]/li", $sec);
                    if ($chips) $s['chips'] = $chips;
                    $projects = [];
                    foreach (self::query($x, ".//*[contains(@class,'ai__projects')]//h3", $sec) as $h) {
                        $body = '';
                        $n = $h->nextSibling;
                        while ($n && !($n instanceof DOMElement)) $n = $n->nextSibling;
                        if ($n instanceof DOMElement && $n->tagName === 'p') $body = self::clean($n->textContent);
                        $projects[] = ['name' => self::clean($h->textContent), 'body' => $body];
                    }
                    if ($projects) $s['projects'] = $projects;
                    $motto = self::txt($x, "(.//*[contains(@class,'ai__motto')])[1]", $sec);
                    if ($motto) $s['motto'] = trim($motto, "“”\" ");
                    $img = self::attr($x, "(.//figure//img)[1]", 'src', $sec);
                    if ($img) { $s['image'] = self::mediaRef($img); $cap = self::txt($x, "(.//figure//figcaption)[1]", $sec); if ($cap) $s['imageCaption'] = $cap; }
                    break;
                case 'contact':
                    $micro = [];
                    foreach (self::query($x, ".//*[contains(@class,'contact__micro')]/li", $sec) as $li) {
                        $row = ['label' => self::txt($x, "./span", $li), 'value' => self::txt($x, "./strong", $li)];
                        $href = self::attr($x, ".//a", 'href', $li);
                        if ($href) $row['href'] = $href;
                        if ($row['label'] !== '') $micro[] = $row;
                    }
                    if ($micro) $s['micro'] = $micro;
                    foreach (self::links($x, ".//a[starts-with(@href,'mailto:') or starts-with(@href,'tel:')]", $sec) as $l) {
                        if (str_starts_with($l['href'], 'mailto:')) $s['email'] = substr($l['href'], 7);
                        if (str_starts_with($l['href'], 'tel:')) $s['phone'] = $l['label'];
                    }
                    break;
            }
            $out[] = self::stamp($s, $o);
        }
        foreach ($old as $o) {
            if (isset($seen[$o['id'] ?? ''])) continue;
            if (($o['status'] ?? '') === 'published') { $o['status'] = 'draft'; $o['updated'] = self::$now; }
            $o['source'] = 'cms-only';
            $out[] = $o;
        }
        usort($out, fn($a, $b) => (($a['order'] ?? 999) <=> ($b['order'] ?? 999)));
        return $out ?: $old;
    }

    private static function deriveDownloads(array $old): array
    {
        $root = AV_SITE_DIR . '/assets';
        $byHref = [];
        foreach ($old as $d) $byHref[ltrim((string)($d['href'] ?? ''), '/')] = $d;
        $out = [];
        $seen = [];
        $i = 0;
        foreach (glob($root . '/*.pdf') ?: [] as $abs) {
            $i++;
            $href = 'assets/' . basename($abs);
            $seen[$href] = true;
            $o = $byHref[$href] ?? [];
            $row = array_merge($o, [
                'id' => $o['id'] ?? ('d-' . self::slugify(pathinfo($abs, PATHINFO_FILENAME))),
                'name' => basename($abs),
                'type' => 'PDF',
                'size' => self::humanSize(filesize($abs)),
                'downloads' => $o['downloads'] ?? 0,
                'status' => 'published',
                'href' => $href,
                'source' => 'static-frontend',
            ]);
            $out[] = $row;
        }
        foreach ($old as $o) {
            $h = ltrim((string)($o['href'] ?? ''), '/');
            if ($h !== '' && isset($seen[$h])) continue;
            if (($o['status'] ?? '') === 'published' && ($h === '' || !is_file(AV_SITE_DIR . '/' . $h))) $o['status'] = 'draft';
            $o['source'] = 'cms-only';
            $out[] = $o;
        }
        return $out;
    }

    /* ============================================================
       HTML HELPERS
       ============================================================ */

    private static function xp(string $file): DOMXPath
    {
        static $cache = [];
        if (isset($cache[$file])) return $cache[$file];
        $html = (string)file_get_contents($file);
        $html = preg_replace('#<br\s*/?>#i', "<br>\n", $html);   // keep word boundaries across line breaks
        $dom = new DOMDocument();
        $prev = libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_NONET);
        libxml_clear_errors();
        libxml_use_internal_errors($prev);
        return $cache[$file] = new DOMXPath($dom);
    }

    /** @return DOMNode[] */
    private static function query(DOMXPath $x, string $expr, ?DOMNode $ctx = null): array
    {
        $r = $ctx ? $x->query($expr, $ctx) : $x->query($expr);
        if (!$r) return [];
        $out = [];
        foreach ($r as $n) $out[] = $n;
        return $out;
    }

    private static function txt(DOMXPath $x, string $expr, ?DOMNode $ctx = null): string
    {
        $n = self::query($x, $expr, $ctx);
        if (!$n) return '';
        // text() unions: join all matched text nodes
        if ($n[0] instanceof DOMText) {
            $s = '';
            foreach ($n as $t) $s .= $t->textContent . ' ';
            return self::clean($s);
        }
        return self::clean($n[0]->textContent);
    }

    /** @return string[] */
    private static function texts(DOMXPath $x, string $expr, ?DOMNode $ctx = null): array
    {
        $out = [];
        foreach (self::query($x, $expr, $ctx) as $n) {
            $t = self::clean($n->textContent);
            if ($t !== '') $out[] = $t;
        }
        return $out;
    }

    private static function attr(DOMXPath $x, string $expr, string $attr, ?DOMNode $ctx = null): string
    {
        $n = self::query($x, $expr, $ctx);
        return $n && $n[0] instanceof DOMElement ? trim((string)$n[0]->getAttribute($attr)) : '';
    }

    /** @return array<int,array{label:string,href:string,cta:bool}> */
    private static function links(DOMXPath $x, string $expr, ?DOMNode $ctx = null): array
    {
        $out = [];
        foreach (self::query($x, $expr, $ctx) as $a) {
            if (!$a instanceof DOMElement) continue;
            $href = trim((string)$a->getAttribute('href'));
            $label = self::clean($a->textContent);
            if ($label === '') $label = trim((string)$a->getAttribute('aria-label'));
            if ($href === '' || $label === '') continue;
            $out[] = ['label' => $label, 'href' => $href, 'cta' => str_contains(' ' . $a->getAttribute('class') . ' ', ' btn ')];
        }
        return $out;
    }

    private static function footerColumn(DOMXPath $x, string $label): array
    {
        foreach (self::query($x, "//footer//*[contains(concat(' ',normalize-space(@class),' '),' footer__col ')]") as $col) {
            if (mb_strtolower(self::txt($x, ".//*[contains(@class,'footer__label')]", $col)) === mb_strtolower($label)) return self::links($x, ".//a", $col);
        }
        return [];
    }

    /** @return array{title:string,desc:string,keywords:string,ogImage:string,ogTitle:string,canonical:string,h1:string} */
    private static function head(string $file): array
    {
        if (isset(self::$headCache[$file])) return self::$headCache[$file];
        $x = self::xp($file);
        $h = [
            'title' => self::txt($x, "//head/title"),
            'desc' => self::attr($x, "//meta[@name='description']", 'content'),
            'keywords' => self::attr($x, "//meta[@name='keywords']", 'content'),
            'ogImage' => self::attr($x, "//meta[@property='og:image']", 'content'),
            'ogTitle' => self::attr($x, "//meta[@property='og:title']", 'content'),
            'canonical' => self::attr($x, "//link[@rel='canonical']", 'href'),
            'h1' => self::txt($x, "(//h1)[1]"),
        ];
        return self::$headCache[$file] = $h;
    }

    /** Flattened JSON-LD facts: name, description, datePublished, location. */
    private static function jsonLd(string $file): array
    {
        $out = ['name' => '', 'description' => '', 'datePublished' => '', 'location' => ''];
        $x = self::xp($file);
        $nodes = [];
        foreach (self::query($x, "//script[@type='application/ld+json']") as $s) {
            $d = json_decode(trim($s->textContent), true);
            if (!is_array($d)) continue;
            $graph = $d['@graph'] ?? (array_is_list($d) ? $d : [$d]);
            foreach ($graph as $g) if (is_array($g)) $nodes[] = $g;
        }
        $pref = ['CreativeWork', 'Article', 'BlogPosting', 'NewsArticle', 'WebPage'];
        foreach ($pref as $type) {
            foreach ($nodes as $g) {
                $t = (array)($g['@type'] ?? []);
                if (!in_array($type, $t, true)) continue;
                if ($out['name'] === '') $out['name'] = self::clean((string)($g['name'] ?? $g['headline'] ?? ''));
                if ($out['description'] === '') $out['description'] = self::clean((string)($g['description'] ?? ''));
                if ($out['datePublished'] === '') $out['datePublished'] = (string)($g['datePublished'] ?? $g['dateCreated'] ?? '');
                if ($out['location'] === '' && isset($g['locationCreated'])) {
                    $loc = $g['locationCreated'];
                    $out['location'] = self::clean(is_array($loc) ? (string)($loc['name'] ?? '') : (string)$loc);
                }
            }
        }
        return $out;
    }

    private static function collectAlts(array $files): void
    {
        foreach ($files as $abs) {
            $x = self::xp($abs);
            foreach (self::query($x, "//img[@src]") as $img) {
                if (!$img instanceof DOMElement) continue;
                $src = self::siteRel($abs, (string)$img->getAttribute('src'));
                $alt = trim((string)$img->getAttribute('alt'));
                if ($src !== '' && $alt !== '' && !isset(self::$altMap[$src])) self::$altMap[$src] = $alt;
            }
        }
    }

    /**
     * Legacy URLs → { targetPath (site-relative, dir form) => [legacy paths] },
     * read from the 301 map in the frontend's own .htaccess (the single source
     * of truth for redirects — there are no redirect stub files any more).
     */
    private static function legacyPaths(): array
    {
        $out = [];
        $ht = AV_SITE_DIR . '/.htaccess';
        if (!is_file($ht)) return $out;
        foreach (preg_split('/\r?\n/', (string)file_get_contents($ht)) as $line) {
            if (!preg_match('/^\s*RewriteRule\s+\^(\S+?)\$\s+(\S+)\s+\[[^\]]*R=301[^\]]*\]/', $line, $m)) continue;
            $from = preg_replace('#/\?$#', '', $m[1]);          // drop optional trailing slash
            $from = str_replace(['\\.', '\\-'], ['.', '-'], $from); // unescape regex literals
            if (preg_match('/[\[\](){}*+?|]/', $from)) continue;  // skip real patterns
            $target = ltrim(preg_replace('#^https?://[^/]+#', '', $m[2]), '/');
            $target = preg_replace('#index\.html$#', '', $target);
            if ($target !== '' && !str_ends_with($target, '/') && !str_ends_with($target, '.html')) $target .= '/';
            $out[$target][] = $from;
        }
        return $out;
    }

    /* ============================================================
       SMALL UTILITIES
       ============================================================ */

    private static function rel(string $abs): string
    {
        return ltrim(str_replace('\\', '/', substr($abs, strlen(AV_SITE_DIR))), '/');
    }

    /** resolve an href/src found in $file to a site-relative path ('' when external). */
    private static function siteRel(string $file, string $ref): string
    {
        $ref = preg_replace('#^https?://(www\.)?abhijeetvarghese\.com/#i', '/', trim($ref));
        if ($ref === '' || preg_match('#^(https?:|data:|mailto:|tel:|//)#i', $ref)) return '';
        $path = (string)parse_url($ref, PHP_URL_PATH);
        if ($path === '') return '';
        if (str_starts_with($path, '/')) $abs = AV_SITE_DIR . $path;
        else $abs = dirname($file) . '/' . $path;
        $parts = [];
        foreach (explode('/', str_replace('\\', '/', $abs)) as $seg) {
            if ($seg === '..') array_pop($parts); elseif ($seg !== '.' && $seg !== '') $parts[] = $seg;
        }
        $abs = '/' . implode('/', $parts);
        if (!str_starts_with($abs, rtrim(AV_SITE_DIR, '/') . '/')) return '';
        return self::rel($abs);
    }

    /** Media reference used by the CMS: assets/<x> → media/<x> (served by /media/ → uploads → site assets). */
    private static function mediaRef(string $ref): string
    {
        if ($ref === '') return '';
        $r = preg_replace('#^https?://(www\.)?abhijeetvarghese\.com/#i', '', trim($ref));
        $r = (string)parse_url($r, PHP_URL_PATH);
        $r = ltrim($r, '/');
        $r = preg_replace('#^(\.\./)+#', '', $r);
        if (str_starts_with($r, 'assets/')) return 'media/' . substr($r, 7);
        if (str_starts_with($r, 'media/')) return $r;
        return $r;   // case-study local assets keep their site path
    }

    private static function normUrl(string $u): string
    {
        $u = ltrim(trim($u), '/');
        $u = preg_replace('#^https?://[^/]+/#', '', $u);
        return preg_replace('#index\.html$#', '', $u);
    }

    private static function slugFromHref(string $href): string
    {
        $p = self::normUrl((string)parse_url($href, PHP_URL_PATH));
        if ($p === '' || $p === 'index.html') return 'home';
        $p = preg_replace('#\.html$#', '', rtrim($p, '/'));
        return $p === '' ? 'home' : $p;
    }

    private static function caseSlug(string $href): string
    {
        return preg_match('#case-studies/([a-z0-9-]+)/?#i', $href, $m) ? mb_strtolower($m[1]) : '';
    }

    private static function titleFromHead(string $title, string $h1): string
    {
        if ($title === '') return $h1;
        $t = preg_split('/\s+[—|–-]\s+/u', $title)[0] ?? $title;
        return self::clean($t) ?: $h1;
    }

    /** "Design · 6 min" → [Design, 6 min] */
    private static function splitTag(string $tag, string $type): array
    {
        if ($tag === '') return ['', ''];
        $parts = array_map('trim', preg_split('/\s*[·•|]\s*/u', $tag));
        $cat = $parts[0] ?? '';
        $rt = '';
        foreach ($parts as $p) if (preg_match('/\d+\s*min/i', $p)) $rt = $p;
        if (mb_strtolower($cat) === $type) $cat = ucfirst($type);
        return [$cat, $rt];
    }

    private static function prettyPhone(string $raw, string $old): string
    {
        $digits = preg_replace('/\D+/', '', $raw);
        if ($old !== '' && preg_replace('/\D+/', '', $old) === $digits) return $old;   // same number → keep editor's formatting
        return str_starts_with($raw, '+') ? $raw : '+' . $digits;
    }

    private static function mediaFolder(string $rel): string
    {
        $dir = dirname($rel);
        if ($dir !== '.') return ucwords(str_replace(['-', '_', '/'], ' ', $dir));
        $n = mb_strtolower(basename($rel));
        return match (true) {
            str_starts_with($n, 'hero') => 'Hero',
            str_starts_with($n, 'case-') => 'Case Studies',
            str_starts_with($n, 'essay-') => 'Essays',
            str_starts_with($n, 'journal-') => 'Journal',
            str_ends_with($n, '.pdf') => 'Documents',
            str_ends_with($n, '.woff2') || str_ends_with($n, '.woff') => 'Fonts',
            default => 'Site',
        };
    }

    private static function humanSize(int $b): string
    {
        if ($b >= 1048576) return round($b / 1048576, 1) . ' MB';
        if ($b >= 1024) return round($b / 1024) . ' KB';
        return $b . ' B';
    }

    private static function slugify(string $s): string
    {
        $s = mb_strtolower(trim($s));
        $s = preg_replace('/[^a-z0-9]+/u', '-', $s);
        return trim($s, '-') ?: 'item';
    }

    private static function clean(string $s): string
    {
        $s = html_entity_decode($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $s = preg_replace('/[ \t\r\n\x{00A0}]+/u', ' ', $s);
        return trim($s);
    }

    /** Stamp `updated`: keep the old timestamp when nothing but `updated` differs. */
    private static function stamp(array $new, array $old): array
    {
        $a = $new; $b = $old;
        unset($a['updated'], $b['updated']);
        if ($old && self::canon($a) === self::canon($b)) { $new['updated'] = $old['updated'] ?? self::$now; return $new; }
        $new['updated'] = self::$now;
        return $new;
    }

    private static function canon($v): string
    {
        return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
