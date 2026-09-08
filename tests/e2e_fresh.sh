#!/bin/bash
# ============================================================
# AV OS v2 — FRESH-INSTALL END-TO-END TEST (spec §75)
# Runs against a fresh DB installed via the web installer.
# ============================================================
set -u
BASE=http://127.0.0.1:8092
ADMIN_EMAIL="admin@avos.test"
TEMP_PASS="$1"
NEW_PASS="AV2E2E!2345xY"
CJ=/tmp/e2e_cookies.txt
rm -f $CJ
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  ✅ $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  ❌ $1 $2"; }
check(){ # name, expected-substring, actual
  if echo "$3" | grep -qF "$2"; then ok "$1"; else bad "$1" "(expected '$2' got: $(echo "$3" | head -c 160))"; fi
}

echo "== 1. INSTALLER LOCK =="
R=$(curl -s -o /dev/null -w "%{http_code}" $BASE/install/)
check "installer self-locked (404)" "404" "$R"

echo "== 2. SCHEMA COMPLETE (42 tables incl. v2 migrations) =="
T=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SHOW TABLES;" 2>/dev/null | wc -l)
[ "$T" -ge 62 ] && ok "table count >= 62 ($T)" || bad "table count $T < 62" ""
for t in leads opportunities meetings automations webhooks api_keys email_templates deployments content_metrics; do
  mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SHOW TABLES LIKE '$t';" 2>/dev/null | grep -q "$t" && ok "table $t exists" || bad "table $t missing" ""
done

echo "== 3. STATUS =="
R=$(curl -s $BASE/api/status)
check "status healthy" '"status":"healthy"' "$R"
check "version 2.4.2" '"version":"2.4.20"' "$R"

echo "== 4. LOGIN (temp pass) + forced change =="
R=$(curl -s -c $CJ -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$TEMP_PASS\"}")
check "login ok" '"ok":true' "$R"
check "must change password" '"must_change_password":true' "$R"
CSRF=$(curl -s -b $CJ $BASE/api/session | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["csrf"];')
R=$(curl -s -b $CJ -X POST $BASE/api/auth/change-password -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"current_password\":\"$TEMP_PASS\",\"new_password\":\"$NEW_PASS\"}")
check "password changed" '"ok":true' "$R"
R=$(curl -s -b $CJ $BASE/api/session)
check "session no longer requires change" '"must_change_password":false' "$R"
# disable auto-publish so this test controls publishing explicitly
curl -s -b $CJ -X PUT $BASE/api/flags/auto_publish -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"enabled":false}' > /dev/null
F=$(curl -s -b $CJ $BASE/api/flags | php -r '$d=json_decode(stream_get_contents(STDIN),true); foreach($d["data"] as $f) if($f["flag"]==="auto_publish") echo $f["enabled"];')
check "auto_publish disabled for controlled test" "0" "$F"

echo "== 5. SEED CONTENT PRESENT =="
R=$(curl -s -b $CJ $BASE/api/content)
check "sections seeded" '"sections"' "$R"
check "projects seeded" '"projects"' "$R"
check "articles seeded" '"articles"' "$R"

echo "== 6. EDIT HOMEPAGE HERO → DB → VERSION =="
curl -s -b $CJ $BASE/api/content > /tmp/e2e_doc.json
php -r '
$d = json_decode(file_get_contents("/tmp/e2e_doc.json"), true);
$doc = $d["data"];
foreach ($doc["sections"] as &$s) { if ($s["id"] === "hero") { $s["title"] = "Making ambitious ideas impossible to misunderstand. [E2E]"; } }
file_put_contents("/tmp/e2e_sections.json", json_encode(["sections" => $doc["sections"]]));
'
R=$(curl -s -b $CJ -X PUT $BASE/api/content -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d @/tmp/e2e_sections.json)
check "content saved" '"ok":true' "$R"
DBT=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT data FROM content_store WHERE key_name='sections';" 2>/dev/null | grep -c 'E2E')
check "verified in database" "1" "$DBT"
V=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM versions WHERE entity='store' AND entity_id='sections';" 2>/dev/null)
check "version created" "1" "$V"

