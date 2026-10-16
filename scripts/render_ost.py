"""Automated OST renderer for Drawing the Hours.

1. Hosts a local HTTP server serving drawing-the-hours.
2. Drives headless Edge to execute scripts/render_ost.html.
3. Renders 7 tracks to 24-bit 48 kHz stereo WAV in ost/wav/.
4. Encodes each WAV to lossless 24-bit FLAC in ost/flac/ with complete Vorbis tags.
5. Produces ost/TRACKLIST.md and ost/BANDCAMP.md for Bandcamp publication.

Usage:
    python scripts/render_ost.py
"""

import http.server
import json
import os
import re
import socketserver
import subprocess
import sys
import threading
import time
from pathlib import Path
from urllib.parse import urlparse, parse_qs

sys.stdout.reconfigure(line_buffering=True)

ROOT = Path(__file__).resolve().parent.parent
OST_DIR = ROOT / 'ost'
WAV_DIR = OST_DIR / 'wav'
FLAC_DIR = OST_DIR / 'flac'

WAV_DIR.mkdir(parents=True, exist_ok=True)
FLAC_DIR.mkdir(parents=True, exist_ok=True)

TRACK_METADATA = [
    {
        "track": 1,
        "wav": "01-drawing-the-hours-title-theme.wav",
        "title": "Drawing the Hours (Title Theme)",
        "flac": "01 Xyh Tamura - Drawing the Hours (Title Theme).flac",
        "tuning": "Harmonics 8-16 / G root (88 bpm)",
        "meter": "5/8 clockwork percussion over 4/4 melodic motif",
        "desc": "The signature Study Desk found-object clockwork groove (pocket watch escapement ticks, cedar pencil taps, fingernail micro-clicks, paper snips) cycling alongside the 16-bar melodic motif on LindonsXylophone, music box, and soft answering brass."
    },
    {
        "track": 2,
        "wav": "02-hour-i-dawn-morning-verge.wav",
        "title": "Hour I: Dawn (Morning Verge)",
        "flac": "02 Xyh Tamura - Hour I Dawn (Morning Verge).flac",
        "tuning": "5-EDO pentatonic scale / G3 root (72 bpm)",
        "meter": "4/4 quiet morning meter",
        "desc": "A continuous progression across Dawn's six authored stage variations. Plucked damped strings and palm-muted piano with resonant chime replies and subtle pencil taps."
    },
    {
        "track": 3,
        "wav": "03-hour-ii-noon-atrium-sun.wav",
        "title": "Hour II: Noon (Atrium Sun)",
        "flac": "03 Xyh Tamura - Hour II Noon (Atrium Sun).flac",
        "tuning": "19-EDO pentatonic / C4 root (96 bpm)",
        "meter": "4/4 sunlit atrium pulse",
        "desc": "Toy piano and chime bells leaping in bright diatonic harmonies, paired with the glass bead and acrylic marble rhythm kit."
    },
    {
        "track": 4,
        "wav": "04-hour-iii-dusk-the-garden-cloister.wav",
        "title": "Hour III: Dusk (The Garden Cloister)",
        "flac": "04 Xyh Tamura - Hour III Dusk (The Garden Cloister).flac",
        "tuning": "5-EDO Balinese tuning / A3 root (64 bpm)",
        "meter": "4/4 meditative evening pulse",
        "desc": "Resonant gamelan gong strikes (bonang) and sustained bowed bass drones, interwoven with tactile matchbox friction and fingernail clicks."
    },
    {
        "track": 5,
        "wav": "05-hour-iv-midnight-window-planter.wav",
        "title": "Hour IV: Midnight (Window Planter)",
        "flac": "05 Xyh Tamura - Hour IV Midnight (Window Planter).flac",
        "tuning": "Bohlen-Pierce 13-step tritave / F3 root (56 bpm)",
        "meter": "4/4 nocturnal spacious time",
        "desc": "Warm detuned triangle pads, bassoon hollow reed, and saxhorn soft brass alternating in triadic cycles, punctuated by distant cavernous tom strikes and quiet watch ticks."
    },
    {
        "track": 6,
        "wav": "06-the-slowing-bloom-poppy-and-ylang-ylang.wav",
        "title": "The Slowing Bloom (Poppy & Ylang-Ylang)",
        "flac": "06 Xyh Tamura - The Slowing Bloom (Poppy & Ylang-Ylang).flac",
        "tuning": "Half-tempo (0.55x), pitch-shifted -100 cents",
        "meter": "Drowsy detuned time",
        "desc": "A meditative, pitch-dropped study of Noon and Midnight. Toy keys and reeds elongated into a dreamlike, hypnotic slumber."
    },
    {
        "track": 7,
        "wav": "07-meadow-cycle-daylight-to-midnight-suite.wav",
        "title": "Meadow Cycle (Daylight to Midnight Suite)",
        "flac": "07 Xyh Tamura - Meadow Cycle (Daylight to Midnight Suite).flac",
        "tuning": "Continuous microtonal cycle (Dawn -> Noon -> Slow Bloom -> Dusk -> Midnight -> Title)",
        "meter": "Through-composed journey",
        "desc": "A seamless 7-minute suite traveling through the four hours of the meadow and returning to the Study Desk clockwork coda."
    }
]

