#!/usr/bin/env python3
"""Write the compressed textures the game loads from the masters in textures/.

The list of textures is read from PAPERS in src/paper.js, so that table is the
only place a texture is named. Each entry gives `source` (a file in textures/)
and `file` (the name written to assets/textures/). A `.webp` target is resized
and encoded; any other target is copied unchanged, which is right for masters
that are already small. An entry marked `grey: true` is encoded without colour.

Usage:
    python scripts/compress_textures.py            # write missing or stale files
    python scripts/compress_textures.py --force    # rewrite everything
    python scripts/compress_textures.py --check    # exit 1 if anything is stale

Requires Pillow.
"""
import argparse
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENTRY = re.compile(r"\{\s*file:\s*'([^']+)',\s*source:\s*'([^']+)'([^}]*)\}")


def entries():
    text = (ROOT / 'src' / 'paper.js').read_text(encoding='utf-8')
    found = [(file, source, 'grey: true' in rest) for file, source, rest in ENTRY.findall(text)]
    if not found:
        sys.exit('No { file, source } entries found in src/paper.js')
    return found


def stale(source, target):
    return not target.exists() or target.stat().st_mtime < source.stat().st_mtime


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--max-side', type=int, default=1024, help='longest side of an encoded texture, in pixels (default 1024)')
    parser.add_argument('--quality', type=int, default=70, help='WebP quality (default 70)')
    parser.add_argument('--force', action='store_true', help='rewrite files that are already up to date')
    parser.add_argument('--check', action='store_true', help='write nothing; exit 1 if any file is missing or stale')
    args = parser.parse_args()
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    out_dir = ROOT / 'assets' / 'textures'
    behind, before, after = [], 0, 0
    for file, name, grey in entries():
        source, target = ROOT / 'textures' / name, out_dir / file
        if not source.exists():
            if target.exists():
                after += target.stat().st_size
                print(f'{file:18} kept; master {name} is not on this machine')
                continue
            sys.exit(f'Missing master textures/{name} and no compressed copy')
        before += source.stat().st_size
        if stale(source, target) or args.force:
            if args.check:
                behind.append(file)
                continue
            out_dir.mkdir(parents=True, exist_ok=True)
            if target.suffix.lower() == '.webp':
                from PIL import Image
                # A grey entry drops colour, which its texture is never asked for (keep 0).
                image = Image.open(source).convert('L' if grey else 'RGB')
                k = min(1, args.max_side / max(image.size))
                if k < 1:
                    image = image.resize((round(image.width * k), round(image.height * k)), Image.LANCZOS)
                image.save(target, 'WEBP', quality=args.quality, method=6)
            else:
                shutil.copyfile(source, target)
            print(f'{file:18} {source.stat().st_size // 1024:5} KB -> {target.stat().st_size // 1024:4} KB')
        after += target.stat().st_size if target.exists() else 0
    if args.check:
        if behind:
            sys.exit('Stale or missing: ' + ', '.join(behind))
        print('All compressed textures are up to date.')
        return
    print(f'masters {before // 1024} KB, compressed {after // 1024} KB')


if __name__ == '__main__':
    main()
