"""Export the SOMEWAREZ kiosk build as a self-contained folder and zip.

Copies the files the kiosk build loads into dist/somewarez/, sets the build flag
on so index.html is the kiosk with no ?somewarez in the address, removes the
link-preview tags from index.html (they name the live site and do nothing
offline), and writes
BUILD.txt with the source commit and a hash of every file. The same folder is
zipped beside it as dist/drawing-the-hours-somewarez-<commit>.zip.

Between Banks, the tests, the notes, and the texture masters are left out.

The export stops, writing nothing, if:
  - the working tree has uncommitted changes (--allow-dirty overrides, and BUILD.txt says so);
  - a copied text file names an http(s) address other than the multicart URL,
    because the folder has to run with no network;
  - a file a script, stylesheet, or page refers to is missing from the folder.

The folder has to be served over HTTP. Opened by double-click (file://) the
browser refuses to load the scripts. README.txt in the folder says how.

Usage:
    python scripts/export_somewarez.py
    python scripts/export_somewarez.py --out dist/somewarez --allow-dirty
"""

import argparse
import hashlib
import re
import shutil
import subprocess
import sys
import zipfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INCLUDE = ['index.html', 'style.css', 'ui.css', 'favicon.svg', 'manifest.webmanifest', 'offline-sw.js', 'src', 'assets', 'somewarez']
# In somewarez/: the forwarding page and the repository README have no use in the export.
SKIP = {'somewarez/index.html', 'somewarez/README.md'}
TEXT = {'.html', '.css', '.js', '.svg'}  # licence texts name their own addresses and are not scanned

README = """Drawing the Hours, SOMEWAREZ kiosk build
Xyh Tamura. Exported {today} from commit {commit}{dirty}.

This folder is the whole work. It needs no network once it is being served.

ANDROID: ONE-TIME INSTALLATION

In Chrome, open the published kiosk address while connected to the internet.
Wait for Offline ready, then tap Install game or choose Install app / Add to
Home screen in Chrome's menu. Afterwards open the home-screen icon. Test it in
airplane mode before the exhibition. This installs the synthesized-audio build;
recorded local audition samples are not included in the offline cache.
The installation files must first be hosted on HTTPS (or localhost for testing).
A plain LAN HTTP address cannot install the offline app.

HOW TO RUN THE FOLDER

The folder has to be served over HTTP. Opening index.html by double-click does
not work: browsers refuse to load its scripts from a file:// address.

On a computer with Python:

    cd <this folder>
    python -m http.server 8080

then open http://localhost:8080/ in the browser, or http://<computer's address>:8080/
from a tablet on the same network. Any static web server works the same way, and
so does copying the folder to a web host.

WHAT IT DOES

Nothing is saved to the device. Three controls at the foot of the field are Main
menu, Level card, and Reset. Nothing is drawn outside the field. Reset returns to the title screen and clears progress, scores, and
settings. Left alone for 90 seconds, the page resets itself. Left alone on the
title screen for 20 seconds, it runs a loop until someone touches the screen:
the game playing itself, clips of the other four works on the multicart, a card
with a QR code for the multicart, the title.

To try other timings, add them to the address in seconds, for example
http://localhost:8080/?idle=60&title=10&demo=30&ad=12

The QR card needs no network on this device. The phone that scans it does.

BUILD.txt lists every file with its SHA-256.
"""


def git(*args):
    return subprocess.run(['git', '-C', str(ROOT), *args], capture_output=True, text=True, check=True).stdout.strip()


