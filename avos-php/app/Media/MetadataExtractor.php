<?php
declare(strict_types=1);
namespace AvOS\Media;

/**
 * Per-class technical metadata (Phase 3F §3F.9, §3F.16, §3F.17).
 *
 * Everything here is derived by READING bytes — never by executing them. A
 * shader is parsed for its `#version` directive with a regex; a `.glb` header
 * is unpacked with `unpack()`; a `.gltf` is JSON-decoded with depth limits.
 * Nothing is evaluated, rendered or compiled server-side, which is the explicit
 * requirement for models (§3F.16) and shaders (§3F.17).
 *
 * The output lands in `media.meta` as JSON, because it genuinely differs per
 * asset class and is never queried by value.
 */
final class MetadataExtractor
{
    public function __construct(private readonly Video\VideoProbe $video) {}

    /**
     * @param string $absolutePath a readable path to the stored original
     * @return array<string,mixed>
     */
    public function extract(string $kind, string $extension, string $bytes, string $absolutePath): array
    {
        return match ($kind) {
            AssetKind::IMAGE, AssetKind::TEXTURE => $this->image($extension, $bytes),
            AssetKind::VIDEO, AssetKind::AUDIO   => $this->timeBased($absolutePath),
            AssetKind::MODEL_3D                  => $this->model($extension, $bytes),
            AssetKind::SHADER                    => $this->shader($extension, $bytes),
            AssetKind::SCRIPT                    => $this->script($extension, $bytes),
            AssetKind::FONT                      => $this->font($extension),
            default                              => [],
        };
    }

    private function image(string $ext, string $bytes): array
    {
        $meta = ['media_class' => 'raster'];
        if ($ext === 'svg') {
            $meta['media_class'] = 'vector';
            $meta['has_viewbox'] = stripos(substr($bytes, 0, 4096), 'viewbox') !== false;
            return $meta;
        }
        if (in_array($ext, ['jpg', 'jpeg'], true)) {
            $exif = ExifReader::read($bytes);
            $meta['orientation'] = $exif['orientation'];
            // Recorded as a boolean ONLY. The coordinates themselves are never
            // stored, so they cannot leak through a later endpoint or a backup.
            $meta['gps_removed'] = $exif['had_gps'];
            if ($exif['summary'] !== []) $meta['exif'] = $exif['summary'];
        }
        $meta['alpha'] = in_array($ext, DerivativeSpec::TRANSPARENT_SOURCES, true);
        return $meta;
    }

    private function timeBased(string $absolutePath): array
    {
        $p = $this->video->probe($absolutePath);
        $meta = ['probe' => $p['available'] ? 'ffprobe' : 'unavailable'];
        if (!$p['available']) {
            // Say why, so nobody later assumes the video simply had no metadata.
            $meta['probe_reason'] = $p['reason'];
            return $meta;
        }
        foreach (['video_codec', 'audio_codec', 'fps', 'bitrate'] as $k) {
            if ($p[$k] !== null && $p[$k] !== '') $meta[$k] = $p[$k];
        }
        return $meta;
    }

    /** GLB/GLTF: header and declared counts only. The model is never evaluated. */
    private function model(string $ext, string $bytes): array
    {
        $meta = ['format' => $ext];

        if ($ext === 'glb' && strlen($bytes) >= 12 && substr($bytes, 0, 4) === 'glTF') {
            $header = @unpack('Vmagic/Vversion/Vlength', substr($bytes, 0, 12));
            if (is_array($header)) {
                $meta['gltf_version'] = (int)$header['version'];
                $meta['declared_bytes'] = (int)$header['length'];
                $meta['length_matches'] = (int)$header['length'] === strlen($bytes);
            }
            // The JSON chunk carries node/mesh counts and often an extents hint.
            if (strlen($bytes) > 20) {
                $chunk = @unpack('VchunkLength/VchunkType', substr($bytes, 12, 8));
                if (is_array($chunk) && $chunk['chunkType'] === 0x4E4F534A) {
                    $json = substr($bytes, 20, min((int)$chunk['chunkLength'], 262144));
                    $meta += $this->gltfCounts($json);
                }
            }
            return $meta;
        }

        if ($ext === 'gltf') {
            $meta += $this->gltfCounts(substr($bytes, 0, 262144));
            return $meta;
        }

        if ($ext === 'obj') {
            // Cheap, bounded scan: count declarations, derive the bounding box.
            $meta += $this->objBounds($bytes);
        }
        return $meta;
    }

    private function gltfCounts(string $json): array
    {
        $data = json_decode($json, true, 64);
        if (!is_array($data)) return ['parsed' => false];
        $out = ['parsed' => true];
        foreach (['meshes', 'nodes', 'materials', 'textures', 'animations'] as $k) {
            if (isset($data[$k]) && is_array($data[$k])) $out[$k . '_count'] = count($data[$k]);
        }
        if (isset($data['asset']['version'])) $out['gltf_asset_version'] = (string)$data['asset']['version'];
        if (isset($data['asset']['generator'])) {
            $out['generator'] = substr((string)$data['asset']['generator'], 0, 120);
        }
        // Extents from the POSITION accessor, when the file declares them.
        foreach ((array)($data['accessors'] ?? []) as $accessor) {
            if (!is_array($accessor)) continue;
            if (($accessor['type'] ?? '') !== 'VEC3') continue;
            if (!isset($accessor['min'], $accessor['max'])) continue;
            if (!is_array($accessor['min']) || count($accessor['min']) !== 3) continue;
            $min = array_map('floatval', $accessor['min']);
            $max = array_map('floatval', $accessor['max']);
            $out['dimensions'] = [
                'x' => round($max[0] - $min[0], 4),
                'y' => round($max[1] - $min[1], 4),
                'z' => round($max[2] - $min[2], 4),
            ];
            break;
        }
        return $out;
    }

