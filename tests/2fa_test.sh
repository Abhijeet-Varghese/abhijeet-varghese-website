#!/bin/bash
# TOTP 2FA lifecycle test: setup → enable → session enforcement → verify → recovery → disable
set -u
BASE=http://127.0.0.1:8092
CJ=/tmp/2fa_admin.txt; rm -f $CJ
CJ2=/tmp/2fa_login.txt; rm -f $CJ2
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "  ✅ $1"; }
bad(){ FAIL=$((FAIL+1)); echo "  ❌ $1 — $2"; }

mysql -uavos -paV0s_d3v_9xKq2mN7 avos -e "DELETE FROM login_attempts; DELETE FROM rate_limits; UPDATE users SET totp_enabled=0, totp_secret=NULL, totp_recovery=NULL WHERE email='admin@avos.test';" 2>/dev/null

curl -s -c $CJ -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@avos.test","password":"AV2E2E!2345xY"}' > /dev/null
CSRF=$(curl -s -b $CJ $BASE/api/session | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["csrf"];')

echo "== 1. SETUP (wrong password rejected) =="
R=$(curl -s -b $CJ -X POST $BASE/api/auth/2fa/setup -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"password":"wrongpassword123"}')
echo "$R" | grep -q 'Current password is incorrect' && ok "setup requires correct password" || bad "setup pw" "$R"
R=$(curl -s -b $CJ -X POST $BASE/api/auth/2fa/setup -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"password":"AV2E2E!2345xY"}')
SECRET=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["secret"] ?? "";')
[ -n "$SECRET" ] && ok "setup returns secret ($SECRET)" || bad "secret" "$R"

echo "== 2. ENABLE (bad code → audit; good code → recovery codes) =="
R=$(curl -s -b $CJ -X POST $BASE/api/auth/2fa/enable -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"code":"000000"}')
echo "$R" | grep -q 'Invalid authenticator code' && ok "bad code rejected" || bad "bad code" "$R"
A=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM audit_logs WHERE action='2fa_failed';" 2>/dev/null)
[ "$A" -ge 1 ] && ok "2FA_FAILED audited" || bad "audit fail" "$A"
CODE=$(php -r 'require "/home/user/avos-php/backend/core/Totp.php"; echo Totp::code("'"$SECRET"'");')
R=$(curl -s -b $CJ -X POST $BASE/api/auth/2fa/enable -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"code\":\"$CODE\"}")
REC=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo count($d["data"]["recovery_codes"] ?? []);')
[ "$REC" = "10" ] && ok "enabled with 10 recovery codes" || bad "enable" "$R"
A=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM audit_logs WHERE action='2fa_enabled';" 2>/dev/null)
[ "$A" -ge 1 ] && ok "2FA_ENABLED audited" || bad "audit enable" "$A"
# secret encrypted at rest
SEC=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT totp_secret FROM users WHERE email='admin@avos.test';" 2>/dev/null)
echo "$SEC" | grep -q "$SECRET" && bad "secret stored in plaintext!" "" || ok "secret encrypted at rest"

echo "== 3. SESSION ENFORCEMENT (login now requires 2FA) =="
rm -f /home/user/avos-php/storage/cache/rl-*.json
curl -s -c $CJ2 -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@avos.test","password":"AV2E2E!2345xY"}' > /tmp/2fa_login_resp.json
grep -q '"must_2fa":true' /tmp/2fa_login_resp.json && ok "login returns must_2fa" || bad "must_2fa" "$(cat /tmp/2fa_login_resp.json)"
CODE2=$(curl -s -o /dev/null -w "%{http_code}" -b $CJ2 $BASE/api/leads)
[ "$CODE2" = "401" ] && ok "API blocked while 2FA pending (401)" || bad "gate" "$CODE2"
R=$(curl -s -b $CJ2 $BASE/api/session)
echo "$R" | grep -q '"2fa_pending":true' && ok "session reports 2fa_pending" || bad "pending flag" "$R"
R=$(curl -s -b $CJ2 -c $CJ2 -X POST $BASE/api/auth/2fa/verify -H "Content-Type: application/json" -d "{\"code\":\"000000\"}")
echo "$R" | grep -q 'INVALID_2FA_CODE' && ok "wrong code rejected" || bad "wrong code" "$R"
R=$(curl -s -b $CJ2 -c $CJ2 -X POST $BASE/api/auth/2fa/verify -H "Content-Type: application/json" -d "{\"code\":\"$CODE\"}")
echo "$R" | grep -q '"ok":true' && ok "valid code completes login" || bad "valid code" "$R"
CODE3=$(curl -s -o /dev/null -w "%{http_code}" -b $CJ2 $BASE/api/leads)
[ "$CODE3" = "200" ] && ok "API accessible after 2FA" || bad "post-2fa" "$CODE3"

echo "== 4. RECOVERY CODE (login again → use recovery) =="
rm -f /home/user/avos-php/storage/cache/rl-*.json
curl -s -c $CJ2 -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@avos.test","password":"AV2E2E!2345xY"}' > /dev/null
RC=$(php -r '
require "/home/user/avos-php/includes/bootstrap.php";
$u = Database::one("SELECT totp_recovery FROM users WHERE email=?", ["admin@avos.test"]);
$hashes = json_decode((string)$u["totp_recovery"], true) ?: [];
// brute our own hash? No — recovery codes are hashed. Instead: temporarily set a known code for the test.
$known = ["TESTREC1","TESTREC2"];
file_put_contents("/tmp/known_recovery.txt", json_encode($known));
$n = array_filter($hashes, fn($h) => $h !== null);
echo "unused_codes=" . count($n);
')
echo "$RC" | grep -q "unused_codes=10" && ok "10 unused recovery codes stored hashed" || bad "recovery count" "$RC"
# Simulate a recovery-code login by inserting a known hashed code (test-only)
mysql -uavos -paV0s_d3v_9xKq2mN7 avos -e "UPDATE users SET totp_recovery=JSON_ARRAY('$(php -r 'echo password_hash("TESTREC1", PASSWORD_DEFAULT);')') WHERE email='admin@avos.test';" 2>/dev/null
R=$(curl -s -b $CJ2 -c $CJ2 -X POST $BASE/api/auth/2fa/verify -H "Content-Type: application/json" -d '{"code":"TESTREC1"}')
echo "$R" | grep -q '"recovery_used":true' && ok "recovery code logs in (single-use)" || bad "recovery login" "$R"
A=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM audit_logs WHERE action='2fa_recovery_used';" 2>/dev/null)
[ "$A" -ge 1 ] && ok "2FA_RECOVERY_USED audited" || bad "audit recovery" "$A"
# reuse should fail
curl -s -c $CJ2 -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@avos.test","password":"AV2E2E!2345xY"}' > /dev/null
R=$(curl -s -b $CJ2 -c $CJ2 -X POST $BASE/api/auth/2fa/verify -H "Content-Type: application/json" -d '{"code":"TESTREC1"}')
echo "$R" | grep -q 'INVALID_2FA_CODE' && ok "reused recovery code rejected" || bad "reuse" "$R"

echo "== 5. DISABLE (requires a valid code) =="
rm -f /home/user/avos-php/storage/cache/rl-*.json
curl -s -b $CJ2 -c $CJ2 -X POST $BASE/api/auth/2fa/verify -H "Content-Type: application/json" -d "{\"code\":\"$CODE\"}" > /dev/null
CSRF2=$(curl -s -b $CJ2 $BASE/api/session | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["csrf"];')
R=$(curl -s -b $CJ2 -X POST $BASE/api/auth/2fa/disable -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF2" -d '{"code":"000000"}')
echo "$R" | grep -q 'Invalid authenticator code' && ok "disable requires valid code" || bad "disable bad" "$R"
R=$(curl -s -b $CJ2 -X POST $BASE/api/auth/2fa/disable -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF2" -d "{\"code\":\"$CODE\"}")
echo "$R" | grep -q '"ok":true' && ok "2FA disabled" || bad "disable" "$R"
A=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM audit_logs WHERE action='2fa_disabled';" 2>/dev/null)
[ "$A" -ge 1 ] && ok "2FA_DISABLED audited" || bad "audit disable" "$A"
ST=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT totp_enabled FROM users WHERE email='admin@avos.test';" 2>/dev/null)
[ "$ST" = "0" ] && ok "totp_enabled=0 in DB" || bad "db state" "$ST"

echo
echo "2FA TESTS: $PASS passed, $FAIL failed"
[ "$FAIL" = "0" ] && exit 0 || exit 1
