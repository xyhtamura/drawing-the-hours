# Drawing the Hours notes

Playable meadow gesture prototype with moving creatures, combinations, and
multi-pocket drawings. The [working scope](SPEC.md) points to Xyh's
[concept and aesthetic direction](CONCEPT.md). Morning Verge is implemented
in `index.html`; earlier concept documents contain superseded proposals.
The working title is Drawing the Hours; the folder remains `relation-garden`.
The [hours and inhabitants note](HOURS.md) records earlier naming options,
visits at quiet hours, a broader cast, and candidate timers.

## Next in Dev

Calibrate Dawn levels 1–3 on real touch devices, then implement Hour II: Noon (Visits 4–6) with the atrium scene, wind gusts, and figure-eight correspondence objectives.

## Activity

2026-09-14 — Antigravity — Implemented the 12-visit campaign architecture and fully delivered Hour I: Dawn (Visits 1–3) in `src/campaign.js`, `src/entities.js`, `src/game.js`, `index.html`, and `style.css` per `CAMPAIGN.md` and Xyh's verbatim narrative lines in `first12levels.md`.
- Implemented `CampaignManager` and `CampaignSaveManager` with `localStorage['dth_campaign_save_v1']`, tracking active objectives, unlocked visits, completed IDs, and best scores.
- Authored Dawn visits with verbatim transition cards that stay until explicitly dismissed: Dawn 1 (*Before the bus*), Dawn 2 (*The curbside patch*), Dawn 3 (*Something in the air*). Retrying a visit skips directly to the Ready screen to respect narrative pacing.
- Implemented procedural Dawn curbside verge environment (`scene: 'curb'`) featuring cool morning gradient, stone curb lip, pencil seam, and bus stop marker post.
- Decoupled objective tracking from recipe scoring titles via pure `deriveObjectiveTags()`; time bonuses (+4s up to +15s cap) are awarded strictly when active objectives advance.
- Implemented per-kind population quotas and 0.8s delayed deficit replenishment, ensuring species ratios stay stable.
- Added visit/chapter selection modal (`#visit-modal`, shortcut `W`) displaying Hour I visits (unlocked/locked state, objectives, best scores), subsequent hours preview, and practice verges. Preserved prototype waves (Morning Verge and Twin Echoes) as accessible Practice Verges.
- Verified via automated test suite in `test/test_mechanics.js` (objective tag derivation across single loops and figure-eights, progression, bonus restrictions, verbatim texts, and registry integrity all passing) and ES module syntax check.
Touch device calibration across Dawn 1–3 and implementing Hour II: Noon remain next.

2026-09-14 — Codex — Read Xyh's twelve narrative lines and the updated
two-wave implementation. Xyh confirmed four groups of three levels and
requested gradual new insects and mechanics. Added `CAMPAIGN.md` and
`campaign-plan.json` with exact source lines, twelve objective/population
profiles, four edgeland scenes, transitions, saves, and acceptance checks.
The proposed additions are noon seed gusts, a dusk lacewing with resting
intervals, and midnight fireflies plus an explicit Trace mode. A draft using
only existing recipes was expanded following Xyh's clarification. Preserved
the earlier 24-level spec as `SPEC-before-campaign-20260914.md` and replaced
its active campaign section. The first twelve levels are a complete release
target, extensible by stable level IDs. Original narrative remains unchanged;
story additions are environmental, with the medicine and job left unresolved.

Verification: existing mechanics tests pass; checked JSON structure, exact
transition-text correspondence, objective supply, relative links, and diffs.
Browser automation failed to start with access denied, so this is a source
and specification check, not a new live playtest. None of the campaign or
new mechanics is implemented. Objective filtering is required because the
current two waves count every valid recipe. Real-touch calibration remains
required. Antigravity owns the folder rename; this task did not rename it.

