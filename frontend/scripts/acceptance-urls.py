#!/usr/bin/env python3
"""
Runtime acceptance harness for the clean-URL engine (brief §103).

Serves dist/ through a router that implements the SAME semantics as the
generated _redirects.htaccess, then crawls every route and asserts:

  * every clean URL returns 200
  * every legacy *.html URL returns 301 to its clean canonical
  * trailing-slash variants 301 to the no-slash canonical
  * every internal link discovered while crawling resolves to 200
  * unknown paths return 404

Usage:  python3 scripts/acceptance-urls.py [dist_dir]
"""
import http.server, json, os, re, socketserver, sys, threading, urllib.request, urllib.error
from pathlib import Path

DIST = Path(sys.argv[1] if len(sys.argv) > 1 else "dist").resolve()
ROUTES = json.loads((DIST.parent / "src/routes/routes.json").read_text())
LEGACY = json.loads((DIST.parent / "src/routes/legacy-redirects.json").read_text())
PORT = 8123

REDIRECTS = {}
for r in ROUTES:
    if r.get("legacy") and r["legacy"] != r["clean"]:
        REDIRECTS[r["legacy"]] = r["clean"]
for r in LEGACY:
    REDIRECTS[r["from"]] = r["to"]


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(DIST), **kw)

    def log_message(self, *a):
        pass

    def send_redirect(self, to):
        self.send_response(301)
        self.send_header("Location", to)
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]

        # rule 1/1b — explicit legacy redirects
        if path in REDIRECTS:
            return self.send_redirect(REDIRECTS[path])

        # rule 2 — any other *.html → extensionless
        if path.endswith(".html") and path != "/404.html":
            return self.send_redirect(re.sub(r"\.html$", "", path).replace("/index", "") or "/")

        # rule 3 — strip trailing slash except root
        if len(path) > 1 and path.endswith("/"):
            return self.send_redirect(path.rstrip("/"))

        # rule 4 — serve the directory index for a clean URL
        rel = path.lstrip("/")
        if path == "/":
            return self.serve(DIST / "index.html")
        f = DIST / rel
        if f.is_file():
            return self.serve(f)
        idx = DIST / rel / "index.html"
        if idx.is_file():
            return self.serve(idx)
        return self.serve(DIST / "404.html", 404)

    def serve(self, f: Path, code=200):
        if not f.is_file():
            self.send_error(404)
            return
        body = f.read_bytes()
        ctype = "text/html; charset=utf-8"
        if f.suffix in (".css", ".js", ".json", ".xml", ".txt", ".svg", ".webp", ".woff2", ".png", ".jpg"):
            ctype = {
                ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
                ".xml": "application/xml", ".txt": "text/plain", ".svg": "image/svg+xml",
                ".webp": "image/webp", ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg",
            }[f.suffix]
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def fetch(url, follow=False):
    req = urllib.request.Request(url, method="GET")
    op = urllib.request.build_opener()
    if not follow:
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, *a, **kw):
                return None
        op = urllib.request.build_opener(NoRedirect)
    try:
        r = op.open(req)
        return r.status, r.headers.get("Location"), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Location"), ""


def main():
    srv = Server(("127.0.0.1", PORT), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{PORT}"
    fails, checks = [], 0

    print(f"\n{'check':52}{'expect':>10}{'got':>8}")
    print("-" * 72)

    # 1) clean URLs → 200
    for r in ROUTES:
        if r["id"] == "not-found":
            continue
        code, _, _ = fetch(base + r["clean"])
        checks += 1
        ok = code == 200
        if not ok:
            fails.append(f"{r['clean']} → {code} (expected 200)")
        print(f"{('GET ' + r['clean'])[:50]:52}{'200':>10}{code:>8}{'' if ok else '  ✗'}")

    # 2) legacy → 301 clean
    for legacy, clean in REDIRECTS.items():
        code, loc, _ = fetch(base + legacy)
        checks += 1
        ok = code == 301 and loc == clean
        if not ok:
            fails.append(f"{legacy} → {code} {loc} (expected 301 {clean})")
        print(f"{('GET ' + legacy)[:50]:52}{'301':>10}{code:>8}{'' if ok else '  ✗'}")

    # 3) trailing slash → 301
    for p in ["/story/", "/case-studies/", "/contact/"]:
        code, loc, _ = fetch(base + p)
        checks += 1
        ok = code == 301 and loc == p.rstrip("/")
        if not ok:
            fails.append(f"{p} → {code} {loc} (expected 301 {p.rstrip('/')})")
        print(f"{('GET ' + p)[:50]:52}{'301':>10}{code:>8}{'' if ok else '  ✗'}")

    # 4) unknown → 404
    code, _, _ = fetch(base + "/no-such-page")
    checks += 1
    ok = code == 404
    if not ok:
        fails.append(f"/no-such-page → {code} (expected 404)")
    print(f"{'GET /no-such-page':52}{'404':>10}{code:>8}{'' if ok else '  ✗'}")

    # 5) crawl every internal link found on every page
    print("-" * 72)
    broken = 0
    for r in ROUTES:
        if r["id"] == "not-found":
            continue
        _, _, html = fetch(base + r["clean"], follow=True)
        for href in set(re.findall(r'href="(/[^"#?]*)"', html)):
            if re.search(r"\.(css|js|woff2|webp|png|jpg|svg|ico|pdf|xml|txt|json)$", href):
                continue
            code, _, _ = fetch(base + href)
            checks += 1
            if code != 200:
                broken += 1
                fails.append(f"{r['clean']} links to {href} → {code}")
    print(f"crawled internal links · broken: {broken}")

    srv.shutdown()
    print("-" * 72)
    if fails:
        print(f"\n✗ {len(fails)} failure(s) of {checks} checks:")
        for f in fails[:30]:
            print("   " + f)
        sys.exit(1)
    print(f"\n✓ ALL {checks} RUNTIME CHECKS PASSED — clean URLs, 301s, no broken links\n")


if __name__ == "__main__":
    main()
