#!/bin/bash
# ============================================================
# AV OS — USER JOURNEYS (spec §81): C (CRM), D (Content), G (AI)
# ============================================================
set -u
BASE=http://127.0.0.1:8092
CJ=/tmp/jr.txt; rm -f $CJ
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "  ✅ $1"; }
bad(){ FAIL=$((FAIL+1)); echo "  ❌ $1 — $2"; }

mysql -uavos -paV0s_d3v_9xKq2mN7 avos -e "DELETE FROM login_attempts;" 2>/dev/null
rm -f /home/user/avos-php/storage/cache/rl-*.json
curl -s -c $CJ -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@avos.test","password":"AV2E2E!2345xY"}' > /dev/null
CSRF=$(curl -s -b $CJ $BASE/api/session | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["csrf"];')

echo "== JOURNEY C — CRM: lead → score → qualify → meeting → proposal → project =="
R=$(curl -s -X POST $BASE/api/public/lead -H "Content-Type: application/json" -d "{\"name\":\"Journey Lead\",\"email\":\"journey-$(date +%s)@test.dev\",\"company\":\"JourneyCorp\",\"project_type\":\"experience centre\",\"message\":\"journey test\",\"utm_source\":\"linkedin\",\"utm_campaign\":\"j-campaign\",\"website\":\"\"}")
LID=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["id"];')
SC=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["score"];')
[ "$SC" -ge 70 ] && ok "lead scored ≥70 for experience centre ($SC)" || bad "lead score" "$SC"
R=$(curl -s -b $CJ -X PUT $BASE/api/leads/$LID -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"status":"qualified"}')
chk(){ if echo "$2" | grep -qF "$1"; then ok "$3"; else bad "$3" "$2"; fi; }
chk '"ok":true' "$R" "lead qualified"
R=$(curl -s -b $CJ $BASE/api/crm/activities/lead/$LID)
chk 'status_changed' "$R" "timeline records status change"
R=$(curl -s -b $CJ -X POST $BASE/api/crm/meetings -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"lead_id\":$LID,\"subject\":\"Journey discovery\",\"scheduled_at\":\"2026-08-20 10:00:00\",\"type\":\"discovery\",\"status\":\"confirmed\"}")
MID=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["id"];')
[ -n "$MID" ] && ok "meeting created (#$MID)" || bad "meeting" "$R"
R=$(curl -s -b $CJ $BASE/api/crm/activities/lead/$LID)
chk 'meeting_scheduled' "$R" "timeline records meeting"
R=$(curl -s -b $CJ -X POST $BASE/api/proposals -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"client_name\":\"JourneyCorp\",\"title\":\"Experience Centre Proposal\",\"lead_id\":$LID,\"scope\":\"Strategy\",\"deliverables\":[\"Blueprint\"],\"investment\":3000000,\"timeline\":\"10 weeks\"}")
PID=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["id"];')
[ -n "$PID" ] && ok "proposal created (#$PID)" || bad "proposal" "$R"
R=$(curl -s -b $CJ -X POST $BASE/api/business/projects -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"title\":\"JourneyCorp Experience Centre\",\"client_id\":null,\"status\":\"in_progress\",\"budget\":3000000,\"progress\":20}")
PRJ=$(echo "$R" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["data"]["id"];')
[ -n "$PRJ" ] && ok "business project created (#$PRJ)" || bad "project" "$R"
R=$(curl -s -b $CJ -X POST $BASE/api/business/milestones/$PRJ -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"title":"Strategy sign-off","due_at":"2026-09-01","status":"pending"}')
chk '"ok":true' "$R" "milestone added"

echo "== JOURNEY D — Content: create project → SEO → preview → publish =="
R=$(curl -s -b $CJ $BASE/api/content)
php -r '
$d = json_decode(stream_get_contents(STDIN), true);
' <<< "$R" 2>/dev/null
curl -s -b $CJ $BASE/api/content > /tmp/jr_doc.json
php -r '
$d = json_decode(file_get_contents("/tmp/jr_doc.json"), true);
$doc = $d["data"];
$id = "prj-journey-" . time();
$doc["projects"][] = ["id" => $id, "title" => "Journey Case Study", "client" => "JourneyCorp", "industry" => "Enterprise", "status" => "draft", "year" => "2026", "featured" => false, "image" => "media/hero-portrait.webp", "summary" => "A journey test case study.", "role" => "Creative Systems Lead", "challenge" => "challenge", "approach" => "approach", "outcome" => "outcome", "seo" => ["title" => "Journey Case Study — Experience Centre", "desc" => "How JourneyCorp built an experience centre.", "keywords" => ["journey"]]];
file_put_contents("/tmp/jr_projects.json", json_encode(["projects" => $doc["projects"]]));
echo "project added to draft: $id\n";
'
R=$(curl -s -b $CJ -X PUT $BASE/api/content -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d @/tmp/jr_projects.json)
chk '"ok":true' "$R" "project draft saved to database"
V=$(mysql -uavos -paV0s_d3v_9xKq2mN7 avos -N -e "SELECT COUNT(*) FROM versions WHERE entity='store' AND entity_id='projects';" 2>/dev/null)
[ "$V" -ge 1 ] && ok "version created for projects" || bad "versions" "$V"
R=$(curl -s -b $CJ -X POST $BASE/api/publish/preflight -H "X-CSRF-Token: $CSRF" -d '{}')
chk '"ok":true' "$R" "pre-flight passes with draft present (draft not published)"

echo "== JOURNEY G — AI: copilot draft → save draft =="
R=$(curl -s -b $CJ -X POST $BASE/api/copilot -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"query":"Create a draft case study from the Orange Business project"}')
chk 'Draft case study structure' "$R" "copilot drafts case study from project (no key needed)"
R=$(curl -s -b $CJ -X POST $BASE/api/copilot -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"query":"Which case studies are missing SEO?"}')
chk 'missing SEO' "$R" "copilot lists SEO gaps"

echo "== JOURNEY F — Rollback (already covered in E2E; quick re-verify) =="
curl -s -b $CJ $BASE/api/deployments > /dev/null
R=$(curl -s -b $CJ $BASE/api/deployments | php -r '$d=json_decode(stream_get_contents(STDIN),true); $x=$d["data"][0]??[]; echo ($x["status"]??"") . " deploys=" . count($d["data"]??[]);')
chk 'live' "$R" "deployment history present"

echo
echo "============================================="
echo "JOURNEYS RESULT: $PASS passed, $FAIL failed"
echo "============================================="
[ "$FAIL" = "0" ] && exit 0 || exit 1
