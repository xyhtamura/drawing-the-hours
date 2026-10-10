#!/usr/bin/env python3
"""Crop the handwritten title masks and write alpha-exact lossless WebP files.

Usage: python scripts/compress_title.py
       python scripts/compress_title.py --check
Requires Pillow. PNG masters remain untouched.
"""
import argparse
import sys
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
CROP = (110, 190, 910, 950)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / 'handwritten')
    parser.add_argument('--output', type=Path, default=ROOT / 'assets' / 'title')
    parser.add_argument('--check', action='store_true', help='verify existing exports without writing')
    args = parser.parse_args()
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    before = after = 0
    for n in range(1, 4):
        source = args.source / f'drawinghand0{n}.png'
        target = args.output / f'drawinghand0{n}.webp'
        with Image.open(source) as original:
            original = original.convert('RGBA')
            bounds = original.getchannel('A').getbbox()
            if not bounds or any((bounds[0] < CROP[0], bounds[1] < CROP[1], bounds[2] > CROP[2], bounds[3] > CROP[3])):
                parser.error(f'{source.name}: lettering extends outside the shared title crop')
            cropped = original.crop(CROP)
            if not args.check:
                args.output.mkdir(parents=True, exist_ok=True)
                cropped.save(target, 'WEBP', lossless=True, method=6)
            if not target.exists():
                parser.error(f'Missing {target}')
            with Image.open(target) as decoded:
                if decoded.size != cropped.size or ImageChops.difference(decoded.convert('RGBA').getchannel('A'), cropped.getchannel('A')).getbbox():
                    parser.error(f'{target.name}: decoded alpha differs from its PNG master')
            before += source.stat().st_size
            after += target.stat().st_size
            print(f'{source.name}: {source.stat().st_size:,} -> {target.stat().st_size:,} bytes; alpha identical')
    print(f'Total: {before:,} -> {after:,} bytes ({100 * (1 - after / before):.1f}% smaller)')


if __name__ == '__main__':
    main()
