#!/usr/bin/env python3
import http.server
import os
import mimetypes
import json
import urllib.parse

PORT = 8000
SITE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "avos-php/public_html/site"))
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "abhijeetvarghese"))

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/avif", ".avif")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("application/json", ".json")

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SITE_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b'{"ok":true,"data":{}}')
            return
        self.send_response(404)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = urllib.parse.unquote(parsed.path)

        if path.startswith("/api/"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b'{"ok":true,"data":{}}')
            return

        # Resolve candidate files
        rel = path.lstrip("/")
        if not rel:
            rel = "index.html"

        candidates = [
            os.path.join(SITE_DIR, rel),
            os.path.join(SITE_DIR, rel, "index.html"),
            os.path.join(SITE_DIR, rel + ".html"),
            os.path.join(FRONTEND_DIR, rel),
            os.path.join(FRONTEND_DIR, rel, "index.html"),
            os.path.join(FRONTEND_DIR, rel + ".html"),
        ]

        target_file = None
        for c in candidates:
            if os.path.isfile(c):
                target_file = c
                break

        if target_file and os.path.isfile(target_file):
            ctype, _ = mimetypes.guess_type(target_file)
            if not ctype:
                ctype = "application/octet-stream"
            
            try:
                with open(target_file, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(len(content)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Cache-Control", "no-cache")
                self.end_headers()
                self.wfile.write(content)
                return
            except Exception as e:
                self.send_error(500, str(e))
                return

        # 404 fallback
        not_found = os.path.join(SITE_DIR, "404.html")
        if os.path.isfile(not_found):
            with open(not_found, "rb") as f:
                content = f.read()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
            return

        self.send_error(404, "File not found")

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

if __name__ == "__main__":
    server_address = ("0.0.0.0", PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, CustomHandler)
    print(f"Server listening on http://0.0.0.0:{PORT} (serving {SITE_DIR})")
    httpd.serve_forever()
