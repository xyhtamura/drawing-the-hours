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

## Paper textures

2026-10-07 — Claude Code — `src/paper.js` reads ten photographs of paper and
fibre from `textures/` (`SB012`, `SB013`, `SB034`, `SB035`, `cip60062`,
`cip60095`, `cip60097`, `cit60069`, `CANVAS10`, `STRANDS2`). Xyh supplied them;
their source and licence are not recorded here, and the filenames read like a
stock texture collection. They are untracked and must not be committed or
published until that is settled. The game falls back to flat colour and
outlines when the folder is absent.

## Favicon

favicon.svg is an original SVG drawing of a moth inside a gesture loop, using the game's cream, terracotta, and green palette. Drawn by Codex on 2026-10-07. It contains no third-party artwork, fonts, or samples.
