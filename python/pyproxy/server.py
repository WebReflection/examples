from minicoi import SimpleHTTPRequestHandler
from proxy.local import reflect
from json import dumps, loads
import socketserver
import sys

class ProxyServerRequestHandler(SimpleHTTPRequestHandler):

    def do_GET(self):
        if self.path == '/':
            self.path = './index.html'

        super().do_GET()

    def do_POST(self):
        if self.path == '/reflect':
            data = self.rfile.read(int(self.headers['Content-Length']))
            data = loads(data)
            result = reflect(*data)
            print("\x1b[2mrequested\x1b[0m\x1b[1m", data, "\x1b[0m\x1b[2mreturning\x1b[0m\x1b[1m", result, "\x1b[0m")
            json = dumps(result, separators=(',', ':'))
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(json)))
            self.end_headers()
            self.wfile.write(json.encode('utf-8'))
        else:
            super().do_POST()


PORT = '8080'

for i in range(0, len(sys.argv)):
    arg = sys.argv[i]
    if arg in ('-p', '--port'):
        PORT = sys.argv[i + 1]
    elif arg.startswith('port='):
        _, PORT, = arg.split('=')


print(f'Starting: http://localhost:{PORT}')


try:
    socketserver.TCPServer.allow_reuse_address = True
    mini_coi = socketserver.TCPServer(('', int(PORT)), ProxyServerRequestHandler)
    mini_coi.serve_forever()
except KeyboardInterrupt:
    print('Stoped by "Ctrl+C"')
finally:
    print('Closing')
    mini_coi.server_close()
