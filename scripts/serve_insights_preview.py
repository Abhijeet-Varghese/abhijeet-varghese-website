"""Static preview server with a harmless local analytics acknowledgement.
Production analytics remains untouched; this only lets local browser QA exercise the existing POST hook."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os

class PreviewHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        length=int(self.headers.get('Content-Length','0'))
        self.rfile.read(length)
        if self.path.split('?',1)[0]=='/api/analytics/track':
            self.send_response(204);self.end_headers()
        else:
            self.send_error(404)
    def log_message(self, format, *args):
        print(format % args)

if __name__=='__main__':
    os.chdir(Path(__file__).resolve().parents[1]/'abhijeetvarghese')
    ThreadingHTTPServer(('0.0.0.0',8092),PreviewHandler).serve_forever()
