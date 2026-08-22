<?php
declare(strict_types=1);
namespace AvOS\Bootstrap;

use AvOS\Api\ApiException;
use AvOS\Api\ApiResult;
use AvOS\Api\ErrorCatalog;
use AvOS\Auth\AuthService;
use AvOS\Auth\LoginThrottle;
use AvOS\Auth\NullMailer;
use AvOS\Auth\NullMfaProvider;
use AvOS\Auth\PasswordHasher;
use AvOS\Auth\PasswordResetService;
use AvOS\Auth\SessionManager;
use AvOS\Content\Cache\CacheInvalidatorInterface;
use AvOS\Content\Cache\NullCacheInvalidator;
use AvOS\Content\ContentType;
use AvOS\Content\Events\EventDispatcher;
use AvOS\Domain\Content\ArticleRepository;
use AvOS\Domain\Content\ArticleService;
use AvOS\Domain\Content\ContentService;
use AvOS\Domain\Content\ExperienceRepository;
use AvOS\Domain\Content\ExperienceService;
use AvOS\Domain\Content\PageRepository;
use AvOS\Domain\Content\PageService;
use AvOS\Domain\Content\ProjectRepository;
use AvOS\Domain\Content\ProjectService;
use AvOS\Domain\Content\PublicContentService;
use AvOS\Domain\Content\PublishingService;
use AvOS\Domain\Content\RouteRepository;
use AvOS\Domain\Content\TaxonomyRepository;
use AvOS\Domain\Content\VersionRepository;
use AvOS\Domain\Content\VersionService;
use AvOS\Domain\Media\AssetRepository;
use AvOS\Domain\Media\AssetService;
use AvOS\Domain\Media\AssetUsageService;
use AvOS\Domain\Media\DerivativeService;
use AvOS\Domain\Media\DownloadService;
use AvOS\Domain\Media\OrphanService;
use AvOS\Domain\Media\UsageRepository;
use AvOS\Domain\Media\VariantRepository;
use AvOS\Domain\System\SettingsRepository;
use AvOS\Domain\System\SystemService;
use AvOS\Errors\AppException;
use AvOS\Http\Controllers\AuthController;
use AvOS\Http\Controllers\ContentController;
use AvOS\Http\Controllers\MediaController;
use AvOS\Http\Controllers\PublicContentController;
use AvOS\Http\Controllers\SystemController;
use AvOS\Http\Middleware\AuthMiddleware;
use AvOS\Http\Middleware\CorsMiddleware;
use AvOS\Http\Middleware\PermissionMiddleware;
use AvOS\Http\Middleware\RateLimitMiddleware;
use AvOS\Http\Middleware\SecurityHeadersMiddleware;
use AvOS\Http\Request;
use AvOS\Http\Router;
use AvOS\Identity\EmailIdentity;
use AvOS\Media\FileNaming;
use AvOS\Media\Image\ImageProcessorFactory;
use AvOS\Media\MetadataExtractor;
use AvOS\Media\Storage\StorageManager;
use AvOS\Media\Video\VideoProbe;
use AvOS\Identity\UserRepository;
use AvOS\Rbac\Authorizer;
use AvOS\Security\DbRateLimiter;
use Throwable;

/**
 * API composition root (Phase 3D §3D.1).
 *
 * The request lifecycle in one readable place:
 *   request id → security headers → CORS → route match → auth → authorization
 *   → rate limit → controller → service → repository → response.
 *
 * Wiring is explicit rather than container-magic so the dependency graph can be
 * read top to bottom.
 */
final class ApiKernel
{
    public readonly EmailIdentity $identity;
    public readonly UserRepository $users;
    public readonly SessionManager $sessions;
    public readonly Authorizer $authz;
    public readonly AuthService $auth;
    public readonly PasswordResetService $reset;
    public readonly DbRateLimiter $limiter;
    public readonly SystemService $system;

    // ---- Phase 3E content engine -------------------------------------
    /** @var array<string,ContentService> keyed by ContentType */
    public readonly array $content;
    public readonly PublishingService $publishing;
    public readonly VersionService $versionService;
    public readonly PublicContentService $publicContent;
    public readonly EventDispatcher $eventDispatcher;
    public readonly CacheInvalidatorInterface $cacheInvalidator;
    public readonly \AvOS\Security\AuditLogger $auditLogger;

    // ---- Phase 3F media & asset engine -------------------------------
    public readonly StorageManager $storage;
    public readonly AssetService $media;
    public readonly AssetUsageService $mediaUsage;
    public readonly OrphanService $mediaOrphans;
    public readonly DownloadService $downloads;

