"""Static preview server for browser QA, with the site's analytics transport stubbed."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parents[1] / 'abhijeetvarghese'


class QAHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path.split('?', 1)[0] == '/api/analytics/track':
            self.send_response(204)
            self.end_headers()
            return
        self.send_error(405, 'Method not allowed')

    def log_message(self, format, *args):
        print(format % args, flush=True)


if __name__ == '__main__':
    os.chdir(ROOT)
    ThreadingHTTPServer(('0.0.0.0', 8092), QAHandler).serve_forever()
