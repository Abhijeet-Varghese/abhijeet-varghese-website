<?php
declare(strict_types=1);
namespace AvOS\Content;

use AvOS\Api\ApiException;

/**
 * Structured content configuration (Phase 3E §3E.13).
 *
 * The builder-compatible block document. Shape:
 *
 *   {
 *     "version": 1,
 *     "blocks": [
 *       { "type": "hero",
 *         "name": "Intro",
 *         "props":  { "heading": "…" },
 *         "styles": { "padding": "4rem" },
 *         "responsive": { "mobile": { "props": {…}, "styles": {…}, "visible": false } },
 *         "children": [ … ]
 *       }
 *     ]
 *   }
 *
 * `type`, `children`, `position` and the four device keys mirror
 * `builder_nodes` / `builder_node_devices` exactly, so Phase 3G can project a
 * document into those tables without a translation layer. The visual builder
 * UI is NOT built here — only the storage contract it will read.
 *
 * §3E.13 rule enforced literally: relational data may not be smuggled into
 * JSON. A block that carries `author_id`, `client_id`, `status` or `slug` is
 * rejected, because those already have real columns and a JSON copy would
 * immediately drift out of sync.
 */
final class ContentDocument
{
    public const CURRENT_VERSION = 1;

    public const MAX_BYTES  = 262144;   // 256 KB of structure — not a media store
    public const MAX_BLOCKS = 500;
    public const MAX_DEPTH  = 12;

    /** Mirrors builder_node_devices.device. */
    public const DEVICES = ['mobile', 'tablet', 'laptop', 'large'];

    /**
     * Keys that must live in columns, never in JSON. Checked at EVERY depth:
     * a nested block is just as capable of duplicating an author id.
     */
    public const RELATIONAL_KEYS = [
        'author_id', 'client_id', 'status', 'slug', 'published_at', 'publish_at',
        'created_by', 'updated_by', 'user_id', 'owner_email', 'category_id', 'tag_id',
    ];

    private const BLOCK_KEYS = [
        'type', 'name', 'props', 'styles', 'responsive', 'children',
        'bindings', 'conditions', 'interactions', 'animations',
    ];

    /** An empty document — what a brand new page gets. */
    public static function empty(): array
    { return ['version' => self::CURRENT_VERSION, 'blocks' => []]; }

    /**
     * Validate and canonicalise. Returns the normalised document.
     * Throws VALIDATION_ERROR with a field map keyed by block path.
     */
    public static function validate(mixed $doc, string $field = 'content'): array
    {
        if ($doc === null) return self::empty();
        if (!is_array($doc)) {
            throw ApiException::validation([$field => 'must be a JSON object']);
        }
        if (array_is_list($doc)) {
            // Tolerate a bare block list — a common client shorthand.
            $doc = ['version' => self::CURRENT_VERSION, 'blocks' => $doc];
        }

        $version = $doc['version'] ?? self::CURRENT_VERSION;
        if (!is_int($version) || $version < 1 || $version > self::CURRENT_VERSION) {
            throw ApiException::validation([$field . '.version' => 'unsupported document version']);
        }

        $blocks = $doc['blocks'] ?? [];
        if (!is_array($blocks) || ($blocks !== [] && !array_is_list($blocks))) {
            throw ApiException::validation([$field . '.blocks' => 'must be an array of blocks']);
        }

        $errors = [];
        $count = 0;
        $normalised = self::walk($blocks, $field . '.blocks', 1, $errors, $count);
        if ($errors !== []) throw ApiException::validation($errors);

        $out = ['version' => $version, 'blocks' => $normalised];
        $encoded = self::encode($out);
        if (strlen($encoded) > self::MAX_BYTES) {
            throw new ApiException(
                \AvOS\Api\ErrorCatalog::PAYLOAD_TOO_LARGE,
                'Content document exceeds ' . (self::MAX_BYTES / 1024) . ' KB.',
                [$field => 'too large'],
            );
        }
        return $out;
    }