    private readonly Router $router;

    public function __construct(
        public readonly Kernel $kernel,
        ?CacheInvalidatorInterface $cacheInvalidator = null,
        ?EventDispatcher $eventDispatcher = null,
    ) {
        $cfg = $kernel->config;
        $db = $kernel->db();

        $this->identity = EmailIdentity::fromConfig($cfg);
        $hasher = new PasswordHasher();
        $this->users = new UserRepository($db, $hasher);
        $this->sessions = new SessionManager($db, $kernel->session, (int)$cfg->get('session.hours', 12));
        $throttle = new LoginThrottle($db);
        $events = new \AvOS\Security\SecurityEventRecorder($db, $this->identity);

        $this->authz = new Authorizer(
            $this->users, $this->identity, $events,
            $kernel->context->ip, $kernel->context->userAgent, $kernel->context->requestId,
        );
        $this->auth = new AuthService(
            $db, $this->users, $hasher, $this->sessions, $throttle,
            $events, $this->identity, new NullMfaProvider(),
        );
        $this->reset = new PasswordResetService(
            $db, $this->users, $hasher, $this->sessions, $events, new NullMailer(),
        );
        $this->limiter = new DbRateLimiter($db);
        $this->system = new SystemService($db, $cfg, $this->identity, new SettingsRepository($db));

        // ---------------- Phase 3E content engine ----------------
        // Wiring stays explicit: Controller → Service → Repository → Database,
        // with audit, events and cache signals injected rather than reached for.
        $ctx = $kernel->context;
        $this->auditLogger = new \AvOS\Security\AuditLogger($db, $ctx->ip, $ctx->userAgent, $ctx->requestId);
        $this->eventDispatcher = $eventDispatcher ?? new EventDispatcher();
        // Phase 3L will replace this. Until then it is an honest no-op, not a
        // pretend cache.
        $this->cacheInvalidator = $cacheInvalidator ?? new NullCacheInvalidator();

        $versions = new VersionRepository($db);
        $refs = new TaxonomyRepository($db);
        $routes = new RouteRepository($db);

        $mk = fn(string $class, $repo): ContentService => new $class(
            $db, $repo, $versions, $refs, $this->auditLogger,
            $this->eventDispatcher, $this->cacheInvalidator, $this->authz, $ctx->requestId,
        );

        $this->content = [
            ContentType::PAGE       => $mk(PageService::class, new PageRepository($db)),
            ContentType::PROJECT    => $mk(ProjectService::class, new ProjectRepository($db)),
            ContentType::ARTICLE    => $mk(ArticleService::class, new ArticleRepository($db)),
            ContentType::EXPERIENCE => $mk(ExperienceService::class, new ExperienceRepository($db)),
        ];

        $this->publishing = new PublishingService(
            $db, $this->content, $versions, $routes, $this->auditLogger,
            $this->eventDispatcher, $this->cacheInvalidator, $this->authz, $ctx->requestId,
        );
        $this->versionService = new VersionService(
            $db, $this->content, $versions, $this->auditLogger,
            $this->eventDispatcher, $this->cacheInvalidator, $this->authz, $ctx->requestId,
        );
        $this->publicContent = new PublicContentService($this->content, $routes, $refs);

        // ---------------- Phase 3F media & asset engine ----------------
        // Storage roots come from configuration, never hardcoded, and never
        // point inside the legacy public_html tree.
        $this->storage = StorageManager::fromConfig($cfg, $kernel->appRoot);

        // The naming salt is derived from the encryption key so a storage path
        // cannot be predicted from a file's hash alone. It is a derivation, not
        // the key itself, and it is never logged or returned.
        $naming = new FileNaming(hash('sha256', 'avos-media-path|' . (string)$cfg->get('security.enc_key', '')));

        $assetRepo = new AssetRepository($db);
        $variantRepo = new VariantRepository($db);
        $usageRepo = new UsageRepository($db);
        $videoProbe = new VideoProbe();

        $derivatives = new DerivativeService(
            $this->storage, $variantRepo, new ImageProcessorFactory(), $naming,
        );

        $this->media = new AssetService(
            $db, $assetRepo, $variantRepo, $usageRepo, $this->storage, $derivatives,
            new MetadataExtractor($videoProbe), $videoProbe, $naming,
            $this->auditLogger, $this->cacheInvalidator, $this->authz,
            AssetService::resolveMaxBytes($db), $ctx->requestId,
        );
        $this->mediaUsage = new AssetUsageService($assetRepo, $usageRepo);
        $this->mediaOrphans = new OrphanService($assetRepo, $variantRepo, $usageRepo, $this->storage);
        $this->downloads = new DownloadService($assetRepo, $this->storage, $this->authz, $this->auditLogger);

        $this->router = $this->buildRouter();
    }