def references(path, text):
    """Relative files a page, stylesheet, or module names."""
    found = set()
    if path.suffix == '.js':
        found.update(re.findall(r"""(?:from|import\()\s*['"](\.[^'"]+)['"]""", text))
        found.update(m for m in re.findall(r"""new URL\(\s*['"`](\.[^'"`]+)['"`]\s*,\s*import\.meta\.url""", text) if '${' not in m)
    elif path.suffix == '.css':
        found.update(m for m in re.findall(r"""url\(\s*['"]?([^'")]+)['"]?\s*\)""", text) if not m.startswith(('data:', '#')))
    elif path.suffix == '.html':
        found.update(m for m in re.findall(r"""(?:href|src)\s*=\s*"([^"#]+)\"""", text) if not re.match(r'[a-z]+:', m))
        found.update(re.findall(r"""(?:from|import\()\s*['"](\.[^'"]+)['"]""", text))
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--out', default='dist/somewarez', help='folder to write, relative to the project')
    parser.add_argument('--allow-dirty', action='store_true', help='export with uncommitted changes')
    parser.add_argument('--include-local-audio', action='store_true', help='include the gitignored audition bank for local use')
    args = parser.parse_args()
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

    subprocess.run(['python', str(ROOT / 'scripts/build_offline.py'), '--check'], check=True)
    dirty = bool(git('status', '--porcelain'))
    if dirty and not args.allow_dirty:
        raise SystemExit('Uncommitted changes. Commit them, or pass --allow-dirty.')
    commit = git('rev-parse', '--short', 'HEAD')
    config = (ROOT / 'somewarez' / 'config.js').read_text(encoding='utf-8')
    multicart = re.search(r"MULTICART_URL\s*=\s*'([^']+)'", config).group(1)

    files = {}
    for entry in INCLUDE:
        source = ROOT / entry
        for path in ([source] if source.is_file() else sorted(p for p in source.rglob('*') if p.is_file())):
            rel = path.relative_to(ROOT).as_posix()
            if rel.startswith('assets/audio-local/') and not args.include_local_audio:
                continue
            if rel in SKIP or path.name in ('Thumbs.db', '.DS_Store'):
                continue
            files[rel] = path.read_bytes()

    # The exported index.html is the kiosk without a query flag.
    build = files['src/build.js'].decode('utf-8')
    flag = re.compile(r"export const KIOSK = \(\(\) => \{.*?\}\)\(\);", re.S)
    if len(flag.findall(build)) != 1:
        raise SystemExit('src/build.js no longer holds the KIOSK flag in the form this script rewrites.')
    files['src/build.js'] = flag.sub('export const KIOSK = true; // set by scripts/export_somewarez.py', build).encode('utf-8')

    # Link previews (Open Graph, Twitter/X) name the live site. They only matter when
    # a link to it is shared, so the copy drops them; any other live address still stops the export.
    page = files['index.html'].decode('utf-8')
    preview = re.compile(r'^[ \t]*(?:<!--\s*(?:Open Graph|Twitter)[^>]*-->|<meta\s+(?:property="og:|name="twitter:)[^>]*>)[ \t]*\r?\n', re.M)
    page, removed = preview.subn('', page)
    files['index.html'] = page.encode('utf-8')
    print(f'index.html: removed {removed} link-preview lines')

    problems = []
    for rel, data in files.items():
        path = Path(rel)
        if path.suffix not in TEXT:
            continue
        text = data.decode('utf-8')
        for url in re.findall(r"""https?://[^\s'"<>)]+""", text):
            if not url.startswith(('http://www.w3.org/', multicart)):
                problems.append(f'{rel} names {url}')
        for ref in references(path, text):
            target = (path.parent / ref.split('?')[0]).as_posix()
            target = Path(target)
            parts = []
            for part in target.parts:
                if part == '..':
                    if not parts:
                        parts = None
                        break
                    parts.pop()
                elif part != '.':
                    parts.append(part)
            resolved = '/'.join(parts) if parts is not None else None
            # The locally supplied audition bank is optional; absent banks use synths.
            optional = resolved in ('between-banks/index.html', 'assets/audio-local/bank.json')
            if resolved is None or (resolved not in files and not optional):
                problems.append(f'{rel} refers to {ref}, which is not in the export')
    if problems:
        raise SystemExit('Nothing written:\n  ' + '\n  '.join(problems))

    today = date.today().isoformat()
    note = ' with uncommitted changes' if dirty else ''
    files['README.txt'] = README.format(today=today, commit=commit, dirty=note).encode('utf-8')
    if args.include_local_audio:
        files['README.txt'] += (
            '\nLOCAL AUDIO AUDITION\n'
            'This copy includes the local recorded-instrument audition bank. '
            'Standalone sample redistribution is not cleared. Keep this copy local; '
            'the default export excludes the bank and uses synthesized instruments.\n'
        ).encode('utf-8')
    inventory = '\n'.join(f'{hashlib.sha256(data).hexdigest()}  {rel}' for rel, data in sorted(files.items()))
    files['BUILD.txt'] = (
        f'Drawing the Hours, SOMEWAREZ kiosk build\nsource commit: {commit}{note}\nexported: {today}\n'
        f'multicart URL: {multicart}\nlocal audition audio: {args.include_local_audio}\nfiles: {len(files)}\n\n{inventory}\n'
    ).encode('utf-8')

    out = (ROOT / args.out).resolve()
    if ROOT not in out.parents:
        raise SystemExit('--out must be inside the project folder.')
    if out.exists():
        shutil.rmtree(out)
    for rel, data in files.items():
        target = out / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    archive = out.parent / f'drawing-the-hours-somewarez-{commit}{"-dirty" if dirty else ""}{"-local-audio" if args.include_local_audio else ""}.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
        for rel, data in sorted(files.items()):
            bundle.writestr(f'drawing-the-hours-somewarez/{rel}', data)

    size = sum(len(data) for data in files.values())
    print(f'{out}: {len(files)} files, {size / 1e6:.2f} MB, commit {commit}{note}')
    print(f'{archive}: {archive.stat().st_size / 1e6:.2f} MB')


if __name__ == '__main__':
    main()
