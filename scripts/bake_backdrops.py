#!/usr/bin/env python3
"""Bake the four hour backdrops, so the game does not press them at runtime.

For each hour this draws the colour wash from src/palettes.js, presses the
hour's texture into it with the settings in PAPER_USE.backdrop (src/paper.js),
and writes a landscape and a portrait WebP to assets/backdrops/. It is a port
of recolor() and paperBackdrop() in src/paper.js; change one, change the other.

It also writes src/backdrops.js, which records the settings each file was baked
from. The game uses a baked file only while that record matches the live
settings, so a stale bake is ignored rather than shown: the game presses the
backdrop itself until this script is run again.

Usage:
    python scripts/bake_backdrops.py            # bake all four hours
    python scripts/bake_backdrops.py --check    # exit 1 if a bake is stale

Requires Pillow and NumPy.
"""
import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
HOURS = ['dawn', 'noon', 'dusk', 'midnight']
SIZES = {'landscape': (1024, 683), 'portrait': (683, 1024)}
SETTING = re.compile(r"^\s*(\w+): \{ paper: '(\w+)', relief: ([\d.]+), keep: ([\d.]+), split: (-?[\d.]+), mid: ([\d.]+) \},", re.M)
PAPER = re.compile(r"^\s*(\w+): \{\s*file:\s*'([^']+)',\s*source:\s*'([^']+)'", re.M)


def read_tables():
    paper_js = (ROOT / 'src' / 'paper.js').read_text(encoding='utf-8')
    block = paper_js[paper_js.index('backdrop: {'):]
    block = block[:block.index('\n  },')]
    settings = {m[1]: dict(paper=m[2], relief=m[3], keep=m[4], split=m[5], mid=m[6]) for m in SETTING.finditer(block)}
    papers = {m[1]: (m[2], m[3]) for m in PAPER.finditer(paper_js)}
    palette_js = (ROOT / 'src' / 'palettes.js').read_text(encoding='utf-8')
    palettes = json.loads(palette_js[palette_js.index('{'):palette_js.rindex('}') + 1])
    missing = [h for h in HOURS if h not in settings]
    if missing:
        sys.exit(f'No backdrop settings parsed for: {", ".join(missing)}')
    return settings, papers, palettes


def key_for(setting, palette):
    """Must build the same string as backdropKey() in src/paper.js."""
    return '|'.join([setting['paper'], setting['relief'], setting['keep'], setting['split'], setting['mid'],
                     palette['top'], palette['middle'], palette['bottom']])


def to_lab(rgb8):
    c = rgb8.astype(np.float64) / 255
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    r, g, b = lin[..., 0], lin[..., 1], lin[..., 2]
    l = np.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    m = np.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    s = np.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    return (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s)


def to_rgb8(L, a, b):
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
    lin = np.stack([4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
                    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
                    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s], axis=-1).clip(0, 1)
    srgb = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * lin ** (1 / 2.4) - 0.055)
    return np.round(srgb * 255).astype(np.uint8)


def wash(width, height, palette, mid):
    """The canvas gradient from (0, 0) to (width, height), interpolated in sRGB."""
    stops = [0, mid, 1]
    colors = np.array([[int(palette[k][i:i + 2], 16) for i in (1, 3, 5)] for k in ('top', 'middle', 'bottom')], dtype=np.float64)
    x, y = np.meshgrid(np.arange(width) + 0.5, np.arange(height) + 0.5)
    t = ((x * width + y * height) / (width * width + height * height)).clip(0, 1)
    out = np.empty((height, width, 3))
    for ch in range(3):
        out[..., ch] = np.interp(t, stops, colors[:, ch])
    return np.round(out).astype(np.uint8)


def cover(image, width, height):
    """Cover the field with the source, turned to match the field's orientation."""
    if (width >= height) != (image.width >= image.height):
        image = image.rotate(-90, expand=True)
    fit = max(width / image.width, height / image.height)
    image = image.resize((max(width, round(image.width * fit)), max(height, round(image.height * fit))), Image.LANCZOS)
    left, top = (image.width - width) // 2, (image.height - height) // 2
    return image.crop((left, top, left + width, top + height))