    private function buildRouter(): Router
    {
        $k = $this->kernel;
        $authMw = new AuthMiddleware($this->sessions, $this->users, $this->authz);
        $perm   = new PermissionMiddleware($this->authz);
        $rate   = new RateLimitMiddleware($this->limiter);
        $cors   = CorsMiddleware::fromConfig((string)(getenv('AV_CORS_ORIGINS') ?: ''));

        $authC = new AuthController(
            $this->auth, $this->reset, $this->sessions, $this->users,
            $this->authz, $k->context->requestId,
        );
        $sysC = new SystemController($this->system, $this->authz);

        $r = new Router();
        // Global: headers first, then CORS (so a preflight short-circuits).
        $r->use(fn(Request $req, callable $next) => (new SecurityHeadersMiddleware())->handle($req, $next));
        $r->use(fn(Request $req, callable $next) => $cors->handle($req, $next));

        // ---- authentication (public, rate limited) ----
        $r->post('/api/v1/auth/login', fn(Request $q) => $this->legacyShape($authC->login($q), $q),
            [$rate->limit(20, 900)]);
        $r->post('/api/v1/auth/password/reset/request',
            fn(Request $q) => $this->legacyShape($authC->resetRequest($q), $q), [$rate->limit(5, 900)]);
        $r->post('/api/v1/auth/password/reset/complete',
            fn(Request $q) => $this->legacyShape($authC->resetComplete($q), $q), [$rate->limit(10, 900)]);

        // ---- authentication (session-aware) ----
        $r->get('/api/v1/auth/session', fn(Request $q) => $this->legacyShape($authC->session($q), $q),
            [$authMw->optional()]);
        $r->post('/api/v1/auth/logout', fn(Request $q) => $this->legacyShape($authC->logout($q), $q),
            [$authMw->optional()]);
        $r->post('/api/v1/auth/password/change',
            fn(Request $q) => $this->legacyShape($authC->changePassword($q), $q),
            [$authMw->required(), $rate->limit(10, 900)]);

        // ---- system ----
        $r->get('/api/v1/system/health', fn(Request $q) => $sysC->health($q), [$authMw->optional()]);
        $r->get('/api/v1/system/settings', fn(Request $q) => $sysC->listSettings($q),
            [$authMw->required(), $perm->permission('settings.read')]);
        $r->get('/api/v1/system/settings/{key}', fn(Request $q) => $sysC->getSetting($q),
            [$authMw->required(), $perm->permission('settings.read')]);
        // Owner-only: fails closed while owner_email_set=false, without
        // affecting any of the permission-protected routes above.
        $r->get('/api/v1/system/owner-status', fn(Request $q) => $sysC->ownerStatus($q),
            [$authMw->required(), $perm->owner()]);

        $this->registerContentRoutes($r, $authMw, $perm);
        $this->registerMediaRoutes($r, $authMw, $perm);

        return $r;
    }

