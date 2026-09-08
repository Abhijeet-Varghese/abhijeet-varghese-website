<?php
/**
 * AV OS — TOTP (RFC 6238) 2FA, pure PHP, no external libraries.
 * SHA1, 30-second window, ±1 step tolerance, Base32 secrets,
 * single-use recovery codes (hashed at rest).
 *
 * Note: setup presents the otpauth:// URI + secret for manual entry
 * in authenticator apps (Google Authenticator, Aegis, 1Password…).
 */
final class Totp
{
    private const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    private const WINDOW = 30;
    private const SKEW = 1; // ±1 step

    /* ---------- secrets ---------- */
    public static function generateSecret(int $bytes = 20): string
    {
        $raw = random_bytes($bytes);
        $bin = '';
        foreach (str_split($raw) as $b) $bin .= str_pad(decbin(ord($b)), 8, '0', STR_PAD_LEFT);
        $out = '';
        for ($i = 0; $i + 5 <= strlen($bin); $i += 5) $out .= self::BASE32[bindec(substr($bin, $i, 5))];
        return $out;
    }

    public static function base32Decode(string $s): string
    {
        $s = strtoupper(trim($s));
        $bits = '';
        foreach (str_split($s) as $c) {
            $v = strpos(self::BASE32, $c);
            if ($v === false) continue;
            $bits .= str_pad(decbin($v), 5, '0', STR_PAD_LEFT);
        }
        $out = '';
        for ($i = 0; $i + 8 <= strlen($bits); $i += 8) $out .= chr(bindec(substr($bits, $i, 8)));
        return $out;
    }

    /** RFC 6238 code for a given secret + time step. */
    public static function code(string $secret, ?int $time = null): string
    {
        $time = $time ?? time();
        $counter = pack('N2', 0, intdiv($time, self::WINDOW));
        $hash = hash_hmac('sha1', $counter, self::base32Decode($secret), true);
        $offset = ord(substr($hash, -1)) & 0x0F;
        $trunc = ((ord($hash[$offset]) & 0x7F) << 24)
               | ((ord($hash[$offset + 1]) & 0xFF) << 16)
               | ((ord($hash[$offset + 2]) & 0xFF) << 8)
               | (ord($hash[$offset + 3]) & 0xFF);
        return str_pad((string)($trunc % 1000000), 6, '0', STR_PAD_LEFT);
    }

    /** Verify with ±SKEW step tolerance (standard TOTP behaviour). */
    public static function verify(string $secret, string $code, ?int $time = null): bool
    {
        if (!preg_match('/^\d{6}$/', $code)) return false;
        $time = $time ?? time();
        for ($i = -self::SKEW; $i <= self::SKEW; $i++) {
            if (hash_equals(self::code($secret, $time + $i * self::WINDOW), $code)) return true;
        }
        return false;
    }

    /** otpauth:// URI for authenticator apps (manual entry). */
    public static function otpauthUri(string $secret, string $account, string $issuer = 'AV OS'): string
    {
        return 'otpauth://totp/' . rawurlencode($issuer . ':' . $account)
             . '?secret=' . $secret . '&issuer=' . rawurlencode($issuer) . '&algorithm=SHA1&digits=6&period=30';
    }

    /* ---------- recovery codes (hashed at rest, single-use) ---------- */
    public static function generateRecoveryCodes(int $count = 10): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(substr(bin2hex(random_bytes(6)), 0, 10)); // 10 chars
        }
        return $codes;
    }

    public static function hashCodes(array $codes): array
    {
        return array_map(fn($c) => password_hash($c, PASSWORD_DEFAULT), $codes);
    }

    /** Verify + mark a recovery code used. Returns ['ok'=>bool,'index'=>int]. */
    public static function consumeRecoveryCode(array $storedHashes, string $code): array
    {
        $code = strtoupper(trim($code));
        foreach ($storedHashes as $i => $hash) {
            if ($hash !== null && $hash !== '' && password_verify($code, (string)$hash)) {
                return ['ok' => true, 'index' => $i];
            }
        }
        return ['ok' => false];
    }
}
