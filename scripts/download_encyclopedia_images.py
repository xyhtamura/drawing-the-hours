import sys
import os
import json
import urllib.request
import urllib.parse
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

OUT_DIR = 'f:/xyh/drawing-the-hours/assets/encyclopedia'
os.makedirs(OUT_DIR, exist_ok=True)

# Curated list of high-quality Wikimedia Commons public domain / CC0 / open license images
ITEMS = [
  {
    "id": "lemon-emigrant",
    "name": "Lemon Emigrant (Paruparo)",
    "sci": "Catopsilia pomona",
    "file_title": "File:Catopsilia pomona 3 by kadavoor.jpg",
    "fallback_search": "Catopsilia pomona"
  },
  {
    "id": "damselfly",
    "name": "Tutubing Karayom (Needle Damselfly)",
    "sci": "Agriocnemis femina",
    "file_title": "File:Variable wisp (Agriocnemis femina).jpg",
    "fallback_search": "Agriocnemis femina"
  },
  {
    "id": "oleander-hawkmoth",
    "name": "Oleander Hawkmoth (Gamugamo)",
    "sci": "Daphnis nerii",
    "file_title": "File:Oleander Hawk-moth Daphnis nerii.jpg",
    "fallback_search": "Daphnis nerii"
  },
  {
    "id": "hoverfly",
    "name": "Amber Bubuyog (Hoverfly)",
    "sci": "Syrphidae / Episyrphus balteatus",
    "file_title": "File:Episyrphus balteatus on flower 2.jpg",
    "fallback_search": "Episyrphus balteatus"
  },
  {
    "id": "green-lacewing",
    "name": "Green Lacewing",
    "sci": "Chrysopidae / Chrysopa perla",
    "file_title": "File:Chrysopa perla 02.jpg",
    "fallback_search": "Chrysopa perla"
  },
  {
    "id": "firefly",
    "name": "Alitaptap (Window Firefly)",
    "sci": "Luciola / Lampyridae",
    "file_title": "File:Luciola cruciata male.jpg",
    "fallback_search": "Luciola"
  },
  {
    "id": "paper-wasp",
    "name": "Putakti (Paper Wasp)",
    "sci": "Ropalidia marginata / Vespidae",
    "file_title": "File:Ropalidia marginata.jpg",
    "fallback_search": "Ropalidia marginata"
  },
  {
    "id": "giant-snail",
    "name": "Giant African Snail (Ground Crawler)",
    "sci": "Lissachatina fulica",
    "file_title": "File:Giant African snail (Achatina fulica) climbing gate.jpg",
    "fallback_search": "Achatina fulica"
  },
  {
    "id": "dama-de-noche",
    "name": "Dama de Noche (Night Jasmine)",
    "sci": "Cestrum nocturnum",
    "file_title": "File:Cestrum nocturnum Blanco1.151-cropped.jpg",
    "fallback_search": "Cestrum nocturnum Blanco"
  },
  {
    "id": "ylang-ylang",
    "name": "Ylang-Ylang (The Slowing Bloom)",
    "sci": "Cananga odorata",
    "file_title": "File:Cananga odorata 01.JPG",
    "fallback_search": "Cananga odorata"
  },
  {
    "id": "abaca",
    "name": "Abaca Flower / Manila Hemp",
    "sci": "Musa textilis",
    "file_title": "File:Musa textilis 11zz.jpg",
    "fallback_search": "Musa textilis"
  },
  {
    "id": "cogon-grass",
    "name": "Cogon Grass (Cogon Plume)",
    "sci": "Imperata cylindrica",
    "file_title": "File:Imperata cylindrica spikes.jpg",
    "fallback_search": "Imperata cylindrica"
  }
]

provenance = {}

for item in ITEMS:
    print(f"\nProcessing {item['id']} ({item['name']})...")
    title = item['file_title']
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url|size|extmetadata&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'DrawingTheHoursBot/1.0 (https://github.com/xyhtamura; research@xyh.org)'})
    
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            pages = data['query']['pages']
            page = list(pages.values())[0]
            if 'imageinfo' not in page:
                print(f"  Missing imageinfo for {title}")
                continue
            info = page['imageinfo'][0]
            img_url = info['url']
            meta = info.get('extmetadata', {})
            license_name = meta.get('LicenseShortName', {}).get('value', 'Public Domain')
            artist = meta.get('Artist', {}).get('value', 'Unknown')
            credit = meta.get('Credit', {}).get('value', '')
            
            print(f"  Found URL: {img_url}")
            print(f"  License: {license_name}")
            
            # Download image
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'DrawingTheHoursBot/1.0 (https://github.com/xyhtamura; research@xyh.org)'})
            raw_path = os.path.join(OUT_DIR, f"temp_{item['id']}.jpg")
            with urllib.request.urlopen(img_req) as img_resp, open(raw_path, 'wb') as f:
                f.write(img_resp.read())
            
            # Open with PIL, resize to max 420x320 keeping aspect ratio, save as webp
            im = Image.open(raw_path)
            if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
                im = im.convert('RGBA')
            else:
                im = im.convert('RGB')
            im.thumbnail((420, 320), Image.Resampling.LANCZOS)
            
            dest_webp = os.path.join(OUT_DIR, f"{item['id']}.webp")
            im.save(dest_webp, 'WEBP', quality=84, method=6)
            os.remove(raw_path)
            
            size_kb = os.path.getsize(dest_webp) / 1024
            print(f"  Saved {dest_webp} ({size_kb:.1f} KB)")
            
            provenance[item['id']] = {
                "name": item['name'],
                "scientific": item['sci'],
                "commons_file": title,
                "url": img_url,
                "license": license_name,
                "artist": artist.replace('<a ', '<span ').replace('</a>', '</span>')
            }
    except Exception as e:
        print(f"  Error on {item['id']}: {e}")

prov_file = os.path.join(OUT_DIR, 'provenance.json')
with open(prov_file, 'w', encoding='utf-8') as f:
    json.dump(provenance, f, indent=2)
print("\nDone! Provenance saved to", prov_file)
