<?php
declare(strict_types=1);
namespace AvOS\Bootstrap;

use AvOS\Auth\AuthService;
use AvOS\Auth\LoginThrottle;
use AvOS\Auth\NullMailer;
use AvOS\Auth\NullMfaProvider;
use AvOS\Auth\PasswordHasher;
use AvOS\Auth\PasswordResetService;
use AvOS\Auth\SessionManager;
use AvOS\Http\Controllers\AuthController;
use AvOS\Http\Router;
use AvOS\Identity\EmailIdentity;
use AvOS\Identity\UserRepository;
use AvOS\Rbac\Authorizer;
use AvOS\Security\SecurityEventRecorder;

/**
 * Composition root for the authentication slice (Phase 3C).
 *
 * Wiring lives here rather than in a container so the dependency graph is
 * readable in one place. Everything is constructed eagerly except the database
 * connection, which the Kernel already creates lazily.
 */
final class AuthKernel
{
    public readonly EmailIdentity $identity;
    public readonly PasswordHasher $hasher;
    public readonly UserRepository $users;
    public readonly SessionManager $sessions;
    public readonly LoginThrottle $throttle;
    public readonly SecurityEventRecorder $events;
    public readonly Authorizer $authz;
    public readonly AuthService $auth;
    public readonly PasswordResetService $reset;

    public function __construct(public readonly Kernel $kernel)
    {
        $cfg = $kernel->config;
        $db  = $kernel->db();

        $this->identity = EmailIdentity::fromConfig($cfg);
        $this->hasher   = new PasswordHasher();
        $this->users    = new UserRepository($db, $this->hasher);
        $this->sessions = new SessionManager($db, $kernel->session, (int)$cfg->get('session.hours', 12));
        $this->throttle = new LoginThrottle($db);
        $this->events   = new SecurityEventRecorder($db, $this->identity);

        $this->authz = new Authorizer(
            $this->users, $this->identity, $this->events,
            $kernel->context->ip, $kernel->context->userAgent, $kernel->context->requestId,
        );

        $this->auth = new AuthService(
            $db, $this->users, $this->hasher, $this->sessions, $this->throttle,
            $this->events, $this->identity, new NullMfaProvider(),
        );

        $this->reset = new PasswordResetService(
            $db, $this->users, $this->hasher, $this->sessions, $this->events, new NullMailer(),
        );
    }

    public function router(): Router
    {
        $c = new AuthController(
            $this->auth, $this->reset, $this->sessions, $this->users,
            $this->authz, $this->kernel->context->requestId,
        );
        $r = new Router();
        $r->post('/api/v1/auth/login',                   fn($req) => $c->login($req));
        $r->post('/api/v1/auth/logout',                  fn($req) => $c->logout($req));
        $r->get('/api/v1/auth/session',                  fn($req) => $c->session($req));
        $r->post('/api/v1/auth/password/change',         fn($req) => $c->changePassword($req));
        $r->post('/api/v1/auth/password/reset/request',  fn($req) => $c->resetRequest($req));
        $r->post('/api/v1/auth/password/reset/complete', fn($req) => $c->resetComplete($req));
        return $r;
    }
}
