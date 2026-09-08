<?php
/**
 * AV OS — Route Registry (single source of truth for public URLs).
 *
 * The RouteRegistry derives ONE canonical route per public entity (page,
 * project/case-study, article) from the content model. The publisher,
 * sitemap, canonical/OG/JSON-LD tags, internal links, breadcrumbs, redirects
 * and the route manifest all read from this class — URLs are never maintained
 * by hand inside individual templates.
 *
 * Canonical policy (matches the current frontend + hosting on Apache/mod_dir):
 *   - Every indexable public page lives at a trailing-slash DIRECTORY url and
 *     is written to `<dir>/index.html`:
 *         Home          /
 *         Story         /story/
 *         Experience    /experience/
 *         Portfolio     /portfolio/
 *         Case studies  /case-studies/
 *         Recruiters    /for-recruiters/
 *         Contact       /contact/
 *         ...
 *     Case studies   /case-studies/<project-slug>/
 *     Essays         /essays/<slug>/
 *     Journal posts  /journal/<slug>/
 *   - Legacy flat URLs (e.g. /portfolio.html, /case-study-foo.html,
 *     /experience.html) are emitted as automatic 301 redirects to the
 *     canonical route — never as independent pages.
 *
 * The class is read-only and side-effect free; it computes routes and
 * validates the route map. Writing files is the publisher's job.
 */
final class RouteRegistry
{
    /** Reserved top-level path segments no content item may claim. */
    public const RESERVED = [
        '', 'index', 'home', 'admin', 'api', 'install', 'media', 'assets',
        'css', 'js', 'storage', '404', 'search', 'sitemap', 'robots',
        // primary sections
        'portfolio', 'experience', 'case-studies', 'story', 'about',
        'contact', 'consulting', 'for-recruiters', 'insights', 'journal',
        'blog', 'essays', 'privacy-policy', 'terms',
    ];

    /**
     * Build the canonical route table for the whole site.
     *
     * @return array<int,array{id:string,type:string,slug:string,canonical:string,
     *   output:string,template:?string,title:string,index:bool,redirects:array<int,array{from:string,to:string,code:int}>}>
     */
    public static function build(array $site, callable $isDue): array
    {
        $routes = [];

        // ---- Home --------------------------------------------------------
        $routes[] = self::mk('home', 'page', '', '/', 'index.html', null, 'Home', false, []);

        // ---- Pages -------------------------------------------------------
        foreach (($site['pages'] ?? []) as $p) {
            if (!$isDue($p)) continue;
            $slug = (string)($p['slug'] ?? '');
            if ($slug === '' || $slug === 'home' || $slug === 'index') continue;
            $canonical = '/' . trim($slug, '/') . '/';
            $routes[] = self::mk(
                (string)($p['id'] ?? $slug), 'page', $slug, $canonical,
                $slug . '/index.html', (string)($p['template'] ?? 'Page'),
                (string)($p['title'] ?? $slug), true,
                self::pageRedirects($slug)
            );
        }

        // ---- Case studies ------------------------------------------------
        foreach (($site['projects'] ?? []) as $p) {
            if (!$isDue($p) || ($p['status'] ?? 'published') !== 'published') continue;
            $slug = self::projectSlug($p);
            if ($slug === '') continue;
            $canonical = '/case-studies/' . $slug . '/';
            $legacy = self::projectRedirects($p, $slug);
            $routes[] = self::mk(
                (string)($p['id'] ?? $slug), 'project', $slug, $canonical,
                'case-studies/' . $slug . '/index.html',
                (string)(TemplateRegistry::resolveProjectKey($p)),
                (string)($p['title'] ?? $slug), false, $legacy
            );
        }

        // ---- Articles (essays + journal posts) ---------------------------
        foreach (($site['articles'] ?? []) as $a) {
            if (!$isDue($a)) continue;
            $slug = (string)($a['slug'] ?? '');
            if ($slug === '') $slug = self::slugify((string)($a['title'] ?? ''));
            if ($slug === '') continue;
            $isEssay = (($a['type'] ?? 'essay') === 'essay');
            $section = $isEssay ? 'essays' : 'journal';
            $canonical = '/' . $section . '/' . $slug . '/';
            $oldPrefix = $isEssay ? 'essay-' : 'journal-';
            $routes[] = self::mk(
                (string)($a['id'] ?? $slug), 'article', $slug, $canonical,
                $section . '/' . $slug . '/index.html', null,
                (string)($a['title'] ?? $slug), true,
                [['from' => '/' . $oldPrefix . $slug . '.html', 'to' => $canonical, 'code' => 301]]
            );
        }

        return $routes;
    }

    /* ---------------- route primitives ---------------- */

    private static function mk(string $id, string $type, string $slug, string $canonical,
        string $output, ?string $template, string $title, bool $index, array $redirects): array
    {
        return [
            'id' => $id, 'type' => $type, 'slug' => $slug, 'canonical' => $canonical,
            'output' => $output, 'template' => $template, 'title' => $title,
            'index' => $index, 'redirects' => $redirects,
        ];
    }

