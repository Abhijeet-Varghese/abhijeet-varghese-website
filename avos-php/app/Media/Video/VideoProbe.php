<?php
declare(strict_types=1);
namespace AvOS\Media\Video;

use AvOS\Media\Capabilities;

/**
 * Video and audio metadata (Phase 3F §3F.14).
 *
 * Uses ffprobe when it exists. When it does not — the normal case on shared
 * hosting, where `proc_open` is usually disabled outright — this returns
 * `available: false` with a reason, and the caller stores the asset anyway with
 * whatever is known from the bytes.
 *
 * The rule the brief is really asking for: **the asset system must not depend
 * on FFmpeg.** Upload works, the original stays available, metadata is
 * partial, and the API says so instead of inventing a duration.
 */
final class VideoProbe
{
    public function available(): bool { return Capabilities::hasFfprobe(); }

    public function unavailableReason(): string
    {
        $ff = Capabilities::all()['ffmpeg'];
        if (!$ff['shell']) return (string)$ff['reason'];
        return 'ffprobe is not installed on this host';
    }

    /**
     * @return array{
     *   available:bool, reason:string, duration_ms:?int, width:?int, height:?int,
     *   video_codec:string, audio_codec:string, fps:?float, bitrate:?int
     * }
     */
    public function probe(string $absolutePath): array
    {
        $empty = [
            'available' => false, 'reason' => $this->unavailableReason(),
            'duration_ms' => null, 'width' => null, 'height' => null,
            'video_codec' => '', 'audio_codec' => '', 'fps' => null, 'bitrate' => null,
        ];
        if (!$this->available() || !is_file($absolutePath)) return $empty;

        // Argument ARRAY, never a shell string: the path can never become a
        // command however it is named.
        $json = Capabilities::run([
            'ffprobe', '-v', 'error', '-print_format', 'json',
            '-show_format', '-show_streams', $absolutePath,
        ], 25);

        if ($json === null || trim($json) === '') {
            return ['available' => false, 'reason' => 'ffprobe returned no output'] + $empty;
        }
        $data = json_decode($json, true);
        if (!is_array($data)) {
            return ['available' => false, 'reason' => 'ffprobe output was not readable'] + $empty;
        }

        $out = $empty;
        $out['available'] = true;
        $out['reason'] = '';

        $duration = (float)($data['format']['duration'] ?? 0);
        if ($duration > 0) $out['duration_ms'] = (int)round($duration * 1000);
        $bitrate = (int)($data['format']['bit_rate'] ?? 0);
        if ($bitrate > 0) $out['bitrate'] = $bitrate;

        foreach ((array)($data['streams'] ?? []) as $stream) {
            $type = (string)($stream['codec_type'] ?? '');
            if ($type === 'video' && $out['width'] === null) {
                $out['width'] = (int)($stream['width'] ?? 0) ?: null;
                $out['height'] = (int)($stream['height'] ?? 0) ?: null;
                $out['video_codec'] = (string)($stream['codec_name'] ?? '');
                $rate = (string)($stream['avg_frame_rate'] ?? '');
                if (str_contains($rate, '/')) {
                    [$n, $d] = array_map('floatval', explode('/', $rate, 2));
                    if ($d > 0.0) $out['fps'] = round($n / $d, 3);
                }
            } elseif ($type === 'audio' && $out['audio_codec'] === '') {
                $out['audio_codec'] = (string)($stream['codec_name'] ?? '');
            }
        }
        return $out;
    }
}