    /** @param array<string,string> $errors */
    private static function walk(array $blocks, string $path, int $depth, array &$errors, int &$count): array
    {
        if ($depth > self::MAX_DEPTH) {
            $errors[$path] = 'exceeds maximum nesting depth of ' . self::MAX_DEPTH;
            return [];
        }
        $out = [];
        foreach ($blocks as $i => $block) {
            $p = $path . '[' . $i . ']';
            if (++$count > self::MAX_BLOCKS) {
                $errors[$path] = 'document exceeds ' . self::MAX_BLOCKS . ' blocks';
                return $out;
            }
            if (!is_array($block) || array_is_list($block)) {
                $errors[$p] = 'must be an object';
                continue;
            }
            $type = $block['type'] ?? '';
            if (!is_string($type) || preg_match('/^[a-z][a-z0-9-]{0,63}$/', $type) !== 1) {
                $errors[$p . '.type'] = 'must be a lowercase identifier';
                continue;
            }
            foreach (array_keys($block) as $key) {
                if (!in_array((string)$key, self::BLOCK_KEYS, true)) {
                    $errors[$p . '.' . $key] = 'is not a recognised block key';
                }
            }

            $node = ['type' => $type];
            if (isset($block['name']) && is_string($block['name'])) {
                $node['name'] = substr($block['name'], 0, 190);
            }

            foreach (['props', 'styles', 'bindings', 'conditions', 'interactions', 'animations'] as $bag) {
                if (!array_key_exists($bag, $block)) continue;
                if (!is_array($block[$bag])) { $errors[$p . '.' . $bag] = 'must be an object'; continue; }
                self::assertNoRelationalKeys($block[$bag], $p . '.' . $bag, $errors);
                $node[$bag] = $block[$bag];
            }

            if (array_key_exists('responsive', $block)) {
                $node['responsive'] = self::responsive($block['responsive'], $p . '.responsive', $errors);
            }

            if (array_key_exists('children', $block)) {
                if (!is_array($block['children']) || ($block['children'] !== [] && !array_is_list($block['children']))) {
                    $errors[$p . '.children'] = 'must be an array of blocks';
                } else {
                    $node['children'] = self::walk($block['children'], $p . '.children', $depth + 1, $errors, $count);
                }
            }
            $out[] = $node;
        }
        return $out;
    }

    private static function responsive(mixed $value, string $path, array &$errors): array
    {
        if (!is_array($value) || array_is_list($value)) {
            $errors[$path] = 'must be an object keyed by device';
            return [];
        }
        $out = [];
        foreach ($value as $device => $override) {
            if (!in_array((string)$device, self::DEVICES, true)) {
                $errors[$path . '.' . $device] = 'must be one of: ' . implode(', ', self::DEVICES);
                continue;
            }
            if (!is_array($override)) { $errors[$path . '.' . $device] = 'must be an object'; continue; }
            self::assertNoRelationalKeys($override, $path . '.' . $device, $errors);
            $out[(string)$device] = $override;
        }
        return $out;
    }

    /** Recursive: a relational key is forbidden at any depth, not just the top. */
    private static function assertNoRelationalKeys(array $bag, string $path, array &$errors): void
    {
        foreach ($bag as $k => $v) {
            if (in_array(strtolower((string)$k), self::RELATIONAL_KEYS, true)) {
                $errors[$path . '.' . $k] =
                    'is a relational field and must not be stored in content JSON';
            }
            if (is_array($v)) self::assertNoRelationalKeys($v, $path . '.' . $k, $errors);
        }
    }

    public static function encode(array $doc): string
    {
        return (string)json_encode($doc, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    /** Tolerant decode: a NULL or unreadable column reads as an empty document. */
    public static function decode(?string $raw): array
    {
        if ($raw === null || $raw === '') return self::empty();
        $d = json_decode($raw, true);
        return is_array($d) ? $d : self::empty();
    }
}
