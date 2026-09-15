# Drawing the Hours notes

Playable meadow gesture prototype with moving creatures, combinations, and
multi-pocket drawings. The [working scope](SPEC.md) points to Xyh's
[concept and aesthetic direction](CONCEPT.md). Morning Verge is implemented
in `index.html`; earlier concept documents contain superseded proposals.
The project title is Drawing the Hours; the folder was renamed to `drawing-the-hours/` on 2026-09-14.
The [hours and inhabitants note](HOURS.md) records earlier naming options,
visits at quiet hours, a broader cast, and candidate timers.

## Next in Dev

Real-device gesture calibration, finger occlusion testing, and difficulty balancing across all twelve visits.

## Activity

2026-09-15 — Antigravity — Implemented Hour IV: Midnight Visits XI and XII, explicit Enclose / Trace mode toggle UI, ready card diagrams, clearance-aware window spawning, and day completion view, completing the 12-visit authored campaign per MIDNIGHT.md and CAMPAIGN.md.
- Enclose / Trace Mode UI: Added `#btn-gesture-mode` in controls bar with keyboard shortcut `[T]`. Explicit switching between Enclose and Trace modes via `setGestureMode()`; locked to Trace in Visit X, hidden in visits with Enclose only, and disabled while drawing or during victory delay. Added visible mode indicators on canvas HUD for Enclose as well as Trace, and updated footer keyboard hints.
- Clearance-Aware Window Scene Spawning: In `src/game.js`, initial placement and replenishment in `window` scene checks distance against already placed entities (`hypot >= e.radius + cand.radius + 14`). Fireflies spawn at anchored positions, lacewings at leaf anchors, while hoverflies, brimstones, seeds, and snail verify clearance across up to 25 attempts or queue to `respawnQueue` with short delay to prevent overlapping starts.
- Ready Screen Diagrams: Added dual Enclose loop (Kindred / Seed & Wing) and Trace sequence (Firefly 1 → Lacewing 2 → Firefly 3) diagram for Visit XI (`teachMidnight02`), explicitly clarifying that seeds belong in Enclose. Added ready vignette for Visit XII (`teachMidnight03`) highlighting the return of Brimstone butterflies and perimeter snail.
- Day-Completion View & Replay Routing: In `src/game.js`, when finishing Visit XII (`midnight-03`), checks actual completed IDs set (`save.completedLevelIds.length === 12` covering all 12 IDs). Renders "Twelve Visits Complete" with total campaign score and prompt "[ Tap to Replay a Visit ]", opening `#visit-modal` on advance. If XII completed out-of-order via test unlocks, renders "Visit XII Complete" and offers visit selection. Replay for practice modes preserved.
- Campaign Activation: Added `'midnight-02'` and `'midnight-03'` to `PLAYABLE_LEVEL_IDS` in `src/campaign.js`. All 12 campaign visits across all 4 hours (Dawn, Noon, Dusk, Midnight) are now playable. Updated `#visit-modal` introductory copy and removed preview notice.
- Verification: Extended `test/test_midnight.js` covering XI and XII objective satisfaction (`any`, `pair`, `seedWing`, `figure8`, `trace`, `nursery`), gesture lockout during strokes and victory delays, day completion verification, and window scene placement clearance at landscape (960x640) and portrait (390x844) viewport dimensions. All test suites (`test_mechanics.js`, `test_dusk.js`, `test_midnight.js`) pass with 0 errors and all ES modules pass `node --check`.
Real-device touch calibration across all twelve visits remains next.

