"""Draw the QR code on the SOMEWAREZ kiosk's multicart card.

Encodes a URL as a QR code (byte mode, error correction level L, versions 1 to 5,
which covers URLs up to 106 bytes) and writes it as an SVG that records the URL in
a data-url attribute. test/test_somewarez.js compares that attribute with
MULTICART_URL in somewarez/config.js, so a changed URL without a redrawn code fails
the suite.

Before writing, the script rasterises the code and reads it back with OpenCV's
QR detector. It refuses to write a code that does not decode to the URL. Without
OpenCV it stops, unless --no-verify is given.

Usage:
    python scripts/make_qr.py
    python scripts/make_qr.py --url https://example.org/ --out somewarez/multicart-qr.svg
    python scripts/make_qr.py --check somewarez/shot.png     decode a screenshot instead
"""

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_CODEWORDS = [19, 34, 55, 80, 108]  # versions 1-5, level L, one block each
EC_CODEWORDS = [7, 10, 15, 20, 26]
QUIET = 4  # light modules around the code

EXP = [0] * 512
LOG = [0] * 256
_x = 1
for _i in range(255):
    EXP[_i] = _x
    LOG[_x] = _i
    _x <<= 1
    if _x & 0x100:
        _x ^= 0x11D
for _i in range(255, 512):
    EXP[_i] = EXP[_i - 255]


def gf_mul(a, b):
    return 0 if a == 0 or b == 0 else EXP[LOG[a] + LOG[b]]


def rs_remainder(data, degree):
    divisor = [0] * (degree - 1) + [1]
    root = 1
    for _ in range(degree):
        for j in range(degree):
            divisor[j] = gf_mul(divisor[j], root)
            if j + 1 < degree:
                divisor[j] ^= divisor[j + 1]
        root = gf_mul(root, 2)
    rem = [0] * degree
    for byte in data:
        factor = byte ^ rem.pop(0)
        rem.append(0)
        for j, coefficient in enumerate(divisor):
            rem[j] ^= gf_mul(coefficient, factor)
    return rem


def codewords(payload):
    need = len(payload) + 2  # 4-bit mode, 8-bit count, then whole bytes
    version = next((v + 1 for v, cap in enumerate(DATA_CODEWORDS) if cap >= need), None)
    if version is None:
        raise SystemExit(f'{len(payload)} bytes is too long: versions 1 to 5 at level L hold 106.')
    capacity = DATA_CODEWORDS[version - 1]
    bits = '0100' + format(len(payload), '08b') + ''.join(format(b, '08b') for b in payload)
    bits += '0' * min(4, capacity * 8 - len(bits))
    bits += '0' * (-len(bits) % 8)
    data = [int(bits[i:i + 8], 2) for i in range(0, len(bits), 8)]
    pad = (0xEC, 0x11)
    data += [pad[i % 2] for i in range(capacity - len(data))]
    return version, data + rs_remainder(data, EC_CODEWORDS[version - 1])


