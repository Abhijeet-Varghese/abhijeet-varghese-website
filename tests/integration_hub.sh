#!/usr/bin/env bash
# ============================================================
# AV OS v2.4 — INTEGRATION HUB + DATA INTELLIGENCE TEST BATTERY
# Registry honesty · secrets-at-rest · fixture-contract adapters
# live public APIs (RSS/Trends/GitHub/YouTube) · search fusion
# truth layer · knowledge graph · case-study · links · agents
# ============================================================
set -u
BASE="${BASE:-http://127.0.0.1:8092}"
FIXTURE_PORT="${FIXTURE_PORT:-8095}"
EMAIL="${EMAIL:-admin@avos.test}"
PASS="${PASS:-AV2E2E!2345xY!}"
COOKIE=$(mktemp)
PASS_COUNT=0; FAIL_COUNT=0
FIXTURE_PID=""
SECRET_MARKER="TESTKEY_should_never_leak_987654321"

say()  { printf '%s\n' "$*"; }
pass() { PASS_COUNT=$((PASS_COUNT+1)); printf '  \033[32m✔\033[0m %s\n' "$*"; }
fail() { FAIL_COUNT=$((FAIL_COUNT+1)); printf '  \033[31m✘ FAIL\033[0m %s\n' "$*"; }
check() { # check <desc> <expected> <actual>
  if [ "$2" = "$3" ]; then pass "$1"; else fail "$1 — expected [$2] got [$3]"; fi
}
check_contains() { # check_contains <desc> <needle> <haystack>
  case "$3" in *"$2"*) pass "$1";; *) fail "$1 — missing [$2] in [$(echo "$3" | head -c 200)]";; esac
}
check_not_contains() {
  case "$3" in *"$2"*) fail "$1 — FOUND [$2]";; *) pass "$1";; esac
}
jqfield() { python3 -c "import sys,json;$1" 2>/dev/null || echo "__ERR__"; }

cleanup() {
  [ -n "$FIXTURE_PID" ] && kill "$FIXTURE_PID" 2>/dev/null
  rm -f "$COOKIE"
}
trap cleanup EXIT

# ---------- login ----------
CSRF=$(curl -s -c "$COOKIE" "$BASE/api/session" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['csrf'])")
LOGIN=$(curl -s -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
check "login ok" "true" "$(echo "$LOGIN" | jqfield "d=json.load(sys.stdin);print('true' if d.get('ok') else 'false')")"
CSRF=$(curl -s -b "$COOKIE" -c "$COOKIE" "$BASE/api/session" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['csrf'])")
AUTH=(-b "$COOKIE" -H "X-CSRF-Token: $CSRF")
GET()  { curl -s "${AUTH[@]}" "$BASE$1"; }
POST() { curl -s "${AUTH[@]}" -X POST "$BASE$1" -H "Content-Type: application/json" ${2:+-d "$2"}; }
PUT()  { curl -s "${AUTH[@]}" -X PUT "$BASE$1" -H "Content-Type: application/json" ${2:+-d "$2"}; }
DEL()  { curl -s "${AUTH[@]}" -X DELETE "$BASE$1"; }

say ""
say "========== A. INTEGRATION REGISTRY & HONESTY =========="
REG=$(GET /api/integrations)
N=$(echo "$REG" | jqfield "d=json.load(sys.stdin);print(len(d['data']['items']))")
[ "$N" -ge 23 ] && pass "registry has $N integrations" || fail "registry count $N < 23"
check_not_contains "no plaintext secrets in API response" "$SECRET_MARKER" "$REG"
GH=$(echo "$REG" | jqfield "d=json.load(sys.stdin);print([i['status'] for i in d['data']['items'] if i['code']=='github'][0])")
case "$GH" in limited|connected) pass "github status honest ($GH)";; *) fail "github status $GH";; esac
TR=$(echo "$REG" | jqfield "d=json.load(sys.stdin);print([i['status'] for i in d['data']['items'] if i['code']=='trends'][0])")
case "$TR" in configured|connected) pass "trends status honest ($TR)";; *) fail "trends status $TR";; esac
R=$(POST /api/integrations/gsc/test)
check "GSC test without creds fails honestly" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin);print('true' if not d['data']['ok'] else 'false')")"
GSC_ST=$(GET /api/integrations | jqfield "d=json.load(sys.stdin);print([i['status'] for i in d['data']['items'] if i['code']=='gsc'][0])")
[ "$GSC_ST" != "connected" ] && pass "GSC never claims CONNECTED without verification ($GSC_ST)" || fail "GSC falsely connected"

