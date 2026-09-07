<?php
/**
 * AV OS — Template Registry (single source of truth).
 *
 * Defines every page/project template the publisher can render and how to
 * render it. Both PublishEngine and the admin API/UI derive their knowledge
 * of supported templates from this class, so the two can never drift apart.
 *
 * Two template families:
 *
 *  PAGE templates       — entries in the `pages` content collection.
 *  PROJECT templates    — entries in the `projects` collection (case studies).
 *
 * Rendering kind:
 *  - 'static'  : renderer loads a canonical file from publish/templates/ and
 *                substitutes placeholders (chrome/footer/SEO/JSON-LD/assets).
 *  - 'method'  : renderer is a dedicated PublishEngine method (hard-coded).
 *  - 'blocks'  : renderer is the generic block renderer.
 *
 * A 'static' or 'method' entry is a DEDICATED template: it MUST exist and be
 * resolvable or publishing fails loudly (it never silently downgrades to
 * blocks). A 'blocks' entry is the intentionally generic fallback.
 */
final class TemplateRegistry
{
    /* ---------------- PAGE TEMPLATES ---------------- */

    /** @return array<string,array> keyed by template key (the `template` value in the pages collection). */
    public static function pageTemplates(): array
    {
        return [
            'Recruiters' => [
                'key'         => 'Recruiters',
                'display'     => 'For Recruiters — cinematic executive profile',
                'kind'        => 'static',
                'renderer'    => 'renderRecruiters',
                'file'        => 'for-recruiters.html',
                'bodyClass'   => 'rp',
                'status'      => 'active',
                'dedicated'   => true,
                'assets'      => [
                    'css' => ['css/for-recruiters.css'],
                    'js'  => ['js/for-recruiters.js'],
                ],
            ],
            'PortfolioReel' => [
                'key'         => 'PortfolioReel',
                'display'     => 'Portfolio — cinematic film reel',
                'kind'        => 'static',
                'renderer'    => 'renderPortfolioReel',
                'file'        => 'portfolio-reel.html',
                'bodyClass'   => 'portfolio-page',
                'status'      => 'active',
                'dedicated'   => true,
                'assets'      => [
                    'css' => ['css/portfolio-reel.css'],
                    'js'  => ['js/portfolio-reel.js'],
                ],
            ],
            'About' => [
                'key'       => 'About',
                'display'   => 'About / Story — long-form editorial',
                'kind'      => 'method',
                'renderer'  => 'renderAbout',
                'file'      => null,
                'bodyClass' => 'about-page',
                'status'    => 'active',
                'dedicated' => true,
                'assets'    => ['css' => [], 'js' => []],
            ],
            'Experience' => [
                'key'       => 'Experience',
                'display'   => 'Experience — employment record',
                'kind'      => 'method',
                'renderer'  => 'renderExperience',
                'file'      => null,
                'bodyClass' => null,
                'status'    => 'active',
                'dedicated' => true,
                'assets'    => ['css' => [], 'js' => []],
            ],
            'Portfolio' => [
                'key'       => 'Portfolio',
                'display'   => 'Portfolio — visual work index',
                'kind'      => 'method',
                'renderer'  => 'renderPortfolio',
                'file'      => null,
                'bodyClass' => 'portfolio-page',
                'status'    => 'active',
                'dedicated' => true,
                'assets'    => ['css' => [], 'js' => []],
            ],
            'Contact' => [
                'key'       => 'Contact',
                'display'   => 'Contact — form + booking',
                'kind'      => 'blocks',
                'renderer'  => null,
                'file'      => null,
                'bodyClass' => null,
                'status'    => 'active',
                'dedicated' => false,
                'assets'    => ['css' => [], 'js' => []],
            ],
            'Blog Index' => [
                'key'       => 'Blog Index',
                'display'   => 'Blog / writing index (essays or journal)',
                'kind'      => 'blocks',
                'renderer'  => null,
                'file'      => null,
                'bodyClass' => null,
                'status'    => 'active',
                'dedicated' => false,
                'assets'    => ['css' => [], 'js' => []],
            ],
            'Page' => [
                'key'       => 'Page',
                'display'   => 'Standard page — generic blocks',
                'kind'      => 'blocks',
                'renderer'  => null,
                'file'      => null,
                'bodyClass' => null,
                'status'    => 'active',
                'dedicated' => false,
                'assets'    => ['css' => [], 'js' => []],
            ],
        ];
    }

    /* ---------------- PROJECT (CASE-STUDY) TEMPLATES ---------------- */

