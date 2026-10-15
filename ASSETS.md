# Assets

## Local soundtrack audition bank

2026-10-15 — Codex — `assets/audio-local/` is a gitignored, optional audition bank supplied from Xyh's local libraries. No recorded instrument sample is committed or included in the default SOMEWAREZ export. `src/samples.js` uses the existing synthesized voices whenever the manifest or a voice cannot load. A local offline export can include the bank explicitly with `--include-local-audio`.

| Local files | What they contain and source | Terms checked on 2026-10-15 |
| --- | --- | --- |
| `dawn-pluck-01.mp3`, `dawn-pluck-02.mp3`, `dawn-pluck-03.mp3` | Shortened stereo-staccato recordings from `E:/Library/PSI Palm Mute Piano/Instruments/Samples/Stereo/Staccato/` | The EULA in `PaperStone - Palm Mute Piano - Manual.pdf` grants finished musical works and performances and restricts distribution of samples outside that context. Standalone game-sampler redistribution is not established. |
| `noon-key-01.mp3`, `noon-key-02.mp3` | Decoded TP1 recordings from Rattly and Raw Toy Piano 1 | The indexed source folder had no usable included redistribution terms. Keep local. |
| `dusk-strike-01.mp3`, `dusk-strike-02.mp3` | Two soft mallet-gong recordings from `E:/Library/Gongster's Paradise/samples/` | No included standalone sample redistribution terms located. Keep local. Replaces the bowed-gamelan trial. |
| `midnight-reed-01.mp3` through `midnight-reed-04.mp3` | Bassoon 073 recordings from `E:/Library/Crocus Soundware - LIMINAL Bundle/Reeds/LIMINAL_Reeds Samples/` | No included redistribution terms located in the indexed bundle. Keep local. |
| `midnight-brass-01.mp3` through `midnight-brass-03.mp3` | Saxhorn recordings from `E:/Library/Indiginus Blue Street Brass KONTAKT/Blue Street Brass Samples/` | The included Blue Street Brass guide did not establish standalone sample redistribution terms. Keep local. |
| `title-wood-01.mp3` through `title-wood-03.mp3` | LindonsXylophone recordings from `E:/Library/Channel Robot The Modernist Xylophone/Modernist  Xylophone Samples/` | The included manual did not establish standalone sample redistribution terms. Keep local. Replaces the music-box title trial. |

All seventeen local filenames are project-specific. They are mono 24 kHz MP3 encodings of the audition recordings, without original file metadata. `bank.json` holds only their names and measured source pitches. The private per-file source paths and processing record are retained in `.browser-check/soundtrack-audition/preparation/runtime-bank-provenance.json`, its `title-dusk-provenance.json` update, and `SAMPLE-CANDIDATES.local.md`; neither is versioned. Renaming is organization, not a licence change. A published sampled soundtrack needs musical recordings or independently cleared assets rather than this standalone audition bank.

## Handwritten title

Xyh supplied `handwritten/drawinghand01.png`, `drawinghand02.png`, and
`drawinghand03.png` on 2026-10-10 as handwritten title frames. The title uses
their alpha channels to form multicoloured cord, with procedural rounded
shading, twisted fibres, and a cast shadow in `src/title-lettering.js`.
No external lettering, texture, or font was added. The editable
`handwritten/drawinghand.psd` master remains local and is ignored by Git.

The browser loads cropped lossless WebP copies from `assets/title/`, generated
by `python scripts/compress_title.py`. The shared crop removes transparent
padding while keeping frame alignment. `python scripts/compress_title.py --check`
compares each decoded alpha channel against its cropped PNG master. The three
exports total 90,592 bytes, compared with 272,134 bytes for the PNGs.

## Foil title card

Xyh supplied `handwritten/foil.png` on 2026-10-10 for the title card.
`python scripts/compress_foil.py` creates `assets/title/foil.webp`, reducing the
3,485 × 2,903 photograph to 1,024 × 853 and extracting the sheet's outline.
It requires Pillow, NumPy, and SciPy. CSS applies a pale peach, mint, and lilac
wash while retaining the folds. The browser loads the 132,396-byte WebP; the
11,668,226-byte PNG and its JPG companion remain local and ignored by Git.
The photograph's original source and licence are not recorded.

## Mali fonts

