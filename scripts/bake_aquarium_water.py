#!/usr/bin/env python3
"""Press supplied textures into the aquarium's four water colors.

Usage: python scripts/bake_aquarium_water.py
Requires Pillow and NumPy, as does bake_backdrops.py. Originals stay local;
the game ships finished water artwork in aquarium/water/.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

from bake_backdrops import cover, press

ROOT = Path(__file__).resolve().parent.parent
WATER = {
    'a8c6d3': ('Texturelabs_Fabric_180S.jpg', .025),
    'b2c8aa': ('Texturelabs_Glass_163S.jpg', .025),
    'dfbca9': ('Texturelabs_Fabric_176S.jpg', .023),
    'beb3ce': ('Texturelabs_Grunge_328S.jpg', .026),
}
SIZES = {'landscape': (960, 640), 'portrait': (640, 960)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, default=ROOT / 'aquarium' / 'tex')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'aquarium' / 'water')
    parser.add_argument('--quality', type=int, default=70, help='WebP quality (default 70)')
    args = parser.parse_args()
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for color, (filename, relief) in WATER.items():
        with Image.open(args.source_dir / filename) as source:
            texture = source.convert('RGB')
        rgb = [int(color[i:i + 2], 16) for i in (0, 2, 4)]
        for orientation, (width, height) in SIZES.items():
            target = np.full((height, width, 3), rgb, dtype=np.uint8)
            pixels = press(cover(texture, width, height), target, relief, .25, 10)
            path = args.output_dir / f'{color}-{orientation}.webp'
            Image.fromarray(pixels).save(path, 'WEBP', quality=args.quality, method=6)
            print(f'{path.name}: {path.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