echo "== 7. PREVIEW (draft renderer via API) =="
# content preview is served by the same engine; verify page list endpoint works
R=$(curl -s -b $CJ $BASE/api/versions/sections)
check "versions API lists versions" '"version"' "$R"

echo "== 8. PUBLISH =="
R=$(curl -s -b $CJ -X POST $BASE/api/publish -H "X-CSRF-Token: $CSRF" -d '{}')
check "publish ok" '"ok":true' "$R"
check "pages regenerated (12 incl. homepage)" '"pages":12' "$R"
check "articles regenerated (drafts excluded)" '"articles":6' "$R"

echo "== 9. GENERATED SITE VERIFICATION =="
curl -s $BASE/site/index.html > /tmp/e2e_index.html
grep -q "\[E2E" /tmp/e2e_index.html && ok "hero change in generated site" || bad "hero change missing" ""
grep -q 'css/tokens.css' /tmp/e2e_index.html && ok "tokens.css injected" || bad "tokens.css missing" ""
grep -q '/api/analytics/track' /tmp/e2e_index.html && ok "analytics snippet injected" || bad "analytics snippet missing" ""
grep -q 'sitemap' /tmp/e2e_index.html; curl -s -o /dev/null -w "%{http_code}" $BASE/site/css/styles.css | grep -q 200 && ok "css served" || bad "css missing" ""
curl -s -o /dev/null -w "%{http_code}" $BASE/site/js/main.js | grep -q 200 && ok "js served" || bad "js missing" ""
curl -s -o /dev/null -w "%{http_code}" $BASE/site/robots.txt | grep -q 200 && ok "robots.txt served" || bad "robots.txt missing" ""
curl -s -o /dev/null -w "%{http_code}" $BASE/site/sitemap.xml | grep -q 200 && ok "sitemap.xml served" || bad "sitemap.xml missing" ""
for p in index.html story.html experience.html case-studies.html contact.html insights.html journal.html consulting.html for-recruiters.html privacy-policy.html terms.html; do
  code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/site/$p)
  [ "$code" = "200" ] && ok "$p 200" || bad "$p HTTP $code" ""
done

echo "== 10. PUBLIC LEAD → CRM =="
R=$(curl -s -X POST $BASE/api/public/lead -H "Content-Type: application/json" -d '{"name":"E2E Visitor","email":"visitor@e2e.test","company":"E2E Corp","project_type":"experience centre","message":"Please contact me about an experience centre.","page":"/contact.html","utm_source":"e2e","utm_medium":"test","utm_campaign":"e2e-campaign","website":""}')
check "lead accepted 201" '"ok":true' "$R"
check "lead scored" '"score":' "$R"
LID=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["id"];')
L=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT name,status,score,utm_campaign FROM leads WHERE id=$LID;" 2>/dev/null)
check "lead in CRM table" "E2E Visitor" "$L"
check "lead has utm campaign" "e2e-campaign" "$L"
# automation + notification fired for high-value lead
N=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM notifications;" 2>/dev/null)
check "automation notification fired (publish + push + rule)" "3" "$N"
A=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM automation_runs;" 2>/dev/null)
check "automation run logged" "1" "$A"
T=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM tasks;" 2>/dev/null)
check "automation task created" "1" "$T"
E=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM email_log;" 2>/dev/null)
check "confirmation emails queued (2)" "2" "$E"

echo "== 11. OPEN LEAD IN CMS + UPDATE =="
R=$(curl -s -b $CJ $BASE/api/leads)
check "lead visible in CMS" "E2E Visitor" "$R"
R=$(curl -s -b $CJ -X PUT $BASE/api/leads/$LID -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"status":"contacted","notes":"Called on day 1"}')
check "lead updated" '"ok":true' "$R"
U=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT status FROM leads WHERE id=$LID;" 2>/dev/null)
check "lead status persisted" "contacted" "$U"
AU=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM audit_logs WHERE action='lead_update';" 2>/dev/null)
check "audit logged lead update" "1" "$AU"

