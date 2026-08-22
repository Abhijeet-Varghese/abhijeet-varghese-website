# Phase 3F — Media & Asset Engine · Completion Report

**Branch** `feat/clean-url-engine` · **Phase 3E base** `1995862`
**Checkpoint tag** `phase3f-start` · **Completion tag** `phase3f-complete`
Not pushed. Not deployed. `main` and `hostinger` untouched.
A6 retained as approved: Owner/Administrator delete, Editor/Content Manager do not.

---

## 1 · Headline findings

**Two bugs were mine, and one of them would have broken the WebGL work entirely.**

1. **Every shader and script upload was rejected.** `libmagic` classifies source
   code by what it *looks like*, not by its extension: a GLSL shader sniffs as
   `text/x-c`, an OBJ mesh as `text/plain`, a JS bundle as
   `application/javascript`. My allow-list pinned those extensions to
   `text/plain`, so `.frag`, `.vert`, `.glsl` and `.obj` all failed MIME
   validation. Caught by an actual upload throwing, not by review. Fixed with a
   `text/*` wildcard for textual asset classes that still refuses
   `text/html`, `text/x-php` and the other active-content subtypes — safety
   still rests on the extension deny list, the content scan and the fact that
   these bytes are only ever served as inert data.

2. **A truncated image passed validation.** `getimagesize()` reads only the
   header, so a PNG cut off mid-data sniffed as `image/png`, reported valid
   dimensions and was accepted — then failed during derivative generation,
   leaving an asset that "uploaded successfully" but could never be processed.
   Now a full decode runs (Imagick `getImagePixelColor`, or GD
   `imagecreatefromstring`), so an accepted image is a usable image. Verified
   against a deliberately truncated fixture.

**One test of mine was simply wrong, and the fix improved coverage.** I asserted
that Content Manager cannot read media. It can — `media.read` and `media.write`
are in its approved Phase 2 role. The control I actually needed was SEO Manager,
which genuinely holds no media permission, and that now proves a real 403 at
the API edge.

**Environment caveat you should know about before reading the PASS column:**
this sandbox began with **no GD, no Imagick and no FFmpeg**. I installed all
three so the image pipeline could be tested against real bytes rather than
skipped. That means every image result below is genuine evidence — and also
that **Hostinger's actual capability set remains UNKNOWN**. See §8.

---

## 2 · Status

| Item | Status |
|---|---|
| Asset domain | **COMPLETE** |
| Storage abstraction | **COMPLETE** |
| Upload security | **COMPLETE** |
| Image processing | **COMPLETE** |
| Responsive variants | **COMPLETE** |
| WebP | **PASS** (generated and byte-verified) |
| AVIF | **PASS** (generated and byte-verified) |
| Video metadata | **COMPLETE** |
| FFmpeg | **AVAILABLE** (installed into the sandbox; unknown on Hostinger) |
| 3D assets | **COMPLETE** |
| Shader assets | **COMPLETE** |
| Script assets | **COMPLETE** |
| Hashing | **COMPLETE** |
| Asset relationships | **COMPLETE** |
| Usage tracking | **COMPLETE** |
| Orphan detection | **COMPLETE** |
| Private downloads | **COMPLETE** |
| Media API | **COMPLETE** |
| Security tests | **PASS** |
| Storage failure tests | **PASS** |
| Database failure tests | **PASS** |
| HTTP verification | **PASS** (100/100 over a real socket) |
| Regression | **PASS** (all prior suites green) |
| §103 | **PASS** |
| Secret scan | **PASS** |
| Private email guard | **PASS** |
| Retirement analyzer | **PASS** — DELETE = 0 |
| **Legacy runtime changes** | **0** |

Deliberately not built, per the brief: visual asset manager UI · WebGL page
binding · media migration · transcoding at upload · automated orphan cleanup.

---

## 3 · Legacy runtime — evidence

```
avos-php/backend               0
avos-php/database/migrations   0
avos-php/public_html           0
avos-php/includes              0
frontend/src                   0
admin/src                      0
```

**LEGACY RUNTIME CHANGES = 0.** No legacy media was read, moved or deleted.
Nothing was written into `public_html/` — the public asset tree is
`public-next/assets/media/`, which is why the legacy count stays at zero.

---

## 4 · What was built

### Migrations — 1

`012_media_engine.sql`. Columns, three widened ENUMs, FKs and indexes.
**No table created, none dropped: still 60 tables (+ ledger = 61).**

### Tables used — 8

`media` `media_variants` `media_usage` `audit_logs` · read-only for usage
checks: `pages` `projects` `articles` `clients` (`page_seo`,
`builder_node_devices`, `testimonials`, `builder_nodes`, `experience` are also
consulted by the structural-usage scan).

