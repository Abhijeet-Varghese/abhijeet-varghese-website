<?php
/**
 * AV OS — PublishEngine
 * Regenerates the static public site from the content store (MySQL).
 * Templates mirror the approved frontend design exactly (1:1 port of the
 * design system); content flows from the store, presentation stays fixed.
 * Atomic: writes to a staging dir, then swaps in place.
 */

final class PublishEngine
{
    private array $site;
    private string $out;
    private ?string $assetVersion = null;

    public function __construct(array $site)
    {
        $this->site = $site;
        $this->out = AV_SITE_OUT;
        if (!is_dir($this->out)) mkdir($this->out, 0775, true);
    }

    /* ---------- helpers ---------- */
    private function esc(mixed $v): string
    {
        return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8');
    }

    /** safe array access for heredoc interpolation (?? not allowed there) */
    private function v(array $arr, ...$path): mixed
    {
        $default = array_pop($path);
        $cur = $arr;
        foreach ($path as $k) {
            if (!is_array($cur) || !array_key_exists($k, $cur)) return $default;
            $cur = $cur[$k];
        }
        return $cur;
    }

    private function media(string $src): string
    {
        return str_starts_with($src, 'media/') ? 'assets/' . substr($src, 6) : $src;
    }

    /** Reserve intrinsic image space from the canonical template asset to prevent CLS. */
    private function imageSizeAttrs(string $publicSrc): string
    {
        $path = parse_url($publicSrc, PHP_URL_PATH) ?: $publicSrc;
        $file = AV_TEMPLATE . '/' . ltrim($path, '/');
        if (!is_file($file)) return '';
        $size = @getimagesize($file);
        if (!$size || empty($size[0]) || empty($size[1])) return '';
        return ' width="' . (int)$size[0] . '" height="' . (int)$size[1] . '"';
    }

    /** Prefix document-relative public links when rendering a nested clean URL. */
    private function prefixedHref(string $href, string $prefix = ''): string
    {
        if ($prefix === '' || $href === '' || str_starts_with($href, '#') || str_starts_with($href, '/') || str_starts_with($href, '//')) return $href;
        if (preg_match('#^[a-z][a-z0-9+.-]*:#i', $href)) return $href;
        return $prefix . $href;
    }

    private function slugify(string $s): string
    {
        $s = strtolower(trim($s));
        $s = preg_replace('/[^a-z0-9]+/', '-', $s);
        return trim($s, '-');
    }

    private const ARROW = '<svg class="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" stroke-width="1.6"/></svg>';

    private const SOCIAL_ICONS = [
        'LinkedIn' => '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>',
        'Instagram' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.2"/><circle cx="12" cy="12" r="4.4"/><circle cx="17.6" cy="6.4" r="1.15" fill="currentColor" stroke="none"/></svg>',
        'WhatsApp' => '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
        'YouTube' => '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
        'Behance' => '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.69 4.154c1.583 0 2.778.403 3.593 1.21.814.806 1.222 1.9 1.222 3.283 0 .888-.195 1.646-.585 2.273-.39.627-.994 1.156-1.812 1.585 1.094.35 1.9.91 2.42 1.682.52.77.78 1.68.78 2.73 0 1.5-.52 2.71-1.56 3.63-1.04.92-2.43 1.38-4.17 1.38H0V4.154h7.69zm-.42 6.19c.91 0 1.61-.23 2.1-.69.49-.46.73-1.1.73-1.92 0-.84-.24-1.47-.73-1.9-.49-.43-1.18-.64-2.1-.64H3.71v5.15h3.56zm.3 7.05c.98 0 1.74-.24 2.28-.73.54-.48.81-1.18.81-2.09 0-.88-.27-1.56-.82-2.04-.55-.48-1.3-.72-2.27-.72H3.71v5.58h3.86zM22.5 17.05c-.62.6-1.52.9-2.7.9-.85 0-1.56-.22-2.13-.65-.57-.44-.9-.98-1-1.64h4.95c.1-.98-.06-1.84-.44-2.55a4.3 4.3 0 00-1.76-1.64c-.77-.39-1.72-.58-2.86-.58-1.3 0-2.43.33-3.38.98a6.58 6.58 0 00-2.16 2.68c-.5 1.12-.75 2.4-.75 3.83 0 1.34.27 2.51.82 3.52.55 1 1.33 1.78 2.35 2.32 1.02.55 2.19.82 3.52.82.9 0 1.76-.14 2.58-.43a6.4 6.4 0 002.2-1.34c.64-.6 1.13-1.34 1.47-2.2h-4.3c-.09.52-.35.9-.78 1.16-.43.26-.9.38-1.4.38-.8 0-1.4-.24-1.8-.72-.4-.48-.6-1.06-.6-1.75h9.12c0-1.52-.3-2.84-.88-3.94-.6-1.1-1.4-1.96-2.43-2.58-1.02-.62-2.14-.93-3.36-.93-1.44 0-2.74.33-3.9.98a7.31 7.31 0 00-2.6 2.62c-.63 1.1-.95 2.33-.95 3.7 0 1.42.34 2.7 1.01 3.84.67 1.13 1.62 2.02 2.83 2.66a8.02 8.02 0 003.78.94c.99 0 1.94-.16 2.86-.47a7.36 7.36 0 002.6-1.5c.77-.7 1.35-1.54 1.74-2.5h-4.18c-.1.74-.4 1.3-.9 1.7zM18.21 8.55h-6.2v-1.9h6.2v1.9z"/></svg>',
    ];

    private function socialIcon(string $label): string
    {
        return self::SOCIAL_ICONS[$label] ?? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>';
    }

    /* ---------- head + shell ---------- */
    private function assetVersion(): string
    {
        if ($this->assetVersion !== null) return $this->assetVersion;
        $ctx = hash_init('sha256');
        $files = [];
        foreach (['css', 'js'] as $part) {
            $root = AV_TEMPLATE . '/' . $part;
            if (!is_dir($root)) continue;
            $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
            foreach ($it as $file) {
                if (!$file->isFile()) continue;
                $files[] = $file->getPathname();
            }
        }
        sort($files, SORT_STRING);
        foreach ($files as $file) {
            hash_update($ctx, str_replace(AV_TEMPLATE, '', $file));
            hash_update_file($ctx, $file);
        }
        return $this->assetVersion = AV_VERSION . '-' . substr(hash_final($ctx), 0, 12);
    }

    private function head(array $s, string $title, string $desc, string $file, string $type = 'website', ?string $image = null): string
    {
        $siteUrl = rtrim(AV_SITE_URL, '/');
        $canonicalUrl = $siteUrl . ($file === 'index.html' ? '/' : '/' . ltrim($file, '/'));
        $favicon = $this->media($s['favicon'] ?? 'media/logo.png');
        $ogImage = $image ?: $this->media($s['ogImage'] ?? 'media/hero-portrait.webp');
        $metaDesc = $desc ?: $this->v($s, 'metaDescription', '');
        $cacheBust = $this->assetVersion();
        $lcpPreload = ($file === 'index.html' || $type === 'article')
            ? '  <link rel="preload" href="' . $this->esc($ogImage) . '" as="image" fetchpriority="high">'
            : '';
        return <<<HTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{$this->esc($title)}</title>
  <meta name="description" content="{$this->esc($metaDesc)}">
  <meta name="keywords" content="{$this->esc($this->v($s, 'keywords', ''))}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#F7F5EF">
  <link rel="canonical" href="{$this->esc($canonicalUrl)}">
  <!-- LCP font preload (Inter Tight normal — body copy above the fold) -->
  <link rel="preload" href="assets/fonts/inter-tight-normal.woff2" as="font" type="font/woff2" crossorigin>
{$lcpPreload}
  <meta property="og:type" content="{$type}">
  <meta property="og:url" content="{$this->esc($canonicalUrl)}">
  <meta property="og:site_name" content="{$this->esc($this->v($s, 'siteName', 'Abhijeet Varghese'))}">
  <meta property="og:title" content="{$this->esc($title)}">
  <meta property="og:description" content="{$this->esc($metaDesc)}">
  <meta property="og:image" content="{$siteUrl}/{$ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{$this->esc($title)}">
  <meta name="twitter:description" content="{$this->esc($metaDesc)}">
  <meta name="twitter:image" content="{$siteUrl}/{$ogImage}">
  <link rel="icon" type="image/png" href="{$this->esc($favicon)}">
  <link rel="stylesheet" href="css/styles.css?v={$cacheBust}">
  <script>
    document.documentElement.className += " js";
    setTimeout(function () {
      document.documentElement.className += " reveal-failsafe";
    }, 2600);
  </script>
HTML;
    }

    private function chrome(array $s, array $nav, ?string $active, string $prefix = ''): string
    {
        // `cta: true` items are rendered as the styled button below, not as list links
        $primary = array_filter($nav['primary'] ?? [], fn($l) => empty($l['hidden']) && empty($l['cta']));
        $lis = [];
        $currentMarked = false;
        foreach ($primary as $l) {
            $isCurrent = !$currentMarked && (($l['page'] ?? '') === $active);
            $cur = $isCurrent ? ' aria-current="page"' : '';
            if ($isCurrent) $currentMarked = true;
            $lis[] = '        <li><a href="' . $this->esc($this->prefixedHref((string)$l['href'], $prefix)) . '"' . $cur . '>' . $this->esc($l['label']) . '</a></li>';
        }
        $mlis = [];
        foreach (array_values($primary) as $i => $l) {
            $mlis[] = '          <li><a href="' . $this->esc($this->prefixedHref((string)$l['href'], $prefix)) . '"><em>' . str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT) . '</em>' . $this->esc($l['label']) . '</a></li>';
        }
        $logo = $this->prefixedHref($this->media($s['logo'] ?? 'media/logo.png'), $prefix);
        $name = $s['siteName'] ?? 'Abhijeet Varghese';
        $homeHref = $this->prefixedHref('index.html', $prefix);
        $contactHref = $this->prefixedHref('contact.html', $prefix);
        return <<<HTML
  <header class="site-nav" id="siteNav">
    <nav class="site-nav__inner" aria-label="Primary">
      <a class="brand" href="{$this->esc($homeHref)}" aria-label="{$this->esc($name)} — home">
        <img class="brand__logo" src="{$this->esc($logo)}" alt="{$this->esc($name)} logo" width="36" height="36" decoding="async">
        <span class="brand__name">{$this->esc($name)}</span>
      </a>
      <ul class="nav-links">
{$this->join($lis)}
      </ul>
      <a class="btn btn--accent btn--small" href="{$this->esc($contactHref)}">Start a conversation</a>
      <button class="nav-toggle" type="button" id="navToggle" aria-expanded="false" aria-controls="mobileMenu" aria-label="Open menu">
        <span class="nav-toggle__line" aria-hidden="true"></span>
        <span class="nav-toggle__line" aria-hidden="true"></span>
        <span class="nav-toggle__line" aria-hidden="true"></span>
      </button>
    </nav>
    <div class="mobile-menu" id="mobileMenu" role="dialog" aria-modal="true" aria-label="Site menu" hidden>
      <div class="mobile-menu__bar">
        <span class="mobile-menu__title">Menu</span>
        <button class="mobile-menu__close" type="button" id="mobileClose" aria-label="Close menu">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        </button>
      </div>
      <nav aria-label="Mobile">
        <ul class="mobile-menu__list">
{$this->join($mlis)}
        </ul>
        <div class="mobile-menu__actions">
          <a class="btn btn--accent btn--block" href="{$this->esc($contactHref)}">Start a conversation</a>
          <a class="mobile-menu__mail" href="mailto:{$this->esc($this->v($s, 'email', ''))}">{$this->esc($this->v($s, 'email', ''))}</a>
        </div>
      </nav>
    </div>
  </header>
HTML;
    }

    private function footer(array $s, array $nav, string $prefix = ''): string
    {
        $cols = [];
        foreach (($nav['footerColumns'] ?? []) as $c) {
            // The sitewide footer replaces the CMS "Social" link column with
            // the icon social column rendered below — one Social block only,
            // so the single-row footer stays: brand · Menu · Resources · Legal
            // + icon Social.
            if (strcasecmp(trim((string)($c['label'] ?? '')), 'Social') === 0) {
                continue;
            }
            $links = [];
            foreach (($c['links'] ?? []) as $l) {
                $ext = !empty($l['external']) ? ' target="_blank" rel="noopener"' : '';
                $links[] = '<li><a href="' . $this->esc($this->prefixedHref((string)$l['href'], $prefix)) . '"' . $ext . '>' . $this->esc($l['label']) . '</a></li>';
            }
            $cols[] = '      <div class="footer__col">
        <p class="footer__label">' . $this->esc($c['label']) . '</p>
        <ul class="footer__links">
          ' . $this->join($links) . '
        </ul>
      </div>';
        }
        $socials = [];
        foreach (($s['socials'] ?? []) as $x) {
            $socials[] = '<li><a href="' . $this->esc($x['href']) . '" target="_blank" rel="noopener">' . $this->socialIcon($x['label'] ?? '') . $this->esc($x['label'] ?? '') . '</a></li>';
        }
        $logo = $this->prefixedHref($this->media($s['logo'] ?? 'media/logo.png'), $prefix);
        $homeHref = $this->prefixedHref('index.html', $prefix);
        $siteName = $this->esc($this->v($s, 'siteName', 'Abhijeet Varghese'));
            return <<<HTML
  <footer class="footer footer--arena">
    <div class="container footer__inner">
      <div class="footer__brand">
        <a class="footer__brandtop" href="{$this->esc($homeHref)}" aria-label="{$this->esc($this->v($s, 'siteName', ''))} — home">
          <img class="brand__logo brand__logo--foot" src="{$this->esc($logo)}" alt="{$this->esc($this->v($s, 'siteName', ''))} logo" width="36" height="36" decoding="async">
          <span class="footer__name">{$this->esc($this->v($s, 'siteName', ''))}</span>
        </a>
        <p class="footer__line">{$this->esc($this->v($s, 'tagline', ''))}</p>
        <p class="footer__contact">
          <a href="mailto:{$this->esc($this->v($s, 'email', ''))}">{$this->esc($this->v($s, 'email', ''))}</a>
          <a href="tel:{$this->esc(preg_replace('/[^0-9+]/', '', $this->v($s, 'phone', '')))}">{$this->esc($this->v($s, 'phone', ''))}</a>
        </p>
        <p class="footer__avail"><span class="footer__avail-dot" aria-hidden="true"></span>{$this->esc($this->v($s, 'availability', 'Available for select projects — 2026'))}</p>
      </div>
{$this->join($cols)}
      <div class="footer__col">
        <p class="footer__label">Social</p>
        <ul class="footer__social">
{$this->join($socials)}
        </ul>
      </div>
      <div class="footer__bottom">
        <p class="footer__copy">{$this->esc($this->v($nav, 'copyright', '© 2026 Abhijeet Varghese. All Rights Reserved.'))}</p>
        <p class="footer__note">Built on AV OS · experience design, engineering &amp; creative leadership</p>
        <a class="footer__top" href="#top" aria-label="Back to top">↑<span>Back to top</span></a>
      </div>
    </div>
  </footer>
HTML;
    }

    private function join(array $rows): string
    {
        return implode("\n", $rows);
    }

    private function shell(array $s, array $nav, string $title, string $desc, string $file, string $body, ?string $active = null, string $type = 'website', ?string $image = null, ?string $jsonld = null, ?string $bodyClass = null): string
    {
        $ld = $jsonld ? '<script type="application/ld+json">' . $jsonld . '</script>' : '';
        $cacheBust = $this->assetVersion();
        // close button on inner pages (fixed position, returns home); the homepage has no need for it
        $close = ($active !== null && $active !== 'home' && $active !== '')
            ? "\n  <a class=\"page-close\" href=\"index.html\" data-history-close aria-label=\"Back to previous page\"><svg width=\"17\" height=\"17\" viewBox=\"0 0 18 18\" fill=\"none\" aria-hidden=\"true\"><path d=\"m3 3 12 12M15 3 3 15\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/></svg></a>"
            : '';
        $bc = $bodyClass ? ' class="' . $this->esc($bodyClass) . '"' : '';
        return $this->head($s, $title, $desc, $file, $type, $image) . "\n  {$ld}\n</head>\n<body id=\"top\"{$bc}>\n  <a class=\"skip-link\" href=\"#main\">Skip to content</a>\n  <div class=\"progress\" id=\"progress\" aria-hidden=\"true\"></div>\n" . $this->chrome($s, $nav, $active) . $close . "\n  <main id=\"main\">\n{$body}\n  </main>\n" . $this->footer($s, $nav) . "\n  <script src=\"js/main.js?v={$cacheBust}\" defer></script>\n</body>\n</html>\n";
    }

    /* ============ homepage sections ============ */
    private function secHero(array $sec, array $s): string
    {
        $name = $this->esc($this->v($s, 'siteName', 'Abhijeet Varghese'));
        $nameParts = explode(' ', $name, 2);
        $n1 = $this->esc($nameParts[0] ?? '');
        $n2 = $this->esc($nameParts[1] ?? '');
        $tagline = $this->esc($this->v($s, 'tagline', 'Making ambitious ideas impossible to misunderstand.'));
        $portrait = $this->media($sec['portrait'] ?? 'media/hero-portrait.webp');
        $roles = '';
        foreach (($sec['roles'] ?? []) as $r) $roles .= '<span class="hero__roles-item">' . $this->esc($r) . '</span>';
        $mq = '';
        foreach (($sec['marquee'] ?? []) as $m) $mq .= '<span>' . $this->esc($m) . '</span><span class="marquee__dot"></span>';
        $arrow = self::ARROW;
        $c1 = $sec['cta'] ?? [];
        $c2 = $sec['cta2'] ?? [];
        $lede = $this->esc($this->v($sec, 'lede', ''));
        $seoTitle = $this->esc(trim(strip_tags((string)($sec['title'] ?? ''))));
        return <<<HTML
    <section class="hp-hero t-dark" id="hero" data-theme="dark" aria-label="Introduction">
      <p class="hp-hero__seo">{$seoTitle}</p>
      <div class="hp-hero__glow" aria-hidden="true"></div>
      <div class="hp-hero__stage">
        <h1 class="hp-hero__name">
          <span class="hp-hero__name-line">{$n1}</span>
          <span class="hp-hero__name-line">{$n2}</span>
        </h1>
        <figure class="hp-hero__portrait">
          <img src="{$this->esc($portrait)}" alt="Editorial portrait of {$name}" width="1024" height="1024" fetchpriority="high" decoding="async">
          <span class="hp-hero__veil" aria-hidden="true"></span>
        </figure>
        <div class="hp-hero__copy">
          <p class="hp-hero__tagline">{$tagline}</p>
          <p class="hp-hero__roles">{$roles}</p>
          <div class="hp-hero__actions">
            <a class="btn btn--accent" href="{$this->esc($c1['href'] ?? 'case-studies.html')}">{$this->esc($c1['label'] ?? 'Explore my work')} {$arrow}</a>
            <a class="btn btn--ghost" href="{$this->esc($c2['href'] ?? 'assets/Abhijeet-Varghese-Resume.pdf')}" download>{$this->esc($c2['label'] ?? 'Download résumé')}</a>
          </div>
          <p class="hp-hero__avail"><span class="hp-hero__avail-dot" aria-hidden="true"></span>{$this->esc($this->v($s, 'availability', 'Available for select projects — 2026'))}</p>
        </div>
        <p class="hp-hero__lede" data-reveal>{$lede}</p>
        <div class="hp-hero__cue" aria-hidden="true"><span>Scroll</span><i></i></div>
      </div>
      <div class="hp-hero__marquee" aria-hidden="true"><div class="marquee__track">{$mq}{$mq}</div></div>
    </section>
HTML;
    }
    private function secClients(array $sec): string
    {
        $tiles = [];
        $clients = $this->site['clients'] ?? [];
        $ids = $sec['clientIds'] ?? [];
        // empty clientIds = show the full logo wall (all clients in order)
        if (!$ids) $ids = array_map(fn($c) => $c['id'] ?? '', $clients);
        $byId = [];
        foreach ($clients as $c) $byId[$c['id']] = $c;
        foreach ($ids as $id) {
            $c = $byId[$id] ?? null;
            if (!$c) continue;
            $tiles[] = '          <li class="logo-tile" data-reveal>' . (($c['logo'] ?? '') ? '<img src="assets/logos/' . $this->esc($c['logo']) . '" alt="' . $this->esc($c['name']) . '" width="160" height="48" loading="lazy" decoding="async">' : '<span style="font-weight:700;color:var(--cm);font-size:15px">' . $this->esc($c['name']) . '</span>') . '</li>';
        }
        return <<<HTML
    <section class="chapter clients t-light" id="clients">
      <div class="container">
        <header class="chapter__head chapter__head--split">
          <div>
            <div class="chapter__meta" data-reveal><span class="chapter__num">02</span><span class="chapter__rule"></span><span class="chapter__tag">{$this->esc($this->v($sec, 'kicker', 'Trust'))}</span></div>
            <h2 class="chapter__title" data-reveal>{$this->esc($this->v($sec, 'title', 'Experiences built for.'))}</h2>
          </div>
          <p class="chapter__lede" data-reveal>{$this->esc($this->v($sec, 'lede', ''))}</p>
        </header>
        <ul class="logo-wall" data-reveal-group aria-label="Selected clients">
{$this->join($tiles)}
        </ul>
        <p class="clients__note" data-reveal>{$this->esc($this->v($sec, 'note', ''))}</p>
      </div>
    </section>
HTML;
    }

    private function secCapabilities(array $sec): string
    {
        $items = [];
        foreach (($sec['items'] ?? []) as $i => $c) {
            $items[] = '          <article class="cap' . ($i === count($sec['items']) - 1 ? ' cap--feature' : '') . '" data-reveal>
            <div class="cap__index"><span class="cap__num">' . $this->esc($c['num'] ?? str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT)) . '</span></div>
            <h3>' . $this->esc($c['name'] ?? '') . '</h3>
            <p>' . $this->esc($c['body'] ?? '') . '</p>
          </article>';
        }
        $title2 = !empty($sec['title2']) ? '<em class="block-em">' . $sec['title2'] . '</em>' : '';
        return <<<HTML
    <section class="chapter capabilities t-dark" id="capabilities">
      <div class="container">
        <header class="chapter__head">
          <div class="chapter__meta" data-reveal><span class="chapter__num">03</span><span class="chapter__rule"></span><span class="chapter__tag">{$this->esc($this->v($sec, 'kicker', 'Capabilities'))}</span></div>
          <h2 class="chapter__title chapter__title--wide" data-reveal>{$this->esc($this->v($sec, 'title', ''))}{$title2}</h2>
        </header>
        <div class="cap-list">
{$this->join($items)}
        </div>
      </div>
    </section>
HTML;
    }

    private function secWork(array $sec): string
    {
        $arrow = self::ARROW;
        $cases = [];
        $projects = $this->site['projects'] ?? [];
        $byId = [];
        foreach ($projects as $p) $byId[$p['id']] = $p;
        foreach (($sec['projectIds'] ?? []) as $i => $id) {
            $p = $byId[$id] ?? null;
            if (!$p) continue;
            $img = $this->media($p['image'] ?? '');
            $imgAlt = (string)($p['imageAlt'] ?? (($p['client'] ?? '') . ' — ' . ($p['industry'] ?? '') . ' engagement'));
            $parallax = !empty($p['preserveFrame']) ? '0' : '0.05';
            $num = str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT);
            $cases[] = <<<HTML
        <article class="case" id="case-{$this->esc($p['id'])}">
          <figure class="case__panel" data-parallax="{$parallax}" data-reveal="img">
            <picture><img src="{$this->esc($img)}" alt="{$this->esc($imgAlt)}" width="1536" height="1024" loading="lazy" decoding="async"></picture>
            <figcaption class="case__card" data-reveal>
              <p class="case__kicker"><span>{$this->esc($this->v($p, 'industry', ''))}</span><span class="case__client">{$this->esc($this->v($p, 'client', ''))}</span></p>
              <h2 class="case__title">{$this->esc($this->v($p, 'title', ''))}</h2>
              <a class="case__card-cta" href="{$this->esc($this->caseStudyFile($p))}">Explore case study {$arrow}</a>
            </figcaption>
          </figure>
          <dl class="case__meta case__meta--row" data-reveal-group>
            <div data-reveal><dt>Problem</dt><dd>{$this->esc($this->v($p, 'challenge', ''))}</dd></div>
            <div data-reveal><dt>Approach</dt><dd>{$this->esc($this->v($p, 'approach', ''))}</dd></div>
            <div data-reveal><dt>Role</dt><dd>{$this->esc($this->v($p, 'role', ''))}</dd></div>
            <div data-reveal><dt>Outcome</dt><dd>{$this->esc($this->v($p, 'outcome', ''))}</dd></div>
          </dl>
        </article>
HTML;
        }
        return <<<HTML
    <section class="chapter work t-light" id="work">
      <div class="container">
        <header class="chapter__head chapter__head--split">
          <div>
            <div class="chapter__meta" data-reveal><span class="chapter__num">04</span><span class="chapter__rule"></span><span class="chapter__tag">{$this->esc($this->v($sec, 'kicker', 'Featured work'))}</span></div>
            <h2 class="chapter__title" data-reveal>{$this->esc($this->v($sec, 'title', ''))}</h2>
          </div>
          <p class="chapter__lede" data-reveal>{$this->esc($this->v($sec, 'lede', ''))}</p>
        </header>
{$this->join($cases)}
      </div>
    </section>