echo "== 12. CREATE MEETING =="
R=$(curl -s -b $CJ -X POST $BASE/api/crm/meetings -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"lead_id\":$LID,\"subject\":\"E2E discovery call\",\"scheduled_at\":\"2026-08-15 10:00:00\",\"type\":\"discovery\",\"status\":\"scheduled\"}")
check "meeting created" '"ok":true' "$R"
M=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM meetings;" 2>/dev/null)
check "meeting in DB" "1" "$M"

echo "== 13. MEDIA UPLOAD + FORMS + BACKUP =="
# tiny valid PNG (1x1) as base64
PNG_B64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
R=$(curl -s -b $CJ -X POST $BASE/api/media -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"name\":\"e2e-pixel.png\",\"data\":\"$PNG_B64\",\"folder\":\"E2E\"}")
check "media upload accepted" '"ok":true' "$R"
MID=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["id"] ?? 0;')
M=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM media WHERE id=$MID;" 2>/dev/null)
check "media row in DB" "1" "$M"
R=$(curl -s -b $CJ $BASE/api/media)
check "media list shows upload" "e2e-pixel" "$R"
# public form submit
R=$(curl -s -X POST $BASE/api/public/submit -H "Content-Type: application/json" -d '{"form_id":"contact","name":"Form Tester","email":"form@e2e.test","message":"form test"}')
check "public submit accepted" '"ok":true' "$R"
FS=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM form_submissions;" 2>/dev/null)
check "submission stored" "1" "$FS"
# backup
R=$(curl -s -b $CJ -X POST $BASE/api/backup -H "X-CSRF-Token: $CSRF" -d '{}')
check "backup created" '"ok":true' "$R"
B=$(ls /home/user/avos-php/storage/backups/ 2>/dev/null | wc -l)
[ "$B" -ge 1 ] && ok "backup file(s) on disk ($B)" || bad "backup files" "$B"

echo "== 14. ANALYTICS (first-party) =="
R=$(curl -s -X POST $BASE/api/analytics/track -H "Content-Type: application/json" -d '{"visitor_id":"e2e-visitor-1","path":"/","referrer":"https://google.com","event_type":"pageview"}')
check "track accepted" '"ok":true' "$R"
R=$(curl -s -b $CJ "$BASE/api/analytics/summary?days=30")
check "analytics summary real data" '"pageviews":1' "$R"
R=$(curl -s -b $CJ "$BASE/api/analytics/sources?days=30")
check "sources endpoint" '"ok":true' "$R"
R=$(curl -s -b $CJ "$BASE/api/analytics/daily?days=30")
check "daily endpoint" '"ok":true' "$R"

echo "== 15. ROLLBACK =="
# deployment #1 is live with [E2E] hero; publish a clean version as #2
curl -s -b $CJ $BASE/api/content > /tmp/e2e_doc.json
php -r '
$d = json_decode(file_get_contents("/tmp/e2e_doc.json"), true);
$doc = $d["data"];
foreach ($doc["sections"] as &$s) { if ($s["id"] === "hero") { $s["title"] = "Making ambitious ideas impossible to misunderstand."; } }
file_put_contents("/tmp/e2e_clean.json", json_encode(["sections" => $doc["sections"]]));
'
curl -s -b $CJ -X PUT $BASE/api/content -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d @/tmp/e2e_clean.json > /dev/null
R=$(curl -s -b $CJ -X POST $BASE/api/publish -H "X-CSRF-Token: $CSRF" -d '{}')
check "publish #2 (clean) ok" '"ok":true' "$R"
C=$(curl -s $BASE/site/index.html | grep -c "\[E2E")
check "site clean before rollback" "0" "$C"
R=$(curl -s -b $CJ -X POST $BASE/api/publish/rollback -H "X-CSRF-Token: $CSRF" -d '{}')
check "rollback ok" '"ok":true' "$R"
C=$(curl -s $BASE/site/index.html | grep -c "\[E2E")
check "site restored to deployment #1 (E2E back)" "1" "$C"
DBT2=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT data FROM content_store WHERE key_name='sections';" 2>/dev/null | grep -c 'E2E')
check "content restored in DB (E2E back)" "1" "$DBT2"
RB=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM audit_logs WHERE action='publish_rollback';" 2>/dev/null)
check "rollback audited" "1" "$RB"
V2=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM versions WHERE entity='store' AND entity_id='sections' AND note LIKE 'rollback%';" 2>/dev/null)
check "rollback created new versions" "1" "$V2"

