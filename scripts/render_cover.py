"""Automated Album Cover Generator for Drawing the Hours OST.

Renders 3000 x 3000 high-resolution album covers derived from the game's title screen:
1. ost/cover.png & ost/cover.jpg: Full album cover with delicate typography (minus UI buttons)
2. ost/cover-clean.png & ost/cover-clean.jpg: Pure title screen art with handwritten title and zero secondary text

Usage:
    python scripts/render_cover.py
"""

import http.server
import os
import re
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
OST_DIR = ROOT / 'ost'
OST_DIR.mkdir(parents=True, exist_ok=True)

done_event = threading.Event()
server_error = None


class CoverRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        global server_error
        url = urlparse(self.path)
        if url.path == '/api/save_cover':
            params = parse_qs(url.query)
            filename = params.get('name', ['cover.png'])[0]
            filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
            length = int(self.headers.get('Content-Length', 0))
            data = self.rfile.read(length)
            dest = OST_DIR / filename
            dest.write_bytes(data)
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
            print("[Server] Cover generation completed signal received.")
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

    port = 8793
    httpd = socketserver.TCPServer(('127.0.0.1', port), CoverRequestHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    print(f"HTTP Server started on http://127.0.0.1:{port}/")

    render_url = f"http://127.0.0.1:{port}/scripts/render_cover.html"
    print(f"Launching headless browser: {edge_bin}")

    edge_proc = subprocess.Popen([
        edge_bin,
        '--headless=new',
        '--disable-gpu',
        '--window-size=1200,900',
        render_url
    ])

    print("Rendering 3000x3000px album covers... (this takes roughly 5-15 seconds)")
    finished = done_event.wait(timeout=120)
    edge_proc.terminate()
    try:
        edge_proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        edge_proc.kill()
    httpd.shutdown()

    if not finished:
        raise SystemExit("Error: Cover generation timed out.")
    if server_error:
        raise SystemExit(f"Render failed: {server_error}")

    # Convert PNGs to high-quality JPEGs for Bandcamp upload
    print("\nEncoding high-quality 95% JPEG masters for Bandcamp...")
    for stem in ['cover', 'cover-clean']:
        png_path = OST_DIR / f"{stem}.png"
        jpg_path = OST_DIR / f"{stem}.jpg"
        if png_path.is_file():
            with Image.open(png_path) as img:
                rgb = img.convert('RGB')
                rgb.save(jpg_path, 'JPEG', quality=95, subsampling=0)
            jpg_size_mb = jpg_path.stat().st_size / (1024 * 1024)
            png_size_mb = png_path.stat().st_size / (1024 * 1024)
            print(f"[OK] {jpg_path.name} ({jpg_size_mb:.2f} MB, 3000x3000 RGB) | PNG: {png_size_mb:.2f} MB")

    print("\n[SUCCESS] Album Covers Generated Successfully in ost/!")


if __name__ == '__main__':
    run()