2026-09-14 — Antigravity — Implemented figure-eight recipe for two dissimilar objects (`COUNTERPART_PAIR` and `Counterpart Dialogue`) in `src/recipes.js`. While two dissimilar insects cannot share a single loop (which yields "Two mismatched species"), separating them with a crossing figure-eight cord balances them into a harmonious bilateral dialogue across the waist (base score 320 pts for a pair, 300 + 40 × count for dialogue). Added gentle Am7 dialogue chime voicing (`[A4, C5, E5, G5]`) to `src/audio.js`. Documented Counterpart Pair in Field Book modal (`index.html`), `SPEC.md` §4.2, and updated Intro modal hints (`src/game.js`). Added automated test coverage in `test/test_mechanics.js` asserting successful two-dissimilar-insect figure-eight evaluation and single-loop mismatch containment; verified test suite passes (`node test/test_mechanics.js`) and syntax checks cleanly. Mobile touch playtest across orientations and flight dexterity calibration remain next.

2026-09-14 — Antigravity — Implemented mobile vertical layout setting (`Auto` / `Vertical` / `Horizontal`) with persistent `localStorage` preference and `V` shortcut (`index.html`, `style.css`). When in vertical mode (or on mobile portrait screens in auto mode), the stage wrapper expands to fill mobile height (`calc(100dvh - 175px)`, max 840px), header controls wrap into a balanced 3-column button grid, and footer remains compact. Re-architected in-game HUD (`src/game.js`) into a responsive 2-tier layout for narrow viewports (`< 560px`): Tier 1 holds the Dandelion Clock and Objective/Wave/Score readouts, and Tier 2 centers the Cord Length Meter below them, eliminating horizontal collision. Made modal cards (`drawModalBox`, `drawIntroModal`, `drawVictoryModal`, etc.) responsively clamp to viewport bounds with auto-scaled typography. In `src/entities.js`, anchored snail hazard dynamically to `bounds.height - 35`, and in `game.js:resize()`, actively clamped live entities and re-scattered boundary clover/flower verge decorations upon viewport orientation shifts. All unit tests passing (`node test/test_mechanics.js`). Touch device playtest across orientations remains next.

2026-09-14 — Antigravity — Converted color-swapped fliers into three morphologically and behaviorally distinct meadow insect species (`src/entities.js`): Brimstone Butterfly (folded sulphur wings, wandering flutter with gliding rests), Azure Damselfly (needle abdomen with ring segments, 4 gauzy narrow wings, distinct dart-and-hover state machine that freezes in mid-air then dashes at speed 3.2), and Roseate Hawkmoth (plump velvety body, swept delta wings, high-frequency flutter with continuous sweeping arcing loops). Preserved accessible dandelion seed contrast (pale tuft and pencil-grey `#948c78` filaments). Implemented the first optional mechanical experiment from `SPEC.md` ("Wave 2: Twin Echoes" / Symmetric Correspondence): figure-eights evaluate matching species composition across both lobes, allowing mixed groups that fail alone to harmonize through bilateral symmetry (`src/recipes.js`, `src/audio.js`). Added wave management to `src/game.js` and `index.html`: `btn-wave` toggle button, `W` keyboard shortcut, top-right HUD wave display, species-specific intro modal instructions, and seamless victory advance (Wave 1 completion promotes directly to Wave 2). Updated Field Book with illustrated meadow inhabitants catalog and Twin Echo recipe details. Verified all mechanics and new figure-eight symmetry test in `test/test_mechanics.js` and checked ES module syntax. Real-tablet touch calibration and dart speed balancing remain next.