Mali Regular and SemiBold are hosted locally in `assets/fonts/` and loaded
before canvas text is measured. They come from the
[Google Fonts Mali directory](https://github.com/google/fonts/tree/main/ofl/mali),
downloaded on 2026-09-14. Copyright 2018 The Mali Project Authors.
The unmodified font binaries are distributed under SIL Open Font License 1.1;
the full license is included in [OFL-Mali.txt](assets/fonts/OFL-Mali.txt).

No Google Fonts request is made while playing. Font loading failures fall
back to installed fonts. The game does not redistribute fallback system fonts.

## SOMEWAREZ kiosk card fonts

The multicart card in the kiosk build (`somewarez/`) is set in the two display
fonts of the multicart page: Bungee Shade for the `5 IN 1` masthead and Pixelify
Sans for everything else. Both are unmodified copies of the files in
`xyhtamura.github.io/somewarez-multicart/assets/fonts/`, which were downloaded
from the Google Fonts repository on 2026-10-04, copied here on 2026-10-13.
`PixelifySans[wght].ttf` is stored as `PixelifySans-wght.ttf`; the bytes are the
same. Each is under SIL Open Font License 1.1, and the licences are beside them:
[Bungee Shade](somewarez/fonts/bungeeshade-OFL.txt)
([source](https://github.com/google/fonts/tree/main/ofl/bungeeshade)) and
[Pixelify Sans](somewarez/fonts/pixelifysans-OFL.txt)
([source](https://github.com/google/fonts/tree/main/ofl/pixelifysans)).
Only the kiosk build loads them.

The QR code, `somewarez/multicart-qr.svg`, is drawn by `scripts/make_qr.py`.

## Local edition drawings

The poppy of the main build and the ylang-ylang of the kiosk build are drawn in
code in `src/entities.js`, with no reference image.

The kiosk build's oleander hawkmoth colours, cogon plume, and abaca flower are
drawn in code in `src/entities.js` and `src/edition.js`. Xyh supplied two
reference images in conversation on 2026-10-13, a plate of an oleander hawkmoth
and a photograph of a banana-family inflorescence; their sources were not
recorded. They were looked at for colour and form only. Neither file is in the
repository and no pixels from them are used.

## Procedural graphics

The cached Dawn paper texture, pavement, grasses, and flowers in
`src/dawn-art.js` were authored for this game by Codex on 2026-09-14.
They use Canvas paths and deterministic noise, without third-party textures.
The existing insect drawings and synthesized audio remain locally authored
project assets. No external sample or image was added in this pass.

The Noon atrium graphics in `src/noon-art.js` were authored by Codex on
2026-09-14 using Canvas paths and deterministic noise. No external assets
were added for Noon.

The Amber Hoverfly in `src/entities.js` is an original Canvas drawing by
Codex, 2026-09-14. It uses paths and translucent fills; no external artwork.

The Dusk passage and leaf anchors in `src/dusk-art.js` and the Paper Lacewing
in `src/lacewing.js` were authored by Codex on 2026-09-15 using Canvas paths
and deterministic paper fibers. No third-party artwork was added.

The window-side planter in `src/midnight-art.js` and the Window Firefly in
`src/entities.js` were authored by Codex on 2026-09-15 using Canvas paths and
deterministic paper fibers. The glow is a radial gradient. No external art,
font, or audio asset was added for Midnight.

2026-09-16 — Codex — Flax flower pickup and card glyph drawn with original
Canvas paths in `src/entities.js`; no external image or font added.

## Textures

Fifteen photographs of paper, fibre, asphalt, glass, plastic film, metal, and
rubber, supplied by Xyh, who stated on 2026-10-09 that all of them are public
domain. Where each came from is not recorded here. The masters are kept in
`textures/`; the game loads compressed copies from `assets/textures/`,
written by `scripts/compress_textures.py` from the table in `src/paper.js`. The masters are
not versioned (`.gitignore`), so they exist only on Xyh's machine; the scripts
keep the committed copies when a master is absent. `assets/backdrops/` holds
the four hour backdrops baked from the same images by
`scripts/bake_backdrops.py`.
Nine are resized to 1024 px and encoded as WebP; six small ones are copied
unchanged. The game falls back to flat colour and outlines when a file is
absent.

## Favicon

favicon.svg is an original SVG drawing of a moth inside a gesture loop, using the game's cream, terracotta, and green palette. Drawn by Codex on 2026-10-07. It contains no third-party artwork, fonts, or samples.

## Aquarium chapter

2026-10-08 — Codex — The fish, aquatic pickups, hazards, glass, sand,
vegetation, and visitor reflection in `aquariumarchive/aquarium.js` are original
Canvas drawings. The chapter reuses the Mali font files and original favicon
listed above. No third-party artwork, texture, or audio was added.

2026-10-09 — Codex — The top-view guppies and ricefish, pair diagrams,
bubble timer, faint submerged paving, leaves, and water in
`between-banks/aquarium.js` are original Canvas and inline SVG drawings. The prototype
reuses the Mali fonts and favicon. No external asset was added. The earlier
chapter's artwork is preserved in `aquariumarchive/`.

2026-10-09 — Codex — Reskinned the active cast as ricefish, blue stream gobies,
spotted barbs, and halfbeaks. Fish bodies, spots, lateral stripes, beaks, stones,
stems, school diagrams, and shade patches in `between-banks/aquarium.js` are original
Canvas and inline SVG graphics. Scientific references informed the cast;
no photograph, illustration, or other external asset was copied into the game.

2026-10-10 — Codex — Water beetles, round leaf clumps, and rising bubbles in
`between-banks/aquarium.js` are original Canvas drawings. Existing fish, shade,
fonts, and paving were reused. No external artwork or sample was added.

2026-10-10 — Codex — Aquarium fish reuse the supplied textures documented above:
`SB012.webp` (mulberry) for ricefish, `cip60095.jpg` (coir) for gobies,
`SB035.webp` (gold tissue) for barbs, and `cip60097.jpg` (fibre) for halfbeaks.
The existing paper renderer tints their bodies, tails, and fins. No asset was added.

## Aquarium water textures

2026-10-10 — Codex — Xyh supplied seven Texturelabs images in `between-banks/tex/`.
The blue water uses `Texturelabs_Fabric_180S.jpg`, green uses
`Texturelabs_Glass_163S.jpg`, peach uses `Texturelabs_Fabric_176S.jpg`, and
purple uses `Texturelabs_Grunge_328S.jpg`. `scripts/bake_aquarium_water.py`
uses the meadow backdrop script's recoloring functions to incorporate their
relief into the four water colors. Finished artwork in both orientations is
versioned in `between-banks/water/`; the originals are excluded from Git.

Texturelabs owns these sources. Its [texture terms](https://texturelabs.org/terms/),
checked on 2026-10-10, permit incorporation into video game scenes and levels
and prohibit redistribution of the original resources and competing texture
products. These are game backgrounds, not a reusable texture pack. Fabric 181
and Grunge 350 were left unused because their large stains compete with fish;
Grunge 325 was left unused because its cracks introduce sharp background lines.