2026-09-15 — Antigravity — Constrained Nursery Polarity to exactly 1 flier and 1 seed, made Twin Echo and Cross-Meadow figure-eights strictly optional in campaign objectives per Xyh's feedback.
- Nursery Polarity Refinement: In `src/recipes.js`, two-pocket drawings with a fliers-only and seeds-only partition must contain exactly 1 flier and 1 seed (base score 300). More than one of either flier or seed explicitly fails with `faultType: 'CROWDED_NURSERY'` and clear guidance. Updated `deriveObjectiveTags()` in `src/campaign.js` accordingly.
- Ready Diagrams & Field Book: Updated `teachNursery` and `teachDusk02` illustrations in `src/game.js` to show exactly 1 flier and 1 seed; updated the Field Book entry in `index.html`.
- Campaign Objectives Optionality: Ensured Twin Echo (`SYMMETRIC_CORRESPONDENCE` / `mixedEcho`) and Cross-Meadow (`CROSS_MEADOW_CORRESPONDENCE`) remain fully valid and rewarding high-score figures when drawn, but are not forced requirements in campaign levels. Replaced `mixedEcho: 1` in Midnight 2 (`midnight-02`) with a generic `figure8: 1` objective, and removed `mixedEcho: 1` from Midnight 3 (`midnight-03`) in both `src/campaign.js` and `campaign-plan.json`.
- Verification: Extended `test/test_mechanics.js` and `test/test_dusk.js` to verify valid 1-flier + 1-seed Nursery evaluations, crowded disqualifications (1+2, 2+1, 2+2), and confirmed that no campaign level requires `mixedEcho` or `crossMeadow`. All test suites and syntax checks pass cleanly.
Hour IV: Midnight (Visits X–XII) and real-device gesture calibration remain next.

2026-09-15 — Antigravity — Unlocked all 9 playable levels (Dawn 1–3, Noon 1–3, Dusk 1–3) in the Meadow Visits selection UI and added playtesting save management hooks per user request.
- Visit Selection Modal: Updated `renderVisitModal()` in `index.html` so that all currently implemented visits (`PLAYABLE_LEVEL_IDS`) are unlocked, clickable, and show status badges (`Current`, `Completed`, or `Unlocked`).
- Testing Controls: Added a `🔓 Unlock All in Save` button in `#visit-modal` alongside the Return button.
- Save Management Methods: Added `unlockAll()` and `reset()` to `CampaignSaveManager` and `CampaignManager` in `src/campaign.js`.
- Console Hooks: Exposed `window.unlockAllLevels()` and `window.resetProgress()` for fast playtesting and debugging from the browser console.
- Verification: Extended `test/test_mechanics.js` to verify `unlockAll()` and `reset()`; all tests (`test_mechanics.js` and `test_dusk.js`) and ES module syntax checks pass cleanly.
Hour IV: Midnight (Visits X–XII) and real-device gesture calibration remain next.

2026-09-15 — Antigravity — Implemented the remainder of Hour III: Dusk (Visits VIII and IX) in `src/campaign.js`, `src/game.js`, `src/audio.js`, `index.html`, `test/test_dusk.js`, and `test/test_mechanics.js`, bringing the Dusk chapter to completion per `DUSK.md`, `CAMPAIGN.md`, and Xyh's verbatim texts.
- Completed Visit VIII (*The gaps in the sound*): verbatim story card ("I can hear the cicadas. And sometimes I can't."), Nursery Polarity (insects sheltered in one pocket, airborne seeds gathered in the other) + lacewing Counterpart Pair objectives, 95s dandelion clock.
- Intermittent cicada ambient layer: synthesized high-frequency stridulation buzzing (5.2s swell/pulse/fade followed by 6.8s of silence) in Web Audio honoring Xyh's story card and `DUSK.md` §62. Stops cleanly on pause, mute, level restart, or completion.
- Completed Visit IX (*Carrying something home*): verbatim story card ("Bringing home medicine today."), gesture-switching objectives (3 single loops and 2 figure-eights amid 8 fliers), 100s dandelion clock.
- Safe-area flier containment: fliers in passage scene spawn inside `duskSafeArea` and steer softly away from safe area borders, preventing edge-clamping during flight.
- Ready screen diagrams: added custom diagram illustrations in `src/game.js` for Visit VIII (`teachDusk02`, Nursery polarity with resting lacewing and dandelion seeds) and Visit IX (`teachDusk03`, gesture switching between single loop and figure-eight with perimeter snail note).
- Progression & Playable IDs: added `'dusk-02'` and `'dusk-03'` to `PLAYABLE_LEVEL_IDS` in `src/campaign.js`, updated `#visit-modal` preview text in `index.html`, and verified campaign chaining (`noon-03` -> `dusk-01` -> `dusk-02` -> `dusk-03` -> locked Midnight).
- Verification: both `test/test_dusk.js` and `test/test_mechanics.js` pass with full progression coverage; all ES modules validate cleanly with `node --check`.
Hour IV: Midnight (Visits X–XII) and real-device gesture calibration remain next.