    /**
     * Phase 3F media routes (§3F.26).
     *
     * Naming follows API-CONTRACT §2, which already reserved `media/` with
     * `[media.*]` permissions — no new convention and no new permission.
     *
     * The public/authenticated split is the same PATH split Phase 3E
     * established, so it stays testable from the router's own inventory:
     *   /api/v1/content/media/*   public, published metadata for public assets
     *   /api/v1/media/*           session + permission
     *
     * `/api/v1/media/{id}/download` is the one route that may serve non-JSON.
     * It is authenticated-optional because a PUBLIC asset is downloadable by
     * anyone; DownloadService fails closed for private ones.
     */
    private function registerMediaRoutes(Router $r, AuthMiddleware $authMw, PermissionMiddleware $perm): void
    {
        $c = new MediaController($this->media, $this->mediaUsage, $this->mediaOrphans, $this->downloads);
        $auth = $authMw->required();

        // ---------------- PUBLIC (public assets only) ----------------
        $r->get('/api/v1/content/media', fn(Request $q) => $c->publicIndex($q));
        $r->get('/api/v1/content/media/{id}', fn(Request $q) => $c->publicShow($q));

        // ---------------- AUTHENTICATED MANAGEMENT ----------------
        $r->get('/api/v1/media', fn(Request $q) => $c->index($q),
            [$auth, $perm->permission('media.read')]);
        $r->get('/api/v1/media/capabilities', fn(Request $q) => $c->capabilities($q),
            [$auth, $perm->permission('media.read')]);
        $r->get('/api/v1/media/orphans', fn(Request $q) => $c->orphans($q),
            [$auth, $perm->permission('media.read')]);
        $r->post('/api/v1/media', fn(Request $q) => $c->upload($q),
            [$auth, $perm->permission('media.write')]);

        $r->get('/api/v1/media/{id}', fn(Request $q) => $c->show($q),
            [$auth, $perm->permission('media.read')]);
        $r->patch('/api/v1/media/{id}', fn(Request $q) => $c->update($q),
            [$auth, $perm->permission('media.write')]);
        $r->put('/api/v1/media/{id}', fn(Request $q) => $c->update($q),
            [$auth, $perm->permission('media.write')]);
        $r->post('/api/v1/media/{id}/replace', fn(Request $q) => $c->replace($q),
            [$auth, $perm->permission('media.write')]);
        $r->post('/api/v1/media/{id}/restore', fn(Request $q) => $c->restore($q),
            [$auth, $perm->permission('media.write')]);
        $r->delete('/api/v1/media/{id}', fn(Request $q) => $c->destroy($q),
            [$auth, $perm->permission('media.delete')]);

        $r->get('/api/v1/media/{id}/usage', fn(Request $q) => $c->usage($q),
            [$auth, $perm->permission('media.read')]);
        $r->post('/api/v1/media/{id}/usage', fn(Request $q) => $c->attach($q),
            [$auth, $perm->permission('media.write')]);
        $r->delete('/api/v1/media/{id}/usage', fn(Request $q) => $c->detach($q),
            [$auth, $perm->permission('media.write')]);

        // Binary delivery. Marked so handle() knows not to wrap it in JSON.
        $r->get('/api/v1/media/{id}/download',
            fn(Request $q) => new BinaryDownload($c->prepareDownload($q)),
            [$authMw->optional()]);
    }

    /**
     * Phase 3E content routes.
     *
     * The public/authenticated split is a PATH split, which makes it testable:
     *   /api/v1/content/*   → public, published only, no session required
     *   /api/v1/{type}/*    → session + permission required, drafts visible
     *
     * Nothing under /api/v1/pages, /projects, /articles or /experience is
     * reachable without `$authMw->required()`; the test suite asserts that over
     * the router's own inventory rather than trusting this comment.
     */
    private function registerContentRoutes(Router $r, AuthMiddleware $authMw, PermissionMiddleware $perm): void
    {
        $c = new ContentController($this->content, $this->publishing, $this->versionService);
        $pub = new PublicContentController($this->publicContent);

        // ---------------- PUBLIC (published content only) ----------------
        $r->get('/api/v1/content', fn(Request $q) => $pub->summary($q));
        $r->get('/api/v1/content/resolve', fn(Request $q) => $pub->resolve($q));
        $r->get('/api/v1/content/pages', fn(Request $q) => $pub->pages($q));
        $r->get('/api/v1/content/pages/{slug}', fn(Request $q) => $pub->page($q));
        $r->get('/api/v1/content/projects', fn(Request $q) => $pub->projects($q));
        $r->get('/api/v1/content/projects/{slug}', fn(Request $q) => $pub->project($q));
        $r->get('/api/v1/content/articles', fn(Request $q) => $pub->articles($q));
        $r->get('/api/v1/content/articles/{slug}', fn(Request $q) => $pub->article($q));
        $r->get('/api/v1/content/experience', fn(Request $q) => $pub->experience($q));

        // ---------------- AUTHENTICATED MANAGEMENT ----------------
        // type => [url segment, read, write, delete permission]
        $matrix = [
            ContentType::PAGE       => ['pages',      'pages.read',    'pages.write',    'pages.delete'],
            ContentType::PROJECT    => ['projects',   'projects.read', 'projects.write', 'projects.delete'],
            ContentType::ARTICLE    => ['articles',   'articles.read', 'articles.write', 'articles.delete'],
            // Experience routes through content.* per API-CONTRACT §2.
            // content.delete is amendment A6 — see SystemSeeder.
            ContentType::EXPERIENCE => ['experience', 'content.read',  'content.write',  'content.delete'],
        ];

        foreach ($matrix as $type => [$seg, $readPerm, $writePerm, $deletePerm]) {
            $base = '/api/v1/' . $seg;
            $auth = $authMw->required();

            $r->get($base, fn(Request $q) => $c->index($q, $type),
                [$auth, $perm->permission($readPerm)]);
            $r->post($base, fn(Request $q) => $c->create($q, $type),
                [$auth, $perm->permission($writePerm)]);
            $r->get($base . '/{id}', fn(Request $q) => $c->show($q, $type),
                [$auth, $perm->permission($readPerm)]);
            $r->put($base . '/{id}', fn(Request $q) => $c->update($q, $type),
                [$auth, $perm->permission($writePerm)]);
            $r->patch($base . '/{id}', fn(Request $q) => $c->update($q, $type),
                [$auth, $perm->permission($writePerm)]);
            $r->delete($base . '/{id}', fn(Request $q) => $c->destroy($q, $type),
                [$auth, $perm->permission($deletePerm)]);

            // Publication is gated on publishing.publish, NOT on {type}.write:
            // a Content Manager may edit everything and publish nothing.
            $r->post($base . '/{id}/publish', fn(Request $q) => $c->publish($q, $type),
                [$auth, $perm->permission('publishing.publish')]);
            $r->post($base . '/{id}/unpublish', fn(Request $q) => $c->unpublish($q, $type),
                [$auth, $perm->permission('publishing.publish')]);
            $r->get($base . '/{id}/preflight', fn(Request $q) => $c->preflight($q, $type),
                [$auth, $perm->permission($readPerm)]);

            $r->get($base . '/{id}/versions', fn(Request $q) => $c->versionIndex($q, $type),
                [$auth, $perm->permission('versions.read')]);
            $r->get($base . '/{id}/versions/{version}', fn(Request $q) => $c->versionShow($q, $type),
                [$auth, $perm->permission('versions.read')]);
            $r->post($base . '/{id}/versions/{version}/restore', fn(Request $q) => $c->versionRestore($q, $type),
                [$auth, $perm->permission('versions.restore')]);
        }

        // Order is content for the timeline (DOMAIN-MODEL §4), so reordering is
        // a write, not a presentation tweak.
        $r->post('/api/v1/experience/reorder',
            fn(Request $q) => $c->reorder($q, ContentType::EXPERIENCE),
            [$authMw->required(), $perm->permission('content.write')]);
    }