def press(texture, target, relief, keep, split):
    L, a, b = to_lab(np.asarray(texture))
    mean_a, mean_b = a.mean(), b.mean()
    r = ((L - L.mean()) / (L.std() or 1)).clip(-3, 3)
    da, db = a - mean_a, b - mean_b
    hue = np.arctan2(mean_b, mean_a) if np.hypot(mean_a, mean_b) > 0.015 else None
    tL, ta, tb = to_lab(target)
    half = (r / 2).clip(-1, 1)
    turn = -np.radians(split) / 2 * half
    gain = 1 - 0.25 * half
    cos_t, sin_t = 1 - turn * turn / 2, turn - turn ** 3 / 6
    oa, ob = (ta * cos_t - tb * sin_t) * gain, (ta * sin_t + tb * cos_t) * gain
    if keep:
        chroma = np.hypot(ta, tb)
        flat = (chroma < 0.01) | (hue is None)
        safe = np.where(chroma < 1e-9, 1, chroma)
        hc, hs = (np.cos(hue), np.sin(hue)) if hue is not None else (1, 0)
        c = np.where(flat, 1, (ta * hc + tb * hs) / safe)
        s = np.where(flat, 0, (tb * hc - ta * hs) / safe)
        oa, ob = oa + keep * (da * c - db * s), ob + keep * (da * s + db * c)
    return to_rgb8((tL + relief * r).clip(0, 1), oa, ob)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--quality', type=int, default=82, help='WebP quality (default 82)')
    parser.add_argument('--check', action='store_true', help='write nothing; exit 1 if any bake is missing or stale')
    args = parser.parse_args()
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    settings, papers, palettes = read_tables()
    out_dir = ROOT / 'assets' / 'backdrops'
    module = ROOT / 'src' / 'backdrops.js'
    keys = {hour: key_for(settings[hour], palettes[hour]) for hour in HOURS}

    if args.check:
        recorded = module.read_text(encoding='utf-8') if module.exists() else ''
        stale = [h for h in HOURS if f"key: '{keys[h]}'" not in recorded
                 or any(not (out_dir / f'{h}-{o}.webp').exists() for o in SIZES)]
        if stale:
            sys.exit('Stale or missing bakes: ' + ', '.join(stale))
        print('All baked backdrops match the settings.')
        return

    out_dir.mkdir(parents=True, exist_ok=True)
    total = 0
    for hour in HOURS:
        s = settings[hour]
        file, source = papers[s['paper']]
        master = ROOT / 'textures' / source
        texture = Image.open(master if master.exists() else ROOT / 'assets' / 'textures' / file).convert('RGB')
        for orient, (width, height) in SIZES.items():
            target = wash(width, height, palettes[hour], float(s['mid']))
            pixels = press(cover(texture, width, height), target, float(s['relief']), float(s['keep']), float(s['split']))
            path = out_dir / f'{hour}-{orient}.webp'
            Image.fromarray(pixels).save(path, 'WEBP', quality=args.quality, method=6)
            total += path.stat().st_size
            print(f'{path.name:24} {path.stat().st_size // 1024:4} KB')
    lines = ['// Generated by scripts/bake_backdrops.py. Do not edit; run the script instead.',
             '// key records the settings each file was baked from. See backdropKey() in paper.js.',
             'export const BAKED_BACKDROPS = {']
    for hour in HOURS:
        lines.append(f"  {hour}: {{ key: '{keys[hour]}', landscape: '{hour}-landscape.webp', portrait: '{hour}-portrait.webp' }},")
    lines += ['};', '']
    module.write_text('\n'.join(lines), encoding='utf-8')
    print(f'{len(HOURS) * len(SIZES)} files, {total // 1024} KB; wrote src/backdrops.js')


if __name__ == '__main__':
    main()
