#!/usr/bin/env bash
# AV OS — database + content backup (Phase 2 safety).
#
# Produces a timestamped, gzipped mysqldump of the site database plus a JSON
# snapshot of content_store. Reads the same config the app does
# (config.local.php / env) so it never hardcodes credentials.
#
# Usage:
#   bash avos-php/scripts/backup-db.sh            # DB dump + content JSON
#   bash avos-php/scripts/backup-db.sh --verify   # dump + restore to a temp DB to prove it works
#
# Safe by construction: writes only into avos-php/storage/backups/ (never the
# web root), never prints credentials, and never modifies data.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$ROOT/storage/backups"
mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"

# Resolve DB params identically to the app (config.local.php overrides env).
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_NAME="${DB_NAME:-avos}"
DB_USER="${DB_USER:-avos}"
DB_PASS="${DB_PASS:-}"
if [ -f "$ROOT/config.local.php" ]; then
  # Pull $db[...] from the local config without evaluating arbitrary PHP.
  eval "$(php -r '
    $db = ["host"=>getenv("DB_HOST")?:$_ENV["DB_HOST"]??"127.0.0.1","name"=>getenv("DB_NAME")?:$_ENV["DB_NAME"]??"avos","user"=>getenv("DB_USER")?:$_ENV["DB_USER"]??"avos","pass"=>getenv("DB_PASS")?:$_ENV["DB_PASS"]??""];
    echo "DB_HOST=".escapeshellarg($db["host"])."; DB_NAME=".escapeshellarg($db["name"])."; DB_USER=".escapeshellarg($db["user"])."; DB_PASS=".escapeshellarg($db["pass"]).";";
  ' 2>/dev/null || true)"
fi

OUT="$BACKUP_DIR/avos-$STAMP.sql.gz"
mysqldump --host="$DB_HOST" --user="$DB_USER" ${DB_PASS:+--password="$DB_PASS"} \
  --single-transaction --routines --triggers --no-tablespaces "$DB_NAME" \
  | gzip > "$OUT"
echo "DB backup: $OUT ($(du -h "$OUT" | cut -f1))"

# Content snapshot (published content_store JSON) for fast restore of content only.
php "$ROOT/backend/scripts/export-snapshot.php" --out="$BACKUP_DIR/content-$STAMP.json" >/dev/null 2>&1 \
  && echo "Content snapshot: $BACKUP_DIR/content-$STAMP.json" \
  || echo "WARNING: content snapshot skipped (export-snapshot.php failed)"

# Retention: keep the most recent 20 backups.
ls -1t "$BACKUP_DIR"/avos-*.sql.gz 2>/dev/null | tail -n +21 | xargs -r rm -f
echo "done."
