#!/bin/bash
# Calendly inbound webhook test — official contract (t=ts,v1=hmac(ts.'.'.body, key))
# Uses curl CLI (php-curl + php -S has a header-parsing quirk; production Apache/LiteSpeed unaffected).
set -u
BASE=http://127.0.0.1:8092
KEY="cal_webhook_signing_key_e2e_test_2026"
CJ=/tmp/cb_cookies.txt; rm -f $CJ
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "  ✅ $1"; }
bad(){ FAIL=$((FAIL+1)); echo "  ❌ $1 — $2"; }

sign() { # body, key, [ts]
  local body="$1" key="$2" ts="${3:-$(date +%s)}"
  echo "t=$ts,v1=$(printf '%s' "$ts.$body" | openssl dgst -sha256 -hmac "$key" | awk '{print $2}')"
}

mysql -uavos -paV0s_d3v_9xKq2mN7 avos -e "DELETE FROM login_attempts; DELETE FROM inbound_events;" 2>/dev/null
curl -s -c $CJ -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@avos.test","password":"AV2E2E!2345xY"}' > /dev/null
CSRF=$(curl -s -b $CJ $BASE/api/session | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["csrf"];')

echo "== 1. CONFIG =="
R=$(curl -s -b $CJ -X PUT $BASE/api/webhooks/inbound/config -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"signing_key\":\"$KEY\"}")
echo "$R" | grep -q '"ok":true' && ok "signing key saved (encrypted)" || bad "key save" "$R"
R=$(curl -s -b $CJ $BASE/api/webhooks/inbound)
echo "$R" | grep -q '"has_key":true' && ! echo "$R" | grep -q "$KEY" && ok "config: has_key, key never exposed" || bad "config" "$R"

echo "== 2. invitee.created =="
TS=$(date +%s)
START=$(date -d "+1 day" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -v+1d +%Y-%m-%dT%H:%M:%SZ)
END=$(date -d "+1 day +30 min" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -v+1d -v+30M +%Y-%m-%dT%H:%M:%SZ)
PAYLOAD="{\"event\":\"invitee.created\",\"created_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"payload\":{\"event\":\"invitee.created\",\"event_type\":{\"uuid\":\"EVT001\",\"name\":\"Intro Call\"},\"invitee\":{\"uuid\":\"INVITEE-ABC-123\",\"email\":\"calendly-booking@test.dev\",\"name\":\"Calendly Booker\",\"text_reminder_number\":\"\",\"scheduled_event\":{\"uuid\":\"SCHED-1\",\"name\":\"Intro Call\",\"start_time\":\"$START\",\"end_time\":\"$END\",\"location\":\"Google Meet\",\"cancel_url\":\"https://calendly.com/cancellations/XYZ\"}}}}"
R=$(curl -s -X POST $BASE/api/webhooks/inbound/calendly -H "Content-Type: application/json" -H "Calendly-Webhook-Signature: $(sign "$PAYLOAD" "$KEY")" -d "$PAYLOAD")
echo "$R" | grep -q '"status":"processed"' && ok "invitee.created → processed" || bad "created" "$R"
MID=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["meeting_id"] ?? 0;')
LID=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["lead_id"] ?? 0;')
[ "$MID" -gt 0 ] && ok "meeting created (#$MID)" || bad "meeting" "$R"
[ "$LID" -gt 0 ] && ok "lead created (#$LID)" || bad "lead" "$R"

echo "== 3. IDEMPOTENCY (same payload re-delivered) =="
R=$(curl -s -X POST $BASE/api/webhooks/inbound/calendly -H "Content-Type: application/json" -H "Calendly-Webhook-Signature: $(sign "$PAYLOAD" "$KEY")" -d "$PAYLOAD")
echo "$R" | grep -q '"status":"duplicate"' && ok "duplicate → duplicate status" || bad "dedup status" "$R"
M2=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["meeting_id"] ?? 0;')
[ "$M2" = "$MID" ] && ok "same meeting returned (no duplicate row)" || bad "dedup meeting" "$M2 vs $MID"
CNT=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM meetings WHERE external_event_id='INVITEE-ABC-123' AND deleted_at IS NULL;" 2>/dev/null)
[ "$CNT" = "1" ] && ok "exactly one meeting row" || bad "meeting count" "$CNT"

echo "== 4. SECURITY REJECTIONS =="
TAMPERED="${PAYLOAD/Calendly Booker/Attacker}"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/webhooks/inbound/calendly -H "Content-Type: application/json" -H "Calendly-Webhook-Signature: $(sign "$PAYLOAD" "$KEY")" -d "$TAMPERED")
[ "$CODE" = "401" ] && ok "tampered body (sig over original) → 401" || bad "tampered" "$CODE"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/webhooks/inbound/calendly -H "Content-Type: application/json" -H "Calendly-Webhook-Signature: $(sign "$PAYLOAD" "$KEY" $(( $(date +%s) - 3600 )))" -d "$PAYLOAD")
[ "$CODE" = "401" ] && ok "stale timestamp → 401" || bad "stale" "$CODE"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/webhooks/inbound/calendly -H "Content-Type: application/json" -H "Calendly-Webhook-Signature: t=$(date +%s),v1=deadbeef" -d "$PAYLOAD")
[ "$CODE" = "401" ] && ok "bad signature → 401" || bad "badsig" "$CODE"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/webhooks/inbound/calendly -H "Content-Type: application/json" -d "$PAYLOAD")
[ "$CODE" = "401" ] && ok "missing signature header → 401" || bad "nosig" "$CODE"

