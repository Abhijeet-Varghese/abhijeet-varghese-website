#!/bin/bash
# ============================================================
# AV OS — FAILURE-MODE TEST BATTERY (spec §80)
# For each failure: EXPECTED FAILURE + SAFE RECOVERY must occur.
# ============================================================
set -u
BASE=http://127.0.0.1:8092
CJ=/tmp/fm_cookies.txt; rm -f $CJ
CJ2=/tmp/fm2.txt; rm -f $CJ2
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "  ✅ $1"; }
bad(){ FAIL=$((FAIL+1)); echo "  ❌ $1 — $2"; }
chk(){ if echo "$3" | grep -qF "$2"; then ok "$1"; else bad "$1" "$3"; fi; }

echo "== 1. INVALID REQUEST =="
R=$(curl -s -X POST $BASE/api/public/lead -H "Content-Type: application/json" -d '{"email":"x@y.com"}')
chk "lead without name → 422" "VALIDATION_ERROR" "$R"

echo "== 2. UNAUTHORIZED =="
CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/leads)
chk "no session → 401" "401" "$CODE"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/publish)
chk "no session publish → 401" "401" "$CODE"

echo "== 3. BAD PASSWORD =="
mysql -uavos -paV0s_d3v_9xKq2mN7 avos -e "DELETE FROM login_attempts;" 2>/dev/null
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@avos.test","password":"wrongwrong123"}')
chk "bad password → 401" "401" "$CODE"

echo "== 4. INVALID UPLOAD (PHP disguised as png) =="
curl -s -c $CJ -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@avos.test","password":"AV2E2E!2345xY"}' > /dev/null
CSRF=$(curl -s -b $CJ $BASE/api/session | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["csrf"];')
PHP_B64=$(printf '<?php echo "pwned"; ?>' | base64 -w0)
R=$(curl -s -b $CJ -X POST $BASE/api/media -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"name\":\"evil.png\",\"data\":\"$PHP_B64\"}")
chk "PHP-in-PNG rejected" "Unsupported file type" "$R"
R=$(curl -s -b $CJ -X POST $BASE/api/media -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"name":"evil.php","data":"PD9waHAgZWNobyAicHduZWQiOz8+"}')
chk ".php upload rejected" "File type not allowed" "$R"

echo "== 5. MISSING ASSET =="
CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE/site/does-not-exist.png)
chk "missing asset → 404" "404" "$CODE"

echo "== 6. FAILED WEBHOOK (dead endpoint) =="
rm -f /home/user/avos-php/storage/cache/rl-*.json
WID=$(curl -s -b $CJ -X POST $BASE/api/webhooks -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"endpoint":"http://127.0.0.1:9/dead-hook","secret":"s3cret","events":["lead.created"]}' | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["id"] ?? 0;')
curl -s -X POST $BASE/api/public/lead -H "Content-Type: application/json" -d '{"name":"Hook Test","email":"hook-$(date +%s)@test.dev","message":"webhook failure test","website":""}' > /dev/null
sleep 1
R=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT success FROM webhook_deliveries WHERE webhook_id=$WID ORDER BY id DESC LIMIT 1;" 2>/dev/null)
chk "dead webhook marked failed" "0" "$R"
R=$(curl -s -b $CJ -X POST $BASE/api/webhooks/retry-failed -H "X-CSRF-Token: $CSRF" -d '{}')
chk "retry-failed works" '"ok":true' "$R"

echo "== 7. FAILED EMAIL (queued, delivery status recorded) =="
R=$(curl -s -b $CJ -X POST $BASE/api/emailtemplates/test/1 -H "X-CSRF-Token: $CSRF" -d '{}')
chk "test email queued" '"ok":true' "$R"
E=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT status FROM email_log ORDER BY id DESC LIMIT 1;" 2>/dev/null)
if [ "$E" = "sent" ] || [ "$E" = "failed" ]; then ok "email status recorded ($E)"; else bad "email status recorded" "$E"; fi

echo "== 8. AI FAILURE (no provider key configured) =="
R=$(curl -s -b $CJ -X POST $BASE/api/ai/generate -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"prompt":"hello"}')
chk "AI without key → clean AI_ERROR" "AI_ERROR" "$R"

echo "== 9. COPILOT PERMISSION DENIAL (viewer) =="
# self-provision a Viewer user (fresh DBs only have the admin)
EXIST=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM users WHERE email='viewer@e2e.test';" 2>/dev/null)
if [ "$EXIST" = "0" ]; then
  curl -s -b $CJ -X POST $BASE/api/users -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"name":"E2E Viewer","email":"viewer@e2e.test","password":"ViewerPass!2345","role_id":6}' > /dev/null
fi
curl -s -c $CJ2 -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"viewer@e2e.test","password":"ViewerPass!2345"}' > /dev/null
CSRF2=$(curl -s -b $CJ2 $BASE/api/session | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["csrf"];')
R=$(curl -s -b $CJ2 -X POST $BASE/api/copilot -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF2" -d '{"query":"Show my leads this month"}')
chk "copilot respects RBAC (leads → 403 for viewer)" "FORBIDDEN" "$R"

echo "== 10. CSRF MISSING =="
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b $CJ -X PUT $BASE/api/content -H "Content-Type: application/json" -d '{"settings":{}}')
chk "state change without CSRF → 419" "419" "$CODE"

echo "== 11. RATE LIMIT (login) =="
for i in 1 2 3 4 5 6 7; do CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@avos.test","password":"wrongwrong123"}'); done
chk "login throttle → 429" "429" "$CODE"

echo "== 12. DATABASE UNAVAILABLE (public site must keep serving) =="
sudo service mariadb stop >/dev/null 2>&1
sleep 1
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 $BASE/site/index.html)
chk "public site serves with DB down" "200" "$CODE"
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 $BASE/site/case-studies.html)
chk "inner page serves with DB down" "200" "$CODE"
R=$(curl -s --max-time 10 $BASE/api/status | head -c 250)
chk "status reports database error" '"database":"error"' "$R"
R=$(curl -s -b $CJ --max-time 10 $BASE/api/leads | head -c 200)
chk "admin API fails cleanly (not pretending)" '"ok":false' "$R"
sudo service mariadb start >/dev/null 2>&1
sleep 2
R=$(curl -s $BASE/api/status | head -c 120)
chk "database recovered → healthy" '"database":"connected"' "$R"

echo
echo "============================================="
echo "FAILURE-MODE RESULT: $PASS passed, $FAIL failed"
echo "============================================="
[ "$FAIL" = "0" ] && exit 0 || exit 1
