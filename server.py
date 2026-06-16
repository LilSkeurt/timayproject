import os
import functools
import http.server
import socketserver

ROOT = "/Users/tim/Documents/Site web"
PORT = 8123

os.chdir(ROOT)
Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"Serving {ROOT} at http://127.0.0.1:{PORT}")
    httpd.serve_forever()