say ""
say "========== B. SECRETS AT REST =========="
PUT /api/integrations/bing "{\"api_key\":\"$SECRET_MARKER\",\"site_url\":\"https://abhijeetvarghese.com/\"}" >/dev/null
DBENC=$(mysql -u avos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT config_enc FROM integrations WHERE code='bing'" 2>/dev/null)
check "config_enc is a v3 AES-GCM envelope" "true" "$(echo "$DBENC" | jqfield "d=json.load(sys.stdin);print('true' if isinstance(d,dict) and d.get('v')==3 and d.get('alg')=='aes-256-gcm' and d.get('iv') and d.get('tag') and d.get('ciphertext') else 'false')")"
check_not_contains "key encrypted at rest (not in DB)" "$SECRET_MARKER" "$DBENC"
AGAIN=$(GET /api/integrations)
check_not_contains "API never returns secrets" "$SECRET_MARKER" "$AGAIN"
check "config change resets CONNECTED claim" "not_connected" "$(echo "$AGAIN" | jqfield "d=json.load(sys.stdin);print([i['status'] for i in d['data']['items'] if i['code']=='bing'][0])")"

say ""
say "========== C. FIXTURE-CONTRACT ADAPTERS (real API shapes) =========="
php -S 127.0.0.1:$FIXTURE_PORT /home/user/tests/fixtures/api_stub.php >/dev/null 2>&1 &
FIXTURE_PID=$!
sleep 1.5
# real RSA key so the JWT/RS256 service-account flow is genuinely exercised
openssl genrsa -out /tmp/avos-test-sa.key 2048 2>/dev/null
mk_sa_body() { # mk_sa_body <outfile> <extra-json>
  python3 - "$1" "$2" <<'PYEOF'
import json, sys
key = open('/tmp/avos-test-sa.key').read()
sa = json.dumps({'client_email': 'svc@fixture.iam.gserviceaccount.com', 'private_key': key})
body = {'service_account_json': sa}
body.update(json.loads(sys.argv[2]))
json.dump(body, open(sys.argv[1], 'w'))
PYEOF
}
# GSC: full OAuth2 JWT (RS256) + sites + query against fixture
mk_sa_body /tmp/body-gsc.json "{\"site_url\":\"https://abhijeetvarghese.com/\",\"api_base\":\"http://127.0.0.1:$FIXTURE_PORT\",\"days\":14}"
PUT /api/integrations/gsc "$(cat /tmp/body-gsc.json)" >/dev/null
R=$(POST /api/integrations/gsc/test)
check "GSC fixture test → ok (JWT flow works)" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin);print('true' if d['data']['ok'] else 'false')")"
check "GSC status now connected" "connected" "$(GET /api/integrations | jqfield "d=json.load(sys.stdin);print([i['status'] for i in d['data']['items'] if i['code']=='gsc'][0])")"
R=$(POST /api/integrations/gsc/sync)
check "GSC fixture sync ok" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin);print('true' if d['data']['ok'] else 'false')")"
QW=$(GET "/api/search-console/quick-wins")
check_contains "quick wins computed from imported data" "experience design consultant" "$QW"
SCORE=$(echo "$QW" | jqfield "d=json.load(sys.stdin);print([x['opportunity_score'] for x in d['data']['items'] if x['query']=='experience design consultant'][0])")
[ "$SCORE" -ge 60 ] 2>/dev/null && pass "opportunity score meaningful ($SCORE/100)" || fail "low opportunity score '$SCORE'"
# GA4
mk_sa_body /tmp/body-ga4.json "{\"property_id\":\"123456789\",\"api_base\":\"http://127.0.0.1:$FIXTURE_PORT\",\"days\":14}"
PUT /api/integrations/ga4 "$(cat /tmp/body-ga4.json)" >/dev/null
R=$(POST /api/integrations/ga4/test)
check "GA4 fixture test ok" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin);print('true' if d['data']['ok'] else 'false')")"
R=$(POST /api/integrations/ga4/sync)
check "GA4 fixture sync ok" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin);print('true' if d['data']['ok'] else 'false')")"
G4=$(mysql -u avos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM intelligence_metrics WHERE metric LIKE 'ga4:%'" 2>/dev/null)
[ "$G4" -ge 5 ] && pass "GA4 metrics normalized ($G4 rows)" || fail "GA4 rows $G4"
# Bing
PUT /api/integrations/bing "{\"api_key\":\"fixture-key\",\"site_url\":\"https://abhijeetvarghese.com/\",\"api_base\":\"http://127.0.0.1:$FIXTURE_PORT\",\"days\":14}" >/dev/null
R=$(POST /api/integrations/bing/test)
check "Bing fixture test ok" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin);print('true' if d['data']['ok'] else 'false')")"
R=$(POST /api/integrations/bing/sync)
check "Bing fixture sync ok" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin);print('true' if d['data']['ok'] else 'false')")"
BN=$(mysql -u avos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM search_console_queries WHERE source='bing'" 2>/dev/null)
[ "$BN" -ge 2 ] && pass "Bing queries stored source-attributed ($BN)" || fail "bing rows $BN"
# Cloudflare
PUT /api/integrations/cloudflare "{\"api_token\":\"fixture-token\",\"zone_id\":\"zone-fixture\",\"api_base\":\"http://127.0.0.1:$FIXTURE_PORT/client/v4\"}" >/dev/null
R=$(POST /api/integrations/cloudflare/test)
check "Cloudflare fixture test ok" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin);print('true' if d['data']['ok'] else 'false')")"
R=$(POST /api/integrations/cloudflare/sync)
check "Cloudflare fixture sync ok" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin);print('true' if d['data']['ok'] else 'false')")"
CF=$(mysql -u avos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM intelligence_metrics WHERE metric LIKE 'cf:%'" 2>/dev/null)
[ "$CF" -ge 3 ] && pass "Cloudflare metrics stored ($CF)" || fail "cf rows $CF"
# Calendly → CRM meetings (shared webhook code path, /cal fixture base)
PUT /api/integrations/calendly "{\"api_key\":\"fixture-pat\",\"api_base\":\"http://127.0.0.1:$FIXTURE_PORT/cal\"}" >/dev/null
R=$(POST /api/integrations/calendly/test)
check "Calendly fixture test ok" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin);print('true' if d['data']['ok'] else 'false')")"
R=$(POST /api/integrations/calendly/sync)
check "Calendly fixture sync ok" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin);print('true' if d['data']['ok'] else 'false')")"
MEETS=$(mysql -u avos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM meetings WHERE external_event_id LIKE '%scheduled_events/FIXTURE%'" 2>/dev/null)
[ "$MEETS" -ge 2 ] && pass "Calendly → CRM meetings created ($MEETS)" || fail "meetings $MEETS"
POST /api/integrations/calendly/sync >/dev/null
MEETS2=$(mysql -u avos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM meetings WHERE external_event_id LIKE '%scheduled_events/FIXTURE%'" 2>/dev/null)
[ "$MEETS2" = "$MEETS" ] && pass "Calendly sync idempotent (no duplicates)" || fail "duplicates: $MEETS → $MEETS2"
# failure mode: bad token → error, site still alive
PUT /api/integrations/cloudflare "{\"api_token\":\"WRONG\",\"zone_id\":\"z\",\"api_base\":\"http://127.0.0.1:$FIXTURE_PORT/client/v4\"}" >/dev/null
R=$(POST /api/integrations/cloudflare/test)
check "wrong token → not connected" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin);print('true' if not d['data']['ok'] else 'false')")"
SITE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
check "public site still 200 after failures" "200" "$SITE"

say ""
say "========== D. LIVE PUBLIC ADAPTERS (real network) =========="
R=$(POST /api/integrations/trends/sync)
T=$(echo "$R" | jqfield "d=json.load(sys.stdin)['data'];print(d.get('imported',0))")
[ "$T" -ge 1 ] 2>/dev/null && pass "Google Trends RSS live ($T items)" || fail "trends $T"
R=$(POST /api/integrations/github/sync)
check "GitHub public API live" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin);print('true' if d['data']['ok'] else 'false')")"
REPOS=$(mysql -u avos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM dev_repos" 2>/dev/null)
[ "$REPOS" -ge 1 ] && pass "dev repos stored ($REPOS)" || fail "repos $REPOS"
R=$(POST /api/integrations/youtube/sync)
YT=$(echo "$R" | jqfield "d=json.load(sys.stdin)['data'];print(d.get('imported',0))")
[ "$YT" -ge 1 ] 2>/dev/null && pass "YouTube RSS live ($YT videos)" || fail "youtube $YT"
R=$(POST /api/integrations/rss/sync)
RI=$(mysql -u avos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM research_items" 2>/dev/null)
[ "$RI" -gt 100 ] && pass "research items from real feeds ($RI)" || fail "research items $RI"

say ""
say "========== E. SEARCH FUSION + MANUAL IMPORT =========="
CSV="Top queries,Clicks,Impressions,CTR,Position,Date
design systems for enterprises,12,930,0.0129,10.5,2026-07-20
immersive retail experience,8,640,0.0125,15.2,2026-07-20"
R=$(POST /api/search-console/import "$(python3 -c "import json,sys;print(json.dumps({'csv':'''$CSV''','source':'google'}))")")
check "CSV manual import (free fallback)" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin)['data'];print('true' if d['imported']>0 else 'false')")"
OV=$(GET "/api/search-console/overview?days=28")
check_contains "fused overview has google source" "google" "$OV"
check_contains "fused overview has bing source" "bing" "$OV"

say ""
say "========== F. TRUTH LAYER + KNOWLEDGE GRAPH + INTELLIGENCE =========="
R=$(POST /api/knowledge-graph/build)
check "knowledge graph built from real content" "true" "$(echo "$R" | jqfield "d=json.load(sys.stdin)['data'];print('true' if d['nodes']>0 else 'false')")"
F=$(GET /api/facts)
FV=$(echo "$F" | jqfield "d=json.load(sys.stdin);print(len([f for f in d['data']['items'] if f['status']=='verified']))")
[ "$FV" -ge 5 ] && pass "verified facts seeded from content ($FV)" || fail "facts $FV"
R=$(POST /api/facts "{\"claim\":\"Abhijeet speaks at industry conferences\",\"status\":\"unverified\",\"confidence\":60,\"source\":\"manual test\"}")
FID=$(echo "$R" | jqfield "d=json.load(sys.stdin);print(d['data']['id'])")
PUT /api/facts/$FID/status "{\"status\":\"verified\"}" >/dev/null
check "fact status change persists" "verified" "$(GET /api/facts | jqfield "d=json.load(sys.stdin);print([f['status'] for f in d['data']['items'] if f['id']==$FID][0])")"
DEL /api/facts/$FID >/dev/null
check "fact delete works" "true" "$(GET /api/facts | jqfield "d=json.load(sys.stdin);print('true' if not any(f['id']==$FID for f in d['data']['items']) else 'false')")"
POST /api/case-studies/intel >/dev/null
CS=$(GET /api/case-studies/intel)
CSN=$(echo "$CS" | jqfield "d=json.load(sys.stdin);print(len(d['data']['items']))")
[ "$CSN" -ge 3 ] && pass "case-study completeness scored $CSN projects" || fail "case-study items $CSN"
POS=$(GET /api/positioning)
check "positioning health 0-100" "true" "$(echo "$POS" | jqfield "d=json.load(sys.stdin);s=d['data']['score'];print('true' if 0<=s<=100 else 'false')")"
OUT=$(GET /api/outcomes)
check_contains "agent outcomes recorded" "agent_slug" "$OUT"

say ""
say "========== G. TRACKABLE LINKS (UTM + WhatsApp) =========="
R=$(POST /api/links "{\"kind\":\"utm\",\"name\":\"test-campaign\",\"target_url\":\"https://abhijeetvarghese.com/contact.html\",\"source\":\"linkedin\",\"medium\":\"social\",\"campaign\":\"v24-test\"}")
LID=$(echo "$R" | jqfield "d=json.load(sys.stdin);print(d['data']['id'])")
LURL=$(echo "$R" | jqfield "d=json.load(sys.stdin);print(d['data']['link']['url'])")
check_contains "UTM params generated" "utm_source=linkedin" "$LURL"
check_contains "campaign param" "utm_campaign=v24-test" "$LURL"
curl -s -X POST "$BASE/api/links/click?id=$LID&page=/contact.html" >/dev/null
CL=$(mysql -u avos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT clicks FROM trackable_links WHERE id=$LID" 2>/dev/null)
check "public click tracking increments" "1" "$CL"
R=$(POST /api/links "{\"kind\":\"whatsapp\",\"name\":\"wa-test\",\"phone\":\"+919876543210\",\"message\":\"Hi, from the site\",\"campaign\":\"instagram\"}")
WURL=$(echo "$R" | jqfield "d=json.load(sys.stdin);print(d['data']['link']['url'])")
check_contains "WhatsApp click-to-chat link" "wa.me/919876543210" "$WURL"

say ""
say "========== H. AGENT SYSTEM (31 workforce + tools) =========="
AG=$(GET /api/agents)
AN=$(echo "$AG" | jqfield "d=json.load(sys.stdin);print(len(d['data']['agents']))")
check "31 agents registered" "31" "$AN"
TOOLS=$(echo "$AG" | jqfield "d=json.load(sys.stdin);items=d['data']['agents'];print(sum(1 for i in items if i.get('permissions') and 'tools' in json.loads(i['permissions'])))")
[ "$TOOLS" -ge 20 ] && pass "agent→tool permissions on $TOOLS agents" || fail "tools only $TOOLS"
AGGRAPH=$(GET /api/integrations/agent-graph)
check_contains "agent→tool graph API" "tools" "$AGGRAPH"
cd /home/user/avos-php && php backend/scripts/agent-runner.php >/dev/null 2>&1
JQ=$(mysql -u avos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM ai_agent_jobs WHERE status='completed'" 2>/dev/null)
[ "$JQ" -ge 31 ] && pass "agent runner completes jobs ($JQ)" || fail "completed jobs $JQ"
PAUSE=$(PUT /api/agents/settings "{\"paused_scopes\":[\"all\"]}")
check "PAUSE ALL AI accepted" "true" "$(echo "$PAUSE" | jqfield "d=json.load(sys.stdin);print('true' if d.get('ok') else 'false')")"
RUN=$(php /home/user/avos-php/backend/scripts/agent-runner.php 2>&1 | head -1)
check_contains "runner respects global kill switch" "paused" "$RUN"
PUT /api/agents/settings "{\"paused_scopes\":[]}" >/dev/null

say ""
say "========== I. CRON SCRIPT + SITE INTEGRITY =========="
cd /home/user/avos-php && OUT=$(php backend/scripts/integration-sync.php 2>&1 | tail -1)
case "$OUT" in *done*|*"nothing due"*|*skipping*) pass "integration-sync cron runs";; *) fail "cron output: $OUT";; esac
CALLS=$(GET /api/integrations/calls)
check_not_contains "call log clean of secrets" "$SECRET_MARKER" "$CALLS"
check_not_contains "call log clean of bing fixture key" "fixture-key" "$CALLS"
SITE2=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
check "public site 200 at end" "200" "$SITE2"
API2=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/status")
check "api healthy at end" "200" "$API2"

say ""
say "========== J. HARDENING (v2.4.1) =========="
# J1. AI budget gate is REAL: with a key set + zero budget, chat must refuse
mysql -u avos -paV0s_d3v_9xKq2mN7 avos -e "UPDATE ai_providers SET api_key_enc='dummy' WHERE code='openai';" 2>/dev/null
R=$(php -r '
require "/home/user/avos-php/includes/bootstrap.php";
AgentSettings::save(["daily_budget" => 0, "monthly_budget" => 0]);
$r = AiService::chat("sys", "hello", "openai", "test");
AgentSettings::save(["daily_budget" => 2, "monthly_budget" => 40]);
echo json_encode($r);
' 2>&1 | tail -1)
check_contains "AI budget gate blocks at zero budget" "budget" "$R"
mysql -u avos -paV0s_d3v_9xKq2mN7 avos -e "UPDATE ai_providers SET api_key_enc=NULL WHERE code='openai';" 2>/dev/null
# J2. Runtime tool enforcement: seo agent job with source=drive must FAIL
mysql -u avos -paV0s_d3v_9xKq2mN7 avos -e "DELETE FROM ai_agent_jobs WHERE agent_slug='seo' AND input LIKE '%drive%';" 2>/dev/null
for i in 1 2 3 4 5 6; do php /home/user/avos-php/backend/scripts/agent-runner.php >/dev/null 2>&1; done
php -r '
require "/home/user/avos-php/includes/bootstrap.php";
AgentJobs::enqueue("seo", "run", ["source" => "drive"], "medium");
' 2>&1 | tail -1
php /home/user/avos-php/backend/scripts/agent-runner.php >/dev/null 2>&1
R=$(mysql -u avos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT error FROM ai_agent_jobs WHERE agent_slug='seo' AND input LIKE '%drive%' ORDER BY id DESC LIMIT 1;" 2>/dev/null)
check_contains "tool permission enforced at runtime" "not permitted" "$R"
# J3. Migration portability validator
php /home/user/avos-php/database/validate-migrations.php >/dev/null 2>&1
[ $? -eq 0 ] && pass "migration validator: all files portable" || fail "migration validator found violations"
# J4. Rate limiter is DB-backed (no more rl-*.json files)
[ -z "$(ls /home/user/avos-php/storage/cache/rl-*.json 2>/dev/null)" ] && pass "rate limiter DB-backed (no file writes)" || fail "legacy rate-limit files still written"
mysql -u avos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='avos' AND table_name='rate_limits';" 2>/dev/null | grep -q 1 && pass "rate_limits table exists" || fail "rate_limits table missing"
# J5. Agent action policies exposed
R=$(GET /api/agents)
check_contains "action policy exposed via API" "action_policy" "$R"

say ""
say "==============================================================="
say "INTEGRATION HUB TESTS: $PASS_COUNT pass / $FAIL_COUNT fail"
[ "$FAIL_COUNT" -eq 0 ] && say "ALL GREEN" || say "FAILURES PRESENT"
exit $([ "$FAIL_COUNT" -eq 0 ] && echo 0 || echo 1)