### Files created — 32 files, 6,288 LOC

| Area | Files |
|---|---|
| `app/Media/` | `AssetKind` `MimeRegistry` `Capabilities` `UploadGuard` `UploadInspection` `FileNaming` `DerivativeSpec` `ExifReader` `MetadataExtractor` |
| `app/Media/Storage/` | `StorageInterface` `LocalFilesystemStorage` `StorageManager` |
| `app/Media/Image/` | `ImageProcessorInterface` `ImagickProcessor` `GdProcessor` `NullImageProcessor` `ImageProcessorFactory` |
| `app/Media/Video/` | `VideoProbe` `TranscodeService` |
| `app/Domain/Media/` | `AssetRepository` `VariantRepository` `UsageRepository` `AssetService` `DerivativeService` `AssetUsageService` `OrphanService` `DownloadService` |
| `app/Http/Controllers/` | `MediaController` |
| `app/Bootstrap/` | `BinaryDownload` |
| `database/next/migrations/` | `012_media_engine.sql` |
| `tests/next/` | `media.php` `media-http.php` |

### Files modified — 5

| File | Why |
|---|---|
| `app/Bootstrap/ApiKernel.php` | wire the media engine; register 16 routes |
| `public-next/api/index.php` | stream a `BinaryDownload` instead of an envelope |
| `tools/retirement-evidence.py` | register the 2 new entry points (§3F.35) |
| `tests/next/content.php` | scope a route count (amendment A10) — test only |
| `.gitignore` | never commit generated derivatives |

### Endpoints — 16 new (84 total)

2 public + 14 authenticated. Full table in `docs/API-CONTRACT.md`.

### Permissions — **0 added** (§3F.27)

`media.read` / `media.write` / `media.delete` already existed in the Phase 2
seeder and were used unchanged. **Total stays at 49.** The test asserts the
`media` domain still has exactly three permissions, so a future silent
expansion fails CI.

---

## 5 · Test results

```
php avos-php/tests/next/run.php            86 pass   (3A/3B)
php avos-php/tests/next/auth.php          125 pass   (3C)
php avos-php/tests/next/api.php           126 pass   (3D)
php avos-php/tests/next/content.php       277 pass   (3E)
php avos-php/tests/next/content-http.php   84 pass   (3E HTTP)
php avos-php/tests/next/media.php         348 pass   (3F)      ← new
php avos-php/tests/next/media-http.php    100 pass   (3F HTTP) ← new
                                   ---------------------
                                   TOTAL 1,146 pass · 0 fail · 0 skip
```

**Tests added: 448.** Prior total 698 → **1,146**. Zero failures, zero skips,
zero NOT-AVAILABLE (every capability was present after installing the
extensions).

| Gate | Result |
|---|---|
| PHP lint, every file under `app cli public-next tests/next` | clean |
| `cli/avos schema:validate` | 0 missing / 0 unexpected / 0 missing columns / 0 missing indexes |
| §103 clean URL gate | 24 pages · 22 sitemap URLs · 0 extension URLs · 0 broken links |
| `tools/retirement-evidence.py` | **DELETE 0** · ARCHIVE 2 · REWRITE 7 · MIGRATE 9 · KEEP 161 |
| `tools/identity-leak-guard.py` | PASS |
| Direct grep for the private address across all changed files | 0 hits |
| Secret scan across all changed files | 0 hits |

---

## 6 · Specific brief requirements — the evidence

### §3F.29 security battery — every attack refused

| Attack | Result |
|---|---|
| `.php` `.phtml` `.php5` `.php3` `.phar` `.htaccess` | `EXECUTABLE_REJECTED` |
| `shell.php.jpg` (double extension) | `EXECUTABLE_REJECTED` — every dotted part is checked |
| `shell.jpg.php` (reversed) | `EXECUTABLE_REJECTED` |
| PHP renamed `.jpg` | `MIME_MISMATCH` |
| HTML pretending to be a PNG | `MIME_MISMATCH` |
| JPEG body under a `.png` name | `MIME_MISMATCH` |
| GIF/PHP polyglot | `EMBEDDED_SCRIPT` — passes sniff *and* signature, dies on content scan |
| PNG with appended PHP | `EMBEDDED_SCRIPT` |
| `.js` containing `<?php` | `EMBEDDED_SCRIPT` |
| SVG with `<script>` / `onload=` / `javascript:` / `<foreignObject>` | `SVG_ACTIVE_CONTENT` |
| Null byte in the filename | `UNSAFE_FILENAME` |
| `../../../etc/passwd.png`, `..\..\win.png` | `UNSAFE_FILENAME` |
| Control character in the filename | `UNSAFE_FILENAME` |
| Oversized file | `FILE_TOO_LARGE` → **413** |
| Truncated PNG (valid header) | `CORRUPT_IMAGE` — caught by full decode |
| Unsupported type (`.rar`) | `UNSUPPORTED_TYPE` |

