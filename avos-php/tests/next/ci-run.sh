#!/usr/bin/env bash
#
# AV OS — Phase 3A–3F backend test harness (CI + local, identical behaviour).
#
#   avos-php/tests/next/ci-run.sh
#
# WHY THIS EXISTS
# ---------------
# Running `php tests/next/<suite>.php` directly is NOT a safe CI gate. Every
# suite is written to SKIP its database section when MariaDB is unreachable,
# and to skip entirely when no HTTP server is listening — and a skip exits 0.
# Measured, not assumed:
#
#   MariaDB unreachable   media.php       352 -> 141 tests, exit 0
#   No HTTP server        media-http.php  100 ->   0 tests, exit 0
#
# So a broken service container would turn the whole gate green while proving
# nothing. This harness closes that hole by enforcing, per suite:
#
#   * process exit code == 0
#   * FAIL == 0
#   * SKIP == 0            <- infrastructure must actually be present
#
# and across the run:
#
#   * total assertions >= AVOS_MIN_TESTS   <- catches a suite silently shrinking
#
# NOT-AVAILABLE is reported but permitted: it is the Phase 3F suite's honest
# signal that an OPTIONAL capability (Imagick/GD/FFmpeg) is absent on this host,
# which is a legitimate shared-hosting state and deliberately not a failure.
#
# CONFIGURATION — environment only. No config file is written anywhere.
#   APP_ENV DB_HOST DB_NAME DB_USER DB_PASS AV_ENC_KEY
#   AVOS_TEST_HOST AVOS_TEST_USER AVOS_TEST_PASS
#   AVOS_MIN_TESTS   (default 1150)
#   AVOS_HTTP_BASE   (if already listening it is reused, otherwise one is started)
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"   # -> avos-php
cd "$ROOT"

MIN_TESTS="${AVOS_MIN_TESTS:-1181}"
HTTP_PORT="${AVOS_HTTP_PORT:-8199}"

CLI_SUITES=(run auth api content media)
HTTP_SUITES=(content-http media-http)

TOTAL_PASS=0
TOTAL_FAIL=0
TOTAL_SKIP=0
TOTAL_NA=0
VIOLATIONS=0
SUMMARY=""

hr () { printf '%s\n' "----------------------------------------------------------------------"; }

# Run one suite and enforce the invariants on its summary line.
run_suite () {
  local name="$1" file="avos-php/tests/next/$1.php"
  local out rc pass fail skip na

  printf '\n==> %s\n' "$name"
  set +e
  out="$(cd "$(dirname "$ROOT")" && php "$file" 2>&1)"
  rc=$?
  set -e
  printf '%s\n' "$out" | tail -n 5

  local line
  line="$(printf '%s\n' "$out" | grep -E '^[[:space:]]*PASS [0-9]+' | tail -n 1 || true)"
  if [ -z "$line" ]; then
    echo "   VIOLATION: $name produced no summary line (crash or truncated output)"
    VIOLATIONS=$((VIOLATIONS + 1))
    SUMMARY="${SUMMARY}  ${name}|-|-|-|-|NO SUMMARY\n"
    return
  fi

  pass=$(printf '%s' "$line" | grep -oE 'PASS [0-9]+'          | grep -oE '[0-9]+')
  fail=$(printf '%s' "$line" | grep -oE 'FAIL [0-9]+'          | grep -oE '[0-9]+')
  skip=$(printf '%s' "$line" | grep -oE 'SKIP [0-9]+'          | grep -oE '[0-9]+')
  na=$(  printf '%s' "$line" | grep -oE 'NOT-AVAILABLE [0-9]+' | grep -oE '[0-9]+' || true)
  na="${na:-0}"

  TOTAL_PASS=$((TOTAL_PASS + pass))
  TOTAL_FAIL=$((TOTAL_FAIL + fail))
  TOTAL_SKIP=$((TOTAL_SKIP + skip))
  TOTAL_NA=$((TOTAL_NA + na))

  local verdict="OK"
  if [ "$rc" -ne 0 ];   then verdict="EXIT $rc";        VIOLATIONS=$((VIOLATIONS + 1)); fi
  if [ "$fail" -ne 0 ]; then verdict="FAILURES";        VIOLATIONS=$((VIOLATIONS + 1)); fi
  # A skip means a service the suite needs was missing. In CI that is a broken
  # environment, never an acceptable pass.
  if [ "$skip" -ne 0 ]; then verdict="SKIPPED (infra)"; VIOLATIONS=$((VIOLATIONS + 1)); fi

  SUMMARY="${SUMMARY}  ${name}|${pass}|${fail}|${skip}|${na}|${verdict}\n"
}

