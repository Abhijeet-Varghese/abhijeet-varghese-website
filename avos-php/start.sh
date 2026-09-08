#!/usr/bin/env bash
# ============================================================
# AV OS — one-command local start (macOS / Linux)
#   ./start.sh            → DB + migrations + backend + watcher
#   ./start.sh --no-watch → skip the live-sync watcher
# Then open http://localhost:8092 (site) and /admin/login.php
# ============================================================
set -u
cd "$(dirname "$0")"
PORT="${AVOS_PORT:-8092}"
WATCH=1
[ "${1:-}" = "--no-watch" ] && WATCH=0

echo "── AV OS · plug-and-play ─────────────────────────────"
command -v php >/dev/null 2>&1 || { echo "✗ PHP not found — install PHP 8.x first"; exit 1; }

# 1. database: start MariaDB if it is not running
if ! mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null; then
  echo "· starting MariaDB…"
  (sudo -n service mariadb start 2>/dev/null || brew services start mariadb 2>/dev/null \
    || sudo -n systemctl start mariadb 2>/dev/null) || echo "  ⚠ start MariaDB manually (XAMPP/MAMP/brew) and re-run"
  sleep 3
fi

# 2. provision the avos database + user (once)
if ! mysql -h 127.0.0.1 -u avos -paV0s_d3v_9xKq2mN7 avos -e "SELECT 1" >/dev/null 2>&1; then
  echo "· provisioning database (avos)…"
  if mysql -h 127.0.0.1 -uroot < database/provision.sql 2>/dev/null; then
    echo "  ✓ database created"
  else
    echo "  ⚠ could not provision automatically — run as root once:"
    echo "    mysql -uroot < database/provision.sql"
  fi
fi

# 3. local config
if [ ! -f config.local.php ]; then
  echo "· creating config.local.php from example (dev defaults)…"
  cp config.local.example.php config.local.php
  sed -i.bak "s|\$env = 'production'|\$env = 'development'|" config.local.php 2>/dev/null
  rm -f config.local.php.bak
fi

# 4. migrations + installer (first run creates admin)
php database/migrate.php
if ! mysql -h 127.0.0.1 -u avos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM users" 2>/dev/null | grep -q "^[1-9]"; then
  echo "· creating the administrator account…"
  php database/install.php --admin-email=admin@abhijeetvarghese.com --generate 2>&1 | tail -5
  echo "  (use the printed temporary password, then change it on first login)"
fi

# 5. backend server
if ss -tln 2>/dev/null | grep -q ":$PORT " || lsof -i :$PORT >/dev/null 2>&1; then
  echo "· backend already running on port $PORT"
else
  echo "· starting backend on http://localhost:$PORT …"
  (nohup php -S 0.0.0.0:$PORT router.php > storage/logs/server.log 2>&1 &)
  sleep 1
fi

# 6. live-sync watcher (auto-publish + frontend sync)
if [ "$WATCH" = "1" ]; then
  if pgrep -f "scripts/auto-publish.php" >/dev/null 2>&1; then
    echo "· live-sync watcher already running"
  else
    echo "· starting live-sync watcher (auto-publish + frontend sync every 60s)…"
    (while true; do php backend/scripts/auto-publish.php >> storage/logs/auto-publish.log 2>&1; php backend/scripts/agent-runner.php >> storage/logs/agent-runner.log 2>&1; sleep 60; done &)
  fi
fi

# startup doctor
php backend/scripts/doctor.php 2>/dev/null | tail -1 | grep -q "SYSTEM READY" && echo "· environment check: ✓ READY" || echo "· environment check: ⚠ see php backend/scripts/doctor.php"

echo "──────────────────────────────────────────────────────"
echo "  AV OS READY"
echo "  PUBLIC SITE   http://localhost:$PORT/"
echo "  ADMIN         http://localhost:$PORT/admin/login.php"
echo "  API STATUS    http://localhost:$PORT/api/status"
echo "──────────────────────────────────────────────────────"