done_event = threading.Event()
server_error = None

class OSTRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        global server_error
        url = urlparse(self.path)
        if url.path == '/api/save_wav':
            params = parse_qs(url.query)
            filename = params.get('filename', ['output.wav'])[0]
            # Sanitize filename
            filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
            length = int(self.headers.get('Content-Length', 0))
            data = self.rfile.read(length)
            dest = WAV_DIR / filename
            dest.write_bytes(data)
            print(f"[Server] Saved {dest.name} ({len(data):,} bytes)")
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
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
            print("[Server] Render completed signal received.")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
            done_event.set()
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Silence default access logging to keep console clean
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


def run_render():
    edge_bin = find_edge_path()
    if not edge_bin:
        raise SystemExit("Error: Microsoft Edge / Chrome binary not found.")

    port = 8792
    httpd = socketserver.TCPServer(('127.0.0.1', port), OSTRequestHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    print(f"HTTP Server started on http://127.0.0.1:{port}/")

    render_url = f"http://127.0.0.1:{port}/scripts/render_ost.html"
    print(f"Launching headless browser: {edge_bin}")

    edge_proc = subprocess.Popen([
        edge_bin,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--autoplay-policy=no-user-gesture-required',
        render_url
    ])

    print("Rendering audio in browser... (this takes roughly 1-3 minutes)")
    finished = done_event.wait(timeout=600)
    edge_proc.terminate()
    try:
        edge_proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        edge_proc.kill()
    httpd.shutdown()

    if not finished:
        raise SystemExit("Error: Audio render timed out.")
    if server_error:
        raise SystemExit(f"Render failed: {server_error}")

    print("\n--- All WAV tracks rendered successfully! ---")


def encode_flac():
    print("\n--- Encoding Lossless 24-bit FLACs with Full Metadata ---")
    track_results = []

    for item in TRACK_METADATA:
        wav_path = WAV_DIR / item["wav"]
        flac_path = FLAC_DIR / item["flac"]
        if not wav_path.is_file():
            print(f"Warning: {wav_path} not found, skipping FLAC encode.")
            continue

        print(f"Encoding {item['flac']}...")
        cmd = [
            'ffmpeg', '-y',
            '-i', str(wav_path),
            '-c:a', 'flac',
            '-sample_fmt', 's32',
            '-compression_level', '12',
            '-metadata', f"title={item['title']}",
            '-metadata', "artist=Xyh Tamura",
            '-metadata', "album=Drawing the Hours (Original Soundtrack)",
            '-metadata', "album_artist=Xyh Tamura",
            '-metadata', f"track={item['track']}/7",
            '-metadata', "date=2026",
            '-metadata', "genre=Chamber Ambient / Video Game OST",
            '-metadata', f"comment={item['desc']}",
            str(flac_path)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"Error encoding {item['flac']}:\n{res.stderr}")
            continue

        # Get audio duration
        probe_cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(flac_path)]
        duration_sec = 0.0
        try:
            p = subprocess.run(probe_cmd, capture_output=True, text=True)
            duration_sec = float(p.stdout.strip())
        except Exception:
            pass

        mins = int(duration_sec // 60)
        secs = int(duration_sec % 60)
        time_str = f"{mins}:{secs:02d}"

        flac_size_mb = flac_path.stat().st_size / (1024 * 1024)
        wav_size_mb = wav_path.stat().st_size / (1024 * 1024)

        track_results.append({
            **item,
            "duration": time_str,
            "duration_sec": duration_sec,
            "flac_size_mb": flac_size_mb,
            "wav_size_mb": wav_size_mb,
        })
        print(f"✓ {item['flac']} ({time_str}, {flac_size_mb:.2f} MB)")

    write_docs(track_results)


def write_docs(tracks):
    total_sec = sum(t.get("duration_sec", 0) for t in tracks)
    total_mins = int(total_sec // 60)
    total_secs = int(total_sec % 60)
    total_time = f"{total_mins}:{total_secs:02d}"
    total_flac_mb = sum(t.get("flac_size_mb", 0) for t in tracks)

    # 1. TRACKLIST.md
    tracklist_md = f"""# Drawing the Hours (Original Soundtrack)
**Artist**: Xyh Tamura  
**Release**: 2026  
**Format**: 24-bit 48 kHz Lossless Stereo FLAC / WAV  
**Total Running Time**: {total_time} ({total_flac_mb:.1f} MB FLAC)  
**Tuning Systems**: 5-EDO (Dawn & Dusk), 19-EDO (Noon), Bohlen-Pierce (Midnight), Harmonics 8-16 (Title)

---

## Tracklist

| # | Title | Duration | Tuning / Meter | Key Instrumentation |
|---|---|---|---|---|
"""
    for t in tracks:
        tracklist_md += f"| {t['track']:02d} | **{t['title']}** | {t['duration']} | {t['tuning']} | {t['meter']} |\n"

    tracklist_md += "\n---\n\n## Track Details\n\n"
    for t in tracks:
        tracklist_md += f"### {t['track']:02d}. {t['title']} ({t['duration']})\n"
        tracklist_md += f"- **Tuning / Meter**: {t['tuning']} · {t['meter']}\n"
        tracklist_md += f"- **Description**: {t['desc']}\n"
        tracklist_md += f"- **Files**: `{t['flac']}` ({t['flac_size_mb']:.2f} MB) · `{t['wav']}` ({t['wav_size_mb']:.1f} MB)\n\n"

    (OST_DIR / "TRACKLIST.md").write_text(tracklist_md, encoding='utf-8')

    # 2. BANDCAMP.md (Complete album publication package)
    bandcamp_md = f"""# Bandcamp Release Package — Drawing the Hours OST

## Album Overview
- **Album Title**: Drawing the Hours (Original Soundtrack)
- **Artist**: Xyh Tamura
- **Release Date**: November 2026
- **Pricing Recommendation**: Name Your Price (or $5–$7 USD / £4–£6 GBP)
- **Tags**: `ambient`, `soundtrack`, `microtonal`, `chamber`, `video game music`, `philippines`, `contemporary classical`, `acoustic`, `percussion`
- **Audio Master**: 24-bit 48 kHz Lossless Stereo (`ost/flac/` and `ost/wav/`)
- **Total Duration**: {total_time} across 7 tracks

---

## Album Description (Bandcamp "About This Album")

The official soundtrack to **Drawing the Hours**, a gesture game and contemplative meadow study by Xyh Tamura.

Recorded through a hybrid palette of microtonal chamber instruments and delicate found-object percussion:
- **Title Theme**: Pocket watch escapement ticks, cedar pencil wood taps, fingernail micro-clicks, and paper snips in an independent 5/8 Study Desk clockwork groove drifting beneath an 88 bpm 16-bar motif.
- **Hour I: Dawn**: Damped strings and palm-mute piano drifting through a 5-EDO pentatonic morning landscape.
- **Hour II: Noon**: A sunlit atrium of toy piano keys, glass beads, and acrylic marble drops.
- **Hour III: Dusk**: Deep resonant gamelan gong strikes (bonang) and sustained bowed bass drones on 5-EDO Balinese tuning.
- **Hour IV: Midnight**: Alternating pad, bassoon hollow reed, and saxhorn soft brass sounding over a 13-step Bohlen-Pierce tritave triad, punctuated by distant cavernous toms and night stillness.
- **The Slowing Bloom**: A drowsy, half-speed, pitch-dropped study capturing the calming effect of ylang-ylang and meadow poppies.
- **Meadow Cycle**: A seamless through-composed 7-minute suite traveling from the first light of dawn through midnight.

All tracks rendered in pristine 24-bit 48 kHz stereo with -1.0 dBFS true-peak mastering headroom.

---

## Tracklist & Track Descriptions

"""
    for t in tracks:
        bandcamp_md += f"### {t['track']:02d}. {t['title']} [{t['duration']}]\n"
        bandcamp_md += f"**Track Notes**:\n{t['desc']}\n\n"

    bandcamp_md += """---

## Credits
- **Music & Sound Design**: Xyh Tamura
- **Arrangements & Engines**: Antigravity & Codex
- **Instrumentation**: Palm Mute Piano, Rattly and Raw Toy Piano, Gongster's Paradise, Crocus Liminal Reeds, Blue Street Brass, Channel Robot The Modernist Xylophone, and 8DIO Mini Click Core found objects.
- **Tuning Systems**: 5-EDO, 19-EDO, 24-tone Bohlen-Pierce, and Harmonics 8-16 (Scala scale library).
"""
    (OST_DIR / "BANDCAMP.md").write_text(bandcamp_md, encoding='utf-8')
    print(f"\n✓ Generated {OST_DIR / 'TRACKLIST.md'}")
    print(f"✓ Generated {OST_DIR / 'BANDCAMP.md'}")


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

    start_time = time.time()
    run_render()
    encode_flac()
    elapsed = time.time() - start_time
    print(f"\n🎉 OST Production Finished in {elapsed:.1f} seconds!")
    print(f"FLAC files ready in: {FLAC_DIR}")
    print(f"WAV files ready in:  {WAV_DIR}")


if __name__ == '__main__':
    main()