Also proven at the service and HTTP layers: a refused upload creates **no
database row and writes nothing to disk**, and is audited with
`result='failure'`. `SELECT COUNT(*) FROM media WHERE extension IN
('php','phtml','phar','php5')` is **0**. Six traversal patterns are rejected by
the storage driver's path resolver, and a resolved path is proven to sit inside
the root by `realpath()`.

**Uploaded PHP never executes** because it is never stored. Defence in depth: the
private root carries a planted `.htaccess` with `Require all denied` and
`php_flag engine off`, and originals live outside the web root entirely.

### §3F.30 image pipeline — real derivatives, verified

Driver `imagick` (ImageMagick 7.1.1-43). A 2400×1600 JPEG produced
**avif + webp + jpeg** at **thumb/card/hero/full** (xlarge correctly skipped —
the source is not 2560 wide).

For **every** variant row the suite re-reads the file and checks: the bytes
exist, the sha256 matches the recorded hash, the decoded width matches the
recorded width, and the sniffed MIME matches the claimed format. Widths come
only from the fixed ladder, and nothing upscales past the source.

The honesty property is asserted both ways: a format that cannot be encoded
produces **no** variant row, and no variant row exists for a format
`Capabilities::canEncode()` says is unavailable.

### §3F.9 EXIF/GPS — byte-level proof

A JPEG was built carrying an EXIF profile containing `GPSLatitude=51.5074`,
`GPSLongitude=-0.1278` and `Make=ZZZTESTCAM`. After upload:

* the **original** still contains `GPSLatitude` — originals are immutable
* **no derivative** contains `GPSLatitude` or `ZZZTESTCAM`
* **no derivative** contains an `Exif\0\0` marker at all
* the database stores only `gps_removed: true` — never a coordinate

### §3F.31 / §3F.32 failure handling

* A permission-denied write **throws** and creates nothing.
* A missing storage root reports not-writable, resolves no path and lists nothing.
* Writes are atomic (temp + `rename`), so a partial file is never visible as an
  asset; `.part-` artefacts are excluded from listings and swept when stale.
* **Database failure after a filesystem write** was simulated for real by
  dropping `media.meta` mid-run: the upload raised `INTERNAL_ERROR`, **no row
  was created**, and the file count on disk was **identical before and after** —
  the orphaned file was cleaned up. The failure was audited with
  `result='failure'`. No false success at any point.

### §3F.20 deletion guard

A referenced asset returns **409** with `reason: ASSET_IN_USE` and the full list
of what uses it. `?force=1` is **also refused** while referenced. No reference is
ever silently detached. Usage merges `media_usage` **and** real FK columns
(`hero_media_id`, `cover_media_id`, `logo_media_id`, `og_media_id`,
`builder_node_devices.media_id`) — consulting only the polymorphic table would
have reported a hero image as unused and allowed its deletion.

### §3F.22 orphan detection

Report-only, verified: an aged unclaimed file is reported **and still on disk
afterwards**; a file inside the 5-minute grace window is not yet called an
orphan; a row whose bytes vanished is reported separately as `missing_files`.
Unreferenced-but-valid assets are listed under a **different** key, because
"nothing links to it" is not the same as "it is garbage".

### §3F.24 private assets

A private asset has no `public_path`, no published copy, no derivatives and a
`null` URL — there is **no URL to guess**. Public metadata for it is **404, not
403**, so its existence is not disclosed. Anonymous download is **404**; a
signed-in role without `media.read` gets **403**; a public asset downloads
anonymously. Flipping public → private deletes the published copy **and every
derivative**, verified file by file, while the private original survives.

### §3F.37 real HTTP

100 assertions across a socket, both upload transports (base64 JSON **and** a
genuine curl `multipart/form-data` post). Verified: 201/200/401/403/404/409/419/
422/413, CSRF present/absent, request-id headers, `Content-Disposition` with a
sanitised filename, `nosniff` and private cache headers on downloads, and that
no response or header ever contains `/home/` or a `storage_path`.

---

## 7 · Contract amendments

Recorded in `docs/API-CONTRACT.md`. **None adds a permission or changes the
security model** — A6 stands exactly as you approved it.