echo "== 5. invitee.canceled =="
CANCEL="{\"event\":\"invitee.canceled\",\"created_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"payload\":{\"event\":\"invitee.canceled\",\"invitee\":{\"uuid\":\"INVITEE-ABC-123\",\"name\":\"Calendly Booker\"}}}"
R=$(curl -s -X POST $BASE/api/webhooks/inbound/calendly -H "Content-Type: application/json" -H "Calendly-Webhook-Signature: $(sign "$CANCEL" "$KEY")" -d "$CANCEL")
echo "$R" | grep -q '"status":"processed"' && ok "invitee.canceled → processed" || bad "cancel" "$R"
ST=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT status FROM meetings WHERE id=$MID;" 2>/dev/null)
[ "$ST" = "cancelled" ] && ok "meeting → cancelled" || bad "cancel status" "$ST"
ACT=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM activities WHERE type='meeting_cancelled';" 2>/dev/null)
[ "$ACT" -ge 1 ] && ok "cancel activity recorded" || bad "activity" "$ACT"

echo "== 6. LEDGER + AUDIT =="
R=$(curl -s -b $CJ $BASE/api/webhooks/inbound/events)
echo "$R" | grep -q 'invitee.created' && ok "events ledger lists entries" || bad "ledger" "$R"
AUD=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM audit_logs WHERE action='inbound_webhook';" 2>/dev/null)
[ "$AUD" -ge 2 ] && ok "inbound webhooks audited ($AUD)" || bad "audit" "$AUD"

echo "== 7. NO KEY → CLEAN 503 =="
mysql -uavos -paV0s_d3v_9xKq2mN7 avos -e "UPDATE integrations SET config_enc=NULL, status='not_connected' WHERE code='calendly';" 2>/dev/null
R=$(curl -s -X POST $BASE/api/webhooks/inbound/calendly -H "Content-Type: application/json" -H "Calendly-Webhook-Signature: $(sign "$PAYLOAD" "$KEY")" -d "$PAYLOAD")
echo "$R" | grep -q 'not configured' && ok "no key → clean 503-style error" || bad "nokey" "$R"
curl -s -b $CJ -X PUT $BASE/api/webhooks/inbound/config -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"signing_key\":\"$KEY\"}" > /dev/null

echo
echo "INBOUND WEBHOOK TESTS: $PASS passed, $FAIL failed"
[ "$FAIL" = "0" ] && exit 0 || exit 1