    /** @return array<string,array> keyed by project template key (matches `caseStudyTemplate`). */
    public static function projectTemplates(): array
    {
        return [
            'orange-business-ebc' => [
                'key'       => 'orange-business-ebc',
                'display'   => 'Orange Business — Executive Briefing Center',
                'kind'      => 'static',
                'renderer'  => 'renderOrangeBusinessCaseStudy',
                'file'      => 'orange-business-executive-briefing-center.html',
                'status'    => 'active',
                'dedicated' => true,
                'assets'    => [
                    'css' => ['css/orange-business-case-study.css'],
                    'js'  => ['js/orange-business-case-study.js'],
                ],
            ],
            'case-study' => [
                'key'       => 'case-study',
                'display'   => 'Standard case study — structured fields',
                'kind'      => 'method',
                'renderer'  => 'renderCaseStudy',
                'file'      => null,
                'status'    => 'active',
                'dedicated' => false,
                'assets'    => ['css' => [], 'js' => []],
            ],
            'coming-soon' => [
                'key'       => 'coming-soon',
                'display'   => 'Coming soon — placeholder',
                'kind'      => 'method',
                'renderer'  => 'renderComingSoonCaseStudy',
                'file'      => null,
                'status'    => 'active',
                'dedicated' => false,
                'assets'    => ['css' => [], 'js' => []],
            ],
        ];
    }

    /* ---------------- LOOKUPS ---------------- */

    public static function page(string $key): ?array
    {
        return self::pageTemplates()[$key] ?? null;
    }

    public static function project(string $key): ?array
    {
        return self::projectTemplates()[$key] ?? null;
    }

    public static function isKnownPage(string $key): bool
    {
        return array_key_exists($key, self::pageTemplates());
    }

    /**
     * Resolve the effective project template for a project record, applying
     * the same precedence PublishEngine uses today (legacy prj-1 default).
     */
    public static function resolveProjectKey(array $project): string
    {
        if (!empty($project['comingSoon'])) {
            return 'coming-soon';
        }
        $key = (string)($project['caseStudyTemplate'] ?? '');
        if ($key === '' && ($project['id'] ?? '') === 'prj-1') {
            $key = 'orange-business-ebc';
        }
        if ($key === '') {
            $key = 'case-study';
        }
        return $key;
    }

    /**
     * Validate a page-template reference. Returns a list of human-readable
     * errors (empty when valid).
     */
    public static function validatePage(string $key, string $context = ''): array
    {
        $errors = [];
        $tpl = self::page($key);
        $ctx = $context !== '' ? " [$context]" : '';
        if ($tpl === null) {
            $errors[] = "unknown page template \"$key\"$ctx. Valid templates: "
                . implode(', ', array_keys(self::pageTemplates()));
            return $errors;
        }
        return self::checkDeps($tpl, $ctx);
    }

    /**
     * Validate a project-template reference.
     */
    public static function validateProject(array $project, string $context = ''): array
    {
        $errors = [];
        $key = self::resolveProjectKey($project);
        $tpl = self::project($key);
        $ctx = $context !== '' ? " [$context]" : '';
        if ($tpl === null) {
            $errors[] = "unknown project template \"$key\"$ctx. Valid templates: "
                . implode(', ', array_keys(self::projectTemplates()));
            return $errors;
        }
        return self::checkDeps($tpl, $ctx);
    }

    /**
     * Verify a template's concrete dependencies (renderer method / canonical
     * file / declared assets) actually exist.
     */
    private static function checkDeps(array $tpl, string $ctx): array
    {
        $errors = [];
        $kind = $tpl['kind'] ?? '';

        if ($kind === 'static') {
            $file = $tpl['file'] ?? '';
            $path = AV_TEMPLATE_DIR . '/' . $file;
            if (!defined('AV_TEMPLATE_DIR') || !is_file($path)) {
                $errors[] = "template \"{$tpl['key']}\"$ctx requires missing canonical file: publish/templates/$file";
            }
        }
        if ($kind === 'method' || $kind === 'static') {
            $renderer = $tpl['renderer'] ?? '';
            if ($renderer === '' || !method_exists(PublishEngine::class, $renderer)) {
                $errors[] = "template \"{$tpl['key']}\"$ctx requires renderer PublishEngine::$renderer which does not exist";
            }
        }
        // declared page assets must exist in the canonical site template
        foreach (['css', 'js'] as $kind2) {
            foreach (($tpl['assets'][$kind2] ?? []) as $rel) {
                if (!defined('AV_TEMPLATE_SITE_DIR') || !is_file(AV_TEMPLATE_SITE_DIR . '/' . $rel)) {
                    $errors[] = "template \"{$tpl['key']}\"$ctx declares missing asset: $rel";
                }
            }
        }
        return $errors;
    }

    /** Compact list for admin selectors: [key => display]. */
    public static function pageOptions(): array
    {
        $out = [];
        foreach (self::pageTemplates() as $key => $t) {
            $out[$key] = $t['display'];
        }
        return $out;
    }
}