echo "AV OS — Phase 3A–3F backend test gate"
hr
php -r 'printf("  php        : %s\n", PHP_VERSION);'
php -r '
  $x = ["gd","imagick","fileinfo","exif","pdo_mysql"];
  $on = array_values(array_filter($x, "extension_loaded"));
  printf("  extensions : %s\n", implode(", ", $on) ?: "(none of the optional set)");
'
printf '  ffmpeg     : %s\n' "$(command -v ffmpeg >/dev/null && ffmpeg -version 2>/dev/null | head -1 | cut -c1-40 || echo 'not installed')"
printf '  database   : %s@%s/%s\n' "${DB_USER:-?}" "${DB_HOST:-?}" "${DB_NAME:-?}"
printf '  min tests  : %s\n' "$MIN_TESTS"
hr

# ---------------------------------------------------------------- CLI suites
for s in "${CLI_SUITES[@]}"; do run_suite "$s"; done

# --------------------------------------------------------------- HTTP suites
# Reuse an already-listening server when one is provided; otherwise start the
# real front controller through the dev router and stop it afterwards.
SERVER_PID=""
cleanup () {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Readiness means "answers 200 with a valid envelope", NOT merely "accepts a
# TCP connection". A PHP fatal error still returns a 500, and an earlier version
# of this probe treated that as reachable — the HTTP suites then ran against a
# dead server and reported 169 failures instead of a clear infrastructure error.
api_healthy () {
  local base="$1" code
  code=$(curl -sS -o /tmp/avos-ci-health.json -w '%{http_code}' --max-time 3 \
         "${base}/api/v1/system/health" 2>/dev/null || echo 000)
  [ "$code" = "200" ] || return 1
  grep -q '"ok":true' /tmp/avos-ci-health.json 2>/dev/null || return 1
  return 0
}

if [ -z "${AVOS_HTTP_BASE:-}" ] || ! api_healthy "${AVOS_HTTP_BASE}"; then
  export AVOS_HTTP_BASE="http://127.0.0.1:${HTTP_PORT}"
  echo
  echo "==> starting API front controller on ${AVOS_HTTP_BASE}"
  # cwd is $ROOT (avos-php); the router path is relative to it.
  php -S "0.0.0.0:${HTTP_PORT}" tests/next/dev-router.php >/tmp/avos-ci-server.log 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 40); do
    api_healthy "${AVOS_HTTP_BASE}" && break
    sleep 0.5
  done
  if ! api_healthy "${AVOS_HTTP_BASE}"; then
    echo "   VIOLATION: API front controller never returned a healthy 200"
    echo "   --- server log ---"
    tail -n 20 /tmp/avos-ci-server.log || true
    exit 1
  fi
  echo "    healthy (pid $SERVER_PID)"
fi

for s in "${HTTP_SUITES[@]}"; do run_suite "$s"; done

cleanup
SERVER_PID=""

# ------------------------------------------------------------------ verdict
echo
hr
printf '  %-14s %7s %7s %7s %7s  %s\n' SUITE PASS FAIL SKIP N/A VERDICT
hr
printf "$SUMMARY" | while IFS='|' read -r n p f k a v; do
  [ -z "$n" ] && continue
  printf '  %-14s %7s %7s %7s %7s  %s\n' "$n" "$p" "$f" "$k" "$a" "$v"
done
hr
printf '  %-14s %7s %7s %7s %7s\n' TOTAL "$TOTAL_PASS" "$TOTAL_FAIL" "$TOTAL_SKIP" "$TOTAL_NA"
hr

if [ "$TOTAL_PASS" -lt "$MIN_TESTS" ]; then
  echo "  VIOLATION: only ${TOTAL_PASS} assertions ran, expected at least ${MIN_TESTS}."
  echo "             A suite shrank or its environment was incomplete."
  VIOLATIONS=$((VIOLATIONS + 1))
fi

if [ "$VIOLATIONS" -ne 0 ]; then
  echo
  echo "BACKEND TEST GATE: FAILED (${VIOLATIONS} violation(s))"
  exit 1
fi

echo
echo "BACKEND TEST GATE: PASSED — ${TOTAL_PASS} assertions, 0 failures, 0 skips, ${TOTAL_NA} not-available"
