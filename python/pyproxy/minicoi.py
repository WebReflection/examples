#!/usr/bin/env python3

from http.server import SimpleHTTPRequestHandler as NativeSimpleHTTPRequestHandler


class SimpleHTTPRequestHandler(NativeSimpleHTTPRequestHandler):

    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        super().end_headers()


# also usable directly as CLI program
if __name__ == '__main__':
    import socketserver
    import sys

    PORT = 8080

    for i in range(0, len(sys.argv)):
        arg = sys.argv[i]
        if arg in ('-h', '--help'):
            print("""
\x1b[7m\x1b[1m  minicoi  \x1b[0m

  A SimpleHTTPRequestHandler with COOP, COEP, and CORP headers

  \x1b[1moptions\x1b[0m

    -h | --help   \x1b[2mthis help\x1b[0m
    -p | --port   \x1b[2mchange default 8080 port:\x1b[0m
                    \x1b[2m$ ./minicoi.py -p 3000\x1b[0m
                    \x1b[2m$ ./minicoi.py --port 8000\x1b[0m
""")
            sys.exit(0)
        elif arg in ('-p', '--port'):
            PORT = int(sys.argv[i + 1])
        elif arg.startswith('port='):
            PORT = int(arg.split('=')[1])


    print(f'Starting: http://localhost:{PORT}')

    try:
        socketserver.TCPServer.allow_reuse_address = True
        mini_coi = socketserver.TCPServer(('', PORT), SimpleHTTPRequestHandler)
        mini_coi.serve_forever()
    except KeyboardInterrupt:
        print('Stoped by "Ctrl+C"')
    finally:
        print('Closing')
        mini_coi.server_close()