HTML;
    }

    private function secThinking(array $sec): string
    {
        $rows = [];
        $articles = $this->site['articles'] ?? [];
        $byId = [];
        foreach ($articles as $a) $byId[$a['id']] = $a;
        foreach (($sec['essayIds'] ?? []) as $i => $id) {
            $e = $byId[$id] ?? null;
            if (!$e) continue;
            if (!$this->isDue($e)) continue;   // never link drafts on the homepage
            $slug = $e['slug'] ?? $this->slugify($e['title'] ?? '');
            $rows[] = '<li><a class="essay" href="essay-' . $this->esc($slug) . '.html" data-reveal>
              <span class="essay__num">' . str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT) . '</span>
              <span class="essay__main"><span class="essay__title">' . $this->esc($e['title'] ?? '') . '</span><span class="essay__tag">' . $this->esc($e['category'] ?? 'Essay') . ' · ' . $this->esc($e['readTime'] ?? '') . '</span></span>
              <svg class="btn__arrow" width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" stroke-width="1.4"/></svg>
            </a></li>';
        }
        $img = $this->media($sec['image'] ?? '');
        $quote = $sec['quote'] ?? '';
        $qParts = explode('.', $quote, 2);
        $q1 = trim($qParts[0] ?? '');
        $q2 = trim($qParts[1] ?? '');
        return <<<HTML
    <section class="chapter thinking t-dark" id="thinking">
      <div class="container">
        <header class="chapter__head chapter__head--center">
          <div class="chapter__meta" data-reveal><span class="chapter__num">05</span><span class="chapter__rule"></span><span class="chapter__tag">{$this->esc($this->v($sec, 'kicker', 'Point of view'))}</span></div>
        </header>
        <blockquote class="thinking__quote" data-reveal>
          <p>“{$q1}.<br><em>{$q2}.”</em></p>
        </blockquote>
        <div class="thinking__lede" data-reveal><p>{$this->esc($this->v($sec, 'lede', ''))}</p></div>
        <ul class="essays" data-reveal-group>
{$this->join($rows)}
        </ul>
      </div>
      <figure class="thinking__media container-wide" data-parallax="0.04" data-reveal="img">
        <picture><img src="{$this->esc($img)}" alt="" width="1536" height="1024" loading="lazy" decoding="async"></picture>
        <figcaption>{$this->esc($this->v($sec, 'imageCaption', ''))}</figcaption>
      </figure>
    </section>
HTML;
    }

    private function secJourney(array $sec): string
    {
        $eras = [];
        foreach (($sec['eras'] ?? []) as $i => $e) {
            $eras[] = '            <li class="era' . (!empty($e['future']) ? ' era--future' : '') . '" data-reveal>
              <span class="era__index">' . str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT) . '</span>
              <h3 class="era__name">' . $this->esc($e['name'] ?? '') . '</h3>
              <span class="era__note">' . $this->esc($e['note'] ?? '') . '</span>
            </li>';
        }
        return <<<HTML
    <section class="journey t-light" id="journey">
      <div class="journey__pin" id="journeyPin">
        <header class="journey__head container">
          <div>
            <div class="chapter__meta" data-reveal><span class="chapter__num">06</span><span class="chapter__rule"></span><span class="chapter__tag">{$this->esc($this->v($sec, 'kicker', 'Journey'))}</span></div>
            <h2 class="chapter__title" data-reveal>{$this->esc($this->v($sec, 'title', ''))}</h2>
          </div>
          <p class="journey__hint" data-reveal>Keep scrolling — the years unfold sideways
            <svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true"><path d="M0 6h19M15 1l5 5-5 5" stroke="currentColor" stroke-width="1.3"/></svg>
          </p>
        </header>
        <div class="journey__viewport">
          <ol class="journey__track" id="journeyTrack">
{$this->join($eras)}
          </ol>
        </div>
        <div class="journey__barwrap container">
          <div class="journey__bar" aria-hidden="true"><span id="journeyBar"></span></div>
          <p class="journey__counter" aria-hidden="true"><em>Era</em> <span id="journeyBarNum">01 / 09</span></p>
        </div>
      </div>
    </section>
    <div class="coda t-light"><div class="container"><p class="journey__coda" data-reveal>{$this->esc($this->v($sec, 'coda', ''))}</p></div></div>
HTML;
    }

    private function secAi(array $sec): string
    {
        $img = $this->media($sec['image'] ?? '');
        $chips = '';
        foreach (($sec['chips'] ?? []) as $c) $chips .= '<li data-reveal>' . $this->esc($c) . '</li>';
        $projs = '';
        foreach (($sec['projects'] ?? []) as $p) $projs .= '<article class="ai-project" data-reveal><h3>' . $this->esc($p['name'] ?? '') . '</h3><p>' . $this->esc($p['body'] ?? '') . '</p></article>';
        return <<<HTML
    <section class="chapter ai t-dark" id="ai">
      <div class="container">
        <div class="ai__grid">
          <div class="ai__copy">
            <header class="chapter__head">
              <div class="chapter__meta" data-reveal><span class="chapter__num">07</span><span class="chapter__rule"></span><span class="chapter__tag">{$this->esc($this->v($sec, 'kicker', 'Method'))}</span></div>
              <h2 class="chapter__title" data-reveal>{$this->esc($this->v($sec, 'title', ''))}<em class="block-em">{$this->esc($this->v($sec, 'title2', ''))}</em></h2>
            </header>
            <div data-reveal-group>
              <p data-reveal>{$this->esc($this->v($sec, 'p1', ''))}</p>
              <p data-reveal>{$this->esc($this->v($sec, 'p2', ''))}</p>
            </div>
            <ul class="chip-list" data-reveal-group>{$chips}</ul>
            <div class="ai__projects" data-reveal-group>{$projs}</div>
            <p class="ai__motto" data-reveal>“{$this->esc($this->v($sec, 'motto', ''))}”</p>
          </div>
          <figure class="ai__media" data-parallax="0.05" data-reveal="img">
            <picture><img src="{$this->esc($img)}" alt="" width="1536" height="1024" loading="lazy" decoding="async"></picture>
            <figcaption>{$this->esc($this->v($sec, 'imageCaption', ''))}</figcaption>
          </figure>
        </div>
      </div>
    </section>
HTML;
    }

    private function secFocus(array $sec): string
    {
        $list = '';
        foreach (($sec['list'] ?? []) as $i => $l) $list .= '<li data-reveal><span class="focus__num">' . str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT) . '</span>' . $this->esc($l) . '</li>';
        $open = '';
        foreach (($sec['openTo'] ?? []) as $o) $open .= '<li data-reveal>' . $this->esc($o) . '</li>';
        return <<<HTML
    <section class="chapter focus t-light" id="focus">
      <div class="container">
        <header class="chapter__head chapter__head--split">
          <div>
            <div class="chapter__meta" data-reveal><span class="chapter__num">08</span><span class="chapter__rule"></span><span class="chapter__tag">{$this->esc($this->v($sec, 'kicker', 'Now'))}</span></div>
            <h2 class="chapter__title" data-reveal>{$this->esc($this->v($sec, 'title', ''))}</h2>
          </div>
          <p class="chapter__lede" data-reveal>{$this->esc($this->v($sec, 'lede', ''))}</p>
        </header>
        <div class="focus__grid">
          <ul class="focus__list" data-reveal-group>{$list}</ul>
          <div class="focus__open" data-reveal-group>
            <p class="label label--muted" data-reveal>{$this->esc($this->v($sec, 'openLabel', 'Open to'))}</p>
            <ul class="open__list">{$open}</ul>
            <p class="focus__note" data-reveal>{$this->esc($this->v($sec, 'note', ''))}</p>
          </div>
        </div>
      </div>
    </section>
