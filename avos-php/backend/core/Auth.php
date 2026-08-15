<?php
/**
 * AV OS — Auth: secure sessions, bcrypt hashing, login throttling, CSRF,
 * force-password-change on first login, session expiry.
 */
final class Auth
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_set_cookie_params([
                'lifetime' => AV_SESSION_HOURS * 3600,
                'path' => '/',
                'httponly' => true,
                'samesite' => 'Lax',
                'secure' => self::isHttps(),
            ]);
            session_name('AVOS_SESS');
            session_start();
        }
        // session expiry: regenerate TTL on activity
        if (!empty($_SESSION['user_id']) && isset($_SESSION['created'])) {
            if (time() - $_SESSION['created'] > AV_SESSION_HOURS * 3600) {
                self::logout();
            } else {
                $_SESSION['created'] = time();
            }
        }
        // revocation check: admin may revoke sessions server-side
        if (!empty($_SESSION['user_id'])) {
            try {
                $row = Database::one("SELECT id FROM sessions WHERE token_hash=? AND expires_at > NOW()", [hash('sha256', session_id())]);
                if (!$row) {
                    self::logout();   // session was revoked or expired in the registry
                } else {
                    Database::q("UPDATE sessions SET last_seen_at=NOW() WHERE id=?", [(int)$row['id']]);
                }
            } catch (Throwable $e) { /* registry down — fall back to PHP session only */ }
        }
    }

    public static function isHttps(): bool
    {
        return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    }

    /** Attempt login with throttling. Returns [ok, error] */
    public static function attempt(string $email, string $password): array
    {
        $ip = self::ip();
        $email = mb_strtolower(trim($email));

        $sec = Database::one("SELECT svalue FROM site_settings WHERE skey='security'");
        $secArr = $sec ? (json_decode($sec['svalue'], true) ?: []) : [];
        $max = (int)($secArr['login_max_attempts'] ?? 5);
        $mins = (int)($secArr['login_lock_minutes'] ?? 15);

        $recent = (int)Database::one(
            "SELECT COUNT(*) c FROM login_attempts WHERE email=? AND ip=? AND success=0 AND attempted_at > (NOW() - INTERVAL ? MINUTE)",
            [$email, $ip, $mins]
        )['c'];
        if ($recent >= $max) {
            return [false, 'Too many failed attempts. Try again in a few minutes.', null, 'THROTTLED', false];
        }

        $user = Database::one("SELECT * FROM users WHERE email=? AND status='active'", [$email]);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            Database::q("INSERT INTO login_attempts (email, ip, success) VALUES (?,?,0)", [$email, $ip]);
            return [false, 'Invalid email or password.', null, null, false];
        }

        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            Database::q("UPDATE users SET password_hash=? WHERE id=?", [password_hash($password, PASSWORD_DEFAULT), $user['id']]);
        }

        Database::q("INSERT INTO login_attempts (email, ip, success) VALUES (?,?,1)", [$email, $ip]);
        session_regenerate_id(true);
        // 2FA gate: with TOTP enabled, only mark the session as pending — the
        // full session (user_id/csrf/registry) is created by verify2fa()
        if (!empty($user['totp_enabled'])) {
            $_SESSION['2fa_pending'] = (int)$user['id'];
            return [true, '', (int)$user['must_change_password'], null, true];
        }
        $_SESSION['user_id'] = (int)$user['id'];
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
        $_SESSION['created'] = time();
        // mirror into the session registry (enables revocation + active-session view)
        try {
            Database::q("INSERT INTO sessions (user_id, token_hash, ip, user_agent, expires_at) VALUES (?,?,?,?,?)",
                [(int)$user['id'], hash('sha256', session_id()), $ip, mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 250),
                 date('Y-m-d H:i:s', time() + AV_SESSION_HOURS * 3600)]);
        } catch (Throwable $e) { /* registry must never block login */ }

        Database::q("UPDATE users SET last_login_at=NOW(), last_login_ip=? WHERE id=?", [$ip, $user['id']]);
        Audit::log($user['id'], 'login', 'auth', 'login', ['method' => 'password']);
        return [true, '', (int)$user['must_change_password'], null, false];
    }

    public static function check(): bool
    {
        return !empty($_SESSION['user_id']);
    }

    public static function user(): ?array
    {
        if (!self::check()) return null;
        $u = Database::one("SELECT u.*, r.name role_name FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=?", [$_SESSION['user_id']]);
        if (!$u) { self::logout(); return null; }
        return $u;
    }

    /** All permission codes for the current user (for the CMS UI) */
    public static function permissions(): array
    {
        $u = self::user();
        if (!$u) return [];
        if ($u['role_name'] === 'Super Admin') {
            return array_column(Database::all("SELECT code FROM permissions"), 'code');
        }
        return array_column(Database::all(
            "SELECT p.code FROM role_permissions rp JOIN permissions p ON p.id=rp.permission_id WHERE rp.role_id=?",
            [$u['role_id']]
        ), 'code');
    }

    public static function can(string $permission): bool
    {
        $u = self::user();
        if (!$u) return false;
        if ($u['role_name'] === 'Super Admin') return true;
        return (bool)Database::one(
            "SELECT 1 FROM role_permissions rp JOIN permissions p ON p.id=rp.permission_id
             WHERE rp.role_id=? AND p.code=?",
            [$u['role_id'], $permission]
        );
    }

    public static function mustChangePassword(): bool
    {
        $u = self::user();
        return $u ? (bool)$u['must_change_password'] : false;
    }

    public static function changePassword(int $userId, string $newPassword): void
    {
        Database::q("UPDATE users SET password_hash=?, must_change_password=0 WHERE id=?",
            [password_hash($newPassword, PASSWORD_DEFAULT), $userId]);
        Audit::log($userId, 'password_change', 'auth', 'user:' . $userId);
    }

    public static function csrf(): string
    {
        return $_SESSION['csrf'] ?? '';
    }

    /* ---------- two-factor authentication (TOTP) ---------- */
    public static function pending2fa(): ?int
    {
        return isset($_SESSION['2fa_pending']) ? (int)$_SESSION['2fa_pending'] : null;
    }

    /** Complete the login for a user who passed the 2FA challenge. */
    public static function complete2fa(int $userId): void
    {
        session_regenerate_id(true);
        unset($_SESSION['2fa_pending']);
        $_SESSION['user_id'] = $userId;
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
        $_SESSION['created'] = time();
        try {
            Database::q("INSERT INTO sessions (user_id, token_hash, ip, user_agent, expires_at) VALUES (?,?,?,?,?)",
                [$userId, hash('sha256', session_id()), self::ip(), mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 250),
                 date('Y-m-d H:i:s', time() + AV_SESSION_HOURS * 3600)]);
        } catch (Throwable $e) {}
        Database::q("UPDATE users SET totp_verified_at=NOW() WHERE id=?", [$userId]);
    }

    /** Encrypt TOTP secrets at rest (aes-256-cbc with AV_ENC_KEY). */
    public static function encryptTotpSecret(string $secret): string
    {
        return AiService::encrypt($secret);
    }

    public static function decryptTotpSecret(string $enc): string
    {
        return AiService::decrypt($enc);
    }

    public static function verifyCsrf(?string $token): bool
    {
        return $token !== null && hash_equals(self::csrf(), $token);
    }

    public static function logout(): void
    {
        if (self::check()) {
            Audit::log($_SESSION['user_id'], 'logout', 'auth', 'logout');
            try { Database::q("DELETE FROM sessions WHERE token_hash=?", [hash('sha256', session_id())]); } catch (Throwable $e) {}
        }
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
    }

    /**
     * Client IP with a proxy trust model: forwarded headers are ONLY honored
     * when the direct peer is in the trusted proxy ranges (AV_TRUSTED_PROXY_RANGES,
     * e.g. Cloudflare's published CIDRs). Never blindly trusts X-Forwarded-For.
     */
    public static function ip(): string
    {
        $peer = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        if (defined('AV_TRUST_PROXY') && AV_TRUST_PROXY && self::peerTrusted($peer)) {
            $fwd = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
            if ($fwd !== '' && filter_var(trim(explode(',', $fwd)[0]), FILTER_VALIDATE_IP)) {
                return trim(explode(',', $fwd)[0]);
            }
        }
        return $peer;
    }

    private static function peerTrusted(string $ip): bool
    {
        if (!defined('AV_TRUSTED_PROXY_RANGES') || AV_TRUSTED_PROXY_RANGES === '') return false;
        foreach (array_filter(array_map('trim', explode(',', (string)AV_TRUSTED_PROXY_RANGES))) as $cidr) {
            if (self::ipInCidr($ip, $cidr)) return true;
        }
        return false;
    }

    private static function ipInCidr(string $ip, string $cidr): bool
    {
        if (str_contains($cidr, '/')) {
            [$net, $bits] = array_pad(explode('/', $cidr, 2), 2, '32');
        } else {
            $net = $cidr; $bits = 32;
        }
        $ipL = ip2long($ip); $netL = ip2long($net);
        if ($ipL === false || $netL === false) return false;
        $mask = $bits === 0 ? 0 : (~0 << (32 - (int)$bits)) & 0xFFFFFFFF;
        return ($ipL & $mask) === ($netL & $mask);
    }
}