    /**
     * Legacy redirects for a root page: only the flat `.html` form.
     * The bare no-slash form (`/portfolio`) is normalised to the trailing-slash
     * canonical by Apache mod_dir (and the dev router) automatically, so we do
     * NOT emit a stub at `<slug>/index.html` — that path IS the canonical page.
     */
    private static function pageRedirects(string $slug): array
    {
        return [
            ['from' => '/' . $slug . '.html', 'to' => '/' . $slug . '/', 'code' => 301],
        ];
    }

    /**
     * Canonical project slug. Prefers an existing clean slug, then the
     * frontend-established case-study directory slug (by id), else a slugified
     * title. Existing production slugs are preserved.
     */
    public static function projectSlug(array $p): string
    {
        // explicit clean case-study directory slug if the editor set one
        $clean = trim((string)($p['caseStudySlug'] ?? ''), '/');
        if ($clean !== '' && !str_contains($clean, '..')) return self::slugify(basename($clean));
        // established frontend canonical dirs (preserve existing URLs)
        $known = [
            'prj-1' => 'orange-business',
            'prj-2' => 'bharat-petroleum-corporation-limited',
            'prj-3' => 'indian-army',
        ];
        if (isset($known[$p['id'] ?? ''])) return $known[$p['id']];
        // a custom legacy path that points INTO case-studies/ already
        $custom = trim((string)($p['caseStudyPath'] ?? ''), '/');
        if ($custom !== '' && preg_match('#^case-studies/([^/]+)/?$#', $custom, $mm)) {
            return self::slugify($mm[1]);
        }
        if (!empty($p['slug'])) return self::slugify((string)$p['slug']);
        return self::slugify((string)($p['title'] ?? $p['id'] ?? 'project'));
    }

    /** Legacy URLs that must 301 to a case study's canonical clean route. */
    private static function projectRedirects(array $p, string $canonicalSlug): array
    {
        $canonical = '/case-studies/' . $canonicalSlug . '/';
        $out = [];
        $seen = [];
        $add = function (string $from) use (&$out, &$seen, $canonical) {
            $from = '/' . ltrim(trim($from), '/');
            if ($from === $canonical || isset($seen[$from])) return;
            if (str_contains($from, '..') || $from === '/') return;
            $seen[$from] = true;
            $out[] = ['from' => $from, 'to' => $canonical, 'code' => 301];
        };

        // old flat case-study-*.html files (derive from title slug + id fallbacks)
        $titleSlug = self::slugify((string)($p['title'] ?? ''));
        if ($titleSlug !== '') $add('case-study-' . $titleSlug . '.html');
        // any editor-declared legacy paths
        foreach ((array)($p['legacyPaths'] ?? []) as $legacy) {
            $legacy = ltrim(trim((string)$legacy), '/');
            if ($legacy === '' || str_contains($legacy, '..')) continue;
            $add(str_ends_with($legacy, '/') ? $legacy . 'index.html' : $legacy);
            // directory form of a legacy dir path
            if (str_ends_with($legacy, '/')) $add(rtrim($legacy, '/'));
        }
        // prj-1 historically lived under /experience-design/...
        if (($p['id'] ?? '') === 'prj-1') {
            $add('case-study-enterprise-technology-made-understandable.html');
            $add('experience-design/orange-business-executive-briefing-center/');
            $add('experience-design/orange-business-executive-briefing-center/index.html');
        }
        return $out;
    }

    /* ---------------- URL helpers used by the publisher ---------------- */

    /** Normalise a title/name into a safe, reserved-aware slug. */
    public static function slugify(string $s): string
    {
        $s = strtolower(trim($s));
        $s = preg_replace('/[^a-z0-9]+/', '-', $s);
        return trim((string)$s, '-');
    }

    /** Absolute canonical URL for a route path (path is like "/portfolio/"). */
    public static function absolute(string $siteUrl, string $canonicalPath): string
    {
        return rtrim($siteUrl, '/') . $canonicalPath;
    }

    /**
     * Resolve an internal href found in rendered content to its canonical
     * root-relative route. Returns the href unchanged when it is not an
     * internal page link (external, anchor, mailto/tel, asset, etc.).
     *
     * @param array<string,string> $map lowercase legacy/current href => canonical path
     */
    public static function resolveInternalHref(string $href, array $map): string
    {
        $h = trim($href);
        if ($h === '' ) return $href;
        if (str_starts_with($h, '//') || preg_match('#^[a-z][a-z0-9+.-]*:#i', $h)) return $href; // absolute/mailto/tel/protocol-relative
        if ($h[0] === '#' || $h[0] === '/') return $href;               // anchor / already root-relative
        // strip any in-page fragment for lookup, keep it for output
        $frag = '';
        $base = $h;
        if (($q = strpos($h, '#')) !== false) { $frag = substr($h, $q); $base = substr($h, 0, $q); }
        $key = strtolower(rtrim($base, '/'));
        $keyNoExt = preg_replace('#\.html?$#', '', $key);
        if (isset($map[$key]))      return $map[$key] . $frag;
        if (isset($map[$keyNoExt])) return $map[$keyNoExt] . $frag;
        return $href;
    }

