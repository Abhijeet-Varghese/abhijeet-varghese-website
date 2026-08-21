#!/usr/bin/env bash
# AV OS — full-file backup (Phase 2 safety): app source + content seed + git tag.
#
# Creates a timestamped tar of the AV OS application (backend + frontend source
# + content seed) into storage/backups/ and prints a suggested git tag.
# Never writes outside storage/backups/, never touches production.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"
BACKUP_DIR="$ROOT/storage/backups"
mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"

OUT="$BACKUP_DIR/avos-files-$STAMP.tar.gz"
tar --exclude='storage/backups' --exclude='storage/cache' --exclude='storage/logs' \
    --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='dist-server' \
    -czf "$OUT" -C "$REPO_ROOT" avos-php avos-data frontend/src frontend/public
echo "File backup: $OUT ($(du -h "$OUT" | cut -f1))"
echo "Suggested git tag: avos-backup-$STAMP"