2026-09-14 — Antigravity — Initialized git repository in `relation-garden/` with `.gitignore` and root baseline commit. Backed up complete project to `f:\xyh\relation-garden-backup\`. Refactored gesture input in `src/game.js` to unified Pointer Events API with `setPointerCapture` and `releasePointerCapture`, resolving potential touch/mouse duplicate triggers and supporting stylus drawing beyond the canvas border. Added `drawRoundedRect` canvas fallback for cross-browser resilience. Guarded canvas click when Field Book modal is active. Overhauled and formalized `SPEC.md` to document the verified Level One implementation, stroke length bands, cycle extraction, inhabitant flight models, combination grammar, and the complete 24-level Four-Hour campaign roadmap (Dawn, Noon, Dusk, Midnight). Re-ran test suite (all tests passing). Real-tablet gesture calibration remains next.

2026-09-14 — Codex — Added the three optional mechanical experiments to
`SPEC.md` at Xyh's request: matching compositions across figure-eight pockets,
ordered crossing, and length-dependent recipe validity. Correspondence is the
first proposed experiment, isolated to one challenge wave with Morning Verge
preserved for comparison. Distinguished it from the existing kindred-pair
recipe and left unresolved rule details explicit. Read back the saved section
and checked that the tablet playtest remains the next step in these notes and
the roadmap. No code changed or experiment implemented.

2026-09-14 — Codex — Xyh accepted the LOOP-like prototype as a useful
starting point and prioritized getting the mechanics fun before further
differentiation. Different flier species can replace the color variants in a
later visual pass; no reskin was performed. This supersedes the earlier demand
to replace the core combination rules immediately. Read Antigravity's build
record and Claude's subsequent fixes, opened the live page, inspected the
paper meadow and Field Book, and used start, restart, pause/resume, and an
open drag. The drag visibly returned "Loop did not close — trace back or cross
over." Ran the existing mechanics suite. This was a limited desktop UI check,
not a completed manual level or a real-tablet test; Claude's recorded full-run
verification was not repeated. No gameplay code or balance changed. The
tablet check remains next; do not impose the earlier alternate mechanics as
prerequisites for continuing this build.

2026-09-14 — Claude Code — Playtested Antigravity's Morning Verge build and
fixed six defects that stood between it and a playable level. Two were
legibility failures measured as WCAG contrast against the rendered canvas: the
airborne dandelion pappus was drawn in near-white on cream paper at 2.1:1, so
the Seed & Wing target read as a bare speck, and the dandelion visit clock's
tufts came in at 1.09:1 — the timer was invisible. The pappus now sits on a pale
tuft with pencil-grey filaments (3.3:1) and the clock head has a sage ground
behind it (peak 6.9:1 across the head). Three were interaction bugs: closing the
Field Book left the visit paused with no way to tell why, victory was held on a
`setTimeout` that fired into a restarted level if the player pressed R inside
1.2 s, and `audio.ensureContext()` could throw before `isDrawing` was set,
which would have silently disabled drawing on any browser refusing an
AudioContext. Victory now runs on game time, the Field Book resumes only the
pause it caused, and the audio context latches to `false` on failure so every
sound method returns early. Last, stroke closure tolerance went from 55 px to
90 px: a hand-drawn loop left 76 px open was rejected outright, and 90 px still
rejects a 94 px gap and a short open line. `index.html` also exposes
`window.game` for console playtesting.

Verified by driving the live page at `http://localhost:8000/relation-garden/`,
not by reading the code. All five recipes were scored through dispatched
`mousedown`/`mousemove`/`mouseup` on the real handlers — Kindred Pair, Trio,
Seed & Wing, Cross-Meadow Correspondence via a genuine figure-eight stroke, and
the snail hazard correctly refusing a loop — with 0 px drift between the client
coordinate sent and the stroke point recorded. A full five-harmony run through
real events ends in `VICTORY`; an expired clock still ends in `GAMEOVER`; a
restart inside the victory window leaves the game `PLAYING` at zero harmonies.
Contrast figures come from `getImageData` on the canvas, not from the hex
values. The existing suite in `test/test_mechanics.js` still passes.

Two balance measurements worth having before Visit II is authored. Sampling
every 0.5 s across a 60 s visit, a loop containing exactly two same-species
butterflies and nothing else is available 74% of the time, and a player taking
one such shot every 2.2 s reaches five harmonies in 15 s. **So Morning Verge has
almost no time pressure**: the clock is 60 s, each harmony adds 4 s, and the
level is finishable in a quarter of it. Whether that is right for a first visit
is Xyh's call, not a defect — nothing was changed. A careless player who loops
the nearest same-species pair without checking for bystanders fails about 45% of
attempts on a third butterfly drifting in. Loosening the exact-count recipes to
absorb that was considered and **dropped**: aiming past bystanders is the skill
the gesture is for, and a careful player has a clean shot three times in four.