    /**
     * AuthController (Phase 3C) returns the older array shape. Adapt it to
     * ApiResult here rather than rewriting approved, frozen 3C code.
     */
    private function legacyShape(array $legacy, Request $req): ApiResult
    {
        return ApiResult::ok($legacy['body']['data'] ?? null, $req->requestId, $legacy['status'] ?? 200);
    }

    public function router(): Router { return $this->router; }

    /**
     * Full lifecycle with a single error boundary.
     *
     * A BinaryDownload short-circuits the JSON envelope, but only AFTER every
     * guard has run — the descriptor is built before any byte is emitted, so an
     * authorization failure still returns a normal error response.
     */
    public function handle(Request $request): ApiResult|BinaryDownload
    {
        try {
            $result = $this->router->dispatch($request);
            if ($result instanceof BinaryDownload) return $result;
            return $result instanceof ApiResult
                ? $result
                : ApiResult::ok($result, $request->requestId);
        } catch (ApiException $e) {
            return ApiResult::fromException($e, $request->requestId);
        } catch (AppException $e) {
            // Phase 3A/3C exceptions — map onto the catalog.
            $code = match ($e->errorCode()) {
                'UNAUTHENTICATED'   => ErrorCatalog::UNAUTHORIZED,
                'FORBIDDEN'         => ErrorCatalog::FORBIDDEN,
                'CSRF_FAILED'       => ErrorCatalog::CSRF_FAILED,
                'VALIDATION_ERROR'  => ErrorCatalog::VALIDATION_ERROR,
                'NOT_FOUND'         => ErrorCatalog::NOT_FOUND,
                'RATE_LIMITED'      => ErrorCatalog::RATE_LIMITED,
                'PAYLOAD_TOO_LARGE' => ErrorCatalog::PAYLOAD_TOO_LARGE,
                'UNSUPPORTED_MEDIA' => ErrorCatalog::UNSUPPORTED_MEDIA_TYPE,
                'MFA_UNAVAILABLE'   => ErrorCatalog::SERVICE_UNAVAILABLE,
                default             => ErrorCatalog::INTERNAL_ERROR,
            };
            $msg = $code === ErrorCatalog::INTERNAL_ERROR ? '' : $e->getMessage();
            return ApiResult::fail($code, $msg, $request->requestId, $e->fields() ?: null);
        } catch (Throwable $e) {
            // Nothing internal reaches the client; full detail goes to the log.
            error_log(sprintf('[AVOS][%s] %s: %s @ %s:%d',
                $request->requestId, $e::class, $e->getMessage(), $e->getFile(), $e->getLine()));
            return ApiResult::fail(ErrorCatalog::INTERNAL_ERROR, '', $request->requestId);
        }
    }
}