2026-09-15 — Antigravity — Added the Seed & Trio loop recipe, replaced Noon 3's mixedEcho requirement with Seed & Trio, and invalidated kindred fliers divided across figure-eights per Xyh's feedback.
- Seed & Trio combination: Enclosing 1 airborne seed + 3 distinct insect species in a single loop evaluates as `RECIPE_TYPES.SEED_AND_TRIO` (base score 360) in `src/recipes.js`. Loops with 1 seed + 3 fliers containing duplicate species fail with `MISMATCH`. Added dedicated pentatonic chord voicing in `src/audio.js` and Field Book entry in `index.html`.
- Kindred fliers in figure-eight: In `src/recipes.js`, two-pocket drawings containing identical flier species (0 seeds, 1 distinct kind, >= 2 fliers total) are rejected with `faultType: 'DIVIDED_KINDRED'` and the guidance "Kindred fliers belong together in a single loop — do not divide them across a figure-eight." Documented this constraint under Kindred Pair in `index.html`.
- Noon 3 adjustment: Updated Visit VI (`noon-03`) objectives in `src/campaign.js` and `campaign-plan.json` from `{ figure8: 4, mixedEcho: 2 }` to `{ any: 4, seedTrio: 2 }`, removing the punitive 4-entity figure-eight requirement in favour of the Seed & Trio circle. Replaced the Ready screen diagram and instructions with `teachSeedTrio` in `src/game.js`.
- Verification: Extended `test/test_mechanics.js` with test coverage for `SEED_AND_TRIO` (valid and duplicate mismatch), `DIVIDED_KINDRED` rejection across figure-eight lobes, `seedTrio` objective tag derivation, and `noon-03` progression. All test suites pass cleanly (`node test/test_mechanics.js`) and all ES modules validate (`node --check`).
Hour III: Dusk (Visits VII–IX) and real-device gesture calibration remain next.

2026-09-14 — Antigravity — Implemented the remainder of Hour II: Noon (Visits V and VI) in `src/game.js`, `src/audio.js`, `src/entities.js`, `src/campaign.js`, `index.html`, and `test/test_mechanics.js`, bringing the Noon atrium chapter to completion per `CAMPAIGN.md` and Xyh's verbatim texts in `first12levels.md`.
- Completed Noon 2 (Visit V, *For now*): verbatim story card ("I don't know how much longer my job will exist."), Figure-eight Nursery Polarity objective (insects sheltered in one lobe, dandelion seeds gathered in the other), 110s dandelion clock.
- Completed Noon 3 (Visit VI, *The glass and the leaves*): verbatim story card ("This atrium makes me feel calmer."), Figure-eight Mixed Echo objective (bilateral symmetry of matching mixed insect groups across lobes), 100s dandelion clock.
- Implemented atrium wind cycle: 12-second periodic state machine (8s calm drift, 2s warning with soft bandpass-filtered noise breath and HUD indicator, 2s rightward gust accelerating seeds at 0.08 playfield widths/s with synthesized rushing whoosh). Seeds lean into the wind and wrap gracefully; insects, cord, and pointer remain strictly unaffected. Pausing freezes the cycle.
- Added dynamic wind presentation: leaning foliage swaying in side planters during gusts, drifting translucent paper wind streamlines across the atrium floor, and responsive HUD wind indicator badge below the cord meter on both desktop and mobile viewports.
- Added illustrated Ready screen diagrams for Nursery Polarity (`noon-02`) and Mixed Echo (`noon-03`) with wind advisories.
- Added `'noon-02'` and `'noon-03'` to `PLAYABLE_LEVEL_IDS` in `src/campaign.js` and updated `#visit-modal` preview text in `index.html`.
- Verification: automated suite in `test/test_mechanics.js` confirms full Noon progression (`noon-01` -> `noon-02` -> `noon-03`), verbatim texts, gust acceleration on seeds, flier immunity, and objective derivation; all ES modules pass syntax check (`node --check`).
Hour III: Dusk (Visits VII–IX) and touch device calibration remain next.