HTML;
    }

    private function secContact(array $sec, array $s): string
    {
        $micro = [];
        foreach (($sec['micro'] ?? []) as $m) {
            $val = !empty($m['href'])
                ? '<a class="link-arrow link-arrow--micro" href="' . $this->esc($m['href']) . '">' . $this->esc($m['value']) . '</a>'
                : $this->esc($m['value']);
            $micro[] = '<li data-reveal><span>' . $this->esc($m['label'] ?? '') . '</span><strong>' . $val . '</strong></li>';
        }
        $socials = '';
        foreach (($s['socials'] ?? []) as $x) $socials .= '<li><a class="social-chip" href="' . $this->esc($x['href']) . '" target="_blank" rel="noopener">' . $this->socialIcon($x['label'] ?? '') . $this->esc($x['label'] ?? '') . '</a></li>';
        return <<<HTML
    <section class="chapter contact t-dark" id="contact">
      <div class="contact__glow" aria-hidden="true"></div>
      <div class="container">
        <div class="contact__grid">
          <div class="contact__intro">
            <div class="chapter__meta" data-reveal><span class="chapter__num">09</span><span class="chapter__rule"></span><span class="chapter__tag">{$this->esc($this->v($sec, 'kicker', 'Begin'))}</span></div>
            <h2 class="contact__title" data-reveal>{$this->esc($this->v($sec, 'title', ''))}</h2>
            <p class="chapter__lede" data-reveal>{$this->esc($this->v($sec, 'lede', ''))}</p>
            <ul class="contact__micro" data-reveal-group>
{$this->join($micro)}
            </ul>
            <div class="contact__social" data-reveal style="--d:.2s">
              <p class="label label--muted">Find me on</p>
              <ul class="social-row">
{$socials}
              </ul>
            </div>
          </div>
{$this->bookingCard()}
        </div>
      </div>
    </section>
HTML;
    }

    private function bookingCard(): string
    {
        $arrow = self::ARROW;
        return <<<HTML
          <div class="book" data-reveal>
            <header class="book__head">
              <p class="book__eyebrow">Reserve your time</p>
              <h2>Book an intro call</h2>
              <p class="book__head-sub">Video call · no agenda theatre · instant invite</p>
            </header>
            <div class="book__view" id="bookView">
              <form class="cf" id="contactForm" novalidate>
                <div class="cf-row">
                  <label>Your name<input type="text" id="cfName" name="name" autocomplete="name" placeholder="Full name" required></label>
                  <label>Email<input type="email" id="cfEmail" name="email" autocomplete="email" placeholder="you@company.com" required></label>
                </div>
                <label>Organization <span>(optional)</span><input type="text" id="cfOrg" name="organization" autocomplete="organization" placeholder="Company or institution"></label>
                <label>Anything I should know? <span>(optional)</span><textarea id="cfMsg" name="message" rows="3" placeholder="The challenge, the audience, what success looks like…"></textarea></label>
                <div class="pick pick--date">
                  <p class="pick__label">Pick a day</p>
                  <button class="date-trigger" type="button" id="dateTrigger" aria-expanded="false" aria-haspopup="dialog" aria-controls="datePop">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="12" rx="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 6.2h13M5.3 1v3M10.7 1v3" stroke="currentColor" stroke-width="1.3"/></svg>
                    <span id="dateTriggerText">Choose a date</span>
                    <svg class="date-trigger__chev" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="m1 1 5 5 5-5" stroke="currentColor" stroke-width="1.5"/></svg>
                  </button>
                  <div class="date-pop" id="datePop" hidden>
                    <div class="datepick">
                      <div class="datepick__head">
                        <button class="datepick__nav" type="button" id="dpPrev" aria-label="Previous month"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 2 4 8l6 6" stroke="currentColor" stroke-width="1.6"/></svg></button>
                        <p class="datepick__title" id="dpTitle" aria-live="polite">Month</p>
                        <button class="datepick__nav" type="button" id="dpNext" aria-label="Next month"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 2 6 6-6 6" stroke="currentColor" stroke-width="1.6"/></svg></button>
                      </div>
                      <div class="datepick__week" aria-hidden="true"><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span></div>
                      <div class="datepick__grid" id="dpGrid" role="grid" aria-label="Choose a date"></div>
                    </div>
                    <p class="date-pop__hint" id="datePopHint">Select a day to see available times</p>
                  </div>
                  <input type="hidden" id="cfDate" name="date">
                </div>
                <div class="pick">
                  <p class="pick__label">Pick a time <span>— IST</span></p>
                  <div class="tslots" id="tslots" role="radiogroup" aria-label="Preferred time">
                    <p class="tslots__group">Morning</p>
                    <div class="tslots__row">
                      <button type="button" class="tslot" role="radio" aria-checked="false" data-slot="09:30">09:30</button>
                      <button type="button" class="tslot" role="radio" aria-checked="false" data-slot="10:30">10:30</button>
                      <button type="button" class="tslot" role="radio" aria-checked="false" data-slot="12:00">12:00</button>
                    </div>
                    <p class="tslots__group">Afternoon</p>
                    <div class="tslots__row">
                      <button type="button" class="tslot" role="radio" aria-checked="false" data-slot="13:30">13:30</button>
                      <button type="button" class="tslot" role="radio" aria-checked="false" data-slot="15:00">15:00</button>
                      <button type="button" class="tslot" role="radio" aria-checked="false" data-slot="16:30">16:30</button>
                    </div>
                    <p class="tslots__group">Evening</p>
                    <div class="tslots__row">
                      <button type="button" class="tslot" role="radio" aria-checked="false" data-slot="18:00">18:00</button>
                      <button type="button" class="tslot" role="radio" aria-checked="false" data-slot="19:30">19:30</button>
                    </div>
                  </div>
                  <p class="pick__hint" id="slotHint">Times update with live availability.</p>
                </div>
                <p class="book__summary" id="bookSummary">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 4.5V8l2.4 1.6" stroke="currentColor" stroke-width="1.3"/></svg>
                  <span id="bookSummaryText">Pick a day and a time</span>
                </p>
                <button class="btn btn--accent btn--block" type="submit" id="bookSubmit">Send booking request {$arrow}</button>
                <p class="cf-note" id="cfNote" role="status" aria-live="polite">Your preferred time will be confirmed personally by email.</p>
              </form>
            </div>
            <div class="book__done" id="bookDone" hidden>
              <div class="done__check" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 26 26" fill="none"><path d="m4 13.5 6 6L22 7" stroke="currentColor" stroke-width="2"/></svg></div>
              <h3>Request received.</h3>
              <p id="doneSummary"></p>
              <p class="book__done-note">I'll confirm the requested time by email within 24 hours.</p>
              <div class="done__actions">
                <a class="btn btn--ghost book__ghost" id="doneMail" href="#">Send additional context</a>
                <button class="btn btn--accent" type="button" id="bookAgain">Request another slot</button>
              </div>
            </div>
            <p class="book__fine">Prefer writing? <a class="book__fine-link" href="mailto:hi@abhijeetvarghese.com">hi@abhijeetvarghese.com</a> · <a class="book__fine-link" href="tel:+919694080706">+91-96940 80706</a></p>
          </div>
HTML;
    }

    /* ---------- homepage assembly ---------- */
    public function renderHomepage(): string
    {
        $siteUrl = AV_SITE_URL;
        $s = $this->site['settings'] ?? [];
        $nav = $this->site['nav'] ?? [];
        $sections = $this->site['sections'] ?? [];
        usort($sections, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
        $body = [];
        foreach ($sections as $sec) {
            if (($sec['status'] ?? 'published') !== 'published') continue;
            $body[] = match ($sec['type'] ?? '') {
                'hero' => $this->secHero($sec, $s),
                'clients' => $this->secClients($sec),
                'capabilities' => $this->secCapabilities($sec),
                'work' => $this->secWork($sec),
                'thinking' => $this->secThinking($sec),
                'journey' => $this->secJourney($sec),
                'ai' => $this->secAi($sec),
                'focus' => $this->secFocus($sec),
                'contact' => $this->secContact($sec, $s),
                default => '<!-- unknown section: ' . $this->esc($sec['type'] ?? '') . ' -->',
            };
        }
        $ld = json_encode([
            '@context' => 'https://schema.org', '@type' => 'Person',
            'name' => $s['siteName'] ?? 'Abhijeet Varghese', 'url' => $siteUrl . '/',
            'jobTitle' => 'Creative Systems Leader',
            'email' => 'mailto:' . ($s['email'] ?? ''), 'telephone' => $s['phone'] ?? '',
            'image' => $siteUrl . '/' . $this->media($s['logo'] ?? 'media/logo.png'),
            'sameAs' => array_map(fn($x) => $x['href'], $s['socials'] ?? []),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $this->shell($s, $nav,
            ($s['siteName'] ?? 'Abhijeet Varghese') . ' — Creative Systems Leader | Experience Design, Enterprise Innovation & AI',
            $s['metaDescription'] ?? '', 'index.html', $this->join($body), 'home', 'website', null, $ld, 'home-arena');
    }

    /* ---------- page blocks ---------- */
    private function blockHero(array $b): string
    {
        $k = $b['content']['kicker'] ?? '';
        [$n, $tag] = str_contains($k, '·') ? array_map('trim', explode('·', $k, 2)) : ['00', $k];
        return <<<HTML
    <section class="page-hero" aria-label="{$this->esc($tag)}">
      <div class="container">
        <div class="chapter__meta page-hero__meta" data-reveal>
          <span class="chapter__num">{$this->esc($n)}</span><span class="chapter__rule"></span><span class="chapter__tag">{$this->esc($tag)}</span>
        </div>
        <h1 class="page-hero__title" data-reveal>{$this->v($b, 'content', 'title', '')}</h1>
        <p class="page-hero__lede" data-reveal style="--d:.15s">{$this->esc($this->v($b, 'content', 'lede', ''))}</p>
      </div>
    </section>
HTML;
    }

    private function blockProse(array $b): string
    {
        $out = [];
        foreach (($b['content']['paragraphs'] ?? []) as $p) $out[] = '<p data-reveal>' . $p . '</p>';
        foreach (($b['content']['headings'] ?? []) as $h) $out[] = '<h2 data-reveal>' . $this->esc($h['h'] ?? '') . '</h2><p data-reveal>' . $this->esc($h['p'] ?? '') . '</p>';
        return <<<HTML
    <section class="page-section t-light">
      <div class="container">
        <div class="prose" data-reveal-group data-dbase=".1">
          {$this->join($out)}
        </div>
      </div>
    </section>
HTML;
    }

    private function blockImage(array $b): string
    {
        $src = $this->media($b['content']['src'] ?? '');
        $cap = !empty($b['content']['caption']) ? '<figcaption style="padding:12px 16px;font-size:12.5px;color:var(--cm)">' . $this->esc($b['content']['caption']) . '</figcaption>' : '';
        return <<<HTML
    <section class="page-section t-light">
      <div class="container">
        <figure style="border-radius:18px;overflow:hidden;border:1px solid var(--cl)">
          <img src="{$this->esc($src)}" alt="{$this->esc($this->v($b, 'content', 'alt', ''))}" style="width:100%;aspect-ratio:16/9;object-fit:cover" loading="lazy">
          {$cap}
        </figure>
      </div>
    </section>
HTML;
    }

    private function blockQuote(array $b): string
    {
        return '<section class="page-section t-light"><div class="container"><blockquote class="pull-quote" data-reveal style="max-width:760px;margin-inline:auto;text-align:center;border-left:0;border-bottom:2px solid var(--ca);border-radius:0 0 16px 16px">“' . $this->esc($b['content']['text'] ?? '') . '”</blockquote></div></section>';
    }

    private function blockTimeline(array $b): string
    {
        $items = [];
        foreach (($b['content']['items'] ?? []) as $i => $it) {
            $items[] = '<li data-reveal><span class="st__num">' . str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT) . '</span><span class="st__name">' . $this->esc($it['name'] ?? '') . '</span><span class="st__note">' . $this->esc($it['note'] ?? '') . '</span></li>';
        }
        return <<<HTML
    <section class="page-section t-light">
      <div class="container">
        <ol class="story-timeline" data-reveal-group data-dbase=".2">
          {$this->join($items)}
        </ol>
      </div>
    </section>
HTML;
    }

    private function blockList(array $b): string
    {
        $items = [];
        foreach (($b['content']['items'] ?? []) as $i => $it) {
            $items[] = '<li data-reveal><span class="focus__num">' . str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT) . '</span>' . $this->esc($it) . '</li>';
        }
        return '<section class="page-section t-light"><div class="container"><ul class="focus__list" data-reveal-group>' . $this->join($items) . '</ul></div></section>';
    }

    private function blockCapabilities(array $b): string
    {
        $items = $b['content']['items'] ?? [];
        if (!$items) {
            foreach (($this->site['sections'] ?? []) as $sec) {
                if (($sec['type'] ?? '') === 'capabilities') { $items = $sec['items'] ?? []; break; }
            }
        }
        $out = [];
        foreach ($items as $i => $c) {
            $out[] = '<article class="cap' . ($i === count($items) - 1 ? ' cap--feature' : '') . '" data-reveal>
            <div class="cap__index"><span class="cap__num">' . $this->esc($c['num'] ?? str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT)) . '</span></div>
            <h3>' . $this->esc($c['name'] ?? '') . '</h3><p>' . $this->esc($c['body'] ?? '') . '</p>
          </article>';
        }
        return '<section class="page-section t-light"><div class="container"><div class="cap-list">' . $this->join($out) . '</div></div></section>';
    }

    private function blockLogowall(array $b): string
    {
        $tiles = [];
        foreach (($this->site['clients'] ?? []) as $c) {
            if (empty($c['logo'])) continue;
            $tiles[] = '<li class="logo-tile" data-reveal><img src="assets/logos/' . $this->esc($c['logo']) . '" alt="' . $this->esc($c['name']) . '" width="160" height="48" loading="lazy" decoding="async"></li>';
        }
        return <<<HTML
    <section class="page-section t-light">
      <div class="container">
        <header class="chapter__head">
          <div class="chapter__meta" data-reveal><span class="chapter__num">✦</span><span class="chapter__rule"></span><span class="chapter__tag">Trust</span></div>
          <h2 class="chapter__title" data-reveal>{$this->esc($this->v($b, 'content', 'title', 'Experiences built for.'))}</h2>
        </header>
        <ul class="logo-wall" data-reveal-group aria-label="Clients">
          {$this->join($tiles)}
        </ul>
        <p class="clients__note" data-reveal>{$this->esc($this->v($b, 'content', 'lede', ''))}</p>
      </div>
    </section>
HTML;
    }

    private function blockCta(array $b): string
    {
        $btn = !empty($b['content']['button'])
            ? '<p style="margin-top:10px"><a class="btn btn--accent" href="' . $this->esc($b['content']['href'] ?? 'contact.html') . '">' . $this->esc($b['content']['button']) . ' ' . self::ARROW . '</a></p>'
            : '';
        return <<<HTML
    <section class="page-section t-light">
      <div class="container">
        <div class="recruiter-card" data-reveal style="max-width:760px;margin-inline:auto;text-align:center">
          <h2>{$this->esc($this->v($b, 'content', 'title', ''))}</h2>
          <p>{$this->esc($this->v($b, 'content', 'text', ''))}</p>
          {$btn}
        </div>
      </div>
    </section>
HTML;
    }

    private function blockCard(array $b): string
    {
        $chips = '';
        foreach (($b['content']['chips'] ?? []) as $c) $chips .= '<li>' . $this->esc($c) . '</li>';
        $dl = !empty($b['content']['download']) ? '<p style="margin-top:10px"><a class="link-arrow" href="assets/Abhijeet-Varghese-Resume.pdf" download>Download résumé ' . self::ARROW . '</a></p>' : '';
        $cta = !empty($b['content']['cta']) ? '<p style="margin-top:10px"><a class="btn btn--accent" href="' . $this->esc($b['content']['href'] ?? 'contact.html') . '">' . $this->esc($b['content']['cta']) . ' ' . self::ARROW . '</a></p>' : '';
        $chipsHtml = $chips ? '<ul class="chip-list">' . $chips . '</ul>' : '';
        return <<<HTML
    <section class="page-section t-light">
      <div class="container">
        <div class="recruiter-card" data-reveal style="max-width:760px;margin-inline:auto">
          <h2>{$this->esc($this->v($b, 'content', 'title', ''))}</h2>
          <p>{$this->esc($this->v($b, 'content', 'body', ''))}</p>
          {$chipsHtml}
          {$dl}{$cta}
        </div>
      </div>
    </section>
HTML;
    }

    private function blockCases(array $b): string
    {
        $arrow = self::ARROW;
        $cases = [];
        $projects = $this->site['projects'] ?? [];
        $byId = [];
        foreach ($projects as $p) $byId[$p['id']] = $p;
        foreach (($b['content']['projectIds'] ?? []) as $i => $id) {
            $p = $byId[$id] ?? null;
            if (!$p) continue;
            $img = $this->media($p['image'] ?? '');
            $imgAlt = (string)($p['imageAlt'] ?? (($p['client'] ?? '') . ' — ' . ($p['industry'] ?? '') . ' engagement'));
            $parallax = !empty($p['preserveFrame']) ? '0' : '0.05';
            $num = str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT);
            $cases[] = <<<HTML
        <article class="case" id="case-{$this->esc($p['id'])}">
          <figure class="case__panel" data-parallax="{$parallax}" data-reveal="img">
            <picture><img src="{$this->esc($img)}" alt="{$this->esc($imgAlt)}" width="1536" height="1024" loading="lazy" decoding="async"></picture>
            <figcaption class="case__card" data-reveal>
              <p class="case__kicker"><span>{$this->esc($this->v($p, 'industry', ''))}</span><span class="case__client">{$this->esc($this->v($p, 'client', ''))}</span></p>
              <h2 class="case__title">{$this->esc($this->v($p, 'title', ''))}</h2>
              <a class="case__card-cta" href="{$this->esc($this->caseStudyFile($p))}">Explore case study {$arrow}</a>
            </figcaption>
          </figure>
          <dl class="case__meta case__meta--row" data-reveal-group>
            <div data-reveal><dt>Problem</dt><dd>{$this->esc($this->v($p, 'challenge', ''))}</dd></div>
            <div data-reveal><dt>Approach</dt><dd>{$this->esc($this->v($p, 'approach', ''))}</dd></div>
            <div data-reveal><dt>Role</dt><dd>{$this->esc($this->v($p, 'role', ''))}</dd></div>
            <div data-reveal><dt>Outcome</dt><dd>{$this->esc($this->v($p, 'outcome', ''))}</dd></div>
          </dl>
        </article>
HTML;
        }
        $note = !empty($b['content']['mailto'])
            ? '<a class="link-arrow" href="mailto:' . $this->esc($b['content']['mailto']) . '?subject=Case%20study%20deep%20dive">Request the deep dive ' . self::ARROW . '</a>'
            : '';
        return <<<HTML
    <section class="page-section t-light">
      <div class="container">
{$this->join($cases)}
        <p class="clients__note" data-reveal style="margin-top:clamp(60px,9vh,110px)">
          {$this->esc($this->v($b, 'content', 'note', ''))}
          {$note}
        </p>
      </div>
    </section>
HTML;
    }

    private function blockArticles(array $b): string
    {
        $kind = $b['content']['kind'] ?? 'essay';
        $rows = [];
        $i = 1;
        foreach (($this->site['articles'] ?? []) as $e) {
            if (($e['type'] ?? '') !== $kind) continue;
            if (!$this->isDue($e)) continue;   // never link drafts/reviews in public listings
            $slug = $e['slug'] ?? $this->slugify($e['title'] ?? '');
            $href = ($kind === 'essay' ? 'essay-' : 'journal-') . $slug . '.html';
            $rows[] = '<article class="entry" data-reveal>
          <p class="entry__meta"><em>' . str_pad((string)$i, 2, '0', STR_PAD_LEFT) . '</em><span>' . $this->esc($e['category'] ?? '') . ' · ' . $this->esc($e['readTime'] ?? '') . '</span></p>
          <h2><a href="' . $href . '">' . $this->esc($e['title'] ?? '') . '</a></h2>
          <p>' . $this->esc($e['excerpt'] ?? '') . '</p>
          <p style="margin-top:12px"><a class="link-arrow" href="' . $href . '">Read ' . ($kind === 'essay' ? 'the essay' : 'the entry') . ' ' . self::ARROW . '</a></p>
        </article>';
            $i++;
        }
        return '<section class="page-section t-light"><div class="container"><div class="entry" data-reveal style="border-top:1px solid var(--cl)"></div>' . $this->join($rows) . '</div></section>';
    }

    private function blockContact(array $b, array $s): string
    {
        $sec = null;
        foreach (($this->site['sections'] ?? []) as $x) if (($x['type'] ?? '') === 'contact') { $sec = $x; break; }
        $micro = [];
        foreach (($sec['micro'] ?? []) as $m) {
            $val = !empty($m['href']) ? '<a class="link-arrow link-arrow--micro" href="' . $this->esc($m['href']) . '">' . $this->esc($m['value']) . '</a>' : $this->esc($m['value']);
            $micro[] = '<li data-reveal><span>' . $this->esc($m['label'] ?? '') . '</span><strong>' . $val . '</strong></li>';
        }
        $socials = '';
        foreach (($s['socials'] ?? []) as $x) $socials .= '<li><a class="social-chip" href="' . $this->esc($x['href']) . '" target="_blank" rel="noopener">' . $this->socialIcon($x['label'] ?? '') . $this->esc($x['label'] ?? '') . '</a></li>';
        return <<<HTML
    <section class="page-section page-section--tight contact-page t-light">
      <div class="container">
        <div class="contact__grid">
          <div class="contact__intro">
            <ul class="contact__micro" data-reveal-group>
{$this->join($micro)}
            </ul>
            <div class="contact__social" data-reveal style="--d:.2s">
              <p class="label label--muted">Find me on</p>
              <ul class="social-row">
{$socials}
              </ul>
            </div>
            <p class="focus__note" data-reveal style="margin-top:34px;max-width:38ch">{$this->esc($this->v($b, 'content', 'note', ''))}</p>
          </div>
{$this->bookingCard()}
        </div>
      </div>
    </section>
HTML;
    }

    private function blockSitemap(): string
    {
        $items = [];
        foreach (($this->site['pages'] ?? []) as $p) {
            if (($p['status'] ?? '') !== 'published' || ($p['slug'] ?? '') === 'home') continue;
            $items[] = '<a href="' . $this->esc($p['slug'] . '.html') . '" data-reveal><strong>' . $this->esc($p['title']) . '</strong><span>Page · ' . count($p['blocks'] ?? []) . ' blocks</span></a>';
        }
        foreach (($this->site['articles'] ?? []) as $a) {
            if (!$this->isDue($a)) continue;   // sitemap page never links drafts
            $slug = $a['slug'] ?? $this->slugify($a['title'] ?? '');
            $items[] = '<a href="' . (($a['type'] ?? 'essay') === 'essay' ? 'essay-' : 'journal-') . $slug . '.html" data-reveal><strong>' . $this->esc($a['title']) . '</strong><span>' . (($a['type'] ?? 'essay') === 'essay' ? 'Essay' : 'Journal') . ' · ' . $this->esc($a['category'] ?? '') . '</span></a>';
        }
        foreach (($this->site['projects'] ?? []) as $project) {
            if (!$this->isDue($project) || ($project['status'] ?? 'published') !== 'published') continue;
            $items[] = '<a href="' . $this->esc($this->caseStudyFile($project)) . '" data-reveal><strong>' . $this->esc($project['title'] ?? 'Case study') . '</strong><span>Case Study · ' . $this->esc($project['client'] ?? '') . '</span></a>';
        }
        $items[] = '<a href="assets/Abhijeet-Varghese-Resume.pdf" data-reveal><strong>Download résumé</strong><span>PDF</span></a>';
        return '<section class="page-section t-light"><div class="container"><div class="sitemap-grid" data-reveal-group data-dbase=".1">' . $this->join($items) . '</div></div></section>';
    }

    /** Stable public route for a project's dedicated case-study page. */
    private function caseStudyFile(array $p): string
    {
        $custom = trim((string)($p['caseStudyPath'] ?? ''));
        // Backward-compatible fallback for content stores created before the
        // Orange Business long-form case-study fields were introduced.
        if ($custom === '' && ($p['id'] ?? '') === 'prj-1') {
            $custom = 'experience-design/orange-business-executive-briefing-center/';
        }
        if ($custom !== '') {
            $custom = ltrim((string)preg_replace('#/+#', '/', $custom), '/');
            if (!str_contains($custom, '..')) return $custom;
        }
        $slug = (string)($p['slug'] ?? '');
        if ($slug === '') $slug = $this->slugify((string)($p['title'] ?? ''));
        if ($slug === '') $slug = (string)($p['id'] ?? 'prj');
        return 'case-study-' . $slug . '.html';
    }

    /** Filesystem destination for a public case-study route. */
    private function caseStudyOutputFile(array $p): string
    {
        $route = $this->caseStudyFile($p);
        return str_ends_with($route, '/') ? $route . 'index.html' : $route;
    }

    /** Lightweight static fallback for legacy URLs; Apache also receives a 301. */
    private function renderCaseStudyRedirect(string $route): string
    {
        $target = '/' . ltrim($route, '/');
        $canonical = rtrim(AV_SITE_URL, '/') . $target;
        return '<!doctype html><html lang="en"><head><meta charset="utf-8">'
            . '<meta name="viewport" content="width=device-width,initial-scale=1">'
            . '<meta name="robots" content="noindex,follow">'
            . '<title>Case study moved — Abhijeet Varghese</title>'
            . '<link rel="canonical" href="' . $this->esc($canonical) . '">'
            . '<meta http-equiv="refresh" content="0;url=' . $this->esc($target) . '">'
            . '</head><body><main><p>This case study has moved to '
            . '<a href="' . $this->esc($target) . '">Orange Business New Executive Briefing Center</a>.</p>'
            . '</main><script>location.replace(' . json_encode($target) . ');</script></body></html>';
    }

    /** Supplied long-form Orange Business case study, adapted to AV OS publishing. */
    private function renderOrangeBusinessCaseStudy(array $p, array $s, array $nav): string
    {
        $templateFile = __DIR__ . '/templates/orange-business-executive-briefing-center.html';
        if (!is_file($templateFile)) throw new RuntimeException('Orange Business case-study template missing');
        $html = (string)file_get_contents($templateFile);
        $siteUrl = rtrim(AV_SITE_URL, '/');
        $route = $this->caseStudyFile($p);
        $pageUrl = $siteUrl . '/' . ltrim($route, '/');
        $mediaUrl = $siteUrl . '/assets/media/';

        $personId = $siteUrl . '/#person';
        $projectId = $pageUrl . '#project';
        $articleId = $pageUrl . '#article';
        $webPageId = $pageUrl . '#webpage';
        $breadcrumbId = $pageUrl . '#breadcrumb';
        $imageId = $pageUrl . '#hero-image';
        $graph = [
            [
                '@type' => 'Person', '@id' => $personId,
                'name' => $s['siteName'] ?? 'Abhijeet Varghese',
                'url' => $siteUrl . '/',
                'jobTitle' => 'Experience Strategy & Creative Technology Lead',
                'knowsAbout' => ['Experience Strategy', 'Experience Design', 'Creative Technology', 'Immersive Experience', 'XR', 'VR', 'Experience Centers', 'Executive Briefing Centers', 'Interactive Experience', 'Spatial Experience', 'Enterprise Experience'],
            ],
            [
                '@type' => 'CreativeWork', '@id' => $projectId,
                'name' => 'Orange Business New Executive Briefing Center',
                'creator' => ['@id' => $personId],
                'locationCreated' => ['@type' => 'Place', 'name' => 'Mumbai, India'],
                'about' => ['Experience Design', 'Experience Strategy', 'Creative Technology', 'Interactive Experience Design', 'Immersive Experience Design', 'Executive Briefing Center'],
                'image' => ['@id' => $imageId],
            ],
            [
                '@type' => 'Article', '@id' => $articleId,
                'headline' => 'Orange Business New Executive Briefing Center',
                'description' => 'Case study documenting the experience strategy, creative technology, interactive media, XR, content and physical-digital experience behind the Orange Business New Executive Briefing Center in Mumbai.',
                'author' => ['@id' => $personId],
                'about' => ['@id' => $projectId],
                'mainEntityOfPage' => ['@id' => $webPageId],
            ],
            [
                '@type' => 'WebPage', '@id' => $webPageId,
                'url' => $pageUrl,
                'name' => 'Orange Business Experience Center & Executive Briefing Center',
                'description' => 'A strategy-led physical-digital experience for executive engagement, product storytelling, immersive demonstration and collaboration.',
                'breadcrumb' => ['@id' => $breadcrumbId],
                'mainEntity' => ['@id' => $articleId],
                'inLanguage' => 'en',
            ],
            [
                '@type' => 'BreadcrumbList', '@id' => $breadcrumbId,
                'itemListElement' => [
                    ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => $siteUrl . '/'],
                    ['@type' => 'ListItem', 'position' => 2, 'name' => 'Case Studies', 'item' => $siteUrl . '/case-studies.html'],
                    ['@type' => 'ListItem', 'position' => 3, 'name' => 'Orange Business Executive Briefing Center', 'item' => $pageUrl],
                ],
            ],
            [
                '@type' => 'ImageObject', '@id' => $imageId,
                'contentUrl' => $mediaUrl . 'orange-business-executive-briefing-center-mumbai-panoramic.jpeg',
                'caption' => 'Panoramic view of the Orange Business New Executive Briefing Center in Mumbai',
            ],
        ];

        $videos = [
            'rotoscope.mp4' => ['rotoscope-video', 'Orange Business Rotoscope Interactive Display', 'Physical movement of the Rotoscope display changing digital content inside the Orange Business Executive Briefing Center.', 'orange-business-rotoscope-experience.jpg'],
            'videowall.mp4' => ['videowall-video', 'Orange Business Interactive Video Wall', 'Interactive video wall used for presentation, demonstration, media playback and executive collaboration.', 'orange-business-interactive-video-wall.jpg'],
            'VR.mp4' => ['vr-video', 'Orange Business Immersive VR Experience', 'Visitor using the immersive VR product-knowledge experience in the Orange Business Executive Briefing Center.', 'orange-business-vr-experience.jpg'],
        ];
        foreach ($videos as $file => [$id, $name, $description, $poster]) {
            $available = is_file(AV_TEMPLATE . '/assets/media/video/' . $file);
            if ($available) {
                $graph[] = [
                    '@type' => 'VideoObject', '@id' => $pageUrl . '#' . $id,
                    'name' => $name, 'description' => $description,
                    'thumbnailUrl' => [$mediaUrl . $poster],
                    'contentUrl' => $mediaUrl . 'video/' . $file,
                ];
                $html = str_replace(' data-video-file="' . $file . '"', '', $html);
            } else {
                $pattern = '#<source\\s+data-video-file="' . preg_quote($file, '#') . '"[^>]*>#';
                $html = (string)preg_replace($pattern, '', $html, 1);
            }
        }

        $structuredData = json_encode(
            ['@context' => 'https://schema.org', '@graph' => $graph],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG
        );
        return strtr($html, [
            '{{SITE_URL}}' => $siteUrl,
            '{{ASSET_VERSION}}' => $this->assetVersion(),
            '{{STRUCTURED_DATA}}' => $structuredData ?: '{}',
            '{{SITE_CHROME}}' => $this->chrome($s, $nav, 'case-studies', '../../'),
            '{{SITE_FOOTER}}' => $this->footer($s, $nav, '../../'),
        ]);
    }

    /** Published placeholder that preserves the project URL and factual metadata. */
    private function renderComingSoonCaseStudy(array $p, array $s, array $nav): string
    {
        $siteUrl = rtrim(AV_SITE_URL, '/');
        $file = $this->caseStudyFile($p);
        $image = $this->media((string)($p['image'] ?? 'media/hero-portrait.webp'));
        $title = strip_tags((string)($p['title'] ?? 'Case study'));
        $client = (string)($p['client'] ?? '');
        $industry = (string)($p['industry'] ?? '');
        $year = (string)($p['year'] ?? '');
        $role = (string)($p['role'] ?? '');
        $summary = strip_tags((string)($p['summary'] ?? ''));
        $status = (string)($p['comingSoonLabel'] ?? 'Full case study coming soon');
        $arrow = self::ARROW;
        $body = <<<HTML
    <section class="page-hero case-coming__hero" aria-label="{$this->esc($client)} case study coming soon">
      <div class="container">
        <div class="chapter__meta page-hero__meta" data-reveal>
          <span class="chapter__num">✦</span><span class="chapter__rule"></span>
          <span class="chapter__tag">{$this->esc($client)} · Coming soon</span>
        </div>
        <h1 class="page-hero__title" data-reveal>{$this->esc($title)}</h1>
        <p class="page-hero__lede" data-reveal style="--d:.15s">{$this->esc($status)}.</p>
      </div>
    </section>
    <section class="case-coming t-light" aria-label="Case study preview">
      <div class="container case-coming__grid">
        <figure class="case-coming__media" data-reveal="img">
          <img src="{$this->esc($image)}" alt="{$this->esc($title)} — {$this->esc($client)} preview" width="1536" height="1024" fetchpriority="high" decoding="async">
          <figcaption>{$this->esc($client)} · {$this->esc($industry)}{$this->esc($year !== '' ? ' · ' . $year : '')}</figcaption>
        </figure>
        <div class="case-coming__copy" data-reveal style="--d:.12s">
          <p class="case-coming__eyebrow">In development</p>
          <h2>The complete story is <em>coming soon.</em></h2>
          <p>{$this->esc($summary)}</p>
          <dl>
            <div><dt>Client</dt><dd>{$this->esc($client)}</dd></div>
            <div><dt>Practice</dt><dd>{$this->esc($industry)}</dd></div>
            <div><dt>Role</dt><dd>{$this->esc($role)}</dd></div>
          </dl>
          <div class="case-coming__actions">
            <a class="btn btn--accent" href="case-studies.html">View all case studies {$arrow}</a>
            <a class="link-arrow" href="portfolio.html">Explore the portfolio {$arrow}</a>
          </div>
        </div>
      </div>
    </section>
HTML;
        $seo = $p['seo'] ?? [];
        $seoTitle = $seo['title'] ?? ($title . ' — ' . ($s['siteName'] ?? ''));
        $seoDesc = $seo['desc'] ?? ($summary ?: $status);
        $ld = json_encode([
            '@context' => 'https://schema.org', '@type' => 'WebPage',
            'name' => $title, 'description' => $seoDesc,
            'url' => $siteUrl . '/' . ltrim($file, '/'),
            'isPartOf' => ['@type' => 'CollectionPage', 'name' => 'Case Studies', 'url' => $siteUrl . '/case-studies.html'],
            'inLanguage' => 'en',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $this->shell($s, $nav, $seoTitle, $seoDesc, $file, $body, 'case-studies', 'website', $image, $ld, 'case-coming-page');
    }

    /** Dedicated case-study page — every project gets its own URL (no more anchor-only). */
    private function renderCaseStudy(array $p, array $s, array $nav): string
    {
        if (!empty($p['comingSoon'])) {
            return $this->renderComingSoonCaseStudy($p, $s, $nav);
        }
        if (($p['caseStudyTemplate'] ?? '') === 'orange-business-ebc' || ($p['id'] ?? '') === 'prj-1') {
            return $this->renderOrangeBusinessCaseStudy($p, $s, $nav);
        }
        $siteUrl = AV_SITE_URL;
        $file = $this->caseStudyFile($p);
        $img = $this->media($p['image'] ?? '');
        $title = strip_tags((string)($p['title'] ?? 'Case study'));
        $client = (string)($p['client'] ?? '');
        $industry = (string)($p['industry'] ?? '');
        $year = (string)($p['year'] ?? '');
        $tagBits = array_filter([$client, $industry, $year]);
        $tag = implode(' · ', $tagBits);
        $summary = strip_tags((string)($p['summary'] ?? ($p['lede'] ?? '')));
        $meta = function (string $label, string $value): string {
            return $value === '' ? ''
                : '<div data-reveal><dt>' . $this->esc($label) . '</dt><dd>' . $this->esc($value) . '</dd></div>';
        };
        $metaRows = $meta('Problem', (string)($p['challenge'] ?? ''))
                  . $meta('Approach', (string)($p['approach'] ?? ''))
                  . $meta('Role', (string)($p['role'] ?? ''))
                  . $meta('Outcome', (string)($p['outcome'] ?? ''));
        // optional gallery images
        $gallery = '';
        if (!empty($p['gallery']) && is_array($p['gallery'])) {
            $items = [];
            foreach (array_slice($p['gallery'], 0, 6) as $g) {
                $src = $this->media(is_array($g) ? (string)($g['src'] ?? $g['url'] ?? '') : (string)$g);
                if ($src !== '') $items[] = '<figure class="case-gallery__item" data-reveal><img src="' . $this->esc($src) . '" alt="' . $this->esc($title . ' — visual') . '" loading="lazy" decoding="async"></figure>';
            }
            if ($items) $gallery = '<div class="case-gallery" data-reveal-group>' . $this->join($items) . '</div>';
        }
        $yearSuffix = $year !== '' ? ' · ' . $year : '';
        $body = <<<HTML
    <section class="page-hero" aria-label="{$this->esc($tag)}">
      <div class="container">
        <div class="chapter__meta page-hero__meta" data-reveal>
          <span class="chapter__num">✦</span><span class="chapter__rule"></span><span class="chapter__tag">{$this->esc($tag)}</span>
        </div>
        <h1 class="page-hero__title" data-reveal>{$this->esc($title)}</h1>
        <p class="page-hero__lede" data-reveal style="--d:.15s">{$this->esc($summary)}</p>
      </div>
    </section>
    <section class="article-body t-light">
      <div class="container">
        <figure class="case-detail__hero" data-reveal="img">
          <picture><img src="{$this->esc($img)}" alt="{$this->esc($title)} — visual overview" width="1536" height="1024" fetchpriority="high" decoding="async"></picture>
        </figure>
        <dl class="case-detail__meta" data-reveal-group>
{$metaRows}
        </dl>
{$gallery}
        <div class="article-foot" data-reveal>
          <p style="color:var(--cm);font-size:0.95rem">Delivered for <strong style="color:var(--ct)">{$this->esc($client)}</strong>{$yearSuffix}</p>
          <div style="display:flex;gap:14px;flex-wrap:wrap">
            <a class="link-arrow" href="case-studies.html">← All case studies</a>
            <a class="btn btn--accent" href="contact.html">Discuss a project like this</a>
          </div>
        </div>
      </div>
    </section>
HTML;
        $seo = $p['seo'] ?? [];
        $seoTitle = $seo['title'] ?? ($title . ' — ' . ($s['siteName'] ?? ''));
        $seoDesc = $seo['desc'] ?? ($summary ?: $title);
        $ld = json_encode([
            '@context' => 'https://schema.org', '@type' => 'CreativeWork',
            'headline' => $title, 'about' => $industry,
            'author' => ['@type' => 'Person', 'name' => $s['siteName'] ?? ''],
            'image' => $siteUrl . '/' . $img, 'url' => $siteUrl . '/' . $file, 'inLanguage' => 'en',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $this->shell($s, $nav, $seoTitle, $seoDesc, $file, $body, 'case-studies', 'article', $img, $ld);
    }

    private function renderPage(array $page, array $s, array $nav): string
    {
        // About page — long-form editorial narrative (one continuous story).
        if (($page['template'] ?? '') === 'About') {
            return $this->renderAbout($page, $s, $nav);
        }
        // Experience page — editorial employment record.
        if (($page['template'] ?? '') === 'Experience') {
            return $this->renderExperience($page, $s, $nav);
        }
        // Portfolio — visual index, distinct from the narrative Case Studies page.
        if (($page['template'] ?? '') === 'Portfolio') {
            return $this->renderPortfolio($page, $s, $nav);
        }
        $siteUrl = AV_SITE_URL;
        $body = [];
        $i = 1;
        foreach (($page['blocks'] ?? []) as $b) {
            $body[] = match ($b['type'] ?? '') {
                'hero' => $this->blockHero($b),
                'prose' => $this->blockProse($b),
                'image' => $this->blockImage($b),
                'quote' => $this->blockQuote($b),
                'timeline' => $this->blockTimeline($b),
                'list' => $this->blockList($b),
                'capabilities' => $this->blockCapabilities($b),
                'logowall' => $this->blockLogowall($b),
                'cta' => $this->blockCta($b),
                'card' => $this->blockCard($b),
                'cases' => $this->blockCases($b),
                'articles' => $this->blockArticles($b),
                'contact' => $this->blockContact($b, $s),
                'sitemap' => $this->blockSitemap(),
                default => '<!-- unknown block: ' . $this->esc($b['type'] ?? '') . ' -->',
            };
            $i++;
        }
        $seo = $page['seo'] ?? [];
        $title = $seo['title'] ?? ($page['title'] . ' — ' . ($s['siteName'] ?? ''));
        $desc = $seo['desc'] ?? ($s['metaDescription'] ?? '');
        $ld = json_encode(['@context' => 'https://schema.org', '@type' => 'WebPage', 'name' => $page['title'], 'url' => $siteUrl . '/' . $page['slug'] . '.html', 'inLanguage' => 'en']);
        return $this->shell($s, $nav, $title, $desc, $page['slug'] . '.html', $this->join($body), $page['slug'], 'website', null, $ld);
    }

    /* ============================================================
       PORTFOLIO — visual work index, deliberately distinct from the
       narrative Case Studies page. Uses only published project data.
       ============================================================ */
    private function renderPortfolio(array $page, array $s, array $nav): string
    {
        $siteUrl = AV_SITE_URL;
        $projects = array_values(array_filter(
            $this->site['projects'] ?? [],
            fn($p) => ($p['status'] ?? '') === 'published'
        ));
        $pieces = [];
        $ldParts = [];
        foreach ($projects as $i => $project) {
            $num = str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT);
            $title = (string)($project['title'] ?? 'Untitled project');
            $client = (string)($project['client'] ?? 'Selected work');
            $industry = (string)($project['industry'] ?? 'Experience Design');
            $summary = (string)($project['summary'] ?? '');
            $role = (string)($project['role'] ?? 'Creative Direction');
            $year = (string)($project['year'] ?? '');
            $image = $this->media((string)($project['image'] ?? 'media/hero-portrait.webp'));
            $imageAlt = (string)($project['imageAlt'] ?? ($title . ' — ' . $client));
            $file = $this->caseStudyFile($project);
            $variant = 'portfolio-piece--' . (($i % 3) + 1);
            $pieces[] = <<<HTML
        <article class="portfolio-piece {$variant}" data-reveal>
          <a class="portfolio-piece__link" href="{$this->esc($file)}" aria-label="View {$this->esc($title)}">
            <figure class="portfolio-piece__media">
              <img src="{$this->esc($image)}" alt="{$this->esc($imageAlt)}" width="1536" height="1024" loading="lazy" decoding="async">
              <span class="portfolio-piece__index" aria-hidden="true">{$num}</span>
              <span class="portfolio-piece__view" aria-hidden="true">View project ↗</span>
            </figure>
            <div class="portfolio-piece__copy">
              <div class="portfolio-piece__eyebrow"><span>{$this->esc($client)}</span><span>{$this->esc($industry)}</span></div>
              <h2>{$this->esc($title)}</h2>
              <p>{$this->esc($summary)}</p>
              <dl><div><dt>Role</dt><dd>{$this->esc($role)}</dd></div><div><dt>Year</dt><dd>{$this->esc($year)}</dd></div></dl>
            </div>
          </a>
        </article>
HTML;
            $ldParts[] = [
                '@type' => 'CreativeWork',
                'name' => $title,
                'about' => $industry,
                'image' => $siteUrl . '/' . $image,
                'url' => $siteUrl . '/' . $file,
            ];
        }

        $capabilities = [];
        foreach (($this->site['sections'] ?? []) as $section) {
            if (($section['id'] ?? '') === 'capabilities') {
                $capabilities = array_slice($section['items'] ?? [], 0, 6);
                break;
            }
        }
        $capRows = [];
        foreach ($capabilities as $i => $cap) {
            $num = str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT);
            $capRows[] = '<li data-reveal style="--d:' . ($i * 0.06) . 's"><span>' . $num . '</span><h3>' . $this->esc($cap['name'] ?? '') . '</h3><p>' . $this->esc($cap['body'] ?? '') . '</p></li>';
        }

        $logos = [];
        foreach (($this->site['clients'] ?? []) as $client) {
            if (empty($client['logo'])) continue;
            $logos[] = '<li data-reveal><img src="assets/logos/' . $this->esc($client['logo']) . '" alt="' . $this->esc($client['name'] ?? '') . '" width="160" height="48" loading="lazy" decoding="async"></li>';
        }

        $projectCount = count($projects);
        $clientCount = count($this->site['clients'] ?? []);
        $kicker = $this->esc((string)($page['kicker'] ?? 'Selected practice'));
        $lede = $this->esc((string)($page['lede'] ?? ''));
        $statement = $this->esc((string)($page['statement'] ?? 'The medium changes. The work is always about clarity.'));
        $arrow = self::ARROW;
        $body = <<<HTML
    <section class="portfolio-hero t-dark" aria-label="Portfolio introduction">
      <div class="portfolio-hero__grid" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="container portfolio-hero__inner">
        <div class="portfolio-hero__meta" data-reveal><span>{$kicker}</span><span>2014 — 2026</span></div>
        <h1 class="portfolio-hero__title">
          <span data-reveal>Work across</span>
          <em data-reveal style="--d:.12s">frames, systems</em>
          <span data-reveal style="--d:.22s">and spaces.</span>
        </h1>
        <div class="portfolio-hero__foot" data-reveal style="--d:.32s">
          <p>{$lede}</p>
          <dl><div><dt>Selected work</dt><dd>{$projectCount}</dd></div><div><dt>Organisations</dt><dd>{$clientCount}</dd></div></dl>
        </div>
      </div>
    </section>

    <section class="portfolio-index t-light" aria-label="Selected portfolio projects">
      <div class="container">
        <header class="portfolio-index__head">
          <p data-reveal>Selected portfolio</p>
          <h2 data-reveal>Different mediums.<br><em>One standard of clarity.</em></h2>
          <span data-reveal>Visual index / {$projectCount} works</span>
        </header>
        <div class="portfolio-index__grid">{$this->join($pieces)}</div>
      </div>
    </section>

    <section class="portfolio-practice t-dark" aria-label="Practice areas">
      <div class="container portfolio-practice__inner">
        <header><p data-reveal>Practice spectrum</p><h2 data-reveal>{$statement}</h2></header>
        <ol>{$this->join($capRows)}</ol>
      </div>
    </section>

    <section class="portfolio-proof t-light" aria-label="Selected organisations">
      <div class="container">
        <header><p data-reveal>Selected organisations</p><h2 data-reveal>Trusted when the work<br><em>had to be understood.</em></h2></header>
        <ul class="portfolio-proof__logos">{$this->join($logos)}</ul>
      </div>
    </section>

    <section class="portfolio-cta t-dark" aria-label="Start a conversation">
      <div class="container portfolio-cta__inner">
        <p data-reveal>Have a complicated idea?</p>
        <h2 data-reveal>Let's make it<br><em>impossible to misunderstand.</em></h2>
        <a class="btn btn--accent" href="contact.html" data-reveal>Start a conversation {$arrow}</a>
      </div>
    </section>
HTML;

        $seo = $page['seo'] ?? [];
        $title = $seo['title'] ?? ('Portfolio — ' . ($s['siteName'] ?? ''));
        $desc = $seo['desc'] ?? ($s['metaDescription'] ?? '');
        $ld = json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'CollectionPage',
            'name' => $page['title'] ?? 'Portfolio',
            'url' => $siteUrl . '/portfolio.html',
            'inLanguage' => 'en',
            'hasPart' => $ldParts,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $this->shell($s, $nav, $title, $desc, 'portfolio.html', $body, 'portfolio', 'website', null, $ld, 'portfolio-page');
    }

    /* ============================================================
       ABOUT — long-form editorial narrative (one continuous story).
       Built from the standard CMS blocks (hero / image / prose /
       quote / list / logowall / cta) so it stays fully editable in
       the Pages → Layout editor. Scoped entirely under
       body.about-page in styles.css — nothing global is touched.
       ============================================================ */
    private function renderAbout(array $page, array $s, array $nav): string
    {
        $blocks = $page['blocks'] ?? [];
        // pass 1 — split into the pre-act group (hero + portrait) and act groups
        $pre = []; $acts = []; $cur = null;
        foreach ($blocks as $b) {
            if (($b['type'] ?? '') === 'quote' && (($b['content']['variant'] ?? '') === 'act')) {
                if ($cur !== null) $acts[] = $cur;
                $cur = ['act' => $b, 'blocks' => []];
                continue;
            }
            if ($cur === null) $pre[] = $b;
            else $cur['blocks'][] = $b;
        }
        if ($cur !== null) $acts[] = $cur;

        // the finale quote + closing CTA are end credits — pulled out of the
        // act scenes and rendered on the page itself.
        $heroBlock = null; $portrait = null;
        foreach ($pre as $b) {
            if (($b['type'] ?? '') === 'hero') $heroBlock = $b;
            elseif (($b['type'] ?? '') === 'image') $portrait = $b;
        }
        $finaleQuote = null; $ctaBlock = null;
        foreach ($acts as $act) {
            foreach ($act['blocks'] as $b) {
                $t = $b['type'] ?? '';
                $v = $b['content']['variant'] ?? '';
                if ($t === 'quote' && $v === 'finale') $finaleQuote = $b;
                elseif ($t === 'cta') $ctaBlock = $b;
            }
        }
        $body = [];
        // the continuous canvas — the page is ONE film: a fixed reel of
        // chapter stills that advances with scroll, world-light that mixes
        // continuously, and a film-grain finish over everything
        $body[] = '<div class="about-atmo" id="aboutAtmo" aria-hidden="true"></div>';
        $reelImgs = ['media/about/about-motion.webp', 'media/about/about-experience.webp', 'media/about/about-environment.webp', 'media/about/about-people.webp', 'media/about/about-leadership.webp', 'media/about/about-credits.webp'];
        $reelFrames = '';
        foreach (array_merge($reelImgs, $reelImgs) as $ri) {
            $reelFrames .= '<span class="about-reel__frame" style="background-image:url(\'' . $this->esc($this->media($ri)) . '\')"></span>';
        }
        $body[] = '<div class="about-reel" aria-hidden="true"><div class="about-reel__track" id="aboutReelTrack">' . $reelFrames . '</div></div>';
        $body[] = '<div class="about-grain" aria-hidden="true"></div>';
        // no hero — the film opens with a compact prologue
        $body[] = $this->aboutPrologue($heroBlock, $s);
        // the summary is the identity hub — all six acts stay as chapters
        $opening = $heroBlock !== null
            ? array_values(array_filter(array_map('trim', preg_split('/\R/', (string)($heroBlock['content']['lede'] ?? '')))))
            : [];
        $body[] = $this->aboutFrame($acts[0] ?? null, $opening, $portrait);
        // by-the-numbers band — derived from the real content store
        // the remaining acts expand below the page — one open at a time
        $creditsRoles = $heroBlock !== null
            ? array_values(array_filter(array_map('trim', (array)($heroBlock['content']['roles'] ?? []))))
            : ['Creative Direction', 'Experience Design', 'Immersive Technology', 'Visual Storytelling'];
        if ($acts) $body[] = $this->aboutAccordion($acts, $creditsRoles);
        // end credits
        $body[] = $this->aboutCredits($ctaBlock, $finaleQuote, $portrait, $creditsRoles);
        // story compass — chapter number · name · progress · direct navigation
        $compassItems = '';
        foreach ($acts as $ci => $cact) {
            $cnum = str_pad((string)($ci + 1), 2, '0', STR_PAD_LEFT);
            $ctxt = (string)($cact['act']['content']['text'] ?? '');
            $cname = $ctxt;
            if (preg_match('/^\d+\s*·\s*(.+)$/u', $ctxt, $m)) $cname = trim($m[1]);
            $compassItems .= '<li><button type="button" data-act="' . $cnum . '"><span class="about-compass__item-num">' . $cnum . '</span><span class="about-compass__item-name">' . $this->esc($cname) . '</span></button></li>';
        }
        $body[] = '<nav class="about-compass" id="aboutCompass" aria-label="Story compass" hidden>'
            . '<button class="about-compass__btn" type="button" id="aboutCompassBtn" aria-expanded="false" aria-controls="aboutCompassList">'
            . '<span class="about-compass__num" id="aboutCompassNum">01</span>'
            . '<span class="about-compass__name" id="aboutCompassName">Motion</span>'
            . '<span class="about-compass__chev" aria-hidden="true">▾</span></button>'
            . '<ul class="about-compass__list" id="aboutCompassList" hidden>' . $compassItems . '</ul></nav>';

        $seo = $page['seo'] ?? [];
        $title = $seo['title'] ?? ($page['title'] . ' — ' . ($s['siteName'] ?? ''));
        $desc = $seo['desc'] ?? ($s['metaDescription'] ?? '');
        $ld = json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'AboutPage',
            'name' => $s['siteName'] ?? '',
            'url' => AV_SITE_URL . '/' . $page['slug'] . '.html',
            'inLanguage' => 'en',
            'description' => $desc,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $this->shell($s, $nav, $title, $desc, $page['slug'] . '.html', $this->join($body), $page['slug'], 'website', null, $ld, 'about-page about-films');
    }

    /** Opening — the homepage hero composition, about content. */
    /** Opening — no hero. THE THEATER: the story opens inside a film
        aperture — corner ticks, letterbox bars, a reel tag — and the
        aperture expands as the visitor scrolls into the page. */
    /** Opening — THE TITLE CARD, minimal: eyebrow · one giant statement ·
        role · skip. Everything else is cut — the canvas (reel, grain,
        world-light) carries the cinema. */
    private function aboutPrologue(?array $heroBlock, array $s): string
    {
        $titlePlain = trim(strip_tags((string)($heroBlock['content']['title'] ?? "I DIDN'T START OUT DESIGNING EXPERIENCES.")));
        $words = preg_split('/\s+/', $titlePlain);
        // Three editorial beats: assertion → turn → destination.
        $l1 = implode(' ', array_slice($words, 0, 2));       // I DIDN'T
        $l2 = implode(' ', array_slice($words, 2, 2));       // START OUT
        $l3raw = rtrim(implode(' ', array_slice($words, 4)), '.!?…');
        $l3 = '<em>' . $l3raw . '.</em>';
        $ledeLines = array_values(array_filter(array_map('trim', preg_split('/\R/', (string)($heroBlock['content']['lede'] ?? '')))));
        $lede = $this->esc(($ledeLines[0] ?? 'VFX and animation were my entry point.') . ' ' . ($ledeLines[count($ledeLines) - 1] ?? 'Eventually, I started thinking about the whole experience.'));
        // The four role chips and the crawl stay; redundant title-card labels
        // and the repeated role line are intentionally removed in the latest
        // minimal About treatment.
        $roles = '';
        foreach (($heroBlock['content']['roles'] ?? ['Creative Direction', 'Experience Design', 'Immersive Technology', 'Visual Storytelling']) as $r) {
            $roles .= '<span class="about-prologue__role-chip">' . $this->esc($r) . '</span>';
        }
        $mq = '';
        foreach (($heroBlock['content']['roles'] ?? ['Creative Direction', 'Experience Design', 'Immersive Technology', 'Visual Storytelling']) as $r) {
            $mq .= '<span>' . $this->esc($r) . '</span><span class="about-prologue__mq-dot" aria-hidden="true">✦</span>';
        }
        return <<<HTML
    <section class="about-prologue t-dark" id="prologue" aria-label="About — opening frame">
      <div class="about-prologue__blueprint" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="container about-prologue__inner">
        <div class="about-prologue__meta" data-reveal>
          <span>About / The first frame</span>
          <span>2014 — Now</span>
        </div>
        <div class="about-prologue__composition">
          <div class="about-prologue__frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <h1 class="about-prologue__title">
            <span class="about-prologue__line about-prologue__word"><span class="about-prologue__word-in">{$l1}</span></span>
            <span class="about-prologue__line about-prologue__line--shift about-prologue__word"><span class="about-prologue__word-in">{$l2}</span></span>
            <span class="about-prologue__line about-prologue__line--outline about-prologue__word"><span class="about-prologue__word-in">{$l3}</span></span>
          </h1>
          <p class="about-prologue__lede" data-reveal style="--d:.42s">{$lede}</p>
        </div>
        <div class="about-prologue__footer">
          <p class="about-prologue__roles" data-reveal style="--d:.5s">{$roles}</p>
          <p class="about-prologue__skip" data-reveal style="--d:.65s"><a href="#act-01"><span>Enter the story</span><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 3v11M4.5 10 9 14.5 13.5 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a></p>
        </div>
      </div>
      <div class="about-prologue__mq" aria-hidden="true"><div class="about-prologue__mq-track">{$mq}{$mq}</div></div>
    </section>
HTML;
    }

    /** Act 01 — Frame. A summary of the person, always visible on the page. */
    /** The identity hub — the summary carries the substance (per master spec). */
    private function aboutFrame(array $act, array $opening, ?array $portraitBlock): string
    {
        $txt = (string)($act['act']['content']['text'] ?? '');
        $name = $txt;
        if (preg_match('/^\d+\s*·\s*(.+)$/u', $txt, $m)) $name = trim($m[1]);
        $note = (string)($act['act']['content']['note'] ?? '');
        // the identity portrait (About-page asset — approved identity image)
        $portraitSrc = 'media/hero-portrait.webp';
        $portraitCap = 'Abhijeet Varghese — Creative Director & Experience Designer';
        $portraitAlt = 'Editorial portrait of Abhijeet Varghese';
        if ($portraitBlock !== null) {
            $portraitSrc = (string)($portraitBlock['content']['src'] ?? $portraitSrc);
            $portraitCap = (string)($portraitBlock['content']['caption'] ?? $portraitCap);
            $portraitAlt = (string)($portraitBlock['content']['alt'] ?? $portraitAlt);
        }
        $portrait = $this->media($portraitSrc);
        // identity + manifesto copy (spec, concise — the Summary is the substance)
        $courses = [
            'What Is the Metaverse — Meta',
            'Digital Business Strategy — University of Virginia',
            'Digital Transformation — Specialization',
        ];
        $territories = ['Creative Direction','Experience Design','Immersive Experiences','Visual Storytelling','Motion','Spatial / Environmental Experiences','Brand Experiences','Creative Leadership','Production & Execution'];
        $coursesHtml = '';
        foreach ($courses as $c) $coursesHtml .= '<li>' . $this->esc($c) . '</li>';
        $terrHtml = '';
        foreach ($territories as $t) $terrHtml .= '<li>' . $this->esc($t) . '</li>';
        // kinetic band — the chain/zoom paragraphs stay in the summary
        $zoomImg = $this->media('media/about/about-environment.webp');
        $zoomDims = $this->imageSizeAttrs($zoomImg);
        $zoomHtml = <<<HTML
        <div class="about-zoomstage" id="aboutZoomStage" aria-hidden="true">
          <p class="about-zoomstage__eyebrow" data-reveal><span class="chapter__rule"></span><span class="chapter__tag">The zoom-out</span></p>
          <div class="about-zoomstage__viewport">
            <div class="about-zoomstage__ghost" id="aboutZoomGhost1" aria-hidden="true"><img src="{$zoomImg}" alt=""{$zoomDims} loading="lazy" decoding="async"></div>
            <div class="about-zoomstage__ghost" id="aboutZoomGhost2" aria-hidden="true"><img src="{$zoomImg}" alt=""{$zoomDims} loading="lazy" decoding="async"></div>
            <div class="about-zoomstage__frame" id="aboutZoomFrame">
              <img src="{$zoomImg}" alt=""{$zoomDims} loading="lazy" decoding="async">
            </div>
          </div>
          <ol class="about-zoomstage__labels" id="aboutZoomLabels">
            <li data-zoom="1"><span>01</span>Frame</li>
            <li data-zoom="2"><span>02</span>Interaction</li>
            <li data-zoom="3"><span>03</span>Environment</li>
            <li data-zoom="4"><span>04</span>Experience</li>
          </ol>
        </div>
HTML;
        return <<<HTML
    <section class="about-frame t-light" id="act-01" data-act="01" aria-label="About — identity">
      <div class="container">
        <!-- identity column — logo · name · role · positioning -->
        <!-- identity + manifesto + portrait — one asymmetric editorial spread:
             the manifesto leads at giant scale, the portrait bleeds off the
             right edge like a film still leaving the frame -->
        <div class="about-frame__spread">
          <div class="about-frame__manifesto">
            <h2 class="about-frame__statement" data-reveal>I design experiences<br><em>by thinking beyond the frame.</em></h2>
            <div class="about-frame__bio" data-reveal-group data-dbase=".12">
              <div class="about-frame__beat" data-reveal>
                <span class="about-frame__beat-num" aria-hidden="true">01</span>
                <p>I started in VFX and animation, learning to think through frames, movement, composition and visual storytelling.</p>
              </div>
              <div class="about-frame__beat" data-reveal style="--d:.1s">
                <span class="about-frame__beat-num" aria-hidden="true">02</span>
                <p>Over time, the frame became interaction, interaction became environment, and environment became the whole experience.</p>
              </div>
              <div class="about-frame__beat" data-reveal style="--d:.2s">
                <span class="about-frame__beat-num" aria-hidden="true">03</span>
                <p>Today, I work across creative direction, experience design, immersive technology, visual storytelling and execution — turning complex ideas into experiences people can understand, feel and remember.</p>
              </div>
            </div>
            <p class="about-frame__question" data-reveal>How should this be <em>experienced?</em></p>
          </div>
          <!-- portrait — the visual object, bleeding off the right edge -->
          <figure class="about-frame__portrait" data-reveal="portrait">
            <span class="about-frame__portrait-frame" aria-hidden="true"></span>
            <img src="{$this->esc($portrait)}" alt="{$this->esc($portraitAlt)}" width="1024" height="1024" loading="lazy" decoding="async">
          </figure>
        </div>
        <!-- the numbers — editorial, not cards -->
        <div class="about-frame__nums" aria-label="By the numbers">
          <div class="about-frame__num" data-reveal><strong data-count="12" data-suffix="+"><span class="about-frame__num-val">12</span><span>+</span></strong><span>Years of practice</span></div>
          <div class="about-frame__num" data-reveal style="--d:.1s"><strong data-count="65" data-suffix="+"><span class="about-frame__num-val">65</span><span>+</span></strong><span>Clients served</span></div>
          <div class="about-frame__num" data-reveal style="--d:.2s"><strong data-count="100" data-suffix="+"><span class="about-frame__num-val">100</span><span>+</span></strong><span>Projects delivered</span></div>
        </div>
        <!-- education · learning · territories -->
        <div class="about-frame__facts">
          <div class="about-frame__fact" data-reveal>
            <p class="about-frame__fact-label">Education</p>
            <p class="about-frame__fact-line">BA — VFX &amp; Animation</p>
          </div>
          <div class="about-frame__fact" data-reveal style="--d:.08s">
            <p class="about-frame__fact-label">Continuously learning</p>
            <ul class="about-frame__list">{$coursesHtml}</ul>
          </div>
          <div class="about-frame__fact" data-reveal style="--d:.16s">
            <p class="about-frame__fact-label">Works across</p>
            <ul class="about-frame__list about-frame__list--cols">{$terrHtml}</ul>
          </div>
        </div>
        <!-- creative-first positioning -->
        <div class="about-frame__credo">
          <h3 class="about-frame__credo-title" data-reveal>I'm a creative person first.</h3>
          <p class="about-frame__credo-lines" data-reveal>
            Technology is part of my vocabulary.<br>
            Design is part of my foundation.<br>
            Animation is part of how I think.<br>
            <em>Experience is where they come together.</em>
          </p>
        </div>
        {$zoomHtml}
      </div>
    </section>
HTML;
    }

    /** THE EVOLUTION — six consecutive film frames. Fully scrapped from
        the accordion: every chapter is now a full-bleed scene you scroll
        through — the still is the backdrop, world-light veils it, the
        numeral floats over the film, the content sits directly on the
        frame. Interludes remain as title cards. */
    private function aboutAccordion(array $acts, array $roles = []): string
    {
        // Latest About treatment: a scroll-choreographed 3D film stack.
        // The first six cards are generated from the CMS act blocks; the two
        // epic quotes become cards 07–08. This keeps publish output aligned
        // with the approved design source instead of reverting to old scenes.
        $cards = [];
        $epics = [];
        foreach ($acts as $scan) {
            foreach (($scan['blocks'] ?? []) as $b) {
                if (($b['type'] ?? '') === 'quote' && (($b['content']['variant'] ?? '') === 'epic')) {
                    $epics[] = trim((string)($b['content']['text'] ?? ''));
                }
            }
        }

        $worlds = [
            1 => 'motion', 2 => 'interaction', 3 => 'environment',
            4 => 'experience', 5 => 'people', 6 => 'leadership',
        ];
        $images = [
            1 => 'media/about/about-motion.webp',
            2 => 'media/about/about-experience.webp',
            3 => 'media/about/about-environment.webp',
            4 => 'media/about/about-experience.webp',
            5 => 'media/about/about-people.webp',
            6 => 'media/about/about-leadership.webp',
        ];
        // Optical line breaks for the six approved headlines. The words still
        // come from CMS content, so copy edits remain publishable.
        $cuts = [
            1 => [2, 2], 2 => [2, 2], 3 => [2, 2],
            4 => [2, 2], 5 => [2, 2], 6 => [3, 3],
        ];
        $splitTitle = function (string $text, array $breaks): string {
            $plain = trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($text), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
            $words = preg_split('/\s+/u', $plain) ?: [];
            $lines = [];
            $offset = 0;
            foreach ($breaks as $take) {
                if ($offset >= count($words)) break;
                $lines[] = implode(' ', array_slice($words, $offset, $take));
                $offset += $take;
            }
            if ($offset < count($words)) $lines[] = implode(' ', array_slice($words, $offset));
            while (count($lines) < 3) $lines[] = '';
            return implode('', array_map(fn($line) => '<span>' . $this->esc($line) . ' </span>', array_slice($lines, 0, 3)));
        };

        foreach (array_slice($acts, 0, 6) as $i => $act) {
            $idx = $i + 1;
            $raw = trim((string)($act['act']['content']['text'] ?? ''));
            if (preg_match('/^(\d+)\s*·/', $raw, $m)) $idx = max(1, min(6, (int)$m[1]));
            $num = str_pad((string)$idx, 2, '0', STR_PAD_LEFT);
            $name = $raw;
            if (preg_match('/^\d+\s*·\s*(.+)$/u', $raw, $m)) $name = trim($m[1]);
            $note = trim((string)($act['act']['content']['note'] ?? ''));
            $world = $worlds[$idx] ?? 'motion';

            $label = '';
            $headline = '';
            $description = '';
            $statement = '';
            $hasDuo = false;
            $systemItems = [];

            foreach (($act['blocks'] ?? []) as $b) {
                $type = $b['type'] ?? '';
                $variant = $b['content']['variant'] ?? '';
                if ($type === 'prose') {
                    if ($label === '' && !empty($b['content']['label'])) {
                        $label = trim((string)$b['content']['label']);
                    }
                    foreach ((array)($b['content']['paragraphs'] ?? []) as $paragraph) {
                        $rawParagraph = (string)$paragraph;
                        $plain = trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($rawParagraph), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
                        if (str_contains($rawParagraph, 'about-duo') || (str_contains($plain, 'Does it look good?') && str_contains($plain, 'Does it work?'))) {
                            $hasDuo = true;
                            continue;
                        }
                        if ($headline === '') $headline = $plain;
                        elseif ($description === '') $description = $plain;
                    }
                } elseif ($type === 'quote' && $variant === 'statement' && $idx !== 6 && $statement === '') {
                    $statement = trim((string)($b['content']['text'] ?? ''));
                } elseif ($type === 'list' && (($b['content']['style'] ?? '') === 'system')) {
                    $systemItems = array_values(array_filter(array_map('strval', (array)($b['content']['items'] ?? []))));
                }
            }

            $titleHtml = $splitTitle($headline, $cuts[$idx] ?? [2, 2]);
            $image = $this->media($images[$idx] ?? $images[1]);
            $extras = '';
            if ($statement !== '') {
                $extras .= '<p class="about-evo3d__stmt">' . $this->esc($statement) . '</p>';
            }
            if ($systemItems) {
                $lis = '';
                foreach ($systemItems as $item) $lis .= '<li>' . $this->esc($item) . '</li>';
                $extras .= '<ol class="about-evo3d__system">' . $lis . '</ol>';
            }
            if ($idx === 6 && $hasDuo) {
                $extras .= '<p class="about-evo3d__duo"><span>Does it look good?</span><strong>Does it <em>work?</em></strong></p>';
            }
            $extrasLine = $extras !== '' ? "\n            " . $extras : '';

            $cards[] = <<<HTML
        <article class="about-evo3d__card about-act" data-act="{$num}" data-world="{$world}">
          <img class="about-evo3d__image" src="{$this->esc($image)}" alt="{$this->esc($name)} — dedicated About visual" width="1312" height="816" loading="lazy" decoding="async">
          <div class="about-evo3d__overlay" aria-hidden="true"></div>
          <div class="about-evo3d__gradient" aria-hidden="true"></div>
          <div class="about-evo3d__edge" aria-hidden="true"></div>
          <div class="about-evo3d__shadow" aria-hidden="true"></div>
          <div class="about-evo3d__hinge" aria-hidden="true"></div>
          <div class="about-evo3d__meta" aria-hidden="true"><span class="about-evo3d__meta-line"></span><span>{$this->esc($name)}</span></div>
          <div class="about-evo3d__category">{$this->esc($label)}</div>
          <div class="about-evo3d__content">
            <p class="about-evo3d__note">{$this->esc($note)}</p>
            <h3 class="about-evo3d__title">{$titleHtml}</h3>
            <p class="about-evo3d__desc">{$this->esc($description)}</p>{$extrasLine}
          </div>
        </article>
HTML;
        }

        $epicDefaults = [
            'THE DISTANCE BETWEEN THE IDEA AND REALITY.',
            'GOOD IDEAS HAVE TO SURVIVE REALITY.',
        ];
        $epicNotes = ['The distance', 'The survival'];
        $epicCuts = [[3, 3], [2, 2]];
        for ($i = 0; $i < 2; $i++) {
            $num = str_pad((string)($i + 7), 2, '0', STR_PAD_LEFT);
            $text = $epics[$i] ?? $epicDefaults[$i];
            $titleHtml = $splitTitle($text, $epicCuts[$i]);
            $cards[] = <<<HTML
        <article class="about-evo3d__card about-evo3d__card--interlude" data-act="{$num}" data-world="interlude">
          <div class="about-evo3d__gradient" aria-hidden="true"></div>
          <div class="about-evo3d__edge" aria-hidden="true"></div>
          <div class="about-evo3d__shadow" aria-hidden="true"></div>
          <div class="about-evo3d__hinge" aria-hidden="true"></div>
          <div class="about-evo3d__meta" aria-hidden="true"><span class="about-evo3d__meta-line"></span><span>Interlude</span></div>
          <div class="about-evo3d__content">
            <p class="about-evo3d__note">{$epicNotes[$i]}</p>
            <h3 class="about-evo3d__title about-evo3d__title--serif">{$titleHtml}</h3>
            <p class="about-evo3d__mark" aria-hidden="true">✦ ✦ ✦</p>
          </div>
        </article>
HTML;
        }

        return <<<HTML
    <section class="about-acts about-evo3d t-dark" id="acts" aria-label="The evolution">
      <div class="container about-evo3d__head">
        <header class="about-acts__head">
          <div class="chapter__meta" data-reveal><span class="chapter__num">✦</span><span class="chapter__rule"></span><span class="chapter__tag">The Evolution</span></div>
          <h2 class="chapter__title" data-reveal>The frame<br><em>kept getting bigger.</em></h2>
          <p class="about-acts__hint" data-reveal>What started with images gradually became a way of thinking about interactions, spaces, systems and people.</p>
        </header>
        <p class="about-acts__meta" aria-hidden="true">08 Frames</p>
      </div>
      <div class="about-evo3d__scroll">
        <div class="about-evo3d__stage">
          <div class="about-evo3d__camera">
            <div class="about-evo3d__world">
{$this->join($cards)}
            </div>
          </div>
        </div>
      </div>
    </section>
HTML;
    }


    /** A full-bleed epic statement — a silent-film intertitle between chapters. */
    private function aboutInterlude(array $b): string
    {
        $text = $this->esc((string)($b['content']['text'] ?? ''));
        return <<<HTML
    <div class="about-interlude" data-reveal>
      <div class="container">
        <span class="about-interlude__label" aria-hidden="true">Interlude</span>
        <span class="about-interlude__rule" aria-hidden="true"></span>
        <p class="about-interlude__text" data-parallax="0.1">{$text}</p>
        <span class="about-interlude__mark" aria-hidden="true">✦ ✦ ✦</span>
      </div>
    </div>
HTML;
    }

    /** The closing movement — philosophy · what I do · now · still curious · credits. */
    private function aboutCredits(?array $ctaBlock, ?array $finaleQuote, ?array $portrait, array $roles = []): string
    {
        $arrow = self::ARROW;

        // What I actually do — deliberately unnumbered, minimal directory.
        $whatItems = ['Films', 'Interactive Experiences', 'VR/XR', 'Experience Centres', 'Physical Installations', 'Brand Systems'];
        $whatList = '';
        foreach ($whatItems as $wi => $item) {
            $whatList .= '<li data-reveal style="--d:' . ($wi * 0.07) . 's">'
                . '<span class="about-what__item">' . $this->esc($item) . '</span></li>';
        }
        $what = '<section class="about-what t-light" aria-label="What I actually do"><div class="container about-what__grid">'
            . '<div class="about-what__head">'
            . '<p class="about-what__eyebrow" data-reveal><span class="chapter__rule"></span><span class="chapter__tag">What I actually do</span></p>'
            . '<h2 class="about-what__title" data-reveal>I take complicated things<br><em>and figure out how people should experience them.</em></h2>'
            . '</div><ol class="about-what__list">' . $whatList . '</ol></div></section>';

        // Now — editorial split: statement left, quiet ruled copy right.
        $now = '<section class="about-now t-dark" aria-label="Now"><div class="container about-now__grid">'
            . '<div class="about-now__head">'
            . '<p class="about-now__eyebrow" data-reveal><span class="chapter__rule"></span><span class="chapter__tag">Now</span></p>'
            . '<h2 class="about-now__title" data-reveal>Hard problems.<br>Ambitious ideas.<br><em>Experiences with a reason to exist.</em></h2>'
            . '</div><p class="about-now__copy" data-reveal>I\'m interested in work where design, technology, story and people have to come together — and where the idea matters as much as the execution.</p>'
            . '</div></section>';

        $curious = '<section class="about-curious t-light" aria-label="Still curious"><div class="container">'
            . '<h2 class="about-curious__title" data-reveal>Still curious.</h2>'
            . '<ul class="about-curious__list" data-reveal-group data-dbase=".1">'
            . '<li data-reveal>Still learning.</li>'
            . '<li data-reveal>Still looking at films differently.</li>'
            . '<li data-reveal>Still noticing how spaces work.</li>'
            . '<li data-reveal>Still getting distracted by interesting interfaces.</li>'
            . '<li data-reveal>Still curious about what technology can become.</li>'
            . '</ul>'
            . '<p class="about-curious__note" data-reveal>That\'s probably what hasn\'t changed.</p>'
            . '</div></section>';

        $quote = $finaleQuote !== null ? $this->v($finaleQuote, 'content', 'text', "That's the work I'm interested in.") : "That's the work I'm interested in.";
        $sig = $ctaBlock !== null ? $this->v($ctaBlock, 'content', 'title', '— Abhijeet Varghese') : '— Abhijeet Varghese';
        $role = $ctaBlock !== null ? $this->v($ctaBlock, 'content', 'role', '') : '';
        $text = $ctaBlock !== null ? $this->v($ctaBlock, 'content', 'text', '') : '';
        $roleHtml = $role !== '' ? '<p class="about-credits__role" data-reveal>' . $this->esc($role) . '</p>' : '';
        $textHtml = $text !== '' ? '<p class="about-credits__text" data-reveal>' . $this->esc($text) . '</p>' : '';
        $btn = ($ctaBlock !== null && !empty($ctaBlock['content']['button']))
            ? '<a class="btn btn--accent" href="' . $this->esc($ctaBlock['content']['href'] ?? 'contact.html') . '">' . $this->esc($ctaBlock['content']['button']) . ' ' . $arrow . '</a>'
            : '';

        return $what . $now . $curious . <<<HTML
    <section class="about-credits t-light" id="credits" aria-label="Credits">
      <div class="container about-credits__inner">
        <span class="about-credits__rule" aria-hidden="true" data-reveal></span>
        <p class="about-credits__quote" data-reveal>{$this->esc($quote)}</p>
        {$roleHtml}
        {$textHtml}
        <p class="about-credits__sig" data-reveal>{$this->esc($sig)}</p>
        <p class="about-credits__cta" data-reveal>{$btn}</p>
      </div>
    </section>
HTML;
    }

    /** Narrative prose — plain paragraphs; authored moments (chain/zoom/duo) pass through. */
    private function aboutProse(array $b): string
    {
        $out = [];
        foreach (($b['content']['paragraphs'] ?? []) as $p) {
            if (preg_match('/^<p[\s>]/', $p)) {
                // inject data-reveal without corrupting the tag (bare <p> or <p class=…>)
                $out[] = preg_replace('/^<p(\s+[^>]*)?>/', '<p$1 data-reveal>', $p, 1);
            } else {
                $out[] = '<p data-reveal>' . $p . '</p>';
            }
        }
        if (!$out) return '';
        return '<div class="about-prose" data-reveal-group data-dbase=".08">' . $this->join($out) . '</div>';
    }

    /** A cinematic frame — real work imagery, homepage language. */
    private function aboutFigure(array $b): string
    {
        $src = $this->media($b['content']['src'] ?? '');
        $mode = (string)($b['content']['mode'] ?? 'wide');
        if (!in_array($mode, ['wide', 'bleed', 'tall'], true)) $mode = 'wide';
        return '<figure class="about-figure about-figure--' . $mode . '" data-parallax="0.04" data-reveal="img"><img src="' . $this->esc($src) . '" alt="' . $this->esc($this->v($b, 'content', 'alt', '')) . '" width="1536" height="1024" loading="lazy" decoding="async"><figcaption>' . $this->esc($this->v($b, 'content', 'caption', '')) . '</figcaption></figure>';
    }

    /** Statements — theme-aware typographic moments (epic breaks out as a band). */
    private function aboutQuote(array $b): string
    {
        $text = $b['content']['text'] ?? '';
        $variant = (string)($b['content']['variant'] ?? '');
        $caps = mb_strtoupper($text) === $text && preg_match('/[A-Z]{3,}/', $text);
        if ($variant === '' && $caps) $variant = 'statement';
        if ($variant === '') $variant = 'serif';
        if ($variant === 'act') $variant = 'statement';
        if ($variant === 'epic') {
            return '<section class="about-body--epic t-dark"><div class="container"><p class="about-statement about-statement--epic" data-reveal>' . $text . '</p></div></section>';
        }
        $map = [
            'serif' => 'about-statement--serif',
            'question' => 'about-statement--question',
            'signature' => 'about-statement--signature',
            'finale' => 'about-statement--finale',
        ];
        $cls = 'about-statement' . (isset($map[$variant]) ? ' ' . $map[$variant] : '');
        return '<p class="' . $cls . '" data-reveal>' . $text . '</p>';
    }

    /** Editorial list — quiet rows with hairlines. */
    private function aboutList(array $b): string
    {
        $items = [];
        $style = (string)($b['content']['style'] ?? '');
        if ($style === 'system') {
            foreach (($b['content']['items'] ?? []) as $i => $it) {
                $items[] = '<li data-reveal style="--d:' . ($i * 0.08) . 's"><span class="about-system__num">' . str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT) . '</span><span class="about-system__name">' . $this->esc($it) . '</span></li>';
            }
            return '<ol class="about-system" data-reveal-group>' . $this->join($items) . '</ol>';
        }
        foreach (($b['content']['items'] ?? []) as $it) {
            $items[] = '<li data-reveal>' . $this->esc($it) . '</li>';
        }
        if (!$items) return '';
        $questions = ($style === 'questions');
        $cls = $questions ? 'about-list about-list--questions' : 'about-list';
        return '<ul class="' . $cls . '" data-reveal-group data-dbase=".12">' . $this->join($items) . '</ul>';
    }

    /** Clients — the homepage logo wall. */
    private function aboutClients(array $b): string
    {
        $ids = $b['content']['ids'] ?? [];
        $tiles = [];
        foreach (($this->site['clients'] ?? []) as $c) {
            if (empty($c['logo'])) continue;
            if ($ids && !in_array($c['id'], $ids, true)) continue;
            $tiles[] = '<li class="logo-tile" data-reveal><img src="assets/logos/' . $this->esc($c['logo']) . '" alt="' . $this->esc($c['name']) . '" width="160" height="48" loading="lazy" decoding="async"></li>';
        }
        if (!$tiles) return '';
        $label = $this->v($b, 'content', 'title', '');
        $labelHtml = $label !== '' ? '<p class="about-clients__label" data-reveal>' . $this->esc($label) . '</p>' : '';
        return '<div class="about-clients-wrap">' . $labelHtml . '<ul class="logo-wall" data-reveal-group aria-label="Selected organisations">' . $this->join($tiles) . '</ul></div>';
    }

    /* ============================================================
       EXPERIENCE — editorial employment record (v2.4.18 immersive).
       Scoped entirely under body.experience-page. Employment data
       is CMS-managed via job blocks (Admin → Pages → Layout).
       ============================================================ */
    private function renderExperience(array $page, array $s, array $nav): string
    {
        $body = [];
        // opening — cinematic, restrained
        $kicker = (string)($page['kicker'] ?? 'Experience');
        $title = (string)($page['title'] ?? 'Experience');
        $lede = (string)($page['lede'] ?? '');
        $arrow = self::ARROW;
        $body[] = <<<HTML
    <section class="exp-hero t-dark" aria-label="{$this->esc($kicker)}">
      <div class="exp-hero__grid container">
        <div class="exp-hero__copy">
          <div class="chapter__meta" data-reveal>
            <span class="chapter__num">✦</span><span class="chapter__rule"></span><span class="chapter__tag">{$this->esc($kicker)}</span>
          </div>
          <h1 class="exp-hero__title" data-reveal style="--d:.15s">{$this->esc($title)}</h1>
          <p class="exp-hero__lede" data-reveal style="--d:.25s">{$this->esc($lede)}</p>
          <div class="exp-hero__meta" data-reveal style="--d:.35s">
            <span>Six roles</span><i aria-hidden="true"></i><span>2014 — 2026</span><i aria-hidden="true"></i><span>Creative Direction &amp; Experience Design</span>
          </div>
        </div>
        <div class="exp-hero__big" aria-hidden="true" data-reveal style="--d:.2s">06</div>
      </div>
    </section>
HTML;

        // the record
        $jobs = [];
        foreach (($page['blocks'] ?? []) as $b) {
            if (($b['type'] ?? '') === 'job') $jobs[] = $b;
        }
        $total = count($jobs);
        $body[] = '<section class="exp-record t-light"><div class="container"><div class="exp-timeline" id="expTimeline">';
        foreach ($jobs as $i => $job) {
            $body[] = $this->expJob($job, $i, $total);
        }
        $body[] = '</div></div></section>';

        // closing CTA
        foreach (($page['blocks'] ?? []) as $b) {
            if (($b['type'] ?? '') === 'cta') {
                $body[] = <<<HTML
    <section class="exp-closing t-dark">
      <div class="container">
        <div class="exp-closing__inner">
          <span class="exp-closing__rule" aria-hidden="true" data-reveal></span>
          <h2 data-reveal>{$this->esc($this->v($b, 'content', 'title', 'Now, the work.'))}</h2>
          <p data-reveal>{$this->esc($this->v($b, 'content', 'text', 'The roles are the record — the work is the evidence.'))}</p>
          <p data-reveal><a class="btn btn--accent" href="{$this->esc($this->v($b, 'content', 'href', 'case-studies.html'))}">{$this->esc($this->v($b, 'content', 'button', 'Explore the work'))} {$arrow}</a></p>
        </div>
      </div>
    </section>
HTML;
            }
        }

        $seo = $page['seo'] ?? [];
        $title = $seo['title'] ?? ($page['title'] . ' — ' . ($s['siteName'] ?? ''));
        $desc = $seo['desc'] ?? ($s['metaDescription'] ?? '');
        $ld = json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'ProfilePage',
            'name' => $s['siteName'] ?? '',
            'url' => AV_SITE_URL . '/' . $page['slug'] . '.html',
            'inLanguage' => 'en',
            'description' => $desc,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $this->shell($s, $nav, $title, $desc, $page['slug'] . '.html', $this->join($body), $page['slug'], 'website', null, $ld, 'experience-page');
    }

    /** One employment entry. */
    private function expJob(array $job, int $i, int $total): string
    {
        $c = $job['content'] ?? [];
        $company = (string)($c['company'] ?? '');
        $role = (string)($c['role'] ?? '');
        $roleSub = (string)($c['role_sub'] ?? '');
        $dates = (string)($c['dates'] ?? '');
        $location = (string)($c['location'] ?? '');
        $summary = (string)($c['summary'] ?? '');
        $disciplines = array_values(array_filter(array_map('trim', (array)($c['disciplines'] ?? []))));
        $responsibilities = array_values(array_filter(array_map('trim', (array)($c['responsibilities'] ?? []))));
        $image = (string)($c['image'] ?? '');

        // discipline strip — small caps, slash separators (no pill tags)
        $disc = '';
        if ($disciplines) {
            $parts = [];
            foreach ($disciplines as $d) $parts[] = '<span>' . $this->esc($d) . '</span>';
            $disc = '<p class="exp-job__disc">' . implode('<i aria-hidden="true"></i>', $parts) . '</p>';
        }

        // responsibilities — first 6 visible, the rest behind an elegant
        // "VIEW ALL RESPONSIBILITIES" toggle (aria-expanded, keyboard-safe)
        $show = array_slice($responsibilities, 0, 6);
        $rest = array_slice($responsibilities, 6);
        $vis = '';
        foreach ($show as $r) $vis .= '<li>' . $this->esc($r) . '</li>';
        $hid = '';
        foreach ($rest as $r) $hid .= '<li>' . $this->esc($r) . '</li>';
        $moreBtn = $rest ? '<button type="button" class="exp-job__more" aria-expanded="false" aria-controls="exp-more-' . $i . '">View all responsibilities <span class="exp-job__more-arrow">+</span></button>' : '';
        $moreList = $rest ? '<ul class="exp-job__list is-hidden" id="exp-more-' . $i . '" hidden>' . $hid . '</ul>' : '';

        $loc = $location !== '' ? ' <span class="exp-job__loc">' . $this->esc($location) . '</span>' : '';
        $roleSub = $roleSub !== ''
            ? '<p class="exp-job__role-sub">' . $this->esc($roleSub) . '</p>'
            : '';
        $imageSrc = $image !== '' ? $this->media($image) : '';
        $img = $imageSrc !== ''
            ? '<figure class="exp-job__img" data-reveal="img"><img src="' . $this->esc($imageSrc) . '" alt="' . $this->esc($c['alt'] ?? $company . ' — ' . $role) . '"' . $this->imageSizeAttrs($imageSrc) . ' loading="lazy" decoding="async"></figure>'
            : '';

        $isFirst = $i === 0;
        $cls = 'exp-job' . ($isFirst ? ' exp-job--lead' : '') . ($i === $total - 1 ? ' exp-job--last' : '');

        return <<<HTML
      <article class="{$cls}" data-reveal>
        <div class="exp-job__rail" aria-hidden="true"></div>
        <div class="exp-job__date"><time>{$this->esc($dates)}</time></div>
        <div class="exp-job__main">
          <h2 class="exp-job__role">{$this->esc($role)}</h2>
          {$roleSub}
          {$img}
          <p class="exp-job__company">{$this->esc($company)}{$loc}</p>
          <p class="exp-job__summary">{$this->esc($summary)}</p>
          <p class="exp-job__disc-label" aria-hidden="true">Disciplines</p>
          {$disc}
          <p class="exp-job__resp-label" id="exp-label-{$i}">Responsibilities</p>
          <ul class="exp-job__list" aria-labelledby="exp-label-{$i}">{$vis}</ul>
          {$moreList}
          {$moreBtn}
        </div>
      </article>
HTML;
    }


    /* ---------- articles ---------- */
    private function mdLite(string $body): string
    {
        $out = [];
        foreach (preg_split('/\R/', $body) as $line) {
            $t = trim($line);
            if ($t === '') { $out[] = '<p>&nbsp;</p>'; continue; }
            if (str_starts_with($t, '## ')) $out[] = '<h3>' . $this->esc(substr($t, 3)) . '</h3>';
            elseif (str_starts_with($t, '> ')) $out[] = '<blockquote class="pull-quote">“' . $this->esc(substr($t, 2)) . '”</blockquote>';
            elseif (preg_match('/^[-*] /', $t)) $out[] = '<ul><li>' . $this->esc(substr($t, 2)) . '</li></ul>';
            else $out[] = '<p>' . $this->esc($t) . '</p>';
        }
        return $this->join($out);
    }

    private function renderArticle(array $a, array $s, array $nav): string
    {
        $arrow = self::ARROW;
        $siteUrl = AV_SITE_URL;
        $slug = $a['slug'] ?? $this->slugify($a['title'] ?? '');
        $file = ($a['type'] ?? 'essay') === 'essay' ? 'essay-' : 'journal-';
        $file .= $slug . '.html';
        $img = $this->media($a['image'] ?? '');
        $back = ($a['type'] ?? 'essay') === 'essay' ? 'insights.html' : 'journal.html';
        $backLabel = ($a['type'] ?? 'essay') === 'essay' ? 'All insights' : 'All journal entries';
        $body = <<<HTML
    <section class="article-hero">
      <img class="article-hero__img" src="{$this->esc($img)}" alt="Artwork for “{$this->esc($this->v($a, 'title', ''))}”" width="1376" height="768" fetchpriority="high" decoding="async">
      <div class="article-hero__veil" aria-hidden="true"></div>
      <div class="container article-hero__inner">
        <div class="chapter__meta" data-reveal>
          <span class="chapter__num">✦</span><span class="chapter__rule"></span>
          <span class="chapter__tag">{$this->esc($this->v($a, 'category', ''))} · {$this->esc($this->v($a, 'readTime', ''))}</span>
        </div>
        <h1 class="article-hero__title" data-reveal style="--d:.1s">{$this->esc($this->v($a, 'title', ''))}</h1>
        <p class="article-hero__lede" data-reveal style="--d:.2s">{$this->esc($this->v($a, 'excerpt', ''))}</p>
      </div>
    </section>
    <section class="article-body t-light">
      <div class="container">
        <div class="prose" data-reveal-group data-dbase=".15">
          {$this->mdLite($this->v($a, 'body', ''))}
        </div>
        <div class="article-foot" data-reveal>
          <p style="color:var(--cm);font-size:0.95rem">By <strong style="color:var(--ct)">{$this->esc($this->v($s, 'siteName', 'Abhijeet Varghese'))}</strong> · {$this->esc($this->v($a, 'date', ''))}</p>
          <div style="display:flex;gap:14px;flex-wrap:wrap">
            <a class="link-arrow" href="{$back}">← {$backLabel}</a>
            <a class="link-arrow" href="contact.html">Start a conversation {$arrow}</a>
          </div>
        </div>
      </div>
    </section>
HTML;
        $body .= $this->relatedSection($a, 'article', (string)($a['id'] ?? ''));
        $seo = $a['seo'] ?? [];
        $title = $seo['title'] ?? (preg_replace('/<[^>]+>/', '', $a['title'] ?? '') . ' — ' . ($s['siteName'] ?? ''));
        $description = $seo['desc'] ?? ($a['excerpt'] ?? '');
        $ld = json_encode([
            '@context' => 'https://schema.org', '@type' => 'Article',
            'headline' => preg_replace('/<[^>]+>/', '', $a['title'] ?? ''),
            'author' => ['@type' => 'Person', 'name' => $s['siteName'] ?? ''],
            'datePublished' => $a['date'] ?? '', 'image' => $siteUrl . '/' . $img,
            'url' => $siteUrl . '/' . $file, 'inLanguage' => 'en',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $this->shell($s, $nav, $title, $description, $file, $body, ($a['type'] ?? 'essay') === 'essay' ? 'insights' : 'journal', 'article', $img, $ld);
    }

    /* ---------- site search: index + page ---------- */
    private function searchIndex(): string
    {
        $siteUrl = AV_SITE_URL;
        $items = [];
        foreach (($this->site['pages'] ?? []) as $p) {
            if (!$this->isDue($p) || in_array($p['slug'] ?? '', ['', 'home', 'index'], true)) continue;
            $items[] = ['type' => 'Page', 'title' => strip_tags((string)($p['title'] ?? '')), 'excerpt' => mb_substr(strip_tags((string)($p['blocks'][0]['content']['lede'] ?? ($p['seo']['desc'] ?? ''))), 0, 180), 'url' => $p['slug'] . '.html', 'tags' => $p['seo']['keywords'] ?? []];
        }
        foreach (($this->site['projects'] ?? []) as $p) {
            if (!$this->isDue($p)) continue;
            $items[] = ['type' => 'Case Study', 'title' => strip_tags((string)($p['title'] ?? '')), 'excerpt' => mb_substr(strip_tags((string)($p['summary'] ?? ($p['seo']['desc'] ?? ''))), 0, 180), 'url' => $this->caseStudyFile($p), 'tags' => [$p['client'] ?? '']];
        }
        foreach (($this->site['articles'] ?? []) as $a) {
            if (!$this->isDue($a)) continue;
            $slug = $a['slug'] ?? $this->slugify($a['title'] ?? '');
            $file = (($a['type'] ?? 'essay') === 'essay' ? 'essay-' : 'journal-') . $slug . '.html';
            $items[] = ['type' => ($a['type'] ?? 'essay') === 'essay' ? 'Essay' : 'Journal', 'title' => strip_tags((string)($a['title'] ?? '')), 'excerpt' => mb_substr(strip_tags((string)($a['excerpt'] ?? '')), 0, 180), 'url' => $file, 'tags' => $a['tags'] ?? []];
        }
        foreach (($this->site['services'] ?? []) as $sv) {
            $items[] = ['type' => 'Service', 'title' => strip_tags((string)($sv['title'] ?? $sv['name'] ?? '')), 'excerpt' => mb_substr(strip_tags((string)($sv['desc'] ?? '')), 0, 180), 'url' => 'consulting.html', 'tags' => []];
        }
        return json_encode(['site' => $siteUrl, 'generated' => date('c'), 'items' => $items], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private function renderSearchPage(array $s, array $nav): string
    {
        $body = '
    <section class="page-hero" aria-label="Search">
      <div class="container">
        <div class="chapter__meta page-hero__meta" data-reveal>
          <span class="chapter__index">S</span>
          <span class="chapter__tag">Search</span>
        </div>
        <h1 class="page-hero__title" data-reveal>Find anything <em>on this site.</em></h1>
        <p class="page-hero__lede" data-reveal>Projects, case studies, essays and journal entries — search the whole portfolio instantly.</p>
        <div class="container" style="max-width:640px;margin-top:28px" data-reveal>
          <input type="search" id="siteSearch" placeholder="Try &ldquo;experience centre&rdquo; or &ldquo;AI&rdquo;&hellip;" aria-label="Search the site"
            style="width:100%;min-height:56px;border-radius:14px;border:1px solid var(--cl);background:var(--bg);padding:0 20px;font:inherit;font-size:16px">
          <div id="searchResults" style="margin-top:16px" aria-live="polite"></div>
        </div>
      </div>
    </section>
    <script>
    (function () {
      var input = document.getElementById("siteSearch");
      var box = document.getElementById("searchResults");
      var idx = [];
      fetch("search-index.json").then(function (r) { return r.json(); }).then(function (d) { idx = d.items || []; }).catch(function () {});
      function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return c.charCodeAt(0) === 34 ? "&quot;" : { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
      function render(q) {
        q = q.toLowerCase();
        if (q.length < 2) { box.innerHTML = ""; return; }
        var hits = idx.filter(function (i) { var tags = Array.isArray(i.tags) ? i.tags.join(" ") : String(i.tags || ""); return (i.title + " " + i.excerpt + " " + tags).toLowerCase().indexOf(q) !== -1; }).slice(0, 10);
        if (!hits.length) { box.innerHTML = "<p style=\"color:var(--ink-3);font-size:14px\">No results for \"" + esc(q) + "\". Try another term, or <a href=\"contact.html\">ask me directly</a>.</p>"; return; }
        box.innerHTML = hits.map(function (i) {
          return "<a href=\"" + esc(i.url) + "\" style=\"display:block;text-decoration:none;border-bottom:1px solid var(--cl);padding:14px 4px\">" +
            "<span style=\"font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)\">" + esc(i.type) + "</span>" +
            "<strong style=\"display:block;font-size:16px;margin:3px 0\">" + esc(i.title) + "</strong>" +
            "<span style=\"font-size:13px;color:var(--ink-3);line-height:1.5\">" + esc(i.excerpt) + "</span></a>";
        }).join("");
      }
      input.addEventListener("input", function () { render(input.value); });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") render(input.value); });
      try {
        if (window.avTrack) avTrack({ event_type: "site_search", path: location.pathname });
      } catch (e) {}
    })();
    </script>';
        return $this->shell($s, $nav, 'Search — ' . ($s['siteName'] ?? ''), 'Search the portfolio: projects, case studies, essays and journal entries.', 'search.html', $body, 'search', 'website');
    }

    /* ---------- related content (shared tags/clients — real relationships) ---------- */
    private function relatedSection(array $current, string $kind, string $currentId): string
    {
        $pool = $kind === 'article' ? ($this->site['articles'] ?? []) : ($this->site['projects'] ?? []);
        $curTags = array_map('strtolower', (array)($current['tags'] ?? []));
        $curCat = strtolower((string)($current['category'] ?? ''));
        $related = [];
        // title word overlap (words >= 5 chars, excluding stopwords) — fallback signal
        $stop = ['about', 'their', 'there', 'these', 'those', 'which', 'would', 'should', 'could', 'human', 'people', 'every'];
        $curWords = array_unique(array_filter(array_map('strtolower', preg_split('/\W+/', (string)($current['title'] ?? ''))), fn($w) => strlen($w) >= 5 && !in_array($w, $stop, true)));
        foreach ($pool as $it) {
            if (!$this->isDue($it)) continue;
            if ((string)($it['id'] ?? '') === $currentId) continue;
            $score = 0;
            if ($curCat !== '' && strtolower((string)($it['category'] ?? '')) === $curCat) $score += 3;
            foreach (array_map('strtolower', (array)($it['tags'] ?? [])) as $t) {
                if (in_array($t, $curTags, true)) $score += 2;
            }
            $itWords = array_unique(array_filter(array_map('strtolower', preg_split('/\W+/', (string)($it['title'] ?? ''))), fn($w) => strlen($w) >= 5 && !in_array($w, $stop, true)));
            foreach ($itWords as $w) {
                if (in_array($w, $curWords, true)) $score += 1;
            }
            if ($kind === 'project' && strtolower((string)($it['client'] ?? '')) === strtolower((string)($current['client'] ?? ''))) $score += 2;
            if ($score > 0) $related[] = ['item' => $it, 'score' => $score];
        }
        usort($related, fn($a, $b) => $b['score'] <=> $a['score']);
        if (!$related) return '';
        $rows = '';
        foreach (array_slice($related, 0, 3) as $r) {
            $it = $r['item'];
            if ($kind === 'article') {
                $slug = $it['slug'] ?? $this->slugify($it['title'] ?? '');
                $href = (($it['type'] ?? 'essay') === 'essay' ? 'essay-' : 'journal-') . $slug . '.html';
                $label = ($it['type'] ?? 'essay') === 'essay' ? 'Essay' : 'Journal';
            } else {
                $href = 'case-studies.html';
                $label = 'Case study';
            }
            $rows .= '<li data-reveal style="padding:10px 0;border-bottom:1px solid var(--cl)"><a class="link-arrow" href="' . $href . '">' . $this->esc(strip_tags((string)($it['title'] ?? ''))) . '<span style="font-size:11px;color:var(--ink-3);margin-left:8px">' . $label . '</span> ' . self::ARROW . '</a></li>';
        }
        return '
    <section class="page-section t-light" aria-label="Related">
      <div class="container">
        <div class="chapter__meta" data-reveal><span class="chapter__index">+</span><span class="chapter__tag">Keep reading</span></div>
        <h2 class="chapter__title" data-reveal style="font-size:1.6rem">Related <em>content.</em></h2>
        <ul style="list-style:none;margin:18px 0 0;padding:0">' . $rows . '</ul>
      </div>
    </section>';
    }

    /* ---------- sitemap + robots ---------- */
    private function sitemapXml(): string
    {
        $siteUrl = AV_SITE_URL;
        $urls = [['', 1.0]];
        foreach (($this->site['pages'] ?? []) as $p) {
            if (!$this->isDue($p)) continue;   // only published/scheduled-due — never drafts
            if (in_array($p['slug'] ?? '', ['', 'home', 'index'], true)) continue;
            $urls[] = [$p['slug'] . '.html', 0.9];
        }
        foreach (($this->site['articles'] ?? []) as $a) {
            if (!$this->isDue($a)) continue;   // never expose drafts in the public sitemap
            $slug = $a['slug'] ?? $this->slugify($a['title'] ?? '');
            $urls[] = [(($a['type'] ?? 'essay') === 'essay' ? 'essay-' : 'journal-') . $slug . '.html', 0.7];
        }
        foreach (($this->site['projects'] ?? []) as $p) {
            if (!$this->isDue($p)) continue;
            if (($p['status'] ?? 'published') !== 'published') continue;
            $urls[] = [$this->caseStudyFile($p), 0.8];
        }
        $out = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
        foreach ($urls as [$f, $p]) {
            $out[] = '  <url><loc>' . $siteUrl . '/' . $f . '</loc><changefreq>monthly</changefreq><priority>' . $p . '</priority></url>';
        }
        $out[] = '</urlset>';
        return implode("\n", $out) . "\n";
    }

    private function robotsTxt(): string
    {
        return "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /install/\n\nSitemap: " . AV_SITE_URL . "/sitemap.xml\n";
    }

    /* ---------- media sync (into the current out dir, i.e. staging) ---------- */
    private function syncMedia(array $site): int
    {
        $mediaSrc = dirname(AV_BACKEND) . '/storage/uploads';
        $needed = [];
        $walk = function ($v) use (&$walk, &$needed) {
            if (is_array($v)) {
                foreach ($v as $x) $walk($x);
                return;
            }
            if (is_string($v) && str_starts_with($v, 'media/')) $needed[] = substr($v, 6);
        };
        $walk($site);
        $count = 0;
        foreach (array_unique($needed) as $name) {
            $src = $mediaSrc . '/' . $name;
            $dst = $this->out . '/assets/' . $name;
            if (is_file($src)) {
                @mkdir(dirname($dst), 0775, true);
                copy($src, $dst);
                $count++;
            }
        }
        // copy the canonical frontend template (css/js/assets) into the site
        $tpl = AV_TEMPLATE;
        if (is_dir($tpl)) {
            foreach (['css', 'js'] as $d) {
                $s = $tpl . '/' . $d;
                if (is_dir($s)) $this->copyDir($s, $this->out . '/' . $d);
            }
            $s = $tpl . '/assets';
            if (is_dir($s)) $this->copyDir($s, $this->out . '/assets');
        }
        return $count;
    }

    private function copyDir(string $from, string $to): void
    {
        @mkdir($to, 0775, true);
        foreach (scandir($from) as $f) {
            if ($f === '.' || $f === '..') continue;
            $s = $from . '/' . $f;
            $d = $to . '/' . $f;
            if (is_dir($s)) $this->copyDir($s, $d);
            else copy($s, $d);
        }
    }

    /* ---------- main publish (atomic-ish) ---------- */
    /** Is this entity due for publishing? (published, or scheduled with due time) */
    private function isDue(array $entity): bool
    {
        $status = $entity['status'] ?? 'published';
        if ($status === 'published') return true;
        if ($status === 'scheduled') {
            $at = $entity['scheduled_at'] ?? '';
            return $at !== '' && strtotime($at) <= time();
        }
        return false;
    }

    /** Build the whole site into $dir (staging). Returns page/article counts. */
    private function buildSite(string $dir, array $site): array
    {
        $s = $site['settings'] ?? [];
        $nav = $site['nav'] ?? [];
        $prevOut = $this->out;
        $this->out = $dir;
        $pages = 0; $articles = 0;

        file_put_contents($dir . '/index.html', $this->renderHomepage());
        foreach (($site['pages'] ?? []) as $p) {
            if (!$this->isDue($p)) continue;
            $slug = $p['slug'] ?? '';
            // homepage is generated from sections — never emit /.html or index.html
            if ($slug === '' || $slug === 'home' || $slug === 'index') continue;
            file_put_contents($dir . '/' . $slug . '.html', $this->renderPage($p, $s, $nav));
            $pages++;
        }
        foreach (($site['articles'] ?? []) as $a) {
            if (!$this->isDue($a)) continue;
            $slug = $a['slug'] ?? $this->slugify($a['title'] ?? '');
            file_put_contents($dir . '/' . (($a['type'] ?? 'essay') === 'essay' ? 'essay-' : 'journal-') . $slug . '.html', $this->renderArticle($a, $s, $nav));
            $articles++;
        }
        $cases = 0;
        foreach (($site['projects'] ?? []) as $p) {
            if (!$this->isDue($p)) continue;
            if (($p['status'] ?? 'published') !== 'published') continue;
            $outputFile = $this->caseStudyOutputFile($p);
            @mkdir(dirname($dir . '/' . $outputFile), 0775, true);
            file_put_contents($dir . '/' . $outputFile, $this->renderCaseStudy($p, $s, $nav));
            $legacyPaths = $p['legacyPaths'] ?? [];
            if (($p['id'] ?? '') === 'prj-1' && !$legacyPaths) {
                $legacyPaths = ['case-study-enterprise-technology-made-understandable.html'];
            }
            foreach ((array)$legacyPaths as $legacy) {
                $legacy = ltrim(trim((string)$legacy), '/');
                if ($legacy === '' || str_contains($legacy, '..') || $legacy === $outputFile) continue;
                $legacyFile = str_ends_with($legacy, '/') ? $legacy . 'index.html' : $legacy;
                @mkdir(dirname($dir . '/' . $legacyFile), 0775, true);
                file_put_contents($dir . '/' . $legacyFile, $this->renderCaseStudyRedirect($this->caseStudyFile($p)));
            }
            $cases++;
        }
        file_put_contents($dir . '/sitemap.xml', $this->sitemapXml());
        file_put_contents($dir . '/robots.txt', $this->robotsTxt());
        file_put_contents($dir . '/404.html', $this->render404($s, $nav));
        if (FeatureFlagModel::isOn('site_search')) {
            file_put_contents($dir . '/search-index.json', $this->searchIndex());
            file_put_contents($dir . '/search.html', $this->renderSearchPage($s, $nav));
        }
        $this->injectExternalAnalytics($dir); // GA4 / GTM / Clarity (integration hub config)
        $this->injectAnalytics($dir);         // first-party analytics snippet
        $this->syncMedia($site);              // copies css/js/assets/media into staging
        $this->writeDesignTokens($dir, $s);   // design system → CSS variables (after syncMedia, which would overwrite them)
        $this->writeSiteHtaccess($dir);       // security headers + redirects + ErrorDocument
        $this->out = $prevOut;
        return ['pages' => $pages, 'articles' => $articles];
    }

    /** Build + validate without touching production. Returns a publish report. */
    public function preflight(): array
    {
        $site = $this->site;
        $staging = AV_CACHE . '/stage-' . bin2hex(random_bytes(4));
        @mkdir($staging, 0775, true);
        try {
            $counts = $this->buildSite($staging, $site);
            $this->validateBuild($staging, $site);
            // report: images, warnings, seo errors
            $images = 0;
            $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($staging, FilesystemIterator::SKIP_DOTS));
            foreach ($it as $f) {
                if ($f->isFile() && in_array(strtolower($f->getExtension()), ['webp', 'avif', 'png', 'jpg', 'jpeg', 'gif', 'svg'], true)) $images++;
            }
            $seoErrors = 0; $warnings = 0;
            foreach (['pages', 'projects', 'articles'] as $key) {
                foreach (($site[$key] ?? []) as $ent) {
                    if (!$this->isDue($ent)) continue;
                    $seo = $ent['seo'] ?? [];
                    if (empty($seo['title']) || empty($seo['desc'])) $seoErrors++;
                }
            }
            foreach (Database::all("SELECT COUNT(*) n FROM media WHERE deleted_at IS NULL AND (alt_text IS NULL OR alt_text='')") as $r) { $warnings += (int)$r['n']; }
            $brokenLinks = $this->internalLinkCheck($staging);
            $report = [
                'ok' => true,
                'pages' => $counts['pages'] + 1,      // + homepage
                'articles' => $counts['articles'],
                'images' => $images,
                'seo_errors' => $seoErrors,
                'warnings' => $warnings,
                'broken_assets' => 0,
                'broken_links' => count($brokenLinks),
                'broken_link_list' => array_slice($brokenLinks, 0, 10),
            ];
            return $report;
        } finally {
            $this->rmDir($staging);
        }
    }

    /** Every generated HTML document, including clean-URL nested pages. */
    private function htmlFiles(string $dir): array
    {
        $files = [];
        if (!is_dir($dir)) return $files;
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $file) {
            if ($file->isFile() && strtolower($file->getExtension()) === 'html') {
                $files[] = $file->getPathname();
            }
        }
        sort($files, SORT_STRING);
        return $files;
    }

    /** Resolve a root- or document-relative public path without allowing traversal. */
    private function resolveBuildPath(string $dir, string $document, string $href): ?string
    {
        $href = html_entity_decode(trim($href), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        if ($href === '' || str_starts_with($href, '#') || str_starts_with($href, '//')) return null;
        if (preg_match('#^[a-z][a-z0-9+.-]*:#i', $href)) return null;
        $path = parse_url($href, PHP_URL_PATH);
        if ($path === null || $path === '') return null;
        $rootRelative = str_starts_with($path, '/');
        $documentRel = str_replace(chr(92), '/', substr($document, strlen(rtrim($dir, '/')) + 1));
        $combined = $rootRelative ? ltrim($path, '/') : dirname($documentRel) . '/' . $path;
        $parts = [];
        foreach (explode('/', str_replace(chr(92), '/', $combined)) as $part) {
            if ($part === '' || $part === '.') continue;
            if ($part === '..') {
                if (!$parts) return '__TRAVERSAL__';
                array_pop($parts);
                continue;
            }
            $parts[] = rawurldecode($part);
        }
        $relative = implode('/', $parts);
        if ($relative === '' || str_ends_with($path, '/')) $relative = rtrim($relative, '/') . '/index.html';
        return ltrim($relative, '/');
    }

    /** Internal-link check: every local href in the build must resolve inside the build. */
    private function internalLinkCheck(string $dir): array
    {
        $broken = [];
        foreach ($this->htmlFiles($dir) as $htmlFile) {
            $content = (string)file_get_contents($htmlFile);
            if (!preg_match_all('/href="([^"#]*)"/i', $content, $matches)) continue;
            foreach ($matches[1] as $href) {
                $target = $this->resolveBuildPath($dir, $htmlFile, $href);
                if ($target === null) continue;
                $label = str_replace(rtrim($dir, '/') . '/', '', $htmlFile) . ' -> ' . $href;
                if ($target === '__TRAVERSAL__' || !is_file($dir . '/' . $target)) $broken[] = $label;
            }
        }
        return array_values(array_unique($broken));
    }

    /**
     * Post-publish verification: critical routes exist and are non-trivial,
     * sitemap URLs resolve to files, no stray drafts. If verification fails
     * the previous deployment is restored automatically (site never left broken).
     */
    private function verifyPublishedSite(array $counts): array
    {
        $problems = [];
        $critical = [
            'index.html', 'css/styles.css', 'js/main.js', 'sitemap.xml', 'robots.txt', '404.html',
            'css/orange-business-case-study.css', 'js/orange-business-case-study.js',
            'experience-design/orange-business-executive-briefing-center/index.html',
        ];
        foreach (array_merge($critical, ['story.html', 'experience.html', 'case-studies.html', 'contact.html']) as $f) {
            $p = $this->out . '/' . $f;
            if (!is_file($p)) { $problems[] = "missing $f"; continue; }
            $min = $f === 'robots.txt' ? 10 : 100;   // robots.txt is legitimately tiny
            if (filesize($p) < $min) $problems[] = "$f too small (" . filesize($p) . "b)";
        }
        // sitemap: every URL must map to an existing file; no draft/admin/api URLs.
        // Parsed with regex (sitemap is self-generated; no XML-extension dependency).
        $sitemap = $this->out . '/sitemap.xml';
        if (is_file($sitemap)) {
            $content = (string)file_get_contents($sitemap);
            if (str_contains($content, '<url>') && preg_match_all('#<loc>([^<]+)</loc>#', $content, $m)) {
                foreach ($m[1] as $loc) {
                    $path = parse_url(trim($loc), PHP_URL_PATH) ?: '';
                    if (preg_match('#/(draft|preview|admin|api|install|storage|includes|backend)#', $path)) {
                        $problems[] = "sitemap exposes private path: $path";
                        continue;
                    }
                    $rel = ltrim($path, '/');
                    if ($rel !== '' && str_ends_with($path, '/')) $rel .= 'index.html';
                    if ($rel !== '' && !is_file($this->out . '/' . $rel)) $problems[] = "sitemap URL missing file: $path";
                }
            } elseif (!str_contains($content, '<urlset')) {
                $problems[] = 'sitemap.xml unparseable';
            }
        }
        return $problems;
    }

    public function publish(): array
    {
        $site = $this->site;
        $staging = AV_CACHE . '/stage-' . bin2hex(random_bytes(4));
        @mkdir($staging, 0775, true);
        $prevOut = $this->out;
        $this->out = $staging;

        try {
            $counts = $this->buildSite($staging, $site);
            $this->out = $prevOut;

            // ---- validate build before touching production ----
            $this->validateBuild($staging, $site);
            $brokenLinks = $this->internalLinkCheck($staging);
            if ($brokenLinks) {
                throw new RuntimeException('Build has broken internal links: ' . implode('; ', array_slice($brokenLinks, 0, 6)));
            }

            // ---- atomic swap ----
            $old = AV_CACHE . '/site-old-' . bin2hex(random_bytes(4));
            $snapshotPath = null;
            try {
                if (is_dir($this->out)) rename($this->out, $old);
                if (!rename($staging, $this->out)) throw new RuntimeException('staging swap failed');
                // snapshot the NEW live site (site + content stay consistent in
                // the deployment record — rollback restores the previous publish)
                $snapshotPath = DeploymentModel::storeSnapshot($this->out);
                if (is_dir($old)) $this->rmDir($old);
            } catch (Throwable $e) {
                // roll back: restore previous production
                if (!is_dir($this->out) && is_dir($old)) rename($old, $this->out);
                $this->rmDir($staging);
                throw $e;
            }

            // ---- post-publish health check with automatic rollback ----
            $problems = $this->verifyPublishedSite($counts);
            if ($problems) {
                $msg = 'Post-publish verification failed: ' . implode('; ', array_slice($problems, 0, 5));
                try { DeploymentModel::rollback(Auth::user()['id'] ?? null); } catch (Throwable $rb) { /* keep going — log below */ }
                ErrorModel::log('critical', 'publish', $msg, ['request_id' => defined('AV_REQUEST_ID') ? AV_REQUEST_ID : '']);
                NotificationModel::push('Publish failed — auto-rolled back', $msg, 'error');
                Audit::log(Auth::user()['id'] ?? null, 'publish_auto_rollback', 'site', '', ['problems' => $problems]);
                throw new RuntimeException('Publish reverted: ' . $msg);
            }

            Audit::log(Auth::user()['id'] ?? null, 'publish', 'site', '', ['pages' => count($site['pages'] ?? []), 'articles' => count($site['articles'] ?? [])]);
            DeploymentModel::record(Auth::user()['id'] ?? null, 'Publish', $snapshotPath);
            $this->mirrorSite();   // dev mirror (AV_MIRROR_DIR) — never fails the publish
            return ['pages' => $counts['pages'] + 1, 'articles' => $counts['articles'], 'time' => date('c')];
        } catch (Throwable $e) {
            $this->rmDir($staging);
            throw $e;
        }
    }

    /** 404 page (static, matches the design system) */
    private function render404(array $s, array $nav): string
    {
        return $this->shell($s, $nav,
            'Page not found — ' . ($s['siteName'] ?? 'Abhijeet Varghese'),
            'The page you were looking for does not exist.', '404.html', '
    <section class="page-hero" aria-label="Not found">
      <div class="container">
        <div class="chapter__meta page-hero__meta" data-reveal>
          <span class="chapter__index">404</span>
          <span class="chapter__tag">Not found</span>
        </div>
        <h1 class="page-hero__title" data-reveal>This page <em>doesn&rsquo;t exist.</em></h1>
        <p class="page-hero__lede" data-reveal>The link may be old or mistyped. Head back to the <a href="index.html">homepage</a> or <a href="case-studies.html">browse the work</a>.</p>
      </div>
    </section>', 'page', 'website');
    }

    /** .htaccess for the generated site: security headers, ErrorDocument, redirects */
    private function writeSiteHtaccess(string $dir): void
    {
        $lines = [
            '# AV OS — generated at publish (do not edit)',
            'Options -Indexes',
            'ErrorDocument 404 /404.html',
            '',
            '# Compress text at the edge; already-compressed media/fonts pass through.',
            '<IfModule mod_brotli.c>',
            '  AddOutputFilterByType BROTLI_COMPRESS text/html text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml',
            '</IfModule>',
            '<IfModule mod_deflate.c>',
            '  AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml',
            '</IfModule>',
            '',
            '<IfModule mod_expires.c>',
            '  ExpiresActive On',
            '  ExpiresByType text/html "access plus 0 seconds"',
            '  ExpiresByType text/css "access plus 1 year"',
            '  ExpiresByType text/javascript "access plus 1 year"',
            '  ExpiresByType application/javascript "access plus 1 year"',
            '  ExpiresByType font/woff2 "access plus 30 days"',
            '  ExpiresByType image/webp "access plus 30 days"',
            '  ExpiresByType image/avif "access plus 30 days"',
            '  ExpiresByType image/jpeg "access plus 30 days"',
            '  ExpiresByType image/png "access plus 30 days"',
            '  ExpiresByType image/svg+xml "access plus 30 days"',
            '  ExpiresByType video/mp4 "access plus 30 days"',
            '</IfModule>',
            '',
            '<IfModule mod_headers.c>',
            '  Header set X-Content-Type-Options "nosniff"',
            '  Header set X-Frame-Options "SAMEORIGIN"',
            '  Header set Referrer-Policy "strict-origin-when-cross-origin"',
            '  Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"',
            '  Header merge Vary "Accept-Encoding"',
            '  <FilesMatch "\\.html$">',
            '    Header set Cache-Control "no-cache, must-revalidate"',
            '  </FilesMatch>',
            '  <FilesMatch "\\.(?:css|js)$">',
            '    Header set Cache-Control "public, max-age=31536000, immutable"',
            '  </FilesMatch>',
            '  <FilesMatch "\\.(?:woff2|avif|webp|jpe?g|png|svg|mp4)$">',
            '    Header set Cache-Control "public, max-age=2592000"',
            '  </FilesMatch>',
            '</IfModule>',
            '',
        ];
        $rules = [];
        foreach (($this->site['projects'] ?? []) as $project) {
            $legacyPaths = $project['legacyPaths'] ?? [];
            if (($project['id'] ?? '') === 'prj-1' && !$legacyPaths) {
                $legacyPaths = ['case-study-enterprise-technology-made-understandable.html'];
            }
            foreach ((array)$legacyPaths as $legacy) {
                $old = trim((string)$legacy, '/');
                if ($old === '' || str_contains($old, '..')) continue;
                $rules[$old] = ['/' . ltrim($this->caseStudyFile($project), '/'), 301];
            }
        }
        try {
            foreach (Database::all("SELECT old_url, new_url, status_code FROM redirects WHERE enabled=1 ORDER BY id") as $r) {
                $old = trim((string)$r['old_url'], '/');
                if ($old === '') continue;
                $rules[$old] = ['/' . ltrim((string)$r['new_url'], '/'), (int)$r['status_code']];
            }
        } catch (Throwable $e) { /* database redirects are optional */ }
        if ($rules) {
            $lines[] = '<IfModule mod_rewrite.c>';
            $lines[] = '  RewriteEngine On';
            foreach ($rules as $old => [$new, $status]) {
                $lines[] = '  RewriteRule ^' . preg_quote($old, '/') . '/?$ ' . $new . ' [R=' . $status . ',L]';
            }
            $lines[] = '</IfModule>';
        }
        file_put_contents($dir . '/.htaccess', implode("
", $lines) . "
");
    }

    /** Convert CMS design tokens into a CSS variables file appended to the template CSS.
     *  Three-layer architecture (primitive → semantic → component), UI/UX Pro Max:
     *  primitives are static scale facts; CMS overrides land on the semantic layer. */
    private function writeDesignTokens(string $dir, array $s): void
    {
        $tokens = $s['designTokens'] ?? [];
        $accent = $tokens['accent'] ?? '#2E5AAC';
        $radius = $tokens['radius'] ?? 16;
        $spacing = $tokens['spacing'] ?? 24;
        $container = $tokens['container'] ?? 1280;
        $bodyFont = $tokens['bodyFont'] ?? 'Inter Tight';
        $accentFont = $tokens['accentFont'] ?? 'Instrument Serif';
        $css = <<<CSS
/* ============================================================
   AV OS — design tokens (generated at publish — do not edit)
   Layer 1 — primitives: scale facts (spacing, radius, type, z, motion)
   Layer 2 — semantic: purpose aliases consumed by components
   Layer 3 — component tokens live next to their rules in styles.css
   ============================================================ */
:root {
  /* ---- semantic (CMS-driven) ---- */
  --color-primary: {$accent};
  --color-accent: {$accent};
  --radius-card: {$radius}px;
  --space-section: {$spacing}px;
  --container-width: {$container}px;
  --font-body: "{$bodyFont}";
  --font-accent: "{$accentFont}";

  /* ---- spacing scale (4px base) ---- */
  --sp-1: 4px;  --sp-2: 8px;  --sp-3: 12px; --sp-4: 16px;
  --sp-5: 20px; --sp-6: 24px; --sp-8: 32px; --sp-10: 40px;
  --sp-12: 48px; --sp-16: 64px; --sp-24: 96px; --sp-32: 128px;

  /* ---- radius scale (5 steps + pill) ---- */
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px;
  --radius-xl: 18px; --radius-2xl: 22px; --radius-pill: 999px;

  /* ---- type scale (editorial: fluid display, fixed micro-labels) ---- */
  --f-micro: 8.5px;   /* tracked uppercase eyebrows — decorative */
  --f-micro-2: 9.5px; /* dense meta strips */
  --f-label: 11.5px;  /* labels, card meta */
  --f-small: 12.5px;  /* compact body */
  --f-body-2: 13.5px; /* secondary body */
  --f-body-px: 14px;  /* base body (light sections) */

  /* ---- feedback ---- */
  --color-success: #1F7A4D;
  --color-warning: #9A6B12;
  --color-error: #C23B3B;
  --ring-focus: 0 0 0 3px rgba(46, 90, 172, 0.15);
  --ring-error: 0 0 0 3px rgba(194, 59, 59, 0.12);

  /* ---- elevation (2-step ladder) ---- */
  --lift: 0 18px 50px -24px rgba(12, 19, 48, 0.35);
  --lift-hi: 0 42px 90px -54px rgba(12, 19, 48, 0.55);

  /* ---- z-scale ---- */
  --z-base: 1; --z-content: 10; --z-sticky: 40; --z-nav: 60;
  --z-overlay: 80; --z-toast: 90; --z-modal: 100;

  /* ---- motion (durations only — choreography is Stage 04) ---- */
  --t-fast: 160ms; --t-base: 240ms; --t-slow: 420ms;
}
CSS;
        $cssDir = $dir . '/css';
        @mkdir($cssDir, 0775, true);
        file_put_contents($cssDir . '/tokens.css', $css);
        // ensure tokens.css is loaded after styles.css in generated HTML
        foreach ($this->htmlFiles($dir) as $idx) {
            $html = (string)file_get_contents($idx);
            if (!str_contains($html, 'tokens.css')) {
                $html = preg_replace('/(<link rel="stylesheet" href="css\/styles\.css(?:\?v=[^"]*)?"\s*>)/', '$1' . "\n" . '<link rel="stylesheet" href="css/tokens.css">', $html, 1);
                file_put_contents($idx, $html);
            }
        }
    }

    /**
     * Inject configured external measurement snippets (GA4 / GTM / Clarity).
     * Reads public container/measurement IDs from the integration registry —
     * never credentials. No-op unless the user configured the IDs.
     */
    private function injectExternalAnalytics(string $dir): void
    {
        $ids = ['ga4' => null, 'gtm' => null, 'clarity' => null];
        foreach (Database::all("SELECT code, configuration FROM integrations WHERE code IN ('ga4','gtm','clarity')") as $row) {
            $cfg = $row['configuration'] ? json_decode((string)$row['configuration'], true) : [];
            $ids[$row['code']] = $cfg;
        }
        $ga4 = (string)($ids['ga4']['measurement_id'] ?? '');
        $gtm = (string)($ids['gtm']['container_id'] ?? '');
        $clarity = (string)($ids['clarity']['project_id'] ?? '');
        if ($ga4 === '' && $gtm === '' && $clarity === '') return;

        $snippets = [];
        if ($ga4 !== '') {
            $snippets[] = <<<HTML
<!-- Google Analytics 4 ({$ga4}) — configured via AV OS integration hub -->
<script async src="https://www.googletagmanager.com/gtag/js?id={$ga4}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '{$ga4}');
</script>
HTML;
        }
        if ($gtm !== '') {
            $snippets[] = <<<HTML
<!-- Google Tag Manager ({$gtm}) — configured via AV OS integration hub -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','{$gtm}');</script>
HTML;
        }
        if ($clarity !== '') {
            $snippets[] = <<<HTML
<!-- Microsoft Clarity ({$clarity}) — configured via AV OS integration hub -->
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "{$clarity}");
</script>
HTML;
        }
        $block = implode("\n", $snippets);
        foreach ($this->htmlFiles($dir) as $f) {
            $html = (string)file_get_contents($f);
            if (str_contains($html, 'googletagmanager.com/gtag')) continue;
            $html = str_replace('</body>', $block . "\n</body>", $html);
            file_put_contents($f, $html);
        }
    }

    /** Inject the first-party analytics snippet (self-hosted, privacy-respecting). */
    private function injectAnalytics(string $dir): void
    {
        $snippet = <<<'JS'
<script>
/* AV OS first-party analytics — minimal, privacy-respecting */
(function () {
  var v = localStorage.getItem("av_visitor") || "";
  var d = { event_type: "pageview", path: location.pathname, referrer: document.referrer || "", visitor_id: v };
  try {
    var u = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) { var x = u.get(k); if (x) d[k] = x; });
  } catch (e) {}
  d.device = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : (/iPad|Tablet/i.test(navigator.userAgent) ? "tablet" : "desktop");
  function avTrack(extra) {
    var e = Object.assign({}, d, extra);
    fetch("/api/analytics/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(e) }).catch(function () {});
  }
  fetch("/api/analytics/track", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(d)
  }).then(function (r) { return r.json(); }).then(function (j) {
    if (j.data && j.data.visitor_id && !v) { try { localStorage.setItem("av_visitor", j.data.visitor_id); } catch (e) {} }
  }).catch(function () {});
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest ? ev.target.closest("a, button") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf(".pdf") !== -1 || a.hasAttribute("download")) { avTrack({ event_type: "download", path: location.pathname, content: href }); return; }
    if (a.closest(".hero, .cta, .btn, .page-hero") || /book|calendly|schedule|contact/i.test(href + " " + (a.textContent || ""))) {
      avTrack({ event_type: "cta_click", path: location.pathname, content: href });
    }
    if (/^(https?:)?\/\//.test(href) && href.indexOf(location.origin) !== 0) { avTrack({ event_type: "external_link", path: location.pathname, content: href }); }
  });
  // media interaction: galleries + videos
  document.addEventListener("click", function (ev) {
    var g = ev.target.closest ? ev.target.closest("[data-gallery], .gallery, .media-grid") : null;
    if (g) { avTrack({ event_type: "gallery_open", path: location.pathname }); return; }
    var v = ev.target.closest ? ev.target.closest("video") : null;
    if (v) {
      var f = function () { avTrack({ event_type: "video_play", path: location.pathname, content: v.currentSrc || "" }); v.removeEventListener("play", f); };
      v.addEventListener("play", f);
    }
  });
  // scroll depth (25/50/75/100)
  (function () {
    var sent = {};
    var onScroll = function () {
      var h = document.documentElement;
      var pct = Math.round((h.scrollTop + window.innerHeight) / h.scrollHeight * 100);
      [25, 50, 75, 100].forEach(function (t) {
        if (pct >= t && !sent[t]) { sent[t] = true; avTrack({ event_type: "scroll_depth", path: location.pathname, content: String(t) }); }
      });
    };
    var t = null;
    window.addEventListener("scroll", function () { if (t) return; t = setTimeout(function () { onScroll(); t = null; }, 400); }, { passive: true });
  })();
  // content views: essays, journal entries, case studies, projects
  (function () {
    var p = location.pathname || "";
    var m = null;
    if ((m = p.match(/\/essay-[^\/]+\.html/))) { avTrack({ event_type: "essay_view", path: p, content: m[0] }); }
    else if ((m = p.match(/\/journal-[^\/]+\.html/))) { avTrack({ event_type: "journal_view", path: p, content: m[0] }); }
    else if ((m = p.match(/\/case-studies\.html/)) || (m = p.match(/\/case-study-[^\/]+\.html/)) || (m = p.match(/\/experience-design\/[^\/]+\/?/))) { avTrack({ event_type: "case_study_view", path: p, content: m[0] }); }
    else if (p.indexOf("experience") !== -1) { avTrack({ event_type: "project_view", path: p }); }
    // contact intent (form page focus)
    var cf = document.getElementById("contactForm") || document.getElementById("bookForm");
    if (cf) { var once = false; cf.addEventListener("focusin", function () { if (!once) { once = true; avTrack({ event_type: "contact_start", path: p }); } }, true); }
  })();
})();
</script>
JS;
        foreach ($this->htmlFiles($dir) as $f) {
            $html = (string)file_get_contents($f);
            if (str_contains($html, 'api/analytics/track')) continue;
            $html = str_replace('</body>', $snippet . "
</body>", $html);
            file_put_contents($f, $html);
        }
    }

    /** Validate the staging build; throw on any problem (live site untouched). */
    private function validateBuild(string $dir, array $site): void
    {
        $fail = [];
        foreach (['index.html', 'sitemap.xml', 'robots.txt', 'css/styles.css', 'js/main.js'] as $req) {
            if (!is_file($dir . '/' . $req)) $fail[] = "missing $req";
        }
        // every published page/article must exist
        foreach (($site['pages'] ?? []) as $p) {
            $slug = $p['slug'] ?? '';
            if (!$this->isDue($p) || in_array($slug, ['', 'home', 'index'], true)) continue;
            if (!is_file($dir . '/' . $slug . '.html')) $fail[] = "missing page {$slug}.html";
        }
        foreach (($site['articles'] ?? []) as $a) {
            if (!$this->isDue($a)) continue;
            $slug = $a['slug'] ?? $this->slugify($a['title'] ?? '');
            $f = (($a['type'] ?? 'essay') === 'essay' ? 'essay-' : 'journal-') . $slug . '.html';
            if (!is_file($dir . '/' . $f)) $fail[] = "missing article $f";
        }
        foreach (($site['projects'] ?? []) as $project) {
            if (!$this->isDue($project) || ($project['status'] ?? 'published') !== 'published') continue;
            $f = $this->caseStudyOutputFile($project);
            if (!is_file($dir . '/' . $f)) $fail[] = "missing case study $f";
        }
        // no unresolved template variables or PHP tags leaked into HTML
        foreach ($this->htmlFiles($dir) as $htmlFile) {
            $content = (string)file_get_contents($htmlFile);
            if (str_contains($content, '<?php') || str_contains($content, '{$this->') || str_contains($content, '{{') || preg_match('/\$\{[a-zA-Z_]/', $content)) {
                $fail[] = 'template leakage in ' . str_replace(rtrim($dir, '/') . '/', '', $htmlFile);
            }
        }
        // no PHP source files in the public output
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $f) {
            if ($f->isFile() && strtolower($f->getExtension()) === 'php') {
                $fail[] = 'PHP file in public output: ' . $f->getFilename();
            }
        }
        if ($fail) throw new RuntimeException('Build validation failed: ' . implode('; ', $fail));
    }

    /**
     * Dev mirror — after a successful publish the generated site is copied
     * into AV_MIRROR_DIR (set in config.local.php, dev only). Keeps the
     * workspace snapshot folder byte-identical to the live output so the
     * .html files can never go stale. Never throws (mirror failure must
     * not roll back a good publish).
     */
    private function mirrorSite(): void
    {
        if (!defined('AV_MIRROR_DIR') || AV_MIRROR_DIR === '' || AV_MIRROR_DIR === $this->out) return;
        $target = AV_MIRROR_DIR;
        try {
            if (is_dir($target)) $this->rmDir($target);
            @mkdir($target, 0775, true);
            $this->copyDir($this->out, $target);
        } catch (Throwable $e) {
            ErrorModel::log('warning', 'mirror', 'site mirror failed: ' . $e->getMessage());
        }
    }

    private function rmDir(string $dir): void
    {
        if (!is_dir($dir)) return;
        foreach (scandir($dir) as $f) {
            if ($f === '.' || $f === '..') continue;
            $p = $dir . '/' . $f;
            is_dir($p) ? $this->rmDir($p) : @unlink($p);
        }
        @rmdir($dir);
    }
}