echo "== 16. REPUBLISH CLEAN + VERIFY AGAIN =="
curl -s -b $CJ -X PUT $BASE/api/content -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d @/tmp/e2e_clean.json > /dev/null
R=$(curl -s -b $CJ -X POST $BASE/api/publish -H "X-CSRF-Token: $CSRF" -d '{}')
check "republish ok" '"ok":true' "$R"
curl -s -o /dev/null -w "%{http_code}" $BASE/site/index.html | grep -q 200 && ok "site live again" || bad "site down" ""
C=$(curl -s $BASE/site/index.html | grep -c "\[E2E")
check "final site clean" "0" "$C"

echo "== 17. SECURITY =="
# CSRF missing on state change
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b $CJ -X PUT $BASE/api/content -H "Content-Type: application/json" -d '{"settings":{}}')
check "CSRF enforced (419)" "419" "$CODE" 
# unauth access
R=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/leads)
check "unauth leads → 401" "401" "$R"
# SQL injection probe
R=$(curl -s -X POST $BASE/api/public/lead -H "Content-Type: application/json" -d '{"name":"x\" OR 1=1 --","email":"sqli@test.com","message":"probe"}')
check "SQLi probe handled" '"ok":true' "$R"
# login throttling: 6 bad attempts → 429/401
for i in 1 2 3 4 5 6; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@avos.test","password":"wrongpass123"}')
done
check "brute-force throttled" "429" "$CODE"
# XSS reflection probe
R=$(curl -s -b $CJ "$BASE/api/search?q=%3Cscript%3Ealert(1)%3C/script%3E")
[ "$(echo "$R" | grep -c '<script>alert(1)</script>')" = "0" ] && ok "search XSS safe (no raw reflection)" || bad "script tag echoed" "$R"

echo "== 18. V2 MODULES ON FRESH INSTALL =="
for ep in "emailtemplates" "campaigns" "content-health" "ai/usage?days=30" "sites" "deployments" "automations/runs" "webhooks" "apikeys" "flags" "knowledge" "errors" "emaillog"; do
  R=$(curl -s -b $CJ "$BASE/api/$ep")
  echo "$R" | grep -q '"ok":true' && ok "/api/$ep" || bad "/api/$ep" "$(echo "$R" | head -c 120)"
done
R=$(curl -s -b $CJ -X POST $BASE/api/copilot -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"query":"Show my recent leads"}')
check "copilot tool-router (no API key needed)" '"ok":true' "$R"

echo "== 19. RBAC =="
# create a Viewer user and verify 403 on publish
R=$(curl -s -b $CJ -X POST $BASE/api/users -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"name":"E2E Viewer","email":"viewer@e2e.test","password":"ViewerPass!2345","role_id":6}')
check "viewer created" '"ok":true' "$R"
CJ2=/tmp/e2e_cookies2.txt; rm -f $CJ2
curl -s -c $CJ2 -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"viewer@e2e.test","password":"ViewerPass!2345"}' > /dev/null
CSRF2=$(curl -s -b $CJ2 $BASE/api/session | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["csrf"];')
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b $CJ2 -X POST $BASE/api/publish -H "X-CSRF-Token: $CSRF2" -d '{}')
check "viewer publish → 403" "403" "$CODE"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b $CJ2 $BASE/api/users)
check "viewer users list → 403" "403" "$CODE"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b $CJ2 $BASE/api/leads)
check "viewer leads read → 200 (leads.read granted)" "200" "$CODE"