2026-09-14 — Antigravity — Renamed the project folder and repository to `drawing-the-hours/` (matching the display title Drawing the Hours and the workspace's kebab-case folder convention) per Xyh's instruction.
- Renamed project repository directory `f:\xyh\relation-garden` to `f:\xyh\drawing-the-hours`.
- Renamed backup snapshot `f:\xyh\relation-garden-backup` to `f:\xyh\drawing-the-hours-backup`.
- Configured git `safe.directory` for the new path; verified git history is preserved intact.
- Updated `package.json` name to `"drawing-the-hours"`.
- Updated `VIEW_STORAGE_KEY` in `index.html` to `'drawing-the-hours-orientation'` with seamless fallback to `'relation-garden-orientation'` to preserve user device view preferences.
- Updated internal references across `CAMPAIGN.md`, `SPEC.md`, `NOTES.md`, and spec history files.
- Updated workspace inbound references in root `ROADMAP.md` and `unbuilt/` (`README.md`, `LUDIC_APPS_IDEAS.md`, `loop-meadow-forest_ideas_20260913.md`).
- Verified all mechanics and campaign test suites pass (`node test/test_mechanics.js`) and all ES modules pass syntax validation.
Tablet touch calibration across Dawn 1–3 and implementing Hour II: Noon remain next.

2026-09-14 — Codex — Refined Dawn's baseline visual treatment at Xyh's
request: locally hosted Mali Regular/SemiBold, rose notebook controls, warmer
paper gradients, deterministic fiber texture, paving seams, boundary grasses,
pink flowers, and a bus-stop marker. `src/dawn-art.js` caches the static
scene at up to 2x resolution and rebuilds only on size/pixel-ratio changes.
Added `ASSETS.md` and the font's full OFL license. Canvas initialization waits
for local font load attempts so text measurement uses the intended face.

Wrapped narrative and ready-screen instructions to fit their cards while
preserving Xyh's words. Adjusted automatic portrait layout so the larger
controls, playfield, and footer fit together; added visible keyboard focus
and reduced-motion button treatment. Removed obsolete study wording from
the header and clarified the gesture hint. No recipe, speed, quota, or timer
balance changes were made.

Verified in the live browser: portrait transition and ready cards, new font
appearance, field rendering, an open drag's feedback, and pause/resume. The
existing mechanics/campaign suite and module syntax checks pass; a narrow
width wrapping check preserved all three Dawn narrative strings. These are
not a complete manual Dawn run, a real-touch calibration, or a frame-time
benchmark. The cached scene's performance benefit is structural, not measured.
The tab is left paused for Xyh. Tablet calibration remains next; folder rename
and Noon are still outside this pass.

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

2026-09-14 — Codex — Implemented Noon 1 (Visit IV), Lunch in the atrium.
Preserved the sandwich transition and authored objectives: four combinations,
including three Counterpart Pairs, in 90 seconds with three Brimstones and
three Damselflies. Added cached glass seams, sunlight, planters, paving, and
a small lunch wrapper in src/noon-art.js; a figure-eight guide; a campaign
menu entry; and independent Noon practice access.

Checked the ready guide and playable six-insect scene in the in-app browser.
Node mechanics tests pass, including Noon availability and practice save
isolation. Full manual completion and real-device touch calibration remain
unverified. The browser view required vertical scrolling at its current height.

Antigravity handoff: visits 5–6 already have data in src/campaign.js. Implement
their wind behavior, then add their IDs to PLAYABLE_LEVEL_IDS; the Noon menu
and next-visit routing follow that registry. Atrium artwork is shared by scene
name. Noon 1 currently ends with Replay rather than entering unfinished visits.
Wind and the remaining chapter are deliberately left for Antigravity.

2026-09-14 — Codex — Added Amber Hoverfly artwork and hold/turn/shift movement.
Replaced Noon damselfly quotas with hoverflies in runtime and campaign-plan
data; Dawn remains unchanged. Added spawning support, recipe display name,
Field Book entry, and updated Noon guide icon. CAMPAIGN.md records the cast
direction for all four hours; lacewing and firefly remain future work.

Node mechanics tests pass, including stationary hover, advance warning, shift
distance, bounds, recipe tags, and Noon quotas. Browser inspection showed
three striped hoverflies with three Brimstones in Noon practice and the Field
Book entry in the DOM. Full manual completion and touch calibration remain
open. Antigravity can use the hoverfly kind directly for visits 5–6; wind
interaction still needs implementation and playtesting. No future chapters
were enabled.

2026-09-15 — Codex — Designed Dusk Visits VII–IX in [DUSK.md](DUSK.md)
and implemented Visit VII, The way through. Two paper lacewings travel among
three visible leaves and rest for 1.5 seconds; two unchanged amber hoverflies
provide partners. The visit asks for five combinations, including two
lacewing Counterpart Pairs, in 100 seconds. It follows Noon VI and is also
available as Practice · Dusk without campaign completion writes. Added the
passage scene, species drawing, ready diagram, Field Book explanation,
responsive anchors, and vacancy-aware replacement at leaves. Plan data,
campaign specification, active scope, and root roadmap agree.

Recorded Xyh's playtest: hoverfly stillness simplifies circles but helps with
harder figure-eights. Replaced Dusk VIII's planned mixed Echo requirement with
one lacewing Counterpart Pair alongside its Nursery; deferred four-target
Echo precision pending touch calibration. VIII and IX remain planned and
unavailable. The optional VIII cicada layer is deferred to that visit; no new
audio work was required for VII. Hoverfly speeds and recipe validity stay
unchanged.

Verified with `node test/test_mechanics.js`, `node test/test_dusk.js`, module
syntax checks, and `git diff --check`. Headless Edge ran the actual game through
five prepared Pointer Event drawings to victory, checked transition and pause
freeze, population restoration, occupied-leaf replacement queuing, and restart
feedback clearing. Inspected rendered desktop and 390-pixel portrait ready
cards and the unobscured desktop field. Lightened lacewing wings and reduced
leaf contrast after the first field image showed camouflage. Fixed stale
stroke/stamp/banner state on restart and wrapped narrow HUD objectives around
the clock. The reusable browser harness is `test/dusk-browser.html`; local
review images and browser profiles are ignored under `.browser-check/`.

These checks use controlled target arrangements, not a manual full run or
real-device gesture calibration. First-pass timing and live arrangement
availability remain for Xyh to playtest. Implement VIII's seed Nursery visit
next using DUSK.md; IX and Midnight remain unbuilt.

2026-09-15 — Codex — Implemented Midnight Visit X, The window corner, and
prepared [MIDNIGHT.md](MIDNIGHT.md) for Antigravity to build XI–XII. X preserves
Xyh's transition sentence, uses three fireflies and two lacewings, and requires
three firefly–lacewing–different-firefly traces in 95 seconds. Added the cached
window-side planter, a firefly whose body and hit radius stay visible between
glows, numbered Trace rings, an open blue cord, ready instructions, a Field
Book entry, campaign chaining after Dusk IX, and isolated Midnight practice.

`src/trace.js` evaluates swept relative motion, orders contacts by entry time,
ignores repeated identities, rejects occupied starts, wrong targets, fourth
targets, hazards, and ambiguous overlaps, and commits nothing until release.
The shared input path samples coalesced moves and the release position. Game
updates also detect an insect crossing a held pointer. Pause, resize, lost
capture, cancelled pointers, hidden tabs, and window blur clear reservations.
A different pointer cannot finish a held stroke. Accepted Trace results share
the enclosure score/objective/departure transaction but produce only `any`
and `trace` tags. Excluded harmonizing insects from enclosure recapture as well.
No new audio layer was added; successful Trace uses the existing harmony chord.

The handoff keeps XI–XII unavailable. XI adds hoverflies and seeds to X's cast,
with no snail; XII returns Brimstones and one snail. Their plan and runtime
records agree. Existing complex figure-eights remain optional. Antigravity's
remaining work is the mixed-mode control and cards, larger-field placement,
XI–XII gameplay verification, and a first-day ending that checks completed IDs
rather than unlocked levels. Recorded the existing startup resume gap: saved
`currentLevelId` is not loaded into the initial visit. That is deferred to the
ending/save-flow pass, not silently treated as implemented. Touch balance and
a full twelve-visit player run remain open.

Verified `node test/test_mechanics.js`, `node test/test_dusk.js`, and
`node test/test_midnight.js`, module syntax, and `git diff --check`. Headless
Edge ran `test/midnight-browser.html` through real handlers with synthetic pen
Pointer Events: sparse fast strokes, moving targets, wrong-order feedback,
interruption without scoring, expiry, three traces through victory, pending
quota preservation and spawning after clearance, practice save isolation,
non-overlapping five-insect starts at 320×300, 960×320, and 390×640, plus the
mode setter's active-stroke rejection and retry default. The original spawn
fixture froze blockers while expecting immediate replenishment; corrected it
to test queued quotas before clearing the blockers. `test/dusk-browser.html`
also passed its five enclosure gestures through victory after input refactoring.
Inspected desktop field and ready-card images and a 390-pixel portrait ready
card. Moved frame edges below the HUD after seeing text cross the dark border.
These are controlled-input checks, not a manual or real-touch completion run.