Undone. The touch and tablet playtest is still open — everything here was
dispatched mouse events in a desktop browser, so pointer-event coalescing on a
real finger, the 90 px closure tolerance at finger scale, and `touch-action`
behaviour under a tablet's scroll gesture are all unmeasured. Frame behaviour
was not measured either: the Browser pane was hidden for this session, which
pauses `requestAnimationFrame`, so every frame was stepped by hand through
`update(dt)` and `render()`. Nothing here reports real frame timing. Two
cosmetic issues were seen and left: butterflies drift under the HUD readouts in
the top-left corner, where the clock becomes hard to read, and the timer can be
farmed to its 75 s cap by a player who keeps scoring.

2026-09-14 — Antigravity — Implemented the first playable level of Drawing the Hours ("Visit I: Morning Verge") as a build-free static web application. Built the geometry engine (`src/geometry.js`) supporting length bands (Petite, Balanced, Extended), single-loop and figure-eight pocket extraction, and containment tests. Authored procedural folded-paper entities (`src/entities.js`): Brimstone, Azure, and Roseate butterflies, drifting dandelion seeds, and ground snail crawler. Created combinatorial recipes (`src/recipes.js`) covering Kindred Pairs, Trios of Flight, Seed & Wing, Cross-Meadow Correspondence, and Nursery Polarity with fault feedback. Added the Dandelion Visit Clock (`src/clock.js`) and synthesized Web Audio (`src/audio.js`) for paper friction, cord recoil, and pentatonic chimes. Created `index.html` and `style.css` with live HUD and field book reference. Verified via automated test suite in `test/test_mechanics.js` (all tests passing) and Node syntax validation. Touch calibration and authoring Visit II (Noon) remain next.

2026-09-13 — Codex — Adopted Drawing the Hours as the working title and
added an independent design brief to `SPEC.md` following Xyh's request to
move away from a LOOP remake. Preserved the gesture and meadow commitments;
proposed independent recipes, objectives, timer treatment, and progression.
Earlier names remain in the historical notes. A limited exact-phrase web
search found no obvious game-title match; no trademark or legal clearance
was performed. Checked links and roadmap agreement. Nothing built; concrete
recipes and scoring remain open. The folder was not renamed.

2026-09-13 — Codex — Recorded Xyh's liminal-hours, broader-inhabitant, and
naming ideas in `HOURS.md`. Proposed repeat visits and a dandelion clock;
marked both as options. Checked official U.S. copyright and trademark guidance
for the homage question and found an existing game titled Cradle through Steam.
This is not title clearance or an assessment of LOOP's rights. Checked local
links and scope agreement. No implementation or biological research; the
protagonist, timer, roster, and title remain open. Daytime-only framing is
superseded; the one-wave study remains next.

2026-09-13 — Codex — Recorded Xyh's expanded spoken concept and developed
the paper, cord, daytime meadow, and everyday magic direction. Separated the
user's requirements from proposed treatments and recipe examples. Preserved
the earlier spec in `SPEC-path-recipes-20260913.md`; permanent ingredient
channels are superseded because the brief centers on moving targets and
temporary gestural arrangements. Updated the scope and roadmap next step.
Checked saved Markdown, relative links, and the roadmap diff. Nothing built,
rendered, playtested, or researched; LOOP's reported rules await the retrieved
text, and geometry, scoring, hazards, and level conditions remain unresolved.

2026-09-13 — Codex — Created the project folder and starter specification at
Xyh's request. Proposed persistent directed paths, ordered ingredient recipes,
one-stroke chains, and explicit cutting. Checked relative links and agreement
between the spec, these notes, and the root roadmap. Nothing built or
playtested. Moving organisms and additional gesture types were deferred to
isolate the path-length mechanic. The folder has no independent Git repository;
its files are held on disk and its planning status is recorded in the root
repository. The provisional name and proposed rules remain open to revision.
