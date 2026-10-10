#!/usr/bin/env python3
"""Build the small foil texture and silhouette used by the title card.

Usage: python scripts/compress_foil.py
Requires Pillow, NumPy, and SciPy. The supplied photograph is unchanged;
pastel colouring is applied by CSS so it can be adjusted without re-encoding.
"""
import argparse
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / 'handwritten' / 'foil.png')
    parser.add_argument('--output', type=Path, default=ROOT / 'assets' / 'title' / 'foil.webp')
    parser.add_argument('--width', type=int, default=1024)
    parser.add_argument('--quality', type=int, default=78)
    args = parser.parse_args()
    if args.width < 64 or not 1 <= args.quality <= 100:
        parser.error('Width must be at least 64; quality must be between 1 and 100.')
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    with Image.open(args.source) as source:
        scale = min(1, args.width / source.width)
        grey = source.convert('L').resize((round(source.width * scale), round(source.height * scale)), Image.Resampling.LANCZOS)
    # Close narrow bright creases, keep the sheet, then fill its bright interior.
    dark = np.asarray(grey) < 222
    closed = ndimage.binary_closing(np.pad(dark, 12), iterations=7)[12:-12, 12:-12]
    labels, _ = ndimage.label(closed)
    sizes = np.bincount(labels.ravel()); sizes[0] = 0
    sheet = ndimage.binary_fill_holes(labels == sizes.argmax())
    # The foil is one unperforated sheet. Bright folds that meet the edge must
    # not become holes; retain each scanline's outer silhouette instead.
    for row in sheet:
        edge = np.flatnonzero(row)
        if edge.size:
            row[edge[0]:edge[-1] + 1] = True
    alpha = Image.fromarray((sheet * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(.6))
    texture = Image.merge('RGBA', (grey, grey, grey, alpha))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    texture.save(args.output, 'WEBP', quality=args.quality, method=6)
    with Image.open(args.output) as decoded:
        if decoded.size != texture.size or decoded.getchannel('A').getbbox() is None:
            parser.error('Export did not retain the foil silhouette.')
    print(f'{args.source.name}: {args.source.stat().st_size:,} -> {args.output.stat().st_size:,} bytes; {texture.width} x {texture.height}')


if __name__ == '__main__':
    main()