| # | Amendment | Risk |
|---|---|---|
| A10 | Phase 3E route-count assertion scoped to exclude `/media` (test only) | low |
| A11 | `script` added to `media.kind`; `MODEL_3D` maps to existing `model` | low |
| A12 | `media.visibility` (`public`/`private`) | low |
| A13 | `media_variants.purpose` gains `xlarge` to complete the 5-step ladder | low |
| A14 | Additional `media` / `media_variants` columns (no table created or dropped) | low |

---

## 8 · Environment limitations — read this one

**The sandbox had no GD, no Imagick and no FFmpeg.** I installed `php-gd`,
`php-imagick` and `ffmpeg` so the pipeline could be tested against real bytes
instead of reported as skipped. Consequences:

1. Every image/video result above is **genuine evidence on Debian/PHP 8.4.23
   with ImageMagick 7.1.1-43 and FFmpeg 7.1.5**.
2. **Hostinger's capability set is UNKNOWN — REQUIRES STAGING EVIDENCE.**
   Specifically unverified: whether Imagick is installed, whether its build has
   an AVIF delegate, whether GD has WebP/AVIF, and whether `proc_open` is
   disabled (it usually is on shared hosting, which would make FFmpeg
   unreachable regardless of whether the binary exists).
3. This is exactly why nothing is hardcoded: `Capabilities` proves each format
   by encoding a pixel **on the server**, and `GET /api/v1/media/capabilities`
   reports what that host can actually do. On a host with no rasteriser,
   uploads still work, originals stay available, and `processing` reads
   `unavailable` with a reason.
4. Sandbox packages do not persist. A future session must reinstall them, or
   the image tests will correctly report `NOT AVAILABLE IN ENVIRONMENT` rather
   than pass.

Also unverified on LiteSpeed: whether the planted `.htaccess` deny rules are
honoured identically, and whether `/assets/media/*` is served as a static file
rather than routed into the SPA rewrite.

---

## 9 · Known limitations

1. **Transcoding is not wired into upload.** `TranscodeService` is real and
   tested for refusal paths, but transcoding a video exceeds a shared-hosting
   request budget. It belongs to the Phase 3P queue. **No fake status**: the API
   reports `transcoding: false` when FFmpeg is absent, and there is no
   perpetual "pending".
2. **Poster frames are implemented but not generated at upload**, for the same
   reason.
3. **Private assets get no derivatives.** A public derivative of a private asset
   would defeat the privacy model. Deliberate, documented.
4. **Public assets are stored twice** (private original + published copy),
   mitigated by hard-linking when the filesystem allows — the method used is
   reported per publish. On a host where hard links fail, disk usage doubles for
   public originals.
5. **Orphan cleanup is report-only**, per §3F.22.
6. **No relational `media_tags` table**, so shader tags live in `meta.tags`.
   Flagged DEFERRED rather than inventing a table.
7. **`media.hash` is UNIQUE**, so byte-identical duplicates cannot be stored
   twice — re-uploading returns the existing asset. "Duplicate candidates" are
   therefore same-size/same-kind near-duplicates only, reported and never
   removed.
8. **SVG is refused, not sanitised**, when it carries active content. Stripping
   part of an author's file silently is its own surprise.
9. **`AV_MEDIA_PUBLIC_DIR` defaults to `public-next/`**, which is not yet a
   mount point in the deployment package — the same open decision carried from
   Phase 3D.
10. **Content services do not yet write `media_usage` automatically.** The
    attach/detach API exists and structural FK usage is already detected; wiring
    document-embedded references into `media_usage` belongs with the builder in
    Phase 3G.

---

## 10 · Reproducing every result

```bash
# The sandbox loses packages between sessions.
sudo apt-get install -y php-gd php-imagick ffmpeg

export AV_CONFIG_FILE=/home/user/_avosnext/avos-private/config.local.php
export AV_PRIVATE_DIR=/home/user/_avosnext/avos-private

php avos-php/cli/avos fresh
php avos-php/cli/avos schema:validate

for t in run auth api content media; do php avos-php/tests/next/$t.php; done

cd avos-php && php -S 0.0.0.0:8199 tests/next/dev-router.php &
export AVOS_HTTP_BASE=http://127.0.0.1:8199
php avos-php/tests/next/content-http.php
php avos-php/tests/next/media-http.php

cd frontend && node scripts/verify-urls.mjs
python3 tools/retirement-evidence.py .
AV_OWNER_EMAIL=owner-fixture@example.test python3 tools/identity-leak-guard.py \
  frontend/src admin/src docs
```

---

## 11 · Not started

Phase 3G. No media migrated. No asset manager UI. No WebGL page binding.
Nothing pushed, nothing deployed.
