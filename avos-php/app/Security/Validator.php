<?php
declare(strict_types=1);
namespace AvOS\Security;

use AvOS\Errors\ValidationException;

/**
 * Input validation foundation (Phase 2 §3A.6).
 * Typed accessors + rule checks. Endpoint-specific request objects (Phase 3E)
 * compose these; controllers never read $_POST directly.
 */
final class Validator
{
    private array $errors = [];

    public function __construct(private readonly array $data) {}

    public static function fromJsonBody(string $raw): self
    {
        $decoded = json_decode($raw, true);
        return new self(is_array($decoded) ? $decoded : []);
    }

    public function has(string $k): bool { return array_key_exists($k, $this->data); }

    public function string(string $k, int $max = 5000, bool $required = false, string $default = ''): string
    {
        $v = $this->data[$k] ?? null;
        if ($v === null || $v === '') {
            if ($required) $this->errors[$k] = 'required';
            return $default;
        }
        if (!is_scalar($v)) { $this->errors[$k] = 'must be a string'; return $default; }
        $s = trim((string)$v);
        if (mb_strlen($s) > $max) { $this->errors[$k] = "must be at most {$max} characters"; return mb_substr($s, 0, $max); }
        return $s;
    }

    public function int(string $k, ?int $min = null, ?int $max = null, bool $required = false, int $default = 0): int
    {
        $v = $this->data[$k] ?? null;
        if ($v === null || $v === '') { if ($required) $this->errors[$k] = 'required'; return $default; }
        if (!is_numeric($v)) { $this->errors[$k] = 'must be a number'; return $default; }
        $i = (int)$v;
        if ($min !== null && $i < $min) { $this->errors[$k] = "must be at least {$min}"; return $default; }
        if ($max !== null && $i > $max) { $this->errors[$k] = "must be at most {$max}"; return $default; }
        return $i;
    }

    public function bool(string $k, bool $default = false): bool
    {
        if (!$this->has($k)) return $default;
        return in_array($this->data[$k], [true, 1, '1', 'true', 'on', 'yes'], true);
    }

    public function email(string $k, bool $required = false): string
    {
        $s = $this->string($k, 190, $required);
        if ($s === '') return '';
        $v = filter_var($s, FILTER_VALIDATE_EMAIL);
        if ($v === false) { $this->errors[$k] = 'must be a valid email address'; return ''; }
        return strtolower($v);
    }

    public function slug(string $k, bool $required = false): string
    {
        $s = $this->string($k, 190, $required);
        if ($s === '') return '';
        if (preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $s) !== 1) {
            $this->errors[$k] = 'must be lowercase letters, numbers and hyphens';
            return '';
        }
        return $s;
    }

    /** @param array<int,string> $allowed */
    public function enum(string $k, array $allowed, bool $required = false, string $default = ''): string
    {
        $s = $this->string($k, 60, $required, $default);
        if ($s === '') return $default;
        if (!in_array($s, $allowed, true)) {
            $this->errors[$k] = 'must be one of: ' . implode(', ', $allowed);
            return $default;
        }
        return $s;
    }

    /** UTC datetime, 'Y-m-d H:i:s'. */
    public function datetime(string $k, bool $required = false): ?string
    {
        $s = $this->string($k, 40, $required);
        if ($s === '') return null;
        $ts = strtotime($s);
        if ($ts === false) { $this->errors[$k] = 'must be a valid date/time'; return null; }
        return gmdate('Y-m-d H:i:s', $ts);
    }

    public function array(string $k, bool $required = false): array
    {
        $v = $this->data[$k] ?? null;
        if (!is_array($v)) { if ($required) $this->errors[$k] = 'required'; return []; }
        return $v;
    }

    public function fails(): bool { return $this->errors !== []; }
    public function errors(): array { return $this->errors; }

    public function validOrThrow(): void
    { if ($this->fails()) throw new ValidationException($this->errors); }
}