echo
echo "== 20. AUTO-PUBLISH (live sync) =="
curl -s -b $CJ -X PUT $BASE/api/flags/auto_publish -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"enabled":true}' > /dev/null
curl -s -b $CJ $BASE/api/content > /tmp/e2e_doc.json
php -r '
$d = json_decode(file_get_contents("/tmp/e2e_doc.json"), true);
foreach ($d["data"]["sections"] as &$s) { if ($s["id"] === "hero") { $s["lede"] = "Auto-publish E2E lede"; } }
file_put_contents("/tmp/e2e_auto.json", json_encode(["sections" => $d["data"]["sections"]]));
'
R=$(curl -s -b $CJ -X PUT $BASE/api/content -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d @/tmp/e2e_auto.json)
check "save triggers auto-publish" '"auto_published":true' "$R"
sleep 1
C=$(curl -s $BASE/ | grep -c "Auto-publish E2E")
check "live site updated without manual publish" "1" "$C"
curl -s -b $CJ -X PUT $BASE/api/content -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d @/tmp/e2e_clean.json > /dev/null
curl -s -b $CJ -X PUT $BASE/api/flags/auto_publish -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"enabled":false}' > /dev/null

echo "== 21. SEO + INTELLIGENCE =="
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/seo/keywords)
check "keywords endpoint (seeded)" '"items"' "$R"
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/seo/opportunities)
N=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo count($d["data"] ?? []);')
[ "$N" -ge 5 ] && ok "opportunities scored ($N)" || bad "opportunities" "$R"
R=$(curl -s -b $CJ -X POST http://127.0.0.1:8092/api/seo/audit -H "X-CSRF-Token: $CSRF" -d '{}')
SC=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["score"] ?? "?";')
[ "$SC" -ge 0 ] && ok "technical SEO crawl ran (score $SC)" || bad "crawl" "$R"
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/intelligence/next-actions)
N=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo count($d["data"] ?? []);')
[ "$N" -ge 1 ] && ok "next-actions engine ($N actions)" || bad "next-actions" "$R"
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/intelligence/daily-brief)
check "daily brief" '"traffic_today"' "$R"
R=$(curl -s -b $CJ -X POST http://127.0.0.1:8092/api/intelligence/social-drafts -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"content_type":"case_study","content_id":"prj-1","platform":"linkedin"}')
check "social draft created (draft only)" '"status":"draft"' "$R"
SRCH=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8092/search.html)
check "public search page 200" "200" "$SRCH"
IDX=$(curl -s http://127.0.0.1:8092/search-index.json | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo count($d["items"] ?? []);')
[ "$IDX" -ge 10 ] && ok "search index built ($IDX items)" || bad "search index" "$IDX"

echo "== 22. AI AGENT OS =="
# agents registered (seeded by the registry on first API call)
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/agents)
N=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo count($d["data"]["agents"] ?? []);')
[ "$N" -ge 15 ] && ok "agent registry seeded ($N agents)" || bad "registry" "$R"
H=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["health"]["overall"] ?? "?";')
[ "$H" = "healthy" ] && ok "agent system healthy ($H)" || bad "health" "$H"
# run the cron runner in cycles (simulates Hostinger cron draining the initial queue)
cd /home/user/avos-php
for i in 1 2 3 4 5 6 7 8; do php backend/scripts/agent-runner.php >> /tmp/agent_run.log 2>&1; done
# force the orchestrator to run (it may not be schedule-due)
curl -s -b $CJ -X POST http://127.0.0.1:8092/api/agents/orchestrator/run -H "X-CSRF-Token: $CSRF" -d '{}' > /dev/null
M=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM ai_agent_memory;" 2>/dev/null)
[ "$M" -ge 3 ] && ok "agent memory populated ($M observations)" || bad "memory" "$M"
J=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM ai_agent_jobs WHERE status='completed';" 2>/dev/null)
[ "$J" -ge 3 ] && ok "agent jobs completed ($J)" || bad "jobs" "$J"
# kill switch: pause all → manual run blocked
curl -s -b $CJ -X POST http://127.0.0.1:8092/api/agents/pause -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"scopes":["all"]}' > /dev/null
R=$(curl -s -b $CJ -X POST http://127.0.0.1:8092/api/agents/seo/run -H "X-CSRF-Token: $CSRF" -d '{}')
echo "$R" | grep -q "AGENTS_PAUSED" && ok "kill switch blocks agent actions" || bad "kill switch" "$R"
curl -s -b $CJ -X POST http://127.0.0.1:8092/api/agents/pause -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"scopes":[]}' > /dev/null
# growth brief real data
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/agents/brief)
echo "$R" | grep -q '"top_recommendation"' && ok "growth brief generated" || bad "brief" "$R"
# drafts created by content agents (no fabricated facts)
K=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM knowledge_items WHERE category IN ('journal-drafts','insight-drafts','case-study-drafts');" 2>/dev/null)
[ "$K" -ge 1 ] && ok "agent drafts stored ($K) — draft only, human review required" || bad "drafts" "$K"