def build(payload):
    version, words = codewords(payload)
    size = 17 + 4 * version
    dark = [[False] * size for _ in range(size)]
    fixed = [[False] * size for _ in range(size)]

    def put(x, y, value):
        dark[y][x] = bool(value)
        fixed[y][x] = True

    for i in range(size):  # timing
        put(6, i, i % 2 == 0)
        put(i, 6, i % 2 == 0)
    for cx, cy in ((3, 3), (size - 4, 3), (3, size - 4)):  # finders with separators
        for dy in range(-4, 5):
            for dx in range(-4, 5):
                x, y = cx + dx, cy + dy
                if 0 <= x < size and 0 <= y < size:
                    put(x, y, max(abs(dx), abs(dy)) not in (2, 4))
    if version >= 2:  # one alignment pattern in versions 2 to 6
        c = size - 7
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                put(c + dx, c + dy, max(abs(dx), abs(dy)) != 1)

    def put_format(mask):
        data = (1 << 3) | mask  # level L is 01
        rem = data
        for _ in range(10):
            rem = (rem << 1) ^ ((rem >> 9) * 0x537)
        bits = ((data << 10) | rem) ^ 0x5412
        bit = lambda i: (bits >> i) & 1
        for i in range(6):
            put(8, i, bit(i))
        put(8, 7, bit(6))
        put(8, 8, bit(7))
        put(7, 8, bit(8))
        for i in range(9, 15):
            put(14 - i, 8, bit(i))
        for i in range(8):
            put(size - 1 - i, 8, bit(i))
        for i in range(8, 15):
            put(8, size - 15 + i, bit(i))
        put(8, size - 8, True)

    put_format(0)  # reserves the format modules before data goes in

    stream = ''.join(format(w, '08b') for w in words)
    i = 0
    right = size - 1
    while right >= 1:
        if right == 6:
            right = 5
        for vert in range(size):
            for j in range(2):
                x = right - j
                y = size - 1 - vert if ((right + 1) & 2) == 0 else vert
                if not fixed[y][x] and i < len(stream):
                    dark[y][x] = stream[i] == '1'
                    i += 1
        right -= 2
    assert i == len(stream), 'not every codeword was placed'

    masks = [
        lambda x, y: (x + y) % 2 == 0, lambda x, y: y % 2 == 0, lambda x, y: x % 3 == 0,
        lambda x, y: (x + y) % 3 == 0, lambda x, y: (x // 3 + y // 2) % 2 == 0,
        lambda x, y: x * y % 2 + x * y % 3 == 0, lambda x, y: (x * y % 2 + x * y % 3) % 2 == 0,
        lambda x, y: ((x + y) % 2 + x * y % 3) % 2 == 0,
    ]

    def apply(mask):
        for y in range(size):
            for x in range(size):
                if not fixed[y][x] and masks[mask](x, y):
                    dark[y][x] = not dark[y][x]

    def penalty():
        score = 0
        lines = [row[:] for row in dark] + [[dark[y][x] for y in range(size)] for x in range(size)]
        for line in lines:
            run = 1
            for a, b in zip(line, line[1:] + [None]):
                if a == b:
                    run += 1
                else:
                    if run >= 5:
                        score += run - 2
                    run = 1
            text = ''.join('1' if m else '0' for m in line)
            score += 40 * (len(re.findall('(?=10111010000)', text)) + len(re.findall('(?=00001011101)', text)))
        for y in range(size - 1):
            for x in range(size - 1):
                if dark[y][x] == dark[y][x + 1] == dark[y + 1][x] == dark[y + 1][x + 1]:
                    score += 3
        share = sum(map(sum, dark)) * 100 // (size * size)
        return score + 10 * (abs(share - 50) // 5)

    best = None
    for mask in range(8):
        apply(mask)
        put_format(mask)
        score = penalty()
        if best is None or score < best[0]:
            best = (score, mask)
        apply(mask)  # the masks are their own inverse
    apply(best[1])
    put_format(best[1])
    return version, best[1], dark


def decode_image(image):
    import cv2
    text, _, _ = cv2.QRCodeDetector().detectAndDecode(image)
    return text


def decode_matrix(dark, scale=8):
    import numpy as np
    size = len(dark)
    image = np.full(((size + 2 * QUIET) * scale,) * 2, 255, dtype=np.uint8)
    for y, row in enumerate(dark):
        for x, module in enumerate(row):
            if module:
                image[(y + QUIET) * scale:(y + QUIET + 1) * scale, (x + QUIET) * scale:(x + QUIET + 1) * scale] = 0
    return decode_image(image)


def svg(dark, url, ink, paper):
    size = len(dark)
    path = []
    for y, row in enumerate(dark):
        x = 0
        while x < size:
            if row[x]:
                start = x
                while x < size and row[x]:
                    x += 1
                path.append(f'M{start + QUIET} {y + QUIET}h{x - start}v1h{start - x}z')
            else:
                x += 1
    side = size + 2 * QUIET
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {side} {side}" shape-rendering="crispEdges" '
        f'role="img" aria-label="QR code for {url}" data-url="{url}">\n'
        f'<rect width="{side}" height="{side}" fill="{paper}"/>\n'
        f'<path fill="{ink}" d="{"".join(path)}"/>\n</svg>\n'
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--url', help='URL to encode; default is MULTICART_URL in somewarez/config.js')
    parser.add_argument('--out', default=str(ROOT / 'somewarez' / 'multicart-qr.svg'))
    parser.add_argument('--ink', default='#241e18')
    parser.add_argument('--paper', default='#fffdf7')
    parser.add_argument('--no-verify', action='store_true', help='write without reading the code back')
    parser.add_argument('--check', metavar='IMAGE', help='decode a QR code found in an image file and print it')
    args = parser.parse_args()
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

    if args.check:
        import cv2
        image = cv2.imread(args.check)
        if image is None:
            raise SystemExit(f'Could not read {args.check}')
        text = decode_image(image)
        print(text or 'No QR code found.')
        raise SystemExit(0 if text else 1)

    url = args.url
    if not url:
        config = (ROOT / 'somewarez' / 'config.js').read_text(encoding='utf-8')
        found = re.search(r"MULTICART_URL\s*=\s*'([^']+)'", config)
        if not found:
            raise SystemExit('MULTICART_URL not found in somewarez/config.js; pass --url.')
        url = found.group(1)
    if not re.fullmatch(r'[\x21-\x7e]+', url) or any(c in url for c in '"<>&'):
        raise SystemExit('The URL must be printable ASCII without quotes, angle brackets, or ampersands.')

    version, mask, dark = build(url.encode('ascii'))
    if not args.no_verify:
        try:
            read = decode_matrix(dark)
        except ImportError:
            raise SystemExit('OpenCV (cv2) and numpy are needed to read the code back; install them or pass --no-verify.')
        if read != url:
            raise SystemExit(f'The code decodes to {read!r}, not {url!r}. Nothing written.')
    Path(args.out).write_text(svg(dark, url, args.ink, args.paper), encoding='utf-8', newline='\n')
    checked = 'not read back' if args.no_verify else 'read back with OpenCV'
    print(f'{args.out}: version {version}, mask {mask}, {len(dark)} modules, {checked}: {url}')


if __name__ == '__main__':
    main()
