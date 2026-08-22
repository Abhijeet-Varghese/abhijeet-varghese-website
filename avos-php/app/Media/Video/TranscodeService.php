<?php
declare(strict_types=1);
namespace AvOS\Media\Video;

use AvOS\Media\Capabilities;

/**
 * Video transcoding abstraction (Phase 3F §3F.15).
 *
 * Built, but deliberately NOT invoked during upload. Transcoding a video takes
 * far longer than a shared-hosting request is allowed to run, so calling it
 * inline would produce timeouts and half-written files. The correct home is the
 * Phase 3P cron+flock queue, and this class is the seam that queue will drive.
 *
 * What it does today, honestly:
 *  - reports whether transcoding is possible at all, and why not when it isn't
 *  - can produce a poster frame, which IS fast enough to run inline
 *  - can transcode on demand when a caller explicitly asks and accepts the cost
 *
 * `status()` never claims a capability that was not proven by running the
 * binary. There is no "transcoding: pending" that quietly never completes.
 */
final class TranscodeService
{
    /** Target profiles the queue will eventually request. */
    public const PROFILES = [
        'mp4'  => ['ext' => 'mp4',  'vcodec' => 'libx264', 'acodec' => 'aac',    'crf' => '23'],
        'webm' => ['ext' => 'webm', 'vcodec' => 'libvpx-vp9', 'acodec' => 'libopus', 'crf' => '32'],
    ];

    public function available(): bool { return Capabilities::hasFfmpeg(); }

    /** @return array{available:bool,reason:string,profiles:string[],encoders:array<string,bool>} */
    public function status(): array
    {
        if (!$this->available()) {
            $ff = Capabilities::all()['ffmpeg'];
            return [
                'available' => false,
                'reason'    => $ff['shell'] ? 'ffmpeg is not installed on this host' : (string)$ff['reason'],
                'profiles'  => [],
                'encoders'  => [],
            ];
        }
        // Which encoders this build actually has — a stripped ffmpeg is common.
        $list = strtolower((string)Capabilities::run(['ffmpeg', '-hide_banner', '-encoders'], 20));
        $encoders = [];
        foreach (self::PROFILES as $name => $p) {
            $encoders[$name] = str_contains($list, strtolower($p['vcodec']));
        }
        return [
            'available' => true,
            'reason'    => '',
            'profiles'  => array_values(array_keys(array_filter($encoders))),
            'encoders'  => $encoders,
        ];
    }

    /**
     * Extract a poster frame. Fast enough to run inline, and the one video
     * derivative that is genuinely useful immediately.
     *
     * @return array{ok:bool,reason:string,path:string}
     */
    public function posterFrame(string $sourceAbsolute, string $destinationAbsolute, float $atSeconds = 1.0): array
    {
        if (!$this->available()) {
            return ['ok' => false, 'reason' => $this->status()['reason'], 'path' => ''];
        }
        if (!is_file($sourceAbsolute)) {
            return ['ok' => false, 'reason' => 'source file is missing', 'path' => ''];
        }
        $dir = dirname($destinationAbsolute);
        if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
            return ['ok' => false, 'reason' => 'destination directory could not be created', 'path' => ''];
        }

        Capabilities::run([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
            '-ss', (string)max(0.0, $atSeconds),
            '-i', $sourceAbsolute,
            '-frames:v', '1', '-q:v', '3',
            $destinationAbsolute,
        ], 60);

        if (!is_file($destinationAbsolute) || filesize($destinationAbsolute) === 0) {
            @unlink($destinationAbsolute);
            return ['ok' => false, 'reason' => 'ffmpeg produced no frame', 'path' => ''];
        }
        return ['ok' => true, 'reason' => '', 'path' => $destinationAbsolute];
    }

    /**
     * Transcode to a profile. NOT called during upload — see the class note.
     * Exposed so the Phase 3P queue worker has something real to call.
     *
     * @return array{ok:bool,reason:string,path:string,bytes:int}
     */
    public function transcode(string $sourceAbsolute, string $destinationAbsolute, string $profile): array
    {
        $fail = static fn(string $r): array => ['ok' => false, 'reason' => $r, 'path' => '', 'bytes' => 0];

        if (!isset(self::PROFILES[$profile])) return $fail('unknown profile');
        if (!$this->available()) return $fail($this->status()['reason']);
        if (!is_file($sourceAbsolute)) return $fail('source file is missing');

        $status = $this->status();
        if (!($status['encoders'][$profile] ?? false)) {
            return $fail('this ffmpeg build has no encoder for ' . $profile);
        }

        $p = self::PROFILES[$profile];
        $tmp = $destinationAbsolute . '.part-' . bin2hex(random_bytes(6));
        $dir = dirname($destinationAbsolute);
        if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
            return $fail('destination directory could not be created');
        }

        Capabilities::run([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
            '-i', $sourceAbsolute,
            '-c:v', $p['vcodec'], '-crf', $p['crf'],
            '-c:a', $p['acodec'],
            '-movflags', '+faststart',
            $tmp,
        ], 900);

        if (!is_file($tmp) || filesize($tmp) === 0) {
            @unlink($tmp);
            return $fail('ffmpeg produced no output');
        }
        if (!@rename($tmp, $destinationAbsolute)) {
            @unlink($tmp);
            return $fail('output could not be committed');
        }
        return ['ok' => true, 'reason' => '', 'path' => $destinationAbsolute,
                'bytes' => (int)filesize($destinationAbsolute)];
    }
}
