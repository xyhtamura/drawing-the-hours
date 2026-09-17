# Chapter palette study

An independent swatch page for Drawing the Hours. Open [index.html](index.html) directly, or visit <http://localhost:8000/drawing-the-hours-palette-study/> while the shared root server is running.

Choose a chapter, select a preset, then edit its swatches. Each chapter keeps its own colors. Applying a day palette set replaces all four chapters. The default set pairs pale daytime chapters with dark blue Midnight. There are 13 chapter presets, four day sets, and 22 editable color roles.

The page saves settings in its own browser storage. Export palette JSON to keep or transfer a set; import it to resume editing. PNG export saves the selected scene. CSS export names the selected chapter's colors. Neither export changes the game.

The scene uses independent Canvas drawings, system fonts, and no external assets or game imports. Its insects and interface approximate the game's appearance; this is a color study, not a playable level. The current wash presets use chapter background stops read from the game on 2026-09-15. Contrast figures compare solid swatches, not the rendered gradient, glow, or moving insects.

## Work record

2026-09-15 — Codex — Built the standalone palette editor, four-chapter comparison, scene annotations, optional motion and instruction card, and JSON, PNG, and CSS exports. Node syntax checks passed for both scripts. Inspected headless Edge screenshots and generated DOM at desktop width 1440 and mobile width 500; the scenes, controls, and responsive comparisons rendered without visible overlap. Manual color editing, pointer gestures, and import/export round trips remain untested. Browser checks are held in `.browser-check/`.

The active `drawing-the-hours/` repository was left untouched. This side folder is ignored by the root repository and has no git history. Applying a chosen set to the game remains a later task; no game palette has been changed.