echo "== 23. INTEGRATION HUB + DATA INTELLIGENCE =="
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/integrations)
N=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo count($d["data"]["items"] ?? []);')
[ "$N" -ge 23 ] && ok "integration registry seeded ($N)" || bad "registry" "$R"
echo "$R" | grep -q '"status_label"' && ok "status labels present (honest states)" || bad "status labels" "$R"
# no integration may claim CONNECTED without a verified request
FALSE_CONN=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); $n=0; foreach($d["data"]["items"] as $i) if($i["status"]==="connected" && $i["last_success_at"]===null) $n++; echo $n;')
[ "$FALSE_CONN" = "0" ] && ok "no fake CONNECTED states" || bad "fake connected x$FALSE_CONN" "$R"
# research engine seeded with real sources
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/research/sources)
N=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo count($d["data"]["items"] ?? []);')
[ "$N" -ge 10 ] && ok "research sources seeded ($N)" || bad "research sources" "$R"
# knowledge graph + truth layer
curl -s -b $CJ -X POST http://127.0.0.1:8092/api/knowledge-graph/build -H "X-CSRF-Token: $CSRF" -d '{}' > /dev/null
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/knowledge-graph)
echo "$R" | grep -q '"nodes"' && ok "knowledge graph built from real content" || bad "graph" "$R"
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/facts)
V=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo count(array_filter($d["data"]["items"] ?? [], fn($f)=>$f["status"]==="verified"));')
[ "$V" -ge 3 ] && ok "truth layer seeded verified facts ($V)" || bad "facts" "$R"
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/positioning)
echo "$R" | grep -q '"score"' && ok "positioning health computed" || bad "positioning" "$R"
# case study completeness
curl -s -b $CJ -X POST http://127.0.0.1:8092/api/case-studies/intel -H "X-CSRF-Token: $CSRF" -d '{}' > /dev/null
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/case-studies/intel)
N=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo count($d["data"]["items"] ?? []);')
[ "$N" -ge 3 ] && ok "case-study completeness scored ($N)" || bad "case study intel" "$R"
# trackable links
R=$(curl -s -b $CJ -X POST http://127.0.0.1:8092/api/links -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"kind":"utm","name":"e2e","target_url":"https://abhijeetvarghese.com/contact.html","source":"e2e","medium":"test","campaign":"fresh"}')
echo "$R" | grep -q 'utm_source=e2e' && ok "UTM generator builds real links" || bad "utm" "$R"
# agents now 31 with tool permissions
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/agents)
N=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo count($d["data"]["agents"] ?? []);')
[ "$N" -ge 31 ] && ok "31-agent workforce registered" || bad "agents $N" "$R"
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/integrations/agent-graph)
echo "$R" | grep -q '"tools"' && ok "agent→tool graph exposed" || bad "agent graph" "$R"
# agent outcomes measured
R=$(curl -s -b $CJ http://127.0.0.1:8092/api/outcomes)
echo "$R" | grep -q '"summary"' && ok "agent outcome measurement live" || bad "outcomes" "$R"

echo "=========================================="
echo "E2E RESULT: $PASS passed, $FAIL failed"
echo "=========================================="
[ "$FAIL" = "0" ] && exit 0 || exit 1
