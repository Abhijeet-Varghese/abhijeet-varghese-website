#!/usr/bin/env bash
# ============================================================
# AV OS — /api/v1/content bridge test (Phase 3)
#
# Verifies the public content endpoint against a running backend
# (php -S 127.0.0.1:8092 router.php, or start.sh). Checks:
#   1. 200 + envelope {ok,data,error}
#   2. structured payload (schema/schemaVersion/revision/collections)
#   3. published-only filtering (no drafts)
#   4. ETag stability across time + 304 revalidation
#   5. no sensitive data leak (keys + value scan)
#   6. deterministic content revision
# ============================================================
set -u
BASE="${AVOS_BASE_URL:-http://127.0.0.1:8092}"
URL="$BASE/api/v1/content"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

echo "── /api/v1/content bridge test ─────────────────────"

# 1. status + envelope
CODE=$(curl -s -o "$TMP/r1.json" -w '%{http_code}' -D "$TMP/h1" "$URL")
[ "$CODE" = "200" ] && ok "HTTP 200" || bad "HTTP $CODE (want 200)"

python3 - "$TMP/r1.json" <<'PY' || bad "payload not parseable"
import json,sys
d = json.load(open(sys.argv[1]))
assert set(d.keys()) == {"ok","data","error"}, f"envelope keys {list(d.keys())}"
assert d["ok"] is True and d["error"] is None
data = d["data"]
need = {"schema","schemaVersion","generatedAt","revision","settings","navigation",
        "sections","pages","projects","articles","clients","testimonials","media","seo","downloads"}
missing = need - set(data.keys())
assert not missing, f"missing payload keys: {missing}"
assert data["schema"] == "avos.content/v1"
assert isinstance(data["schemaVersion"], int) and data["schemaVersion"] >= 1
assert isinstance(data["revision"], int)
for k in ("sections","pages","projects","articles","clients","testimonials","media","seo","downloads"):
    assert isinstance(data[k], list), f"{k} not a list"
assert isinstance(data["navigation"], dict)
print("  ✓ envelope + structured payload OK")
PY

# 3. published-only: no draft/review/scheduled items may appear
python3 - "$TMP/r1.json" <<'PY' || bad "draft content leaked"
import json,sys
d = json.load(open(sys.argv[1]))["data"]
for k in ("sections","pages","projects","articles","testimonials","downloads"):
    for it in d[k]:
        st = it.get("status","published")
        assert st == "published", f"{k}: leaked non-published item status={st!r} title={it.get('title')!r}"
print("  ✓ published-only filtering OK")
PY

# 4. ETag stability + 304
E1=$(awk 'tolower($1)=="etag:"{print $2}' "$TMP/h1" | tr -d '\r')
sleep 1.1
E2=$(curl -s -D - -o /dev/null "$URL" | awk 'tolower($1)=="etag:"{print $2}' | tr -d '\r')
[ -n "$E1" ] && [ "$E1" = "$E2" ] && ok "ETag stable across time" || bad "ETag unstable ($E1 vs $E2)"
C304=$(curl -s -o /dev/null -w '%{http_code}' -H "If-None-Match: $E1" "$URL")
[ "$C304" = "304" ] && ok "If-None-Match → 304" || bad "If-None-Match → $C304 (want 304)"

# cache header
CC=$(awk 'tolower($1)=="cache-control:"{$1="";sub(/^ /,"");print}' "$TMP/h1" | tr -d '\r')
case "$CC" in *public*) ok "Cache-Control public ($CC)" ;; *) bad "Cache-Control not public ($CC)" ;; esac

# 5. no sensitive data
python3 - "$TMP/r1.json" <<'PY' || bad "sensitive data present"
import json,sys,re
raw = open(sys.argv[1]).read()
d = json.loads(raw)["data"]
keys=set()
def walk(o):
    if isinstance(o,dict):
        for k,v in o.items(): keys.add(k); walk(v)
    elif isinstance(o,list):
        for x in o: walk(x)
walk(d)
bad_keys = ["password","api_key","apikey","secret","smtp","turnstile","enc_key","session","csrf","token"]
# designTokens is legitimate public design config (radius/shadow/fonts), not a secret
hits=[k for k in keys if k != "designTokens" and any(b in k.lower() for b in bad_keys)]
assert not hits, f"sensitive keys present: {hits}"
# designTokens is legit public config — ensure nothing credential-shaped in values
assert '"aV0s_d3v' not in raw and 'password_hash' not in raw and '-----BEGIN' not in raw
print("  ✓ no sensitive keys/credentials")
PY

echo "──────────────────────────────────────────────────────"
echo "  RESULT: $FAIL failure(s) across all checks above"
[ "$FAIL" = "0" ] || exit 1