    private function objBounds(string $bytes): array
    {
        $min = [PHP_FLOAT_MAX, PHP_FLOAT_MAX, PHP_FLOAT_MAX];
        $max = [-PHP_FLOAT_MAX, -PHP_FLOAT_MAX, -PHP_FLOAT_MAX];
        $vertices = 0;
        $faces = 0;
        // Bounded: a huge OBJ must not turn metadata extraction into a stall.
        foreach (explode("\n", substr($bytes, 0, 2 * 1024 * 1024)) as $line) {
            if (str_starts_with($line, 'v ')) {
                $parts = preg_split('/\s+/', trim($line));
                if ($parts !== false && count($parts) >= 4) {
                    $vertices++;
                    for ($i = 0; $i < 3; $i++) {
                        $v = (float)$parts[$i + 1];
                        if ($v < $min[$i]) $min[$i] = $v;
                        if ($v > $max[$i]) $max[$i] = $v;
                    }
                }
            } elseif (str_starts_with($line, 'f ')) {
                $faces++;
            }
        }
        $out = ['vertices_scanned' => $vertices, 'faces_scanned' => $faces];
        if ($vertices > 0) {
            $out['dimensions'] = [
                'x' => round($max[0] - $min[0], 4),
                'y' => round($max[1] - $min[1], 4),
                'z' => round($max[2] - $min[2], 4),
            ];
        }
        return $out;
    }

    /** §3F.17: shader stage, GLSL version, description, tags. */
    private function shader(string $ext, string $bytes): array
    {
        $text = substr($bytes, 0, 262144);
        $stage = match ($ext) {
            'frag' => 'fragment',
            'vert' => 'vertex',
            default => $this->guessShaderStage($text),
        };
        $meta = [
            'shader_stage' => $stage,
            'lines'        => substr_count($text, "\n") + 1,
        ];
        if (preg_match('/^\s*#version\s+(\d{2,3})\s*(es)?/mi', $text, $m) === 1) {
            $meta['glsl_version'] = $m[1] . (isset($m[2]) && $m[2] !== '' ? ' es' : '');
        }
        // A leading comment block is the closest thing a shader has to a title.
        if (preg_match('#^\s*(?://\s*(.+)|/\*+\s*(.+?)\s*\*/)#s', $text, $m) === 1) {
            $desc = trim((string)($m[1] ?? $m[2] ?? ''));
            if ($desc !== '') $meta['description'] = substr(preg_replace('/\s+/', ' ', $desc) ?? '', 0, 200);
        }
        $uniforms = [];
        if (preg_match_all('/^\s*uniform\s+\w+\s+(\w+)/mi', $text, $m) > 0) {
            $uniforms = array_slice(array_unique($m[1]), 0, 40);
        }
        if ($uniforms !== []) $meta['uniforms'] = array_values($uniforms);
        // Tags stay JSON: there is no media_tags table, so no relational
        // relationship is being bypassed (see the DEFERRED list in the report).
        $meta['tags'] = [];
        return $meta;
    }

    private function guessShaderStage(string $text): string
    {
        $t = strtolower($text);
        if (str_contains($t, 'gl_fragcolor') || str_contains($t, 'out vec4')) return 'fragment';
        if (str_contains($t, 'gl_position')) return 'vertex';
        return 'unknown';
    }

    /**
     * §3F.18: scripts are stored as DATA. Nothing here executes, evaluates or
     * parses the JavaScript as code — it counts lines and looks for a library
     * fingerprint so the admin can label it.
     */
    private function script(string $ext, string $bytes): array
    {
        $text = substr($bytes, 0, 262144);
        $meta = [
            'script_type' => $ext === 'json' ? 'configuration' : 'javascript',
            'lines'       => substr_count($text, "\n") + 1,
            'executed'    => false,   // stated explicitly; nothing ever sets it true
        ];
        $lower = strtolower($text);
        $libraries = [];
        foreach (['three' => 'three.js', 'gsap' => 'gsap', 'scrolltrigger' => 'ScrollTrigger',
                  'lenis' => 'lenis', 'matter' => 'matter.js'] as $needle => $label) {
            if (str_contains($lower, $needle)) $libraries[] = $label;
        }
        if ($libraries !== []) $meta['libraries'] = $libraries;
        if ($ext === 'json') {
            $meta['valid_json'] = json_decode($text, true, 64) !== null || trim($text) === 'null';
        }
        return $meta;
    }

    private function font(string $ext): array
    {
        return ['font_format' => $ext, 'webfont' => in_array($ext, ['woff', 'woff2'], true)];
    }
}
