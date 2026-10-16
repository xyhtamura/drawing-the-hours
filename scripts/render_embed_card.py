"""Automated Embed Card Generator for Drawing the Hours.

Renders high-resolution 1200 x 630 Open Graph & Twitter Social Embed Cards:
1. drawing-the-hours-embed.png (lossless PNG)
2. drawing-the-hours-embed.jpg (high-quality web-optimized JPEG)

Usage:
    python scripts/render_embed_card.py
"""

import http.server
import os
import re
import shutil
import socketserver
import subprocess
import sys
import threading
import time
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from PIL import Image

try:
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = ROOT / 'assets'
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

done_event = threading.Event()
server_error = None
saved_card_path = None


class CardRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        global server_error, saved_card_path
        url = urlparse(self.path)
        if url.path == '/api/save_card':
            params = parse_qs(url.query)
            filename = params.get('name', ['drawing-the-hours-embed.png'])[0]
            filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
            length = int(self.headers.get('Content-Length', 0))
            data = self.rfile.read(length)
            dest = ROOT / filename
            dest.write_bytes(data)
            saved_card_path = dest
            print(f"[Server] Saved {dest.name} ({len(data):,} bytes)")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        elif url.path == '/api/progress':
            length = int(self.headers.get('Content-Length', 0))
            msg = self.rfile.read(length).decode('utf-8', errors='replace')
            print(f"[Browser] {msg.strip()}")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        elif url.path == '/api/error':
            length = int(self.headers.get('Content-Length', 0))
            server_error = self.rfile.read(length).decode('utf-8', errors='replace')
            print(f"[Browser ERROR] {server_error}")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
            done_event.set()
        elif url.path == '/api/done':
            print("[Server] Embed card generation completed signal received.")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
            done_event.set()
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass


def find_edge_path():
    candidates = [
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
    ]
    for p in candidates:
        if p.is_file():
            return str(p)
    return None


def run():
    edge_bin = find_edge_path()
    if not edge_bin:
        raise SystemExit("Error: Edge / Chrome browser binary not found.")

    with socketserver.TCPServer(("127.0.0.1", 0), CardRequestHandler) as httpd:
        port = httpd.server_address[1]
        server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        server_thread.start()
        print(f"[Server] Serving {ROOT} at http://127.0.0.1:{port}/")

        url = f"http://127.0.0.1:{port}/scripts/render_embed_card.html"
        cmd = [
            edge_bin,
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--virtual-time-budget=12000",
            f"--window-size=1400,900",
            url
        ]

        print(f"[Browser] Launching headless browser...")
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        try:
            finished = done_event.wait(timeout=30)
            if not finished:
                print("[Timeout] Embed card generation timed out.")
            if server_error:
                print(f"[Error] Failed: {server_error}")
        finally:
            try:
                proc.terminate()
                proc.wait(timeout=2)
            except Exception:
                pass
            httpd.shutdown()

    if saved_card_path and saved_card_path.is_file():
        print(f"\nProcessing rendered embed card...")
        # 1. Verify and create JPEG version
        im = Image.open(saved_card_path)
        print(f"Loaded image: {im.size} mode={im.mode}")

        # RGB for JPEG
        if im.mode in ('RGBA', 'LA'):
            bg = Image.new('RGB', im.size, (244, 239, 220)) # soft natural paper tone
            bg.paste(im, mask=im.split()[-1])
            rgb_im = bg
        else:
            rgb_im = im.convert('RGB')

        jpg_path = saved_card_path.with_suffix('.jpg')
        rgb_im.save(jpg_path, 'JPEG', quality=92, optimize=True)
        print(f"Saved JPEG: {jpg_path.name} ({jpg_path.stat().st_size:,} bytes)")

        # 2. Copy to assets/ directory
        assets_png = ASSETS_DIR / saved_card_path.name
        assets_jpg = ASSETS_DIR / jpg_path.name
        shutil.copy2(saved_card_path, assets_png)
        shutil.copy2(jpg_path, assets_jpg)
        print(f"Copied to assets/: {assets_png.name}, {assets_jpg.name}")

        # 3. Check xyhtamura.github.io/img/works/
        portfolio_works = ROOT.parent / 'xyhtamura.github.io' / 'img' / 'works'
        if portfolio_works.is_dir():
            dest_port_png = portfolio_works / 'drawing-the-hours-embed.png'
            dest_port_jpg = portfolio_works / 'drawing-the-hours-embed.jpg'
            shutil.copy2(saved_card_path, dest_port_png)
            shutil.copy2(jpg_path, dest_port_jpg)
            print(f"Copied to portfolio works: {dest_port_png.name}")

        print("\nAll embed card assets generated successfully!")
    else:
        print("[Error] Output embed card file was not created.")
        sys.exit(1)


if __name__ == '__main__':
    run()