    /**
     * Build a lookup map of every known internal href (flat .html, no-ext,
     * directory) → canonical root-relative path. Used by resolveInternalHref().
     *
     * @return array<string,string>
     */
    public static function hrefMap(array $routes): array
    {
        $map = [];
        foreach ($routes as $r) {
            $canonical = $r['canonical'];
            // index by canonical directory (no trailing slash) and with slash
            $noSlash = rtrim($canonical, '/');
            if ($noSlash !== '') {
                $map[strtolower($noSlash)] = $canonical;
                $map[strtolower($noSlash . '.html')] = $canonical;
            }
            // index by output filename form too (portfolio/index.html style ignored)
            // legacy flat forms
            foreach ($r['redirects'] as $rd) {
                $from = ltrim($rd['from'], '/');
                $map[strtolower(rtrim($from, '/'))] = $rd['to'];
                $map[strtolower(preg_replace('#\.html?$#', '', $from))] = $rd['to'];
            }
        }
        // special: root/home
        $map['index.html'] = '/';
        $map['index'] = '/';
        $map[''] = '/';
        return $map;
    }

    /* ---------------- validation ---------------- */

    /**
     * Validate the route map. Returns a list of human-readable errors
     * (duplicates, shadowed routes, a redirect pointing at a missing route,
     * a redirect loop/chain, or a reserved-route claim). Empty = valid.
     */
    public static function validate(array $routes): array
    {
        $errors = [];
        $byCanonical = [];
        $byOutput = [];
        $canonSet = [];
        foreach ($routes as $r) {
            $canonSet[$r['canonical']] = true;
        }
        // A redirect stub must never share an output file with a canonical page.
        foreach ($routes as $r) {
            foreach ($r['redirects'] as $rd) {
                $from = ltrim($rd['from'], '/');
                $stubOut = (str_ends_with($from, '.html')) ? $from : $from . '/index.html';
                foreach ($routes as $other) {
                    if ($other['output'] === $stubOut) {
                        $errors[] = "redirect \"{$rd['from']}\" would overwrite canonical route \"{$other['canonical']}\" (both write $stubOut)";
                    }
                }
            }
        }
        foreach ($routes as $r) {
            $c = $r['canonical'];
            if (isset($byCanonical[$c])) {
                $errors[] = "duplicate canonical route \"$c\" ({$r['type']} {$r['id']} collides with {$byCanonical[$c]})";
            }
            $byCanonical[$c] = $r['id'];
            if (isset($byOutput[$r['output']])) {
                $errors[] = "duplicate output path \"{$r['output']}\" ({$r['id']} vs {$byOutput[$r['output']]})";
            }
            $byOutput[$r['output']] = $r['id'];

            // reserved top-level claim by a non-section content item
            $seg = trim($c, '/');
            $top = explode('/', $seg)[0];
            if ($r['type'] === 'page' && in_array($top, ['admin','api','install','storage','css','js','assets','media'], true)) {
                $errors[] = "page \"{$r['id']}\" claims reserved route \"$c\"";
            }

            // redirect integrity: target must exist, must not loop/chain
            foreach ($r['redirects'] as $rd) {
                $to = $rd['to'];
                if (!isset($canonSet[$to])) {
                    $errors[] = "redirect \"{$rd['from']}\" targets missing route \"$to\" ({$r['id']})";
                }
                if ($rd['from'] === $to) {
                    $errors[] = "redirect loop on \"$to\" ({$r['id']})";
                }
            }
        }
        // redirect shadowing: a redirect 'from' equals another route's canonical
        foreach ($routes as $r) {
            foreach ($r['redirects'] as $rd) {
                if (isset($byCanonical[$rd['from']]) && $rd['from'] !== $r['canonical']) {
                    $errors[] = "redirect \"{$rd['from']}\" shadows an existing canonical route";
                }
            }
        }
        return $errors;
    }

    /** Machine-readable manifest written to routes.json at publish. */
    public static function manifest(array $routes, string $siteUrl): array
    {
        $out = [];
        foreach ($routes as $r) {
            $out[] = [
                'id'           => $r['id'],
                'type'         => $r['type'],
                'template'     => $r['template'],
                'route'        => $r['canonical'],
                'url'          => self::absolute($siteUrl, $r['canonical']),
                'output'       => $r['output'],
                'title'        => $r['title'],
                'redirects'    => $r['redirects'],
            ];
        }
        return ['generated_at' => date('c'), 'site' => $siteUrl, 'routes' => $out];
    }
}