final class Audit
{
    public static function log(?int $userId, string $action, string $entity = '', string $entityId = '', array $detail = []): void
    {
        try {
            Database::q(
                "INSERT INTO audit_logs (user_id, action, entity, entity_id, detail, ip) VALUES (?,?,?,?,?,?)",
                [$userId, $action, $entity, $entityId, json_encode($detail), Auth::ip()]
            );
        } catch (Throwable $e) { /* audit must never break the request */ }
    }
}

/** Generic MySQL-backed rate limiter (no Redis needed — Hostinger compatible) */
final class RateLimiter
{
    /**
     * Atomic DB-backed rate limiter (MariaDB row-lock semantics via
     * INSERT..ON DUPLICATE KEY UPDATE — no read-modify-write race).
     * @return bool true if allowed
     */
    public static function allow(string $key, int $max, int $windowSeconds): bool
    {
        $k = md5($key);                       // fixed-size key, no PII in table
        $windowStart = date('Y-m-d H:i:s', time() - $windowSeconds);
        $now = date('Y-m-d H:i:s');
        try {
            Database::q(
                "INSERT INTO rate_limits (k, window_start, count) VALUES (?,?,1)
                 ON DUPLICATE KEY UPDATE
                   count = IF(window_start < ?, 1, count + 1),
                   window_start = IF(window_start < ?, ?, window_start)",
                [$k, $windowStart, $windowStart, $windowStart, $now]
            );
            $row = Database::one("SELECT count FROM rate_limits WHERE k=?", [$k]);
            // opportunistic cleanup (≈0.1% of calls) keeps the table bounded
            if (random_int(1, 1000) === 1) {
                Database::q("DELETE FROM rate_limits WHERE window_start < ?", [date('Y-m-d H:i:s', time() - 86400)]);
            }
            return $row ? (int)$row['count'] <= $max : true;
        } catch (Throwable $e) {
            // rate limiting must never break the request — fail open on DB errors
            return true;
        }
    }
}
