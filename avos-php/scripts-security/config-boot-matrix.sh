#!/usr/bin/env bash
# AV OS — §88 configuration boot matrix.
#
# Exercises every configuration state and asserts the application fails SAFELY:
# a clear message, no secret value, no filesystem path, no stack trace.
# Prints only PASS/FAIL and masked categories.
set -uo pipefail

ROOT="${1:?usage: config-boot-matrix.sh <app-root>}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

BOOT="$TMP/boot.php"
cat > "$BOOT" <<'PHP'
<?php
require getenv('AV_APP_ROOT') . '/backend/config/config.php';
$s = av_config_security();
echo "BOOTED source=", $s['config_source'],
     " outside_webroot=", $s['config_outside_webroot'] ? 'yes' : 'no',
     " db_configured=", $s['db_configured'] ? 'yes' : 'no',
     " db_password=", $s['db_password_set'] ? 'SET' : 'NOT SET',
     " enc_key=", $s['enc_key_set'] ? ($s['enc_key_strong'] ? 'SET/VALID' : 'SET/WEAK') : 'NOT SET',
     " strict=", $s['strict_mode'] ? 'on' : 'off', "\n";
PHP

pass=0; fail=0
leaks() { grep -qE "LocalSecTest|sec_test_key|[A-Za-z0-9]{32,}|/home/[a-z0-9]+/|Stack trace|SQLSTATE" <<<"$1"; }

run() {
  local name="$1" expect="$2"; shift 2
  local out; out="$(env AV_APP_ROOT="$ROOT" "$@" php "$BOOT" 2>&1)"
  local verdict="FAIL"
  if grep -q "$expect" <<<"$out"; then verdict="PASS"; fi
  if leaks "$out"; then verdict="FAIL(LEAK)"; fi
  if [ "$verdict" = "PASS" ]; then pass=$((pass+1)); else fail=$((fail+1)); fi
  printf "  %-42s %-11s %s\n" "$name" "$verdict" "$(head -c 110 <<<"${out//$'\n'/ }")"
}

# ---------------------------------------------------------------- fixtures
mkdir -p "$TMP/private"
cat > "$TMP/private/config.local.php" <<'PHP'
<?php
$env='production';
$db=['host'=>'127.0.0.1','name'=>'avos_sec','user'=>'avos_sec','pass'=>'LocalSecTest_2026','charset'=>'utf8mb4'];
$sessionHours=12; $encKey='sec_test_key_0123456789abcdef0123456789abcdef';
$siteUrl='https://example.test'; $turnstile=['site_key'=>'','secret_key'=>''];
PHP
cat > "$TMP/private/nodb.php" <<'PHP'
<?php
$env='production';
$db=['host'=>'127.0.0.1','name'=>'','user'=>'','pass'=>'','charset'=>'utf8mb4'];
$encKey='sec_test_key_0123456789abcdef0123456789abcdef';
PHP
cat > "$TMP/private/nokey.php" <<'PHP'
<?php
$env='production';
$db=['host'=>'127.0.0.1','name'=>'avos_sec','user'=>'avos_sec','pass'=>'LocalSecTest_2026','charset'=>'utf8mb4'];
$encKey='';
PHP

echo
echo "§4 CONFIGURATION BOOT MATRIX"
echo "------------------------------------------------------------------------------------------"
run "1 private config present (env path)"   "BOOTED source=AV_CONFIG_FILE" AV_CONFIG_FILE="$TMP/private/config.local.php"
run "2 private config ABSENT"               "not configured for production"  AV_SKIP_LOCAL_CONFIG=1
run "3 invalid AV_CONFIG_FILE path"         "AV_CONFIG_FILE is set but not readable" AV_CONFIG_FILE="$TMP/private/does-not-exist.php"
run "4 missing DB credentials"              "database credentials not configured" AV_CONFIG_FILE="$TMP/private/nodb.php"
run "5 missing AV_ENC_KEY"                  "AV_ENC_KEY must be set" AV_CONFIG_FILE="$TMP/private/nokey.php"
run "6 strict mode + in-webroot config"     "inside the web root" \
      AV_REQUIRE_PRIVATE_CONFIG=1 AV_CONFIG_FILE="$ROOT/config.local.php"
run "7 strict mode + private config"        "BOOTED source=AV_CONFIG_FILE" \
      AV_REQUIRE_PRIVATE_CONFIG=1 AV_PRIVATE_DIR="$TMP/private" AV_CONFIG_FILE="$TMP/private/config.local.php"
echo "------------------------------------------------------------------------------------------"
echo "  PASS=$pass  FAIL=$fail"
echo
[ "$fail" -eq 0 ]
