# Assets

## Mali fonts

Mali Regular and SemiBold are hosted locally in `assets/fonts/` and loaded
before canvas text is measured. They come from the
[Google Fonts Mali directory](https://github.com/google/fonts/tree/main/ofl/mali),
downloaded on 2026-09-14. Copyright 2018 The Mali Project Authors.
The unmodified font binaries are distributed under SIL Open Font License 1.1;
the full license is included in [OFL-Mali.txt](assets/fonts/OFL-Mali.txt).

No Google Fonts request is made while playing. Font loading failures fall
back to installed fonts. The game does not redistribute fallback system fonts.

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
`aquarium/aquarium.js` are original Canvas and inline SVG drawings. The prototype
reuses the Mali fonts and favicon. No external asset was added. The earlier
chapter's artwork is preserved in `aquariumarchive/`.
