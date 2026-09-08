#!/usr/bin/env bash
# Frontend → CMS sync (one-way) — end-to-end checks.
#   AV_ADMIN_EMAIL / AV_ADMIN_PASS / AV_BASE override defaults.
set -u
cd "$(dirname "$0")/.."
BASE="${AV_BASE:-http://127.0.0.1:8092}"
EMAIL="${AV_ADMIN_EMAIL:-admin@abhijeetvarghese.com}"
PASS="${AV_ADMIN_PASS:-Admin@Local2026!!}"
SITE="abhijeetvarghese"
PHP="php avos-php/backend/scripts/sync-frontend.php"
pass=0; fail=0
ok()   { pass=$((pass+1)); echo "  ✓ $1"; }
bad()  { fail=$((fail+1)); echo "  ✗ $1"; }
check(){ if [ "$1" = "$2" ]; then ok "$3"; else bad "$3 (got: $1 / want: $2)"; fi; }
store(){ php -r 'require "avos-php/includes/bootstrap.php"; $d=ContentStore::get($argv[1]); echo json_encode($d, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);' "$1"; }
jq_(){ python3 -c "import sys,json; d=json.load(sys.stdin); print(eval(sys.argv[1]))" "$1"; }

echo "== 1. CLI sync is idempotent"
$PHP --force >/dev/null
out=$($PHP --force); n=$(echo "$out" | grep -c UPDATED || true)
check "$n" "0" "second forced run updates nothing"
st=$($PHP --status | jq_ "d['in_sync']"); check "$st" "True" "fingerprint stored and in sync"

echo "== 2. Derived data mirrors the site"
n=$(store projects | jq_ "len([p for p in d if p['status']=='published'])"); check "$n" "3" "3 published projects (one per case-studies/ dir)"
slugs=$(store projects | jq_ "','.join(sorted(p['slug'] for p in d if p['status']=='published'))")
check "$slugs" "bharat-petroleum-corporation-limited,indian-army,orange-business" "project slugs = case-study directories"
n=$(store articles | jq_ "len([a for a in d if a['status']=='published'])"); check "$n" "6" "6 published articles (4 essays + 2 journal)"
n=$(store pages | jq_ "len([p for p in d if p['status']=='published'])"); check "$n" "12" "12 published pages"
nav=$(store nav | jq_ "d['primary'][1]['href']"); check "$nav" "experience/" "nav hrefs come from index.html"
n=$(store clients | jq_ "len(d)"); n2=$(grep -o 'src="assets/logos/[^"]*' $SITE/index.html | sort -u | wc -l | tr -d ' ')
check "$n" "$n2" "clients = logos in #clients"
n=$(store seo | jq_ "len(d)"); n2=$(grep -c "<loc>" $SITE/sitemap.xml | tr -d ' ')
check "$n" "$n2" "one seo row per public URL (matches sitemap.xml)"
n=$(store sections | jq_ "','.join(s['id'] for s in d if s['status']=='published')")
check "$n" "hero,clients,capabilities,work,thinking,journey,ai,focus,contact" "sections follow index.html order"
n=$(store media | jq_ "len(d) >= 50"); check "$n" "True" "media library enumerates assets/"
src=$(store projects | jq_ "sorted(set(p.get('source') for p in d if p['status']!='published'))"); check "$src" "['cms-only']" "non-site projects marked cms-only + non-published"

echo "== 3. Change detection (edit site → sync picks it up, restore → reverts)"
cp $SITE/index.html /tmp/_idx.bak
sed -i 's/Available for select projects — 2026/Available for select projects — 2099/' $SITE/index.html
$PHP >/dev/null
v=$(store settings | jq_ "d['availability']"); check "$v" "Available for select projects — 2099" "settings.availability follows index.html"
v=$(store sections | jq_ "d[0]['availability']"); check "$v" "Available for select projects — 2099" "sections.hero.availability follows index.html"
cp /tmp/_idx.bak $SITE/index.html
out=$($PHP); echo "$out" | grep -q "settings   UPDATED" && ok "restore detected (content hash, not mtime)" || bad "restore not detected"
v=$(store settings | jq_ "d['availability']"); check "$v" "Available for select projects — 2026" "settings.availability reverted"
out=$($PHP); echo "$out" | grep -q "no changes" && ok "no-op when unchanged" || bad "unexpected work when unchanged"

echo "== 4. agent-runner auto-trigger"
sed -i 's/Available for select projects — 2026/Available for select projects — 2098/' $SITE/index.html
out=$(php avos-php/backend/scripts/agent-runner.php 2>&1); echo "$out" | grep -q "frontend changed → CMS synced" && ok "runner synced on change" || bad "runner did not sync: $out"
cp /tmp/_idx.bak $SITE/index.html; php avos-php/backend/scripts/agent-runner.php >/dev/null 2>&1
v=$(store settings | jq_ "d['availability']"); check "$v" "Available for select projects — 2026" "runner restored value"
git -C . status --short $SITE | grep -q . && bad "site folder modified by tests" || ok "site folder untouched (one-way)"

echo "== 5. API"
C=$(mktemp); curl -s -c $C -b $C $BASE/api/session >/dev/null
TOK=$(curl -s -c $C -b $C $BASE/api/session | jq_ "d['data']['csrf']")
curl -s -c $C -b $C -H "Content-Type: application/json" -H "X-CSRF-Token: $TOK" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" $BASE/api/auth/login >/dev/null
TOK=$(curl -s -c $C -b $C $BASE/api/session | jq_ "d['data']['csrf']")
v=$(curl -s -b $C $BASE/api/system/sync-frontend | jq_ "d['data']['in_sync']"); check "$v" "True" "GET /api/system/sync-frontend"
v=$(curl -s -b $C -X POST -H "Content-Type: application/json" -H "X-CSRF-Token: $TOK" -d '{"force":true}' $BASE/api/system/sync-frontend | jq_ "d['data']['ok']"); check "$v" "True" "POST /api/system/sync-frontend (force)"
v=$(curl -s -b $C $BASE/api/status | jq_ "d['data']['frontend_sync']['in_sync']"); check "$v" "True" "/api/status exposes frontend_sync"
v=$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/system/sync-frontend); check "$v" "401" "POST requires auth"
rm -f $C /tmp/_idx.bak

echo; echo "frontend_sync: $pass passed, $fail failed"; [ $fail -eq 0 ]
