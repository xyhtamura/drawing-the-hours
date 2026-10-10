# Drawing the Hours notes

Playable meadow gesture prototype with moving creatures, combinations, and
multi-pocket drawings. The [working scope](SPEC.md) points to Xyh's
[concept and aesthetic direction](CONCEPT.md). Morning Verge is implemented
in `index.html`; earlier concept documents contain superseded proposals.
The project title is Drawing the Hours; the folder was renamed to `drawing-the-hours/` on 2026-09-14.
The [hours and inhabitants note](HOURS.md) records earlier naming options,
visits at quiet hours, a broader cast, and candidate timers.

## Next in Dev

Play the revised aquarium levels on a touch device and tune shoal separation, beetle pacing, and bubble disturbance strength; the twenty-four-visit meadow pacing pass remains pending.

## Activity

2026-10-10 — Claude Code — Gave Between Banks its own favicon at Xyh's request for the multicart's three hax: between-banks/favicon.svg, a fish seen from the side on the water blue, an original drawing. between-banks/index.html now links it in place of the meadow's ../favicon.svg. Rendered at 16, 32, and 96 px in headless Edge on light and dark backgrounds and inspected the screenshot; the motif is legible at 16 px. The root server returns the file as image/svg+xml. Display in an actual browser tab was not checked.

2026-10-03 — Claude Code — Checked the eight new ready cards at phone width (375 x 812 emulation) and fixed four caption overlaps.

- **Nothing is clipped.** At that width the game keeps its 640 x 960 field and scales it by 375/640, so a card is the same 500-unit card as on desktop, drawn smaller. No picture reaches the card edge.
- **Four loops ran into their own captions**, at every width: the pair loops on II under their labels, and the loop on VIII, on X and XII (the Seed & Trio picture), and on VII (the flax picture) through the first caption line. The last two predate this work. Each loop is now flatter and sits higher.

Verification: screenshots of all eight cards at 375 x 812, then of II, VII, VIII, and X again after the fix; all eight `node test/test_*.js` suites pass.

Open: at 375 px the scale is 0.59, so the 11-unit caption lines render at about 6.5 CSS px and the 13-unit instruction at about 7.6. That is true of every ready card, old and new, and follows from the fixed-size field; it was not changed here. Checked in emulation only, not on a phone.

2026-10-03 — Claude Code — Gave the eight visits that had no teaching picture one each, on Xyh's request.

- **Six new pictures** in `Game.drawReadyModal`: II a matching pair beside a two-kind loop that gathers nothing; VI the three Dawn figures side by side; VIII a Seed & Wing loop beside a seed carried along a gust; XI a loop closed clear of the web beside a cord cut at it; XIV a Counterpart Pair beside one kind divided across the crossing; XX the firefly-first trace bent over a hoverfly.
- **Two reuse an existing picture** with its lines taken from the visit: X uses the Seed & Trio picture without the web line, and XVII uses the switching picture, whose loop, figure-eight, and flier counts now come from the level.
- `Game.drawCardCross` draws the mark beside a figure that does not count.

Verification: all eight `node test/test_*.js` suites pass. Each of the eight cards was opened in the page at `http://localhost:8000/drawing-the-hours/` and read by screenshot at an 800 x 450 pane: picture, labels, and both caption lines sit inside the card and clear of the Begin prompt.

Not done: the cards were not checked at phone width, where the card is narrower than the widest pictures (about 290 px across). The rule each picture states was checked against `src/recipes.js` and the trace logic, not by playing.

2026-10-03 — Claude Code — Stretched the campaign from twelve visits to twenty-four, six an hour, on Xyh's call that mechanics arrived too quickly.

- **Sequence.** The order of introduction is the same. A visit now adds at most one thing, and the sixth visit of each hour adds nothing. The table, with which visits keep a twelve-visit field unchanged, is in [CAMPAIGN.md](CAMPAIGN.md) under "Twenty-four visits revision, 2026-10-03". Xyh's six lines per hour in [first12levels.md](first12levels.md) are used in order and are not tied to the mechanics.
- **Ids moved.** `dawn-02`→`dawn-04`, `dawn-03`→`dawn-05`, `noon-02`→`noon-03`, `noon-03`→`noon-06`, `dusk-02`→`dusk-04`, `dusk-03`→`dusk-06`, `midnight-02`→`midnight-03`, `midnight-03`→`midnight-06`. Entries below this one use the old ids and the old visit numbers.
- **Second Trace recipe** (Midnight XXII): lacewing → firefly → the other lacewing. `Game.traceStatus` reads `traceSequences` when a level lists more than one recipe and picks the one the stroke follows furthest; a lacewing-first trace is tagged `lacewingTrace` as well as `trace`. New objective label, hint text, and diagram for it.
- **Jasmine** moved to XXIII so that XXIV adds nothing. XXIV takes either trace.
- **Cicadas** follow a `cicadas: true` level flag instead of a level id; the flag sits on XIV, the visit whose line is about them.
- **Ready cards.** New teaching visits reuse the nearest existing diagram with the line that does not apply swapped out (III, XV, XXII, XXIII). The buffer and culmination visits (II, VI, VIII, X, XI, XIV, XVII, XX) show the instruction and the requirement diagrams only.
- **Save key** is `dth_campaign_save_v2`; a v1 save is left unread, so progress restarts at Visit I. "Unlock all visits" still works.
- `campaign-plan.json` regenerated from `src/campaign.js`. Field Book flax, jasmine, and Ordered Trace entries, the gesture hint, the final card ("Twenty-Four Visits Complete"), and the STRING.md status paragraph updated.

Verification:
- All eight `node test/test_*.js` suites pass. New assertions: six visits per hour numbered by position; each Noon and Dusk visit's added element and requirement; the jasmine in XXIII and XXIV only; one cicada visit; and, through real pointer events on `Game`, that the lacewing-first trace scores in XXII while firefly-first does not, that XXIII and XXIV score both, and that a stroke following neither recipe scores nothing.
- In the page at `http://localhost:8000/drawing-the-hours/`: started each of the 24 visits, drew its ready card, ran 30 update steps and one draw, and read the spawned entities — every population matched its level, with no console errors. The Visits list shows six per hour. The XXII card was checked by screenshot: lacewing, firefly, lacewing, numbered 1 to 3.

Not done:
- **No visit was played.** Counts, durations, and motion scales on the twelve new visits are first-pass numbers set by analogy with their neighbours. Whether VI, XII, XVIII each feel like a culmination, and whether XXIV is still the hardest, is unobserved.
- The lacewing-first recipe needs both lacewings at once; with two on the field there is exactly one such trace available at a time. Not checked in play whether that waits too long.
- Titles for the new visits are proposals drawn from Xyh's lines, not Xyh's.
- `test/*-browser.html` had ids renamed but were not run.
- `DAY-1-PACING.md`, `DUSK.md`, `MIDNIGHT.md`, `HOURS.md`, and the dated sections of STRING.md and CAMPAIGN.md still describe twelve visits. Left as dated record; STRING.md and CAMPAIGN.md say so at the top of the relevant section.
- `first12levels.md` keeps its filename though it now holds twenty-four lines; tests and docs cite it.
- Decided against requiring one trace of each recipe in XXIV: it would add a sixth requirement row to the card. XXIII requires one lacewing-first trace instead.

2026-09-18 — Antigravity — Added close X buttons to popups and an on/off hints toggle setting in Settings.

- **Dedicated close X buttons on popups.** Added delicate circular paper close buttons (`.modal-close-btn`) to Settings (`#settings-menu`), Field Book (`#fieldbook-modal`), Visits (`#visit-modal`), and Pause Menu (`#pause-menu`). In Field Book and Visits, the close button uses `position: sticky; top: 0; float: right; z-index: 25;` so it is immediately visible without scrolling and stays pinned at the top-right even when reading down lengthy recipe entries. In Pause and Settings shell cards, it is pinned with `position: absolute; top: 16px; right: 16px;` to preserve centered title alignment. The bottom "Back to menu" / "Resume" buttons remain for backwards compatibility and keyboard users. Clicking the modal backdrop outside the card also dismisses the popup (resumes game on Pause, returns to Pause menu on sub-modals).
- **Hints toggle in Settings.** Added `<button id="btn-hints">` in Settings allowing players to toggle the stalled-play hint on or off (`Hints: On` / `Hints: Off`), styled identically to the Sound toggle. Setting state is persisted in `localStorage` under `drawing-the-hours-hints`. When disabled, `updateHint(dt)` returns immediately without accumulating stalled time or showing a hint; disabling hints during active play immediately dismisses any active hint card and rectangle.

Verification:
- `test/test_flow.js`: added suite 9 verifying hints toggle initialization, storage persistence, timer suppression, active hint dismissal on disable, presence of `#btn-hints` and all four `#btn-close-*-x` buttons, backdrop click listeners, and CSS sticky/absolute positioning rules.
- `test/shell-browser.html`: updated iframe browser test suite with checks for Settings close X, Hints button toggle on/off, Field Book close X, Visits modal close X, and Pause close X.
- Automated browser verification in headless Edge driving `http://localhost:8000/drawing-the-hours/index.html` via Chrome DevTools Protocol: verified title begin, pause menu opening and close X resume, settings menu opening and close X return, hints toggle button text and localStorage persistence ('off' / 'on'), field book close X return without scrolling, visits close X return, and backdrop click dismissal.
- All unit test suites pass (`test_flow.js`, `test_noon.js`, `test_mechanics.js`, `test_dusk.js`, `test_midnight.js`, `test_jasmine.js`, `test_string_sandbox.js`), `node --check` passes cleanly on all modified files, and `git diff --check` passes.

2026-09-17 — Antigravity — Added level completion fade-out wash, dedicated Continue button on Visit Complete card to prevent accidental advance, and reduced Noon VI web hazard to one web.

- **Level fade-out before Visit Complete.** When all visit objectives are met, `victoryDelay` extends to 1.35 s: the player first sees the completion stamp and banner, then over the final 1.05 s the field, moving inhabitants, and HUD smoothly dim under a soft parchment wash (`rgba(40, 32, 28, ...)`). When the state changes to `LEVEL_COMPLETE`, the modal eases in over 0.25 s, removing the jarring snap.
- **Dedicated Continue button on Visit Complete.** Replaced the generic prompt text with an explicit, tactile paper button box centered at the bottom of the card (`this.levelCompleteButton = { x, y, w, h }`). `handleOverlayClick` now intercepts clicks during `LEVEL_COMPLETE` and `VICTORY`: clicking inside the button triggers `advance()`, while clicking anywhere else on the canvas or background is swallowed, preventing accidental skips to the next visit on touch devices or stray clicks. Keyboard users can still press Space.
- **Noon VI web hazard reduced to 1 web.** `noon-03` (`The glass and the leaves`) now strings 1 web instead of 2, positioned at [0.29, 0.31]. Level instructions and design notes updated to singular "The web and the hornet cut a cord they touch." in both `src/campaign.js` and `campaign-plan.json`; `teachNoon03` ready card updated to "Avoid the web and the hornet."

Verification:
- `test/test_noon.js`: updated to assert 1 web and 1 web patch for Noon VI; plan and runtime agreement verified.
- `test/test_mechanics.js`: updated Noon VI web assertion to 1 web.
- `test/test_flow.js`: added suite 8 verifying `LEVEL_COMPLETE` button hit-testing — clicking outside the Continue button is swallowed without advancing state or changing level, and clicking the Continue button advances to the next visit.
- Real browser verification in headless Edge driving `index.html`: verified victory delay, parchment wash fade-out, Visit Complete Continue button layout, background click swallowing, and button click advancement to Visit II.
- All seven unit test suites pass (`test_noon.js`, `test_flow.js`, `test_mechanics.js`, `test_dusk.js`, `test_midnight.js`, `test_jasmine.js`, `test_string_sandbox.js`), `node --check` syntax check passes on all modified files, and `git diff --check` passes cleanly.

2026-09-16 — Claude Code — Moved the night jasmine to Midnight XII alone, on
Xyh's call: XI is playable without it, and leaving it out gives that visit's card
its space back.

- `midnight-02` loses `jasmine` and `jasminePlaces`; its instruction and ready
  card return to what they were. `midnight-03` keeps the flower at (0.18, 0.40),
  the fullest field of the day.
- **Fixed a misplacement from the entry below.** The XII jasmine line had landed
  in the level-complete card rather than the XII ready card, and XI's line sat on
  top of an existing line at the same height. XII's ready card now carries it, in
  the space the "Brimstone butterflies and the perimeter snail return" line used
  to take: the flower and the Brimstone are drawn side by side, the first line
  teaches the flower, and the returning cast moves into the last line with the
  purity reminder.

Verification: `test/test_jasmine.js` now asserts the flower is authored into XII
alone, with X and XI carrying none in both the runtime and the plan, and drives
its behaviour checks through `midnight-03`. All seven suites, `node --check`, and
`git diff --check` pass. In the live page, Midnight XII spawns one jasmine and XI
none, and XI's ready card reads as it did before the flower was added.

2026-09-16 — Claude Code — Added the night jasmine to Midnight XI–XII and named
the three relations a stroke can have to an entity, after Xyh's playtest of the
later visits: the required figures interact, the field clusters, and a clean
pocket becomes hard to find.

- **Three gesture relations** (`gestureRoles` in `src/string.js`, STRING.md rule
  10). **Thread starter**: the stroke begins inside the entity's radius.
  **Threaded**: it begins outside and crosses the entity — what threads a bead.
  **Thread ended**: it ends inside the radius; nothing reads it yet, and it is
  named so the third case is not reinvented. Xyh's taxonomy, written down so a
  rule can ask for one instead of inventing its own test.
- **Night jasmine** (`NightJasmine` in `src/entities.js`, `type: 'plant'`). A
  stroke that is a thread starter on an open jasmine takes the first insect it
  threads: the cord ends there, the insect flies over and settles for
  `JASMINE_STAY` (24 s), and the bloom is spent while its guest sits. It scores
  nothing and advances no objective — Xyh's call. What it buys is one insect out
  of the cluster and a target that holds still. A guest gathered into a drawing
  frees the flower early; when the stay ends the spent bloom closes and another
  opens `JASMINE_REGROW` (12 s) later, so it regenerates rather than standing
  there permanently. A thread begun in a spent bloom is an ordinary thread.
- **Where it stands.** XI has one at the foot of the window (0.50, 0.84); XII has
  one off to the left (0.18, 0.40), so thinning the field costs a trip. X keeps
  none: tracing is still being taught there.
- **Parked insects** keep `state: 'roaming'` and are enclosable while they sit;
  `Insect.update` flies them to the flower at 150 px/s and then holds them.
- **HUD fix found while testing XI.** The wide layout wrote the objective list on
  one line, and five requirements ran it back across the cord meter and the
  clock. It now wraps into the space right of the meter, and the title and score
  drop with it. This was the other half of Xyh's "hard to tell what's missing".

Verification:

- New `test/test_jasmine.js`: the three relations, including a stroke that stays
  clear and an empty stroke; the jasmine authored into XI and XII only, with the
  plan agreeing on cast and placement; a take that ends the cord, settles the
  guest, scores nothing and advances no objective; the guest arriving and then
  holding still; a spent bloom refusing a second insect; the stay ending, the
  bloom closing, and a regrow queued; a guest harmonized early freeing its
  flower; the jasmine never threaded and never pocket content. All seven suites,
  `node --check`, and `git diff --check` pass.
- In the live page at `http://localhost:8000/drawing-the-hours/`: a dispatched
  stroke from inside the flower through a lacewing ended the cord, banner
  "Lacewing settled on the jasmine. It stays for 24 seconds.", score 0 and
  objectives unchanged, and the lacewing sat at distance 0 from the flower three
  seconds later. Screenshots: an open bloom mid-field, and Midnight XI with the
  wrapped HUD.
- Not measured: 24 s, the 12 s regrow, and one flower per visit are first
  guesses. Whether the jasmine actually relieves the clustering is a playtest
  question, not something these checks answer.

Left undone: what a **thread ended** relation should do (named, unused), and
Xyh's earlier future idea that a hazard could become a wanted ingredient. Both
are recorded in STRING.md rather than built.

2026-09-16 — Claude Code — Second pass on the day after Xyh played the first
one. Hazards were sorted into kinds, Noon's pressure changed from care to count,
the cord pickup changed hands, and the visit card became reopenable.

- **A hazard cuts or is a dud, and a fixed path belongs to a thing.** Xyh's two
  rules. The hornet now flies like the other insects — `Hornet extends Insect`
  with its own `SPECIES_CONFIG` entry, so it wanders and turns — and its drawn
  lane is gone, because a creature on a fixed route read as scenery. The web is
  the only fixed-place hazard, and it is a thing. The snail no longer cuts the
  cord (`cutsCord: false`); it spoils a pocket that holds it, which the hornet
  does too under the purity rule. `checkCordHazards` now selects on `cutsCord`
  rather than on entity type. **This reverses Xyh's 2026-09-15 decision that a
  cord touching the snail breaks**, on Xyh's own proposal; Dawn II–III keep the
  seam snail as a dud ingredient.
- **Noon asks for more, not for care.** Xyh: the hornet visit played as care and
  timing, which is Dusk's theme, and Noon should feel quick. Each Noon visit now
  requires six combinations instead of four, on the same simple loops: IV six
  with two trios, V six with three Seed & Wing, VI six with two Seed & Trio.
  Clocks and casts are unchanged.
- **The cord pickup lengthens the next cord.** Following Xyh's note that it
  should be botanical and short-lived: picking it does not lengthen the cord that
  picks it. `BEAN_BONUS` (400 px) goes to the next stroke, the meter shows the
  longer allowance before that stroke starts, an unused pod dries out after
  `BEAN_KEEPS_SECONDS` (12 s), and another grows `BEAN_REGROW_SECONDS` (8 s)
  after one is taken. **The skin is Codex's** — see the handoff below.
- **The visit card reopens during play.** Xyh could not tell which required
  figures were still missing at Midnight XI. A `CARD` state draws the ready card
  again over the paused field; the **Visit Card** control or `C` opens it, the
  next click or Space resumes, the clock stops meanwhile, and the visit is not
  reset. The card's footer reads Resume rather than Begin when reopened.
- **Seeds take the visit's motion scale.** Xyh noticed seeds outrunning insects
  at Dusk. They did: `DandelionSeed` ignored `motionScale` entirely while fliers
  were multiplied by 0.85. Seeds now take it, and their base drift dropped from
  0.5–0.9 to 0.38–0.68.
- **Recorded, not built:** hazards as wanted ingredients in a later recipe
  (Xyh's future idea, noted in STRING.md rule 6). Figure-eights stay at the
  current cord length; Xyh confirmed it.

Verification:

- `test/test_noon.js` rewritten for the new design: the hornet wanders (heading
  changes and it leaves its starting line across 30 simulated seconds, staying on
  the field), keeps no lane, and cuts; the snail does not cut; both spoil a
  pocket; the web is the only fixed-place hazard and keeps its ratio on resize;
  the picking cord is not lengthened while the next one is, the kept pod shows on
  the meter, is spent by one stroke, and dries out after twelve seconds; beans are
  neither beads nor content; the visit card opens mid-visit, stops the clock, and
  leaves objectives intact. `test_mechanics.js` and `test_string_sandbox.js`
  updated for the snail: a cord drawn over one keeps going, and a pocket holding
  one scores nothing. All six suites, `node --check`, and `git diff --check` pass.
- In the live page at `http://localhost:8000/drawing-the-hours/`: the Noon V
  hornet turned and left its starting line (−57, −23 px over ten seconds); picking
  the pod left the picking stroke at 1,300 px, showed 1,700 px on the meter after
  release, gave the next stroke 1,700 px, and dropped back to 1,300 px once spent;
  a cord drawn across the Dawn II snail survived; the Visit Card button opened the
  card with the clock held at 50 s through two seconds of updates, and the footer
  read Resume. Screenshot: the Dawn II card reopened mid-visit.
- Not measured: six combinations per Noon visit, the 12 s keep, the 8 s regrow,
  and the hornet's flight speed are first guesses awaiting Xyh's play.

**Handoff to Codex — reskin the Noon cord-length pickup.** The object is
placeholder work by Claude Code: `StringBean` in `src/entities.js` (a green bean
pod), `drawBeanGlyph` in `src/game.js` for the ready cards, the Field Book entry
"String Bean" in `index.html`, and the copy on the Noon IV and VI cards. Xyh's
brief: botanical, elemental, or edgelands, and oblique rather than literal —
"string bean" is the first thing that came to mind, not the decision. Yours to
choose, draw, and name.

What must keep working, because the rules and tests depend on it: the entity
keeps `type: 'bean'` (rename the class and the kind if you like, but change
`src/game.js`, `src/string.js`, the `population` key in `src/campaign.js` and
`campaign-plan.json`, and `test/test_noon.js` together); it is picked when the
held cord comes within `radius + 3`; the bonus lands on the next stroke, not the
one that picks it; it is never threaded, never pocket content, never tappable.
`test/test_noon.js` checks each of those. The Field Book entry carries
`data-reveal-hour="noon"`, and `DOC_STYLE_GUIDE.md` and `WRITING_VOICE_AGENT.md`
govern the copy. One agent per folder: this session is finished in here.

2026-09-16 — Claude Code — Moved the crossing out of Noon and into Dusk, and
gave Noon a power-up and hazards instead, following Xyh's decision on
[DAY-1-PACING.md](DAY-1-PACING.md). Each hour now asks for one new kind of
attention: Dawn closes a loop, Noon manages the field and the cord, Dusk crosses
the cord, Midnight threads in order.

- **Noon IV–VI require loops only.** IV: four combinations including two trios,
  on a clear field (2 Brimstones, 2 hoverflies, 2 hawkmoths). V: four including
  two Seed & Wing, with the hornet and the gusts; its hawkmoths and snail are
  gone, which carries out priority 1 of the pacing document. VI: unchanged
  Seed & Trio goals, now against the hornet, two webs, and the breeze.
- **Cord spool** (`CordSpool` in `src/entities.js`). Running the held cord over
  one adds 400 px to that stroke's `maxCordLength`; the meter's snap mark moves
  with it. The thread lasts for that stroke only, the spool leaves the field, and
  another is placed 8 s later on clear ground. It is never a bead, never pocket
  content, and cannot be tapped. `Game.cordLimit()` is the one reading of the
  limit that the HUD and the tests share.
- **Hornet** (`Hornet`). Patrols one horizontal lane at about 54 px/s, turning at
  the edges; `drawHornetLanes` draws the lane faintly so the patrol can be read
  before a cord is drawn. Breaks a cord it touches and spoils a pocket that holds
  it. Drawn deeper amber with heavier bands, a dark head, and a sting, so it does
  not read as a hoverfly.
- **Web patch** (`WebPatch`). Static, placed by field ratio from the level's
  `webPatches`, kept clear of the HUD and the bottom frame on short canvases.
  Breaks a cord it touches. It is `type: 'terrain'`, not a hazard entity, so a
  loop drawn around a web is valid — the cord simply cannot cross it.
- **Shared plumbing.** `checkCordHazards` now covers terrain and names what broke
  the cord (`HAZARD_BREAK_MESSAGE`); population upkeep counts hazards, terrain,
  and spools by kind rather than folding every hazard into `snail`; pocket
  gathering, bead threading, and tap targeting all exclude terrain and spools.
- **Dusk VII is the first crossing.** Its objectives are unchanged; the
  instruction and the ready card now teach the shape rather than recall it. A
  resting lacewing and a holding hoverfly are the stillest pair in the game, so
  the new shape is learned against targets that wait. Nursery Polarity needed no
  move: it was already Dusk VIII, which is now the visit after the lesson.
- **Copy and cards.** New Noon ready cards (`teachNoon01/02/03` in `src/game.js`,
  renamed from the recipe-named flags): a trio loop with a spool, a Seed & Wing
  loop with the hornet's lane, and the Seed & Trio loop with a spool. Field Book
  gained Cord Spool, Atrium Hornet, and Web Patch under `data-reveal-hour="noon"`;
  Counterpart Pair and Nursery Polarity moved to the Dusk reveal; the hoverfly
  entry no longer teaches a figure-eight. `CAMPAIGN.md`, `STRING.md`, and
  `DAY-1-PACING.md` record the arc, the spool's exception to the shared snap
  limit, and the three cord-breaking hazards.

Verification:

- New `test/test_noon.js`: Noon requires no crossing key and the plan agrees on
  cast, goals, instructions, and web positions; the hornet's lane, 54 px/s speed,
  edge turns, and lane after a resize; both hazards breaking a cord with their own
  message and the hornet spoiling a pocket; a loop drawn around a web scoring; a
  spool raising the limit to 1,700 px for its stroke, leaving the field, queueing
  its return, and dropping back to 1,300 px on release; spools as neither beads
  nor content; the trio scoring at IV and Seed & Trio at VI.
- `test/test_mechanics.js` and `test/test_string_sandbox.js` updated: Noon's
  objective assertions follow the new design, every Noon level is asserted to
  require no crossing key, and the figure-eight closure checks moved to Dusk VII
  and VIII where the shape is now taught. All six suites, `node --check`, and
  `git diff --check` pass.
- In-app browser at `http://localhost:8000/drawing-the-hours/`: Noon VI spawns
  2 Brimstones, 2 hoverflies, 2 hawkmoths, 2 seeds, 1 hornet, 2 webs, 1 spool;
  a dispatched stroke over the spool raised `cordLimit()` from 1,300 to 1,700,
  removed the spool, queued its 8 s return, and dropped back to 1,300 on release;
  a stroke into the hornet broke with "The hornet broke the cord. Watch its lane."
  Screenshots: the Noon V field with the hornet on its dashed lane, and the ready
  cards for Noon IV, V, VI and Dusk VII. The Field Book showed the three new Noon
  entries and hid Counterpart Pair and Nursery until Dusk.
- Not a manual or touch run, and no balance measurement: the trio at IV, the
  400 px bonus, the 8 s respawn, the hornet's speed, and the web positions are
  first guesses.

Left undone: the pacing document's priorities 3–6 (Midnight XI motion, a Dusk IX
snail route, one Seed & Trio at VI, Midnight XII's cast) are still open, and
`test/measure_string_sandbox.js` still cannot measure a Noon loop, because its
scripted player plans single loops only — the four-target Seed & Trio with a spool
detour is exactly the case it cannot play. Xyh's touch playtest of Noon and the
new Dusk opening is the next step.

2026-09-16 — Claude Code — Built the remaining day-one review items (handoff
item 4) and recorded Xyh's answers to the rest of that handoff.

- **Failure card.** Retry, Practice this visit, and Level select are now three
  clickable rows on the game-over card in `src/game.js`; Space still takes the
  first. Retry returns to the ready screen rather than the story card. Canvas
  clicks reach them through `handleOverlayClick`, which `index.html` calls
  before the advance handler.
- **Untimed practice of a visit.** `CampaignManager.startPracticeOf` copies the
  failed visit as `practice-visit` with `untimed: true`, runs it in practice
  mode, and so writes no completion, unlock, or best score. The clock is frozen
  and reads `--:--` / Untimed; the HUD, pause card, ready diagram, and the Dusk
  cicada layer follow `practiceOf` so the copy behaves as its source visit.
- **Hint.** After twelve seconds of play without objective progress, a
  dismissible card names one unfinished requirement, counts what is left, and
  draws the figure (loop, crossed loop, or threaded line) as cord and marks. It
  moves nothing on the field. A press on the card dismisses it and starts the
  twelve seconds again; objective progress clears it.
- **Resume on reload.** `CampaignManager` now loads `currentLevelId` into the
  opening visit and flags `resumedFromSave`; the game opens that visit at its
  ready screen instead of replaying the story card. An unknown or not-yet-playable
  saved ID falls back to Dawn I. This closes the startup gap recorded on 2026-09-15.
- **Progress gates.** The visit list unlocks only what the save has reached —
  the highest unlocked index, completed IDs, and the visit in play — and the
  practice verges for an hour appear with that hour. `isHourReached` in
  `src/campaign.js` drives both that and the Field Book, whose Noon, Dusk, and
  Midnight entries are now separate entries tagged `data-reveal-hour`. The
  Threading & Beads entry no longer explains the Midnight trace.
- **Save controls.** The Unlock All in Save button is hidden unless the page is
  opened with `?dev`; `window.unlockAllLevels()` and `window.resetProgress()`
  are unchanged.
- **Failure line.** The card's second line follows the hour rather than saying
  "morning breeze" at Midnight.

Verification:

- New `test/test_flow.js`: hour gates, save resume and fallback, untimed
  practice writing nothing over two simulated minutes, hint timing at 11 s and
  13 s with dismissal and re-arming, the three failure options and their
  rectangles and actions (including that the untimed copy offers no practice of
  itself), the per-hour failure line, and the page gates. The four existing
  suites, `node --check`, and `git diff --check` pass.
- In-app browser at `http://localhost:8000/drawing-the-hours/`, driving the real
  page with dispatched click and pointer events: a fresh save hides every
  reveal-tagged Field Book entry and locks Visits II–XII; recording Dawn I–III
  victories reveals Noon's visit, practice verge, and four Field Book entries
  while Dusk and Midnight stay hidden; a click on Practice this visit started
  `practice-visit` of Dusk VII, whose clock stayed at 100 s through 30 s of
  updates with the save untouched; a pointer press on the hint card dismissed it
  without starting a cord, while a press elsewhere still drew; a reload resumed
  Dusk VII at READY; `?dev` showed the save control and Unlock All opened
  everything; Level select opened the visit list from the failure card; the
  Midnight card read "slipped away into the dark". Screenshots: the Noon failure
  card at desktop width and at 375×812, and the Midnight hint card at 375×812.
- Not a manual or real-touch run. The browser pane pauses `requestAnimationFrame`
  while hidden, so these checks stepped `update()` and `render()` directly.

Xyh's answers to the previous handoff: Midnight is complete (item 1), 1,300 px
feels fine (item 2), and item 4 was to be built. **Dropped: the figure-eight path
in the measurement script.** Item 2 existed to re-measure the cord limit across
the day; with the limit accepted, the measurement is not needed, so it was not
written. Item 3, the touch playtest, is Xyh's and remains open.

Handoff for the next agent:

1. Playtest on a touch device across the day: closing loops and figure-eights by
   crossing, tap thresholds, threading speed, the 1,300 px limit, both wind
   directions, and purity. Xyh's to run.
2. The failure card's Level select leaves the game in GAMEOVER behind the modal;
   closing the modal without choosing returns to the failure card. Decide whether
   that is right, or whether closing should retry.
3. The hint card sits at a fixed position under the HUD (x 12, y 132/150). It has
   not been checked against every scene's artwork at small heights.

2026-09-16 — Antigravity — Rolled the string rules out to Midnight X–XII and removed obsolete Enclose/Trace modes across the app. All twelve campaign visits and practice levels now run under single-gesture string rules.

- `midnight-01`, `midnight-02`, and `midnight-03` set `stringRules: true` and
  `gestures: ['string']` in `src/campaign.js` and `campaign-plan.json`;
  `practice-midnight` automatically inherits both. STRING.md's status line
  names all twelve visits and practice levels, keeping Test 21 green.
- Mode switching removed: deleted `#btn-gesture-mode` button, click listener,
  and `[T]` shortcut from `index.html`. Removed Enclose/Trace mode banner lines
  from canvas HUD and footer. Removed `TraceGesture` usage and `drawTraceTargets`
  from `src/game.js`, with cord drawing dyed cotton with trace blue when ready.
- Redrew ready cards for Visits X (`teachMidnight01`), XI (`teachMidnight02`),
  and XII (`teachMidnight03`) in `src/game.js`: no modes, showing threading to trace
  or closing the cord to loop, and explaining that a stroke cannot both thread and enclose.
- Updated documentation in `CAMPAIGN.md`, `MIDNIGHT.md`, `STRING.md`, and
  Field Book entries in `index.html`.
- Updated test suites: updated `test/test_midnight.js` to assert one-gesture string
  rules across Midnight; added Test 24 to `test/test_string_sandbox.js` covering
  ordered trace threading in Visit X, loop enclosure, counterpart figure-8, and
  purity cancellation in Visit XI, and synthesis with snail hazard in Visit XII.

Verification:

- All four test suites (`test_string_sandbox.js`, `test_mechanics.js`,
  `test_dusk.js`, `test_midnight.js`), `node --check`, and `git diff --check` pass.

Not done: figure-eights in measurement script, and physical touch playtesting on mobile devices.

2026-09-16 — Antigravity — Rolled the string rules out to Dusk VII–IX (handoff
item 1 of the previous entry). Only Midnight remains on the old modes.

- `dusk-01`, `dusk-02`, and `dusk-03` set `stringRules: true` and
  `gestures: ['string']` in `src/campaign.js` and `campaign-plan.json`;
  `practice-dusk`, a copy of `dusk-01`, inherits both. STRING.md's status line
  names all four, keeping test 21 green.
- Dusk ready cards (`teachLacewing`, `teachDusk02`, `teachDusk03` in `src/game.js`)
  now adopt the 445 px modal height (`teachDusk`). Added closure hints:
  Visit VII adds "Run the cord back onto or across its start to close.",
  Visit VIII adds "Cross your start to close.", Visit IX adds "Cross your start
  to close." Diagrams and timings remain unchanged.
- Lacewing wall interactions verified: when a travelling lacewing collides
  with a drawn wall, its route clock (`laceElapsed`) pauses so it does not jump
  through walls, and resumes along leaf anchors on cord release. A threaded
  lacewing is held still (`state === 'bead'`) on the cord instead of flying along
  leaf routes. Snail hazards crawl their seam in Dusk and break the cord on contact.
  Ambient cicada audio remains active.

Verification:

- New test 23 in `test/test_string_sandbox.js` checks Dusk VII–IX flags and
  plan agreement, figure-eight closure across start scoring Lacewing Counterpart
  in `dusk-01` (and scoring nothing when stopping short), single-loop Nursery in
  `dusk-02`, switching gesture objectives in `dusk-03`, snail hazard cord breaks,
  lacewing wall collision holding route position, and threaded lacewing stillness.
- All four test suites (`test_string_sandbox.js`, `test_mechanics.js`,
  `test_dusk.js`, `test_midnight.js`), `node --check`, and `git diff --check` pass.

Not done: physical touch playtesting on a tablet/phone, and Midnight X–XII rollout.

Handoff for the next agent:

1. **String rules for Midnight X–XII.** Trace is threading in sequence with
   purity (STRING.md rule 4). Redraw the Visit X and XI Trace cards for
   threading. Then remove the modes: the Enclose / Trace button, the `T`
   shortcut, `gestureMode`, `setGestureMode`, `TraceGesture`, and the Trace HUD
   line; update CAMPAIGN.md, MIDNIGHT.md, the Field Book, and the STRING.md
   removed/kept list.
2. **Figure-eights in the measurement script.** Give its player a figure-eight
   path so Noon IV–V and Dusk can be measured, then re-measure the 1,300 px
   limit across the day.
3. Playtest on a touch device across the day: closing loops and figure-eights by
   crossing, tap thresholds, threading speed, the 1,300 px limit, both wind
   directions, and purity.
4. Remaining from the day-one review entry: failure flow (Level select, untimed
   practice, hint), resuming on reload, the Unlock All button, Midnight entries in
   the Field Book shown to Dawn players, and the "morning breeze" game-over
   subtitle shown at every hour.

2026-09-16 — Claude Code — Rolled the string rules out to Noon IV–VI (handoff
item 2 of the STRING.md upkeep entry below). Dusk, Midnight, and removing the
modes are left for the next agent, as Xyh asked for the heavier work.

- `noon-01`, `noon-02`, and `noon-03` set `stringRules: true` and
  `gestures: ['string']` in `src/campaign.js` and `campaign-plan.json`;
  `practice-noon`, a copy of `noon-01`, inherits both. STRING.md's status line
  names all four, so test 21 passes.
- The Noon ready cards now use the 445 px card height. Noon IV adds "Run the cord
  back onto or across its start to close both pockets."; Noon V's first line
  reads "Nursery: 1 flier and 1 seed in separate pockets. Cross your start to
  close."; Noon VI's reads "Seed & Trio: 1 seed and 3 different insects in a
  loop that crosses itself." The diagrams themselves are unchanged.
- The measurement script's player draws circles only, so Noon's figure-eight
  objectives are unmeasured; recorded in STRING.md build step 7.

Verification:

- New test 22 in `test/test_string_sandbox.js` checks the four levels' flags and
  the plan, then draws a figure-eight through the game's own pointer handlers:
  run past its start around a Brimstone and a hoverfly in `noon-01` it scores a
  Counterpart Pair; stopped 0.4 rad short it scores nothing; around a hawkmoth
  and a seed in `noon-02` it scores a Nursery. All four suites, `node --check`,
  and `git diff --check` pass.
- Live page: in `noon-01` the same figure-eight showed two closed pockets while
  held; over 3 s of held play the Brimstone and hoverfly stayed in their lobes
  (at most 56 px from the waist line against 80 px lobes), and release scored
  "Counterpart Pair (+400 pts)". In `noon-02` a held figure-eight around a
  hawkmoth and a seed lasted through a gust without the seed leaving its lobe, and
  release scored "Nursery Polarity (+375 pts)". Every line on the Noon transition
  and ready cards fit inside the card at 996 px and at 339 px wide.

Not done: no touch playtest of closing a figure-eight by finger, and no
retuning of Noon clocks or populations under walls.

Handoff for the next agent, in order. It replaces the list in the 2026-09-16
STRING.md upkeep entry. Follow "Keeping this document current" in STRING.md.

1. **String rules for Dusk VII–IX**, one visit at a time, as Noon was done: set
   `stringRules: true` and `gestures: ['string']` in both data files, add each ID
   (and `practice-dusk`) to the STRING.md status line, add closure hints to the
   Dusk ready cards (`teachLacewing`, `teachDusk02`, `teachDusk03` in
   `src/game.js`), and extend test 22's pattern. In the live page, check that
   lacewings stop at walls and resume their leaf route after release, that a
   threaded lacewing holds still, and that the Dusk VIII cicada layer still plays.
2. **String rules for Midnight X–XII.** The Trace is threading in sequence with
   purity (STRING.md rule 4). Redraw the Visit X and XI Trace cards for
   threading. Then remove the modes: the Enclose / Trace button, the `T`
   shortcut, `gestureMode`, `setGestureMode`, `TraceGesture`, and the Trace HUD
   line; update CAMPAIGN.md, MIDNIGHT.md, the Field Book, and the STRING.md
   removed/kept list.
3. **Figure-eights in the measurement script.** Give its player a figure-eight
   path so Noon IV–V and Dusk can be measured, then re-measure the 1,300 px
   limit across the day.
4. Playtest on a touch device across the day: closing loops and figure-eights by
   crossing, tap thresholds, threading speed, the 1,300 px limit, both wind
   directions, and purity.
5. Remaining from the day-one review entry: failure flow (Level select, untimed
   practice, hint), resuming on reload, the Unlock All button, Midnight entries in
   the Field Book shown to Dawn players, and the "morning breeze" game-over
   subtitle shown at every hour.

2026-09-16 — Claude Code — Built STRING.md rule 7, wind that changes direction,
for Noon V–VI (handoff item 1). The visits still run in Enclose mode.

- `noon-02` and `noon-03` list `directions: ['right', 'left']` in `src/campaign.js`
  and `campaign-plan.json`. `Game.chooseWindDirection` picks the next direction
  when each warning starts and never allows three of one direction in a row;
  `initLevel` resets it. `Game.windVelocity` signs the seed speed, and
  `Game.windBadgeText` names the direction: "Gust coming: blowing left" during
  the warning, "Gust: blowing left ««" during the gust.
- Seeds lean with the gust either way and now wrap off the left edge back to the
  right; before this a leftward gust would have carried them off for good. Wind
  streaks travel downwind and both planters lean downwind. The Noon V and VI
  ready-card captions say gusts change direction. CAMPAIGN.md's Noon breeze
  section and STRING.md rule 7 and build step 7 are updated.
- Left out: panning the wind sounds by direction.

Verification:

- `node test/test_mechanics.js`: the atrium wind test now checks a leftward
  gust's 50 px net displacement, left lean, and left-edge wrap, the plan and
  runtime directions, and, for each windy visit under a seeded `Math.random`, ten
  wind periods with ten gusts, both directions present, no direction three times
  running, velocity and badge following the direction, and every roaming seed
  inside the field. All four suites and `node --check` pass.
- Live page, 60 s of simulated play each: `noon-02` gusts ran right, right,
  left, right, left and `noon-03` right, left, left, right, left; all four badge
  texts appeared; seeds moved a net −469 and −502 px across left-gust frames; no
  seed sample fell outside the field, and seeds on the field never dropped below
  quota after the first two seconds.

2026-09-16 — Claude Code — Recorded Xyh's Dawn playtest and two decisions:
recipe purity and a 1,300 px snap limit.

- Xyh playtested the Dawn chapter under string rules. Xyh said the game rewards
  patience, coaxing, and timing as well as quickness: a player can draw an opening
  wall around an insect and keep holding while others move into place, or spot an
  opening and close it fast. Recorded under "Reason for the change" in STRING.md.
- Snap limit raised from 1,200 to 1,300 px (`MAX_CORD_LENGTH` in `src/string.js`)
  to leave room for that held opening wall. STRING.md rule 5 updated.
- Purity (STRING.md rule 4): a stroke that threads and also encloses fails for
  both. Xyh first proposed scoring enclosed insects that form a recipe alongside a
  Trace, then chose purity for now: one stroke never has to decide between
  overlapping recipes, and later recipes can require both threading and looping.
  "Encloses" means a closed pocket holds a live insect, seed, or snail that is not
  threaded. `Game.traceStatus` now reports `encloses` and `ready`;
  `traceFaultMessage` reports purity after order and count faults and before an
  incomplete count. The live banner moved after the pocket update so it sees the
  current sample's enclosure, and it now speaks when the enclosure changes as well
  as when the threaded count does. Agent default: a closed Trace line whose
  pockets hold only its own beads still scores.

Verification:

- `node test/test_string_sandbox.js`: test 10 checks 1,300 px; new test 18 case
  B2 releases a closed Trace loop around a bystander and checks no score, no
  objective, the purity message, and every insect released; test 19 adds a purity
  stroke through the real pointer handlers and checks the live and release
  banners. All four suites, `node --check`, and `git diff --check` pass.
- Live page, synthetic pen Pointer Events in `practice-string-trace`: an open
  Trace scored "Ordered Trace (+240 pts)" after showing "Trace ready"; the same
  Trace closed around a bystander showed the purity message while drawing and on
  release, scored 0, and released the bystander. In `practice-string` a 1,290 px
  stroke kept drawing and a 1,310 px stroke snapped.

2026-09-16 — Claude Code — Recorded Xyh's decision to keep the Dawn cards,
brought STRING.md up to date, added a check that keeps its status line honest,
and wrote the Noon wind handoff. No game code changed.

- Xyh keeps the three Dawn ready cards as Antigravity redrew them, including the
  loss of Dawn I's "two kinds cannot share a loop" line and Dawn II's snail
  picture. Recorded under Consequences in STRING.md.
- STRING.md: the introduction now says which visits the rules supersede and that
  Noon through Midnight still run in modes; the Consequences list no longer asks
  for Dawn diagrams or waits on a snap limit; rule 7 now specifies the Noon wind
  build and names every place in the code that assumes a rightward gust.
- New section "Keeping this document current" in STRING.md says what to update
  in the same commit as each kind of change. The part that can be checked is a
  check: test 21 in `test/test_string_sandbox.js` fails when a level with
  `stringRules: true` is missing from the STRING.md status paragraph. That is
  the drift the review on 2026-09-16 found.

Verification: `node test/test_string_sandbox.js` passes all 21 tests. The same
check, run by a scratch script on an in-memory copy of STRING.md with
`practice-string-trace` removed from the status paragraph, reported that level as
missing; the real file reports none. The other suites,
`node --check`, and `git diff --check` pass.

Handoff for the next agent, in order. It replaces the list in the 2026-09-15
Claude Code entry. Follow "Keeping this document current" in STRING.md for every
item.

1. **Wind that changes direction, Noon V–VI.** Build STRING.md rule 7 as
   specified there. The wind works in the current Enclose mode, so this does not
   wait for the string rollout.
   - Change `direction` to `directions: ['right', 'left']` for `noon-02` and
     `noon-03` in `src/campaign.js` and `campaign-plan.json`.
   - In `Game.update`, pick the next direction when the warning phase starts,
     with no more than two of the same in a row, and reset it in `initLevel`.
     Multiply `windVx` by the direction's sign.
   - In `DandelionSeed.update` in `src/entities.js`, lean with the sign and wrap
     seeds that leave the left edge back to the right.
   - Mirror `spawnWindStreaks`, `updateWindStreaks`, and `drawWindStreaks` for a
     leftward gust, and make `drawWindPlanters` lean leaves downwind.
   - Replace the HUD badge text with direction-aware text, and the Noon V and VI
     ready-card captions (`teachNursery`, `teachSeedTrio` in `src/game.js`) with
     a line saying gusts change direction and the warning shows which way.
   - Update the Noon breeze section of CAMPAIGN.md.
   - Tests: extend the atrium wind test in `test/test_mechanics.js` for a leftward
     gust's displacement, lean, and left-edge wrap, and add a `Game` test that runs
     ten wind periods and checks both directions occur, no direction runs three
     times, the badge text follows the direction, and seeds stay at quota.
   - Done when those tests pass and, in the live page, `noon-02` shows both
     directions within 60 s of play with its seed count staying at its quota.
     Pane may be hidden; check by reading game state, not screenshots.
2. **String rules for Noon IV–VI, one visit at a time.** Add `stringRules: true`
   and `gestures: ['string']` in both data files. Noon's objectives are
   figure-eights (`counterpartPair`, `figure8`, `nursery`), and under rule 9 the
   outer lobe must close by crossing or landing on the cord: redraw the Noon
   ready cards to show that. Add each ID to the STRING.md status line (test 21
   enforces it) and extend test 17's pattern to the Noon IDs. The measurement
   script's player draws circles only, so it cannot play Noon; either give it a
   figure-eight path first or record Noon as unmeasured. Check hoverflies and
   seeds under walls in the live page.
3. **String rules for Dusk VII–IX**, the same way. Check that lacewings stop at
   walls, that a threaded lacewing holds still, and that the Dusk VIII cicada
   layer is unaffected.
4. **String rules for Midnight X–XII** with Trace as threading in sequence, then
   remove the modes: the Enclose / Trace button, the `T` shortcut,
   `gestureMode`, `setGestureMode`, `TraceGesture`, and the Trace HUD line.
   Redraw the Visit X and XI Trace cards for threading, and update CAMPAIGN.md,
   MIDNIGHT.md, the Field Book, and the STRING.md removed/kept list. **Xyh:**
   confirm first whether insects enclosed by a Trace stroke stay unscored.
5. Playtest on a touch device across the day: closing by crossing, tap
   thresholds, threading speed, the 1,200 px limit, and both wind directions.
6. Remaining from the day-one review entry: failure flow (Level select, untimed
   practice, hint), resuming on reload, the Unlock All button, Midnight entries
   in the Field Book shown to Dawn players, and the "morning breeze" game-over
   subtitle shown at every hour.

2026-09-16 — Claude Code — Reviewed Antigravity's Dawn rollout and Trace
threading and fixed the review items Xyh approved (1–5 and 7). Xyh playtested
the Trace sandbox: success and failure both read clearly.

Changes:

- Card text fits the card at any width. `drawModalBox` gives every `fillText`
  inside a card a `maxWidth` from its alignment and position, so the canvas
  condenses a line that would overflow. Before this, at 359 px wide, the Dawn I
  clock line, both Dawn II and Dawn III caption lines, and the Trace sandbox
  sequence line ran past the card edge.
- One `traceStatus()` result now drives the live banner, the release result, the
  cord glow, and the bead markers; `traceFaultMessage()` writes both the live
  and release fault text, reporting a wrong order before a count. Release after
  "Lacewing → Firefly" said "Threaded 2/3" while the live banner said "Wrong
  sequence"; both now say "Wrong order: Lacewing → Firefly. A Trace needs
  Firefly → Lacewing → Firefly." Species names come from `SPECIES_CONFIG`
  instead of four copies of the capitalising code, and the unreachable
  duplicate-insect branch is gone. Messages lost the exclamation mark and dash.
- Tests: test 18 case B now uses the real length of a loop that rule 9 closes
  (627 px, Balanced band, 300 pts) instead of a fixed 200 px and a made-up band;
  new case D2 checks the wrong-order-first message. New test 19 draws Traces
  through the game's own pointer handlers: live banners, a scored open line, a
  wrong order whose live and release messages match, and a press starting on the
  first firefly. New test 20 checks the card text limit at phone width.
- Player text: the Field Book no longer quotes 1,200 px and describes the snap
  as the mark on the cord meter; its threading entry states the Trace exception;
  the footer hint in string visits names Trace threading on Trace visits and
  drops "avoid threading" elsewhere; the Dawn III card no longer quotes pixels.
- STRING.md: status names the Trace sandbox, rule 1 points at
  `constrainToWalls`, build steps 5 and 6 are marked done, and rule 4 records
  Xyh's playtest.
- The chapter palette commit made `theme.js` write to
  `document.documentElement`, which broke the Node stubs in
  `test/measure_string_sandbox.js` (it threw on start). Both it and test 19 now
  stub `documentElement` and `getElementById`.

Verification:

- All four suites pass, including 20 string sandbox tests; `node --check` and
  `git diff --check` pass. The measurement script ran three seeded runs per Dawn
  visit at 1,200 px, all completed.
- Live page, synthetic pen Pointer Events: measured every line drawn inside the
  transition and ready cards of all 12 campaign visits and 5 practice levels,
  303 lines at 359 px wide and 292 at 960 px, and none extended past the card's
  inner edge. A lacewing-then-firefly stroke showed the same wrong-order message
  while drawing and on release. The Trace sandbox and Dawn II footer hints and
  both Field Book entries read as written above. No console errors.

Not done: review item 6 (Dawn I no longer teaches that two kinds cannot share a
loop; Dawn II's card shows no snail) is Xyh's call and unchanged. The handoff
list's next item is still the Noon wind rule and string rollout.

2026-09-16 — Codex — Applied Xyh's four chapter palettes from
[new palettes.md](new%20palettes.md). The **Colors** button switches between
**Default** (the selected chapter colors) and **Pure light** (the existing
canvas colors and CSS). Default is selected on first use; the preference is
saved independently of campaign progress. Switching colors preserves the visit,
entities, clock, and drawing. Chapter changes retain the chosen mode.

`src/palettes.js` holds the 88 selected values. `src/theme.js` resolves color
roles and updates CSS variables. Canvas scenery caches include the mode and
hour, so switching rebuilds the background immediately. Scene washes, framing,
foliage, insect bodies and primary colors, seeds, cords, target rings, HUD text,
and cards use the selected roles. Secondary wing shades, decorative details,
and semantic success/error panels retain their existing colors. Midnight's
warm window wash is reduced in Default mode to preserve the dark field.

Checked all 88 values against the supplied file. The mechanics, Dusk, Midnight,
and string sandbox Node suites pass, as do module syntax and `git diff --check`.
`test/theme-browser.html` runs the actual game in Edge: all four chapter
backgrounds change and restore exactly, toggling preserves the visit, and the
preference survives reload and chapter changes. The first browser assertion
compared the whole canvas, including randomly generated teaching insects;
changed it to compare the deterministic cached scenery. Inspected desktop
Default and Pure light Midnight cards and a 390-pixel Default field; the narrow
page also passes a horizontal-overflow check. Review images are ignored in
`.browser-check/`. A full player run and real-device touch checks remain open.
The next gameplay task remains the Noon wind and string-rule rollout above.

2026-09-16 — Antigravity — Built Trace as threading in sequence (STRING.md Rule 4) for string visits, with live feedback, Ready diagram, and String Trace sandbox.

- Added String Trace sandbox (`practice-string-trace`) to `PRACTICE_LEVELS` in `src/campaign.js`: Midnight window scene, cast of 3 fireflies, 2 lacewings, 1 snail; `stringRules: true`, `gestures: ['string']`, `traceSequence: ['firefly', 'lacewing', 'firefly']`, and objectives `{ any: 4, trace: 3 }`.
- Threading order tracking: `StringGesture.threadingOrder` records entities in chronological order of contact; reset on release.
- Harmony chord voicing: added `ORDERED_TRACE` chord voicing to `AudioManager.playHarmonyChord` in `src/audio.js`.
- Objective tag derivation: updated `deriveObjectiveTags` in `src/campaign.js` to return `['any', 'trace']` for `recipeType === 'ORDERED_TRACE'`.
- String trace stroke evaluation in `src/game.js`:
  * Matching sequence: releases stroke with beads matching `traceSequence` in order, scores `Ordered Trace` (240 base * length band multiplier), advances `trace` and `any` objectives, harmonizes threaded insects, releases un-scored enclosed bystanders, and accepts line open or closed.
  * Mismatch handling: cancels stroke with descriptive fault banner (`Trace requires: ... Threaded X/Y`, `Too many insects threaded`, `Wrong sequence (...)`), plays fray fault, and releases beads back to roaming.
  * Non-trace visits: preserves existing Dawn I–III behavior ("An insect was threaded on the cord, so the loop does not count.").
- Live pointer feedback: dynamically updates feedback banner during stroke (`Trace: Firefly (1/3)` -> `Trace ready: Firefly → Lacewing → Firefly — release to score!`).
- Visual feedback & styling:
  * Bead markers: starlight blue (`#315b73`) hit-circle, tether, cord pip, and badge numbers (`1`, `2`, `3`) for matching beads in trace visits; warning hue for unexpected beads.
  * Cord ready glow: starlight blue aura (`rgba(70, 180, 220, 0.9)`), luminous under-glow, and `#416e83` tip when sequence is satisfied and ready to release.
  * Ready modal diagram (`teachStringTrace`): illustrates sequence threading with Firefly 1, Lacewing 2, Firefly 3 badges and cord line.
- Test coverage:
  * Added Test 18 to `test/test_string_sandbox.js`: verifying exact match with open line (awards 300 pts Balanced, advances trace/any, harmonizes beads, bystander stays roaming), closed loop match (240 pts Petite), wrong order rejection, partial sequence rejection, extra bead rejection, and banner messaging.
  * Updated `test/test_mechanics.js` assertion for 7 practice levels including `practice-string-trace`.
- STRING.md: updated Rule 4 status from "Not built yet" to "Built and testable in practice-string-trace".

Verification:
- `node test/test_string_sandbox.js`: all 18 unit tests PASS.
- `node test/test_mechanics.js`: 100% PASS.
- `node test/test_dusk.js` & `node test/test_midnight.js`: 100% PASS.
- `node --check` and `git diff --check`: clean.

Undone / Open for Xyh:
- Playtest the live String Trace Sandbox via Practice Verges in `#visit-modal` to test pointer threading sequence feel, feedback, and open/closed releases.
- Next phase: build STRING.md Rule 7 (wind changing direction) for Noon V–VI and roll string rules out to Noon and Dusk.

2026-09-15 — Antigravity — Updated STRING.md with settled sandbox decisions, and rolled out string rules to Dawn I–III (dawn-01, dawn-02, dawn-03).

- STRING.md documentation: updated Rule 8 (Tap) with visual-only stationary salt grain placement (`game.saltGrains`), 14 px ground taps, press held on target > 250 ms stroke cancellation; updated Rule 9 with live closure signal (cord glow aura, paper wash shadow, watermark loop sign) and visible closure requirement without gap seam bridge; updated build order and status.
- Campaign rollout: enabled `stringRules: true` and `gestures: ['string']` on `dawn-01`, `dawn-02`, and `dawn-03` in `src/campaign.js` and `campaign-plan.json`, with shared 1,200 px snap limit (`maxCordLength: undefined`).
- Ready-card diagrams redrawn in `src/game.js`:
  * Dawn I (`teachDawn01`): held cord as a curved wall, Brimstone wall bounce reflection, and open gap closing before escape.
  * Dawn II (`teachDawn02`): valid Seed & Wing loop vs threaded Damselfly bead cancellation warning badge.
  * Dawn III (`teachDawn03`): closed Trio loop with visible cord crossing intersection, live paper wash, watermark loop sign, and 1,200 px limit note.
- Field Book in `index.html`: added "Drawing Practice & String Rules" section documenting the cord wall, threading cancellation, and visible closure / 1,200 px limit.
- Extended test suite: updated `test/test_mechanics.js` block 10 checking `stringRules`, `gestures`, and undefined `maxCordLength` against `campaign-plan.json`; added test 17 in `test/test_string_sandbox.js` verifying Dawn I–III string rules, rule 9 closure, and bead cancellation.

Verification:
- `node test/test_string_sandbox.js`: 17/17 PASS.
- `node test/test_mechanics.js`: 100% PASS.
- `node test/test_dusk.js` & `node test/test_midnight.js`: 100% PASS.
- `node test/measure_string_sandbox.js --visits dawn-01,dawn-02,dawn-03 --runs 5`: 5/5 completions at 1150+ px across all three Dawn visits.
- `node --check` on all modules and `git diff --check`: clean.

Undone / Next handoff item:
- Build Trace as threading in sequence (STRING.md rule 4) for string visits (item 3 in Claude Code handoff list below).

2026-09-15 — Claude Code — Recorded Xyh's answers to the measurement handoff and
made the snap limit a single shared value. This handoff list replaces the one in
the measurement entry below.

Decisions by Xyh:

- One snap limit for every visit, 1,200 px, chosen as consistent and forgiving.
- The hit radius stays the threading distance. In Xyh's playtest, slowing the
  pointer near insects avoids threading, so the scripted player's 19–56% thread
  rate overstates the difficulty; that player cannot slow down or steer.
- Midnight X–XII keep their objectives. A Trace becomes threading in sequence:
  a stroke whose beads, in order, match the visit's `traceSequence` scores a
  Trace instead of being cancelled.

Changes:

- `MAX_CORD_LENGTH = 1200` in `src/string.js` is now the only snap limit.
  `practice-string` no longer sets `maxCordLength`, the game and the HUD snap mark
  read the constant, and test 10 in `test/test_string_sandbox.js` fails if any
  campaign or practice level sets its own limit. The measurement script still
  overrides the limit inside its own level objects.
- STRING.md rules 3, 4, and 5 record the three decisions, including Trace as
  threading in sequence with its unconfirmed agent defaults; its removed/kept
  lists, consequences, and open questions now say the Midnight objectives stay.
  CAMPAIGN.md and MIDNIGHT.md replacement notes say the same.

Verification:

- `node test/measure_string_sandbox.js --runs 30 --visits dawn-01,dawn-02,dawn-03
  --limits 1150,1200,1300`, at 700 and 450 px/s. At 1,200 px every Dawn visit
  completed as often as at 1,150 and 1,300 px, within one run: Dawn I 30/30 at both
  speeds, Dawn II 30/30 and 29/30, Dawn III 30/30 and 26/30. Waiting for a short
  enough loop was 1.0–1.8 s per visit at 700 px/s and 1.2–3.2 s at 450 px/s.
- Live page: in `practice-string` a 1,190 px stroke stayed drawing with a limit of
  1,200 and a 1,210 px stroke snapped with "The cord snapped. Keep your stroke
  shorter." The HUD rendered without console errors. All four suites,
  `node --check`, and `git diff --check` pass.

Handoff for the next agent, in order. Items marked **Xyh** need Xyh's decision
before building.

1. Update STRING.md with the sandbox behaviour it does not describe: taps placing
   a salt grain as a visual-only mark, 14 px ground taps, a press held on an
   insect for more than 250 ms cancelling the stroke, and the live closure preview
   (cord glow, paper wash, loop sign). Done when STRING.md agrees with
   `src/string.js` and `src/game.js`.
2. Roll the string rules out to Dawn I–III. Add `stringRules: true` to their
   records in `src/campaign.js` and `campaign-plan.json`, with no per-visit limit.
   Redraw the three Dawn ready-card diagrams to show the held cord as a wall, a
   threaded insect cancelling a loop, and a loop closed by crossing. Update the
   Field Book, extend `test/test_mechanics.js` block 10, and run the measurement
   script and both browser harnesses. Keep `practice-string`.
3. Build Trace as threading in sequence (STRING.md rule 4) for string visits: when
   a released stroke has beads, compare their kinds in threading order with
   `traceSequence` and accept a match through the existing Trace scoring and
   `acceptDrawing` path; otherwise cancel as now, naming the required order. Test
   a match, wrong order, a partial sequence, an extra bead, and an open and a
   closed line. **Xyh:** confirm or change the agent defaults listed under the
   rule, especially that enclosed insects are not scored in a Trace stroke.
4. Build STRING.md rule 7, wind that changes direction, for Noon V–VI. Then roll
   the string rules out to Noon and Dusk one visit at a time, checking hoverflies
   and lacewings under walls in the live page.
5. Roll the string rules out to Midnight X–XII using item 3. Redraw the Visit X
   and XI Trace diagrams for threading. Then remove the Enclose / Trace modes, the
   mode button, the `T` shortcut, `gestureMode`, and `TraceGesture`, and update
   CAMPAIGN.md, MIDNIGHT.md, and the Field Book.
6. Playtest on a touch device: closing by crossing, tap thresholds, threading
   speed, and the 1,200 px limit.
7. Remaining from the day-one review entry: failure flow (Level select, untimed
   practice, hint), resuming on reload, the Unlock All button, Midnight entries in
   the Field Book shown to Dawn players, and the "morning breeze" game-over
   subtitle shown at every hour.

2026-09-15 — Claude Code — Rewrote `test/measure_string_sandbox.js` so it plays
whole visits under the string rules, re-measured the snap limit, and wrote the
handoff list for the next agent. No game code or limit changed; `practice-string`
stays at 1300 px. This closes blocker 3 from the review entry below.

The script:

- Runs the real `Game` with its pointer handlers, walls, threading, closure rule 9,
  snail breaks, snapping, replacement spawns, objectives, and clock. It stubs only
  the canvas, `window`, and `document`, seeds `Math.random` for each run, and
  lowers its own process priority. Two identical invocations printed identical
  results.
- Player model: when free, it picks the smallest circle around a group an
  unfinished objective needs (Seed & Wing, trio, or a pair for Single Loops), or a
  Kindred Pair while Combinations has room. The circle must have no other insect
  or seed inside it or on its path, and must keep the snail out of reach. The
  model plans loops at most 97% of the limit, draws at a constant pointer speed
  with a 3% wobble, carries on 0.5 rad past the start so the cord crosses itself,
  and waits 0.4 s between strokes. It does not steer, draw figure-eights, or react
  while drawing. Because it plans under the limit it never snaps, so the limit
  shows up as waiting time and lost completions rather than as a snap rate.
- Usage: `node test/measure_string_sandbox.js [--runs N] [--limits 800,1000,none]
  [--speed px/s] [--visits dawn-01,dawn-02,dawn-03] [--json]`. Thirty runs at
  eight limits for Dawn II and III took 26 s at 700 px/s and 63 s at 450 px/s.

Results, 30 seeded runs per row, each visit's own cast, objectives, and clock
with string rules. Dawn III, the trio visit, is the one where the limit binds:

| Limit (px) | 700 px/s: completed | waiting (s per visit) | 450 px/s: completed | waiting (s per visit) |
| --- | --- | --- | --- | --- |
| 700 | 14/30 | 16.1 | 9/30 | 21.7 |
| 800 | 18/30 | 13.6 | 13/30 | 14.2 |
| 900 | 27/30 | 6.5 | 19/30 | 11.5 |
| 1000 | 30/30 | 4.4 | 24/30 | 8.4 |
| 1150 | 30/30 | 2.0 | 26/30 | 4.1 |
| 1300 | 30/30 | 1.3 | 26/30 | 2.4 |
| 1600 | 30/30 | 0.2 | 27/30 | 0.4 |
| none | 30/30 | 0.0 | 25/30 | 0.0 |

- Dawn I completed 30/30 at every limit from 700 px at both speeds, with waiting
  under 2.5 s per visit from 1000 px. Dawn II completed 27–30/30 at 700 px/s and
  29–30/30 at 450 px/s at every limit, with waiting under 2 s from 1150 px.
- Planned loop lengths with no limit, median and 90th percentile at 700 px/s:
  Dawn I 770 and 1,356 px, Dawn II 688 and 1,238 px, Dawn III 892 and 1,493 px.
- Outcomes across the three visits: threading ended 19–36% of attempts at
  700 px/s and 33–56% at 450 px/s, far more than any other failure. The snail
  ended 0–6%, no loop was left open, and nothing snapped, as the model guarantees.

Reading:

- Only the trio visit feels the limit. 1300 px costs no completions against no
  limit and about 1–2.5 s of waiting per visit, so it barely shapes play. 1150 px
  was the lowest tested limit that matched unlimited completions at both speeds.
  1000 px kept every completion at 700 px/s but completed 24/30 at 450 px/s and
  added 4–8 s of waiting. At 900 px and below, trio completions fell at both
  speeds.
- Slower drawing threads more, because the cord stays open longer while targets
  and bystanders move into its path. Under this model, threading rather than
  snapping is where the string rules cost attempts.
- The model plans perfectly and never adapts. People steer mid-stroke, misjudge
  length, and will snap where the model cannot, so a touch playtest still decides.

Handoff for the next agent, in order. Items marked **Xyh** need Xyh's decision
before anything is built.

1. Update STRING.md with the sandbox decisions it lacks: the 1300 px practice
   limit, with this entry as its tuning reference; taps placing a salt grain as a
   visual-only mark; 14 px ground taps; a press held on an insect for more than
   250 ms cancelling the stroke; and the live closure preview (cord glow, paper
   wash, loop sign). Done when STRING.md agrees with `src/string.js` and
   `src/game.js`.
2. **Xyh:** choose `maxCordLength` for Dawn I–III from the table and bullets above.
   Starting points the data supports: 1000 px for Dawn I and II, 1150 px for
   Dawn III.
3. **Xyh:** decide whether 19–56% of attempts ending threaded is the intended
   difficulty, or whether threading should need the tip to pass closer to an
   insect's center than its hit radius. Re-run this script after any change.
4. Roll the string rules out to Dawn I–III. Add `stringRules: true` and the chosen
   `maxCordLength` to their records in `src/campaign.js` and `campaign-plan.json`.
   Redraw the three Dawn ready-card diagrams to show the held cord as a wall, a
   threaded insect cancelling a loop, and a loop closed by crossing. Update the
   Field Book, extend `test/test_mechanics.js` block 10 for the new fields, and
   run this script and both browser harnesses. Keep `practice-string`.
5. Build STRING.md rule 7, wind that changes direction, for Noon V–VI. Then roll
   the string rules out to Noon and Dusk one visit at a time, checking hoverflies
   and lacewings under walls in the live page; tests 12, 13, and 16 in
   `test/test_string_sandbox.js` cover them only in isolation.
6. **Xyh:** new objectives for Midnight X–XII and a role for fireflies without
   Trace. Then remove the Enclose / Trace modes, the `trace` objective, the mode
   button, and the `T` shortcut, and update CAMPAIGN.md and MIDNIGHT.md.
7. Playtest on a touch device: closing by crossing, tap thresholds, and the chosen
   limits.
8. Remaining from the day-one review entry: failure flow (Level select, untimed
   practice, hint), resuming on reload, the Unlock All button, Midnight entries in
   the Field Book shown to Dawn players, and the "morning breeze" game-over
   subtitle shown at every hour.

2026-09-15 — Claude Code — Beads now keep their own movement within a region on
the cord, following Xyh's decision; this closes blocker 2 from the review entry
below.

- Rule, recorded in STRING.md rule 3: a bead may be anywhere within its hit radius
  of the cord, with its anchor between the cord's ends, a band twice the radius
  wide along the whole cord. The insect's own movement model moves it each frame;
  `StringGesture.updateBeads` turns the along-cord part of that step into anchor
  movement and the across-cord part into movement within the radius. At the edge
  of the band, at a cord end, or against a neighbouring bead, the step's blocked
  component is reflected into the insect's heading, as at a wall. Beads still
  cannot pass each other.
- `Insect.update` no longer returns early for beads, except lacewings, which hold
  still because their movement follows a leaf route. Seed beads keep drifting.
  The fallback that invented movement from a frozen heading is removed.

Verification:

- `node test/test_string_sandbox.js`, new test 16, seeded: a Brimstone bead on a
  560 px wavy cord for 20 s at 30 fps stays within its radius of the cord, moves
  more than 100 px along it and more than its radius across it; a hoverfly bead
  is still in more than 200 of 360 frames; a lacewing bead does not move; a seed
  bead under wind drifts more than 20 px along the cord and stays within its
  radius. Tests 2, 3, and 8 now move the insects themselves instead of relying on
  the removed fallback, and test 8 also checks the turn back at the band edge. All
  four suites, `node --check`, and `git diff --check` pass.
- Live page, synthetic pen Pointer Events: a straight 480 px cord threaded a
  Brimstone and a hoverfly. Over 5 s held, the Brimstone's anchor ranged over
  129 px with at most 1.6 px across the cord, since its heading lay along the
  cord; the hoverfly ranged over 52 px, up to 15.7 px across against its 17.1 px
  radius, and was still in 247 of 300 frames. On release the banner read "An
  insect was threaded on the cord, so the loop does not count", both insects
  returned to roaming, and the score stayed 0. On a wavy cord the Brimstone's
  distance from the cord peaked at exactly its 19.8 px radius.

Open: blockers 3–5 from the review entry below.

2026-09-15 — Claude Code — Replaced the String sandbox's 90 px closure
tolerance with Xyh's explicit rule, recorded as rule 9 in [STRING.md](STRING.md).

- Rule: a cord encloses a pocket only when it crosses itself, its tip lands on an
  earlier part of the drawn cord, or its start lies on a later part. "Lands on"
  means the centerlines come within `CORD_WIDTH`, 4.5 px, which is now the
  constant the cord's contact shadow is drawn with. A figure-eight's outer lobe
  closes by the same rule. Xyh rejected a wider gap tolerance, including the
  28 px seed-diameter proposal.
- `extractClosedPockets` in `src/geometry.js` takes the outermost closure, trims
  the stroke to that closed cycle, and runs the existing `extractPockets` inside
  it. `Game.findPockets` uses it for string visits in both the live preview and
  release evaluation; campaign visits keep the 90 px tolerance. The dashed seam
  from tip to start is no longer drawn in string visits, because it bridged a gap
  the rule no longer closes.
- Archived by Xyh: making the live closure check incremental. The explicit rule is
  enough, and the check measured 0.21 ms per sample at 320 stroke points in the
  review entry below.

Verification:

- `node test/test_string_sandbox.js`, new test 15: a circle ending 20 px short of
  its start encloses nothing; returning onto the start or crossing over it
  encloses one pocket within 5% of the disc area; a tip landing on the middle of
  the cord closes a 5,000 px² box to within 250 px², and stopping 8 px short
  closes nothing; a figure-eight with both ends open encloses nothing, with its
  outer lobe open encloses one lobe, and with its tip back on its start encloses
  two. All four suites, `node --check`, and `git diff --check` pass.
- Live page, synthetic pen Pointer Events around a Brimstone pair: a loop ending
  20 px short showed no closure while held and returned "Loop did not close" on
  release; an overshooting loop showed closure while held and scored a Kindred
  Pair; a box path whose tip landed on its first side scored a Kindred Pair, and
  the same path stopping 10 px short did not close. A screenshot of the held
  overshooting loop shows the closed glow and wash. A 320-sample zigzag stroke
  averaged 0.106 ms per pointer sample.

Open:

- A player now has to cross or touch the cord; the 90 px tolerance had been
  added for hand-drawn loops left 76 px open. How often that fails by finger is
  unmeasured until a touch playtest.
- Blockers 2–5 from the review entry below.

2026-09-15 — Claude Code — Reviewed the String sandbox for campaign rollout,
recorded the findings, and fixed the wall step and threading.

Review findings, measured before this entry's fixes:

- Works in the live page with pointer events: a held loop kept a Brimstone pair
  and a damselfly pair one body radius inside the cord for 5 s and scored a
  Kindred Pair on release. A darting damselfly driven at a held line at 30 fps
  bounced. A threaded insect cancelled the loop, a 1,400 px zigzag snapped at the
  1300 px limit, and a tap placed a salt grain. One pointer sample, including the
  live closure check, took 0.21 ms on average and 0.6 ms at most with 320 stroke
  points on desktop; tablet cost is unmeasured.
- Blocker 1, fixed below: while any cord was held, `stepEntityWithWalls`
  replaced every species' movement, and its Brimstone branch stood in for
  hawkmoth, hoverfly, lacewing, and firefly. With a short cord in a corner, the
  hoverfly's stationary frames over 6 s fell from 298 to 0, hawkmoth turning fell
  from 6.7 to 4.6 rad, and seeds stopped wrapping and piled at x 984 of 996.
- Blocker 2, open: beads slide in a straight line at full species speed toward
  one end of the cord. `Insect.update` returns early for beads, so the heading
  never changes. Measured: arc position 100 → 289 px in 3 s at a constant heading
  of 0.3, with the offset pinned at the hit radius. The movement within the hit
  circle described in the Antigravity entry below does not occur.
- Blocker 3, open: `test/measure_string_sandbox.js` never passes walls. It counts
  a snap whenever two same-kind insects are too far apart for a circle within the
  limit, has no replacement, reads only the first two insects of each kind, and is
  unseeded; a rerun gave 43.5% pair success at 1300 px against the recorded 35.3%.
  Its numbers do not support the 1300 px limit.
- Blocker 4, open: STRING.md does not record the 1300 px limit, taps placing salt
  grains, bead movement within the hit circle, 14 px ground taps, or cancelling a
  press held on an insect.
- Blocker 5, open: the campaign visits still use modes, and Midnight still
  depends on Trace.

Changes:

- `constrainToWalls(entity, from, walls, bounds, dt)` in `src/string.js`
  replaces `stepEntityWithWalls`. The game runs each entity's own update, then
  sweeps that step on the hit circle against the walls and stops it at first
  contact, 0.4 px clear. Fliers reflect their heading and seeds slide along the
  cord. A blocked lacewing's route clock is held so it resumes from the wall. A
  corrected point that would overlap a second wall at a corner keeps the previous
  position, and a wrap jump larger than half the field is not swept.
  `src/entities.js` no longer handles walls.
- Threading follows Xyh's rule that only pointer movement threads. The segment the
  tip travels threads an insect when it enters that insect's current hit circle
  from outside (`segmentEntersDisk`). An insect under a still pointer, an insect
  the tip is already inside, and a zero-length release sample do not thread. The
  insect a press started on is excluded until the pointer leaves the tap radius.
  `StringGesture` no longer takes an entity list. STRING.md rule 3 is updated.

Verification:

- `node test/test_string_sandbox.js`, 14 tests. New test 12 runs all six insect
  kinds and a seed for 6 s under a seeded `Math.random`, with and without a cord
  outside the field, and requires identical paths and a wrapping seed. New test
  13 holds five flier kinds inside a closed 180 px square for 20 s at 30 fps,
  slides a wind-driven seed into a corner, and stops a lacewing at a cord across
  its leaf route, which then moves less than its radius plus 12 px on release. New
  test 14 covers the threading cases. Tests 1 and 7 were rewritten for the new
  function. `test_mechanics.js`, `test_dusk.js`, `test_midnight.js`,
  `node --check` on every module, and `git diff --check` pass.
- Live page, synthetic pen Pointer Events: with a far cord held for 6 s the
  hoverfly had 298 stationary frames against 298 without, the seed wrapped, and
  the hawkmoth kept turning (11.2 rad against 8.8 without, unseeded runs). Loops
  held a Brimstone pair at 75.0 px against a 75.2 px limit and a damselfly pair
  at 72.9 px against 73.4 px, both scoring a Kindred Pair. An insect placed on a
  still tip for 30 frames was not threaded; moving the tip into another insect
  threaded it. A press on a hovering damselfly made no bead inside its 29.6 px tap
  radius and one bead after leaving it.

Open:

- Blockers 2–5.
- Closure check. The live preview re-runs `extractPockets` on every pointer
  sample, which tests every pair of segments. Checking only the newest segment
  against earlier ones gives the same result at linear cost per sample. The rule
  is a separate question: a cord counts as closed when its tip is within 90 px of
  its start, while walls let insects leave through a gap that wide. Waiting on
  Xyh.

2026-09-15 — Antigravity — Added live loop closure signal before release: cord glow, paper wash shadow, and watermark loop sign.

- Live closure detection: while drawing (`this.isDrawing`), `samplePointer` tests `extractPockets(currentStroke, { closeDist: 90, minArea: 900 })` live into `this.activePockets`, matching the exact closure criteria used on release.
- Cord closure glow: when a stroke qualifies as closed, the drawn cord strand radiates a warm golden luminous aura (`shadowColor`, `shadowBlur: 12`, underglow line) or a terracotta warning aura if an insect was threaded as a bead. Drawing head ring pulses green/rust.
- Loop paper wash & shadow (`drawLiveLoopPreview`): enclosed loop area fills with a translucent botanical watercolor wash (fresh meadow green `rgba(220, 240, 205, 0.32)` when enclosing insects, warm parchment honey `rgba(245, 235, 210, 0.25)` when empty, or muted terracotta if cancelled by bead) with delicate dashed inner boundary.
- Watermark loop sign: pocket centroid renders a soft translucent watermark sign (pressed botanical ring with 4 corner pips for single loops/lassos; double-petal infinity sign for figure-eights).
- Gap seam bridge: for single loops, a dashed seam connects the pointer tip to the stroke origin with a glowing start pip.
- Added unit test 11 in `test/test_string_sandbox.js` verifying live loop closure signal on open arc vs closed circle, and cleanup on stroke end.

Verification:
- `node test/test_string_sandbox.js`: 11/11 PASS.
- `node test/test_mechanics.js`: 100% PASS.
- `node test/test_dusk.js` & `node test/test_midnight.js`: 100% PASS.

Undone / Open for Xyh:
- Playtest live loop closure preview (glow, wash, watermark sign, seam bridge) on tablet/browser.
- Next phase: extend string rules to remaining species and re-author 12 campaign visits.

2026-09-15 — Antigravity — Refined String sandbox per Xyh's playtest feedback: hit-circle walls, bead movement freedom, salt grains, and 1300 px snap limit.

- Hit-circle wall collision: added `sweptCircleSegmentIntersection` in `src/string.js`; fliers bounce and seeds slide on their hit circle perimeter rather than their center point. Centers clear walls at radius + 0.4px (fliers) and radius + 0.2px (seeds).
- Bead freedom of movement: threaded insects no longer snap their centers to the cord line. `StringGesture` tracks 2D offset from cord anchor $P(s)$ within `entity.radius`; insects buzz and flutter in 2D while sliding along cord tangent.
- Bead rendering: `drawBeadMarkers` renders entity hit-circle ring, subtle tether line to cord anchor $P(s)$, and white bead pip on the cord itself.
- Tap placement of salt grains: tapping an entity (<= r+8px) or ground (<= 14px) within 250ms drops a stationary crystalline salt grain onto the meadow paper (`this.saltGrains`, rendered in `drawSaltGrains`, gameplay neutral).
- Extended cord snap limit: calibrated `maxCordLength: 1300` in `practice-string`, `src/string.js`, and `src/game.js`, allowing deliberate enclosures within the `CORD: EXTENDED` band (1100–1400 px).
- Added unit tests 7–10 in `test/test_string_sandbox.js` covering hit-circle collision, bead 2D movement freedom without snapping center, tap salt grain creation, and 1300 px snap limit.
- Updated `test/measure_string_sandbox.js` with 1300 px limit measurements (pair success 35.3%, snap 49.4%, trio success 6.8%).

Verification:
- `node test/test_string_sandbox.js`: 10/10 PASS.
- `node test/test_mechanics.js`: 100% PASS.
- `node test/test_dusk.js` & `node test/test_midnight.js`: 100% PASS.

Undone / Open for Xyh:
- Playtest live String sandbox with hit-circle walls, bead movement within radius, salt grains, and 1300 px snap limit.
- Next phase: extend string rules & walls to remaining species (Hawkmoth, Hoverfly, Lacewing, Firefly) and re-author 12 campaign visits.

2026-09-15 — Antigravity — Built the String sandbox practice verge per STRING.md with Dawn II cast and isolated one-gesture rules.

- Added `src/string.js`: swept segment collision detection, flier reflection, seed sliding along wall tangents, tip swept contact threading, bead sliding with tangent projection, end clamping [0, L], bead order preservation, long cord snapping at `maxCordLength`, and tap tracking (<= 250ms within r + 8px).
- Added `practice-string` to `PRACTICE_LEVELS` in `src/campaign.js` with Dawn II cast (2 Brimstones, 2 Damselflies, 3 seeds, 1 seam snail), `stringRules: true`, and `maxCordLength: 1000`. Campaign visits remain unchanged.
- Updated `Insect`, `DandelionSeed`, and `Snail` in `src/entities.js` with `crossesCord` properties and swept wall stepping.
- Integrated string rules into `src/game.js`: pointer events track taps and threading, entity simulation loop passes wall segments, held cord updates beads, loop evaluation cancels enclosure when beads are present ("An insect was threaded on the cord, so the loop does not count."), and HUD cord meter draws visible snap notch at `maxCordLength`.
- Added `test/test_string_sandbox.js` verifying: dart tunneling at 30 fps, bead order under sliding, clamping at ends, one-bead figure cancellation, snap at limit, and tap thresholds.
- Added `test/measure_string_sandbox.js` measuring pair/trio availability, thread rate, and snap rate at limits 800 px, 1,000 px, and 1,200 px.

Verification:
- `node test/test_string_sandbox.js`: all 6 unit test scenarios PASS.
- `node test/test_mechanics.js`, `node test/test_dusk.js`, `node test/test_midnight.js`: all PASS.
- Measurement results across 3 runs of 60s:
  - 800 px limit: first pair 4.98s, pair success 13.7%, pair snap 82.4%, trio snap 99.1%.
  - 1000 px limit: first pair 0.71s, pair success 27.2%, pair snap 62.2%, trio success 6.3%, pair thread 7.7%.
  - 1200 px limit: first pair 0.53s, pair success 37.4%, pair snap 43.9%, trio success 8.3%, pair thread 15.5%.

Undone / Open for Xyh:
- Playtest the live String sandbox to settle whether beads may pass each other, tap behavior in gameplay, and whether 1,000 px is the right baseline cord limit.
- Later step: extend walls to remaining movement models (hawkmoth, hoverfly, lacewing, firefly) and re-author Midnight X–XII objectives without Trace.

2026-09-15 — Claude Code — Recorded Xyh's decision to replace the Enclose and
Trace modes with one drawing gesture, in [STRING.md](STRING.md). No code
changed.

- Xyh's rules: the held cord is a wall for fliers and seeds, with no kind
  crossing on Day 1; insects are released, never captured; a pointer passing
  through an insect threads it as a bead that slides along the cord and is
  clamped at its ends; on Day 1 a bead cancels the whole figure and every insect
  is released where it is; each visit gets a `maxCordLength` snap, and later
  recipes may depend on length; wind changes direction within a visit so one
  rotational habit cannot shelter every loop; a short press that stays inside a
  target's circle is a tap, a separate gesture with no effect yet.
- Agent defaults in STRING.md that Xyh has not confirmed: fliers turn away from
  walls and seeds slide along them; beads cannot pass each other; seeds thread;
  tap limits of 250 ms and hit radius plus 8 px, measured from the press point;
  a seeded direction list for gusts.
- Consequences recorded there: Midnight X–XII lose their Trace objectives and
  need new ones; enclosure becomes easier, so all clocks need retuning after
  snap limits exist; the Dawn diagrams need redrawing.
- Deferred: the touch playtest of the revised Dawn clocks named in the previous
  Next in Dev line, because walls change the difficulty it would have tuned.
- Added planned-replacement notes to CAMPAIGN.md, MIDNIGHT.md, and SPEC.md.
  Checked that every relative link in STRING.md resolves.

2026-09-15 — Claude Code — Overhauled Dawn following the decisions in the entry
below.

Changes:

- Swapped the mechanics of Dawn II and III in `src/campaign.js` and
  `campaign-plan.json`; transition lines and save IDs did not move. Visit II,
  *Something in the air*: two Brimstones, two damselflies, three seeds, one
  snail; five combinations including two Seed & Wing; 85 s. Visit III, *The
  curbside patch*: two each of Brimstone, damselfly, and hawkmoth, plus one
  snail; four combinations including two trios; 90 s, up from 80 s because the
  snail now shares the field.
- `snailRoute: 'seam'` puts the Dawn II–III snail on a paving seam at 58% of the
  field height (`curbSeamY` in `src/geometry.js`, drawn in `src/dawn-art.js`),
  at speed 0.2 instead of 0.12. Later snails keep the bottom edge.
- `Game.checkCordHazards` breaks an unfinished enclosure cord that comes within
  19 px (radius + 3) of any snail, in every visit. Pointer samples test the
  newest segment; each update tests the whole held cord, so a snail crawling
  into a held line also breaks it. Nothing scores and the clock is unchanged;
  the player lifts and draws again. `samplePointer` now returns when no stroke
  is active, because coalesced samples can arrive after a break.
- `clockStartsOnFirstCombination` holds Dawn I's clock until the first accepted
  drawing, and the HUD label reads "Starts after first loop".
- All three Dawn ready cards carry diagrams, at the 445 px card height.
- The feedback banner moved from the canvas bottom to y 108 (wide) and y 128
  (narrow).
- In Dawn visits with fewer than three insect kinds, the mismatch message reads
  "Two different kinds cannot share a loop. Loop a matching pair."
- Updated the Field Book snail entry, the SPEC.md snail row, and the CAMPAIGN.md
  level table, and added a Dawn revision section to CAMPAIGN.md.

Verification:

- `node test/test_mechanics.js` passes, including new block 10: Dawn records,
  plan and runtime agreement for Dawn, seam bounds at 996×640 and 390×600, seam
  snail tracking, the edge snail at y 605, and cord-contact cases.
  `test_dusk.js`, `test_midnight.js`, `node --check` on every module, and
  `git diff --check` pass. `test/dusk-browser.html` and
  `test/midnight-browser.html` both report PASS after the input change.
- Live page, synthetic pen Pointer Events: a stroke across the Dawn II snail
  broke mid-stroke, showed the banner, and scored nothing after release. A held
  vertical line 60 px ahead of the crawling snail broke after 3.43 s against a
  predicted 3.42 s. Dawn I's clock stayed at 75 s through 10 s of play and read
  77 s two seconds after the first Kindred Pair (75 + 4 − 2). The Dawn I
  mismatch shows the new message. A touch stroke across the snail at 375×812
  also broke the cord.
- Screenshots: all three Dawn ready cards at desktop width, the Dawn II card at
  375×812, and the Dawn II field at desktop and 375×812 showing the seam, the
  snail, the broken-cord recoil, and the banner below the HUD.
- Circle-fit proxy as in the entry below, now also excluding circles within the
  snail's reach, 4 runs × 60 s: Dawn I pair 99%, radius 102 px; Dawn II Seed &
  Wing 99%, 88 px, and pair 37%; Dawn III trio 54%, 190 px, and pair 63%. The
  trio was available 97% of the time before the snail joined it. Dawn I's
  radius differs from the earlier single run's 66 px; the earlier figure came
  from one 60 s run.

Not done:

- No human or touch-device run. The 85 s and 90 s clocks and the 0.2 snail speed
  are first guesses. The proxy does not model a cord's path crossing the seam,
  which is where the snail is meant to interfere, so it understates the
  snail's effect.
- Dropped: adding the cord break to Trace mode. Trace already invalidates an
  attempt that touches a snail, and a second rule there would change Midnight,
  which Xyh finds challenging enough.
- Still open from the review: failure flow (Level select, untimed practice,
  hint), resume on reload, the Unlock All button, Midnight entries in the Field
  Book, and the "morning breeze" game-over subtitle at every hour.

2026-09-15 — Claude Code — Reviewed the twelve-visit day as a first player's run
and as a small release, then agreed a Dawn overhaul with Xyh. No code changed in
this entry.

Findings:

- Dawn I–III are the only visits whose ready cards have no diagram. Dawn I never
  shows how to draw a loop, Dawn II neither shows nor names the hawkmoth, and
  Dawn III does not mention the snail.
- Measured in the live page with a circle-fit proxy: every 0.5 s across 60 s,
  check whether a circle around the required insects, plus a 14 px margin
  beyond each radius, excludes every other live entity. Population stays at
  quota because nothing is captured. Dawn I: a clean same-kind pair in 100% of
  samples, median smallest loop radius 66 px. Dawn II: trio 97%, radius 169 px.
  Dawn III: Seed & Wing 100%, radius 86 px. Noon IV Counterpart Pair: 100%,
  radius 65 px. Dawn's difficulty runs trivial, hard, easy. The Dawn III snail
  crawls 35 px above the bottom edge (y 605 of 640) and was never in the way.
  This is a proxy, not a human or touch run.
- Xyh's playtest: the difficulty comes from insects crossing the line while it
  is drawn, so enclosed insects escape and bystanders enter. Later chapters are
  challenging enough without adding disruptors.
- A real pointer loop around two Brimstones scored a Kindred Pair; a loop around
  a Brimstone and a damselfly returned the mismatch message, which suggests a
  trio before trios exist.
- The feedback banner draws 54 px above the canvas bottom. In a 720 px-tall
  window the canvas ends at 779 px, so fault explanations were below the fold.
- The game-over subtitle says "morning breeze" at every hour. Failure offers
  only Retry; Level select, untimed practice, and the 12-second hint from
  CAMPAIGN.md are unbuilt. Reload always starts at Dawn I. The Unlock All button
  is visible and all twelve visits are open. The Field Book shows Midnight
  entries to a Dawn player.
- As a release, the day totals 1,150 clock seconds, about 19 minutes, which
  suits a small free game. A Dawn-only demo would show only single loops; the
  figure-eight arrives at Visit IV.

Decisions by Xyh:

- Swap the mechanics of Dawn II and III. Xyh's lines and the save IDs stay in
  their slots; titles move with their mechanics. Visit II takes seeds and the
  snail; Visit III takes the hawkmoth trio.
- Make the snail disruptive. At Dawn it crawls a seam through the middle of the
  field, and a cord that touches it while being drawn breaks immediately.
- Start Dawn I's clock only after the first successful loop.

Proposed and not yet agreed: a Field Book that fills in as figures are taught or
found, a strip of the day's stamps on the completion card, a use for stroke
length bands, and signposting for optional figures.

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


2026-09-16 — Codex — Completed the pickup handoff: replaced the placeholder
String Bean with a pale blue, five-petaled Flax Flower. The field and Noon cards
share `drawFlaxFlower`; the Field Book and pickup/expiry messages name the flower.
Original Canvas paths add no external assets. The internal `bean` type and quota
key remain so threading, pocket, and tap exclusions keep the existing contract.
The 400 px next-cord bonus, twelve-second expiry, and Noon eight-second regrowth
are unchanged.

Added one flower to Dusk VIII and Midnight XII with twenty-four-second regrowth
after picking. These visit choices and the slower interval are first-pass tuning
for Xyh's request for occasional returns. Initial spawning now includes Midnight's
separate scene branch. Runtime and campaign plan agree. No flowers were added to
the chapter-opening lessons.

Verified all six Node suites, including added checks for later-hour initial
population/queueing, pickup, unchanged picking-cord limit, and delayed regrowth.
Inspected the rendered flower in the actual Midnight XII field using headless
Edge; screenshot is ignored under `.browser-check/flax.png`. Module syntax and
`git diff --check` pass. Touch playtesting and regrowth balance remain open.
The screenshot also shows the existing XII objective line overlapping the cord
meter at desktop width; that unrelated HUD layout issue remains unfixed.


2026-09-16 — Codex — Moved the app inside the stage. The title screen and pause
menu carry Drawing the Hours; the playing field has no page header or footer.
Pause sits at bottom right. The menu contains Resume, Visit Card, Visits, Field
Book, Restart, and a Settings submenu for colors and sound. Hidden menus are
inert, focus stays within the active menu, and closing submenus returns to the
menu without resuming. The clock and entities freeze while any menu is open.
Window blur opens the pause menu; a menu does not reset the saved visit.

Removed decorative pavement, frames, verge flowers, and edge planting. Kept
chapter washes and grain, lacewing resting leaves, and gameplay entities including
webs, flax, and night jasmine. Removed the old forced-orientation control: the
field follows the available screen orientation. Short canvas cards scale as a
whole rather than collapsing their internal spacing; failure hit areas scale too.

Xyh corrected the initial viewport-sized implementation before handoff: changing
the viewport must not change density or invalidate pixel-based cord tuning.
`src/viewport.js` fixes gameplay to 960×640 landscape or 640×960 portrait, equal
area, uniformly fitted without cropping. Pointer input and canvas overlay clicks
map from CSS pixels into logical units. Window resizing only changes display
scale; rotation cancels the stroke, remaps positions, and reapplies anchored
entity placement. Cord limits, hit radii, and speeds remain in logical units.
HUD text compensates for downscaling; HTML menu controls retain CSS touch sizes.

All six Node suites pass. `test/shell-browser.html` drove the actual page through
title, menu, settings, Field Book, Visits, Resume, Visit Card, blur, and Restart.
It checks frozen time and entities in menus, equal field area, uniform fit,
unclipped bounds, and a 200-unit synthetic pointer stroke at 390×780, 1200×800,
1600×900, and 844×390 viewports. Inspected desktop, portrait, short landscape,
and title screenshots in headless Edge. Existing browser harnesses dismiss the
new title screen before testing gameplay. Module syntax and diff whitespace
checks pass. Manual full-day and physical touch playtests remain open, especially
scaled insect sizes and the chosen portrait baseline. No cord tuning was changed.


2026-09-21 — Claude Code — Recorded other stories for the string mechanic in
[STORIES.md](STORIES.md): a Filipino
edgelands campaign (places, a cast matched to existing species behaviour,
plants, and two new behaviours), and Xyh's three alternative stories: fish on
an aquarium or pond trip, buttons and crafts, and words, syllables, and numbers
spoken in a situation. Nothing was built and no species, range, or local name
was checked. The Next in Dev line is unchanged. One code-level note carried in
STORIES.md: hover-and-dart is dragonfly behaviour, so the Azure damselfly is
misnamed for how it moves.


2026-10-02 — Claude Code — Added figure diagrams for the combinations a visit asks
for. `src/combo-diagrams.js` holds one table keyed by objective (pair, trio,
seedWing, seedTrio, nursery, counterpartPair, lacewingCounterpart, twinSeedWing,
mixedEcho, figure8, single, any, trace, plus crossMeadow for the Field Book): a
loop, figure-eight, or open trace with the creatures that belong in each pocket,
drawn by the game's own `Insect` and `DandelionSeed` code so each species matches
the field. The visit card now shows a diagram beside every requirement row (rows
grew from 21 to 36 units; the card grows by the same amount per row). The Field
Book's Harmonic Combinations each carry a diagram at the right, drawn when the
book opens. Ordered Trace moved out of the Window Firefly entry into its own
Midnight-gated combination entry so it can carry its diagram; its text is
unchanged.

Verified: `test/test_combo_diagrams.js` (every objective key used by any visit or
practice verge has a diagram, every creature token is a real species, each
diagram draws against a recording context); all other Node suites pass. Opened
the actual page in the preview browser and looked at the Field Book at
Midnight, and at the visit cards for Midnight XII, Midnight XI, and Dusk VIII.
A 3x gallery of all fourteen figures was checked for overlap and clipping.

Not done: the in-play HUD objective line is still text only; diagrams there need
a layout pass because the line wraps beside the cord meter. The Field Book has no
entry for Twin Seed & Wing, which the code recognises but no visit asks for. The
visit-complete recap and pause menu are unchanged. Known and not from this
change: on the Midnight XI card the begin prompt overlaps the last line of the
teaching diagram (same at HEAD). Not checked on a touch device or in Pure light
colours.


2026-10-07 — Claude Code — Paper textures on backdrops and creatures, outlines
off. `src/paper.js` loads the ten images in `textures/`, reduces each to OKLab
residuals around its own mean, and rebuilds it around whatever colour the draw
site asked for. Three settings per role, in `PAPER_USE`: `relief` (lightness
swing), `keep` (how much of the texture's own hue variation survives, turned to
sit on the target hue), and `split` (degrees of hue shift between creases and
highlights). `keep` and `split` at zero give a one-hue tint; the other two are
the answer to recoloured textures going monochrome. The palette stays the
authority for colour, so `palettes.js` and the Pure light fallbacks are
unchanged.

Draw sites: every `fill(); stroke()` outline pair in `entities.js`,
`lacewing.js`, and the Dusk and Midnight leaves now calls `paperShape(ctx,
role)`, which fills with a tinted pattern tile, casts a short cut-paper shadow,
and strokes only when `paperStyle.outlines` is on or the texture is missing.
Veins, antennae, and other inner lines are kept. The four hour backdrops press
a texture into the colour wash through `paperBackdrop`; the procedural fibres
remain as the fallback. The soft ellipse under each flier is hidden while
cut-paper shadows are drawn (`paperStyle.contact`). `themeKey()` gained a
version counter so cached art rebuilds when textures finish loading.

[texture-lab.html](texture-lab.html) shows every species at 3×, 1.6×, and field
size on the hour's backdrop, with texture, relief, keep, and split per role,
toggles for outlines, shadows, and contact ellipses, a strip comparing tint
only / keep / split / both on the role being edited, and the settings as JSON
to paste back into `PAPER_USE`. The values in `PAPER_USE` now are first
guesses, not choices.

Verified: all eight Node suites pass (no DOM, so they exercise the flat-colour
and outline fallback). In the preview browser the lab was looked at for all
four hours with no console errors, and the game was opened to Dawn Visit I,
which showed the textured backdrop and creatures. Measured in the lab on this
desktop: backdrop bake about 400 ms per hour, once per theme or size change
(3.6 s before the bake was capped at 1024 px on the long side); a frame of 30
creatures with shadows 1.3–2 ms.

Not done: `textures/` is untracked and was not committed, because the images'
source and licence are unrecorded (see ASSETS.md); without them the published
game draws exactly as before. Texture and setting choices per hour and per
species are Xyh's to make in the lab. Visit cards, Field Book diagrams, pocket
fills, stamps, the cord, the dandelion seed, and the web patch are untextured;
card and diagram creatures pick up textures because they call the same draw
code, and were not inspected. Not checked: Pure light colours, portrait
layout, a touch device, Safari, and frame time or memory on a tablet (each
tinted tile is 256×256, one per texture, colour, and setting). The Next in Dev
line is unchanged.


2026-10-07 — Claude Code — Visit gating turned off at Xyh's request. `VISIT_GATE
= false` in `index.html` opens every visit and practice verge in the Visits
list; the intro line now reads "Select any visit or practice verge." and
unfinished visits are badged Open. Saves still record progress, and
`isHourReached` and `CampaignSaveManager` are unchanged, so setting the constant
back to `true` restores unlocking. Verified in the preview browser from the
existing save: 31 list items, none locked, and choosing Midnight XXIV started
it. All eight Node suites pass. Not changed: the Field Book still hides hours
not yet reached or in play.


2026-10-07 — Claude Code — Dawn made dustier, and the title screen and menu
cards redrawn, at Xyh's request.

Dawn: the wash moved from pale rose, mint, and sage (`#e7d9d3`, `#e4f0ec`,
`#d9e3d5`) to clay, sand, and dry olive (`#dcc3b6`, `#e5d7c4`, `#cdcbb3`) in
`src/palettes.js` and `new palettes.md`, so it no longer sits beside Noon's
blue, cream, and mint. `dawn-art.js` scatters fine dark and pale specks over the
pressed paper. Other Dawn roles are unchanged.

Title screen: `src/shell-art.js` draws the four hours as overlapping torn sheets
of their own papers, a terracotta cord loop round the title, and the six fliers
circling it. The title sits on a tilted paper card. The sheets bake one per
timer tick; fliers stop animating once the screen is dismissed, and stay still
under `prefers-reduced-motion`.

Menu cards (`.shell-card`: pause and settings): the hour's paper as a mirrored
CSS tile in the panel colour, no ruled border, a cut-paper shadow, a strip of
four hour swatches with the current hour taller, and a flier drawn by the
game's own code on each pause-menu button. `dressMenus()` redraws these when
the hour or colour mode changes. The line that reset the Visits button label on
every level change was removed, since it erased the button's icon and the label
never changes.

Verified in the preview browser: title screen with all four sheets, loop, and
fliers; Dawn Visit I in play on the new wash; pause menu with icons and hour
strip. No console errors. All eight Node suites pass.

Not checked: the settings card, Field Book, and Visits list on the new card
style; Pure light colours; portrait; a touch device. The mirrored card tile
shows a faint symmetric pattern; relief was lowered to 0.011 and the tile
enlarged to 420 px to quiet it, and that last tweak was not looked at again.
Brimstone yellow on the sand wash is lower in contrast than it was on mint.


2026-10-07 — Claude Code — Backdrops moved to Xyh's synthetic textures: Dawn
`asphalt.png`, Noon `glass.png`, Dusk `plastic.png`, Midnight `metal.png`
(`rubber.png` is registered and unused). Only `PAPERS` and
`PAPER_USE.backdrop` in `src/paper.js` changed; the palette is untouched and
each texture is recoloured to the hour's wash as before. Relief per hour:
asphalt 0.03 with `keep` 0.8 so its coloured flecks survive, glass 0.024,
plastic 0.035, metal 0.05 (raised from 0.03, where the dark wash left it
reading as plain cloud). The title sheets and menu cards follow, since they
read the same table. Creatures still use the earlier paper set.

Sources larger than 1280 px on the long side are now reduced once on load.
Backdrop bake in the lab, on this desktop: 445–640 ms per hour (about 0.9–1.1 s
before the reduction).

Verified in the preview browser: all four hours in the lab and the title
screen, no console errors. All eight Node suites pass.

Not done: the four PNGs total about 8 MB (glass 3.4 MB at 1800×2700), far more
than the 1280 px the code keeps; resized copies would cut the download and were
not made, since the files are Xyh's. Their source and licence are unrecorded,
as for the earlier set. `textures/2026-10-07 00-21-59.png` has the same size as
`glass.png` and is not referenced. Each hour was not looked at in play, only in
the lab.

2026-10-07 — Codex — Added favicon.svg and a relative SVG icon link to index.html. The icon is an original drawing documented in ASSETS.md. Rendered it in headless Microsoft Edge at 16, 32, and 96 pixels on light and dark backgrounds and inspected the screenshot; the motif remains legible at tab size. Parsed the SVG as XML and confirmed the local page's favicon link, HTTP 200 delivery, and image/svg+xml content type. Browser-chrome tab display was not directly checked. No gameplay or development plans changed.

2026-10-08 — Codex — Built [Aquarium](between-banks/index.html), an eight-tank
detour with its own runtime and save, linked from the meadow title and pause
menu. The aquarium reuses pocket extraction from `src/geometry.js` without
changing the meadow engine. Bangus, tamban, tilapia, danggit, and protected fry
have original Canvas drawings. Authored visitor cards connect the hatchery,
mangrove nursery, school, pen, seagrass, tidal channel, sorting tank, and last
window. See [the chapter README](between-banks/README.md) for the tank rules.

Accepted loops guide fish into a refuge ring, and count arrivals rather than
removing fish. Mechanics include schooling, minimum group sizes, cord walls,
protected fry, cutting roots and jellyfish, netting that spoils pockets,
aeration loops, a temporary seaweed slowdown, a slack-tide transfer window,
and a two-species figure eight. Every tank is open; practice removes oxygen
depletion and writes no completion. Aquarium cord limit: 1,500 logical pixels;
there is no bead threading here. That departure is deliberate, so the detour
can centre on group transfer and water conditions. Meadow rules are unchanged.

Verified with `node test/test_aquarium.js`: closure, length, roots, fry,
netting, minimum school sizes, pocket purity, tidal rejection, aeration,
already-safe fish, and a two-pocket figure eight. All eight existing Node
test files also passed. Opened `test/aquarium-browser.html` in the in-app
browser: synthetic pointer events transferred real fish to refuge, reached
the completion card, advanced to tank 2, opened all eight tank cards, froze
oxygen on pause, and toggled practice. The check uses the aquarium save, so
running it changes aquarium progress. The browser console reported no errors.
Inspected the pen's active desktop field at 1100×900 and its card at 390×844;
both retained the tank proportions and readable controls. Fixed a pause-time
HUD lag found by that browser check and a pointer event with no coalesced
samples found during the gesture check.

Exhibit claims were checked against SEAFDEC's milkfish culture page and
mangrove code and BFAR's sardine closed-season explanation, linked in the
chapter. The oxygen meter, slowdown, refuge transfer, and tide timings are
fictional game units, stated explicitly in Exhibit notes. Downloading the
48-page SEAFDEC code into `library/drawing-the-hours-aquarium/` failed through
the host connection; the web reader could inspect it, but no local PDF was
retained. No external artwork or texture was added; provenance is in ASSETS.md.

Undone: a full human playthrough of all eight tanks, touch and pen input,
orientation changes on a tablet, difficulty tuning, and aquarium audio.
Next: play the eight tanks on a touch device and tune counts, motion, oxygen,
and slack-tide timing. The earlier meadow pacing pass remains pending after
that playthrough. Both Drawing the Hours entries in ROADMAP.md were updated;
the duplicate entries predate this change and were retained.


2026-10-09 — Claude Code — Textures compressed and loaded on demand, at Xyh's
request. Xyh stated the images are public domain, so the compressed set is now
committed; ASSETS.md records that.

Compression: each `PAPERS` entry in `src/paper.js` now names `file` (loaded
from `assets/textures/`) and `source` (its master in `textures/`).
`scripts/compress_textures.py` reads that table and writes one from the other:
a `.webp` target is resized to 1024 px on the long side at quality 70, any
other target is copied. Masters 9840 KB, compressed 863 KB. The six smallest
masters are copied, because re-encoding them made them larger. Run the script
after adding or replacing a master; `--check` exits 1 if anything is stale.

Loading: no texture is fetched at startup. `paperTile` and `paperBackdrop`
ask for a texture the first time something needs it and draw the flat-colour
fallback until it lands; arrivals within 80 ms are announced together, which
bumps the theme version once so cached backdrops rebuild once.
`onPapersArrived` replaces `papersLoaded` for the title art and menu cards.
The lab calls `loadAllPapers()`.

Verified in the preview browser, from the page's resource timing: the title
screen fetched 10 textures, 452 KB; entering Dusk I fetched one more
(`SB013.webp`, for the leaves), 587 KB in all. Before this the page fetched
15 files, 9.8 MB. Title screen and Dusk I rendered textured with no console
errors; the lab loaded all 15. Node suites pass.

Known limit: the title screen shows all four hours and all six fliers, so it
alone pulls most of the set. Loading per hour saves little until the title
uses less; what it does save is the three textures nothing draws and
`SB012.webp` (159 KB) until a snail or flower appears. A creature drawn before
its texture lands shows flat with outlines for a moment; not observed on
localhost, likely visible on a slow connection.

Not done: `textures/2026-10-07 00-21-59.png` is still in the masters folder
and unreferenced. Creature papers are still whole sheets rather than tile
crops. Not checked on a throttled connection or a tablet.


2026-10-09 — Claude Code — Masters untracked, backdrops baked, grey sources, at
Xyh's request.

Masters: `textures/` is removed from the index and listed in `.gitignore`.
The files stay on disk. They remain in earlier commits (`c5bfec3`), so a clone
still downloads them; removing them from history would need a rewrite and a
force push, which was not done.

Baked backdrops: `scripts/bake_backdrops.py` writes a landscape and a portrait
WebP per hour to `assets/backdrops/` (8 files, 358 KB; Dawn's asphalt grain is
114 KB each, the rest 9–31 KB) and generates `src/backdrops.js`, which records
the settings each was baked from. `paperBackdrop` draws the baked file when
that record equals `backdropKey(hour)` and colours are Default. Otherwise it
presses at runtime as before: Pure light colours, the lab while a slider is
moved, or any backdrop line in `PAPER_USE` or wash colour in `palettes.js`
edited since the bake. So a stale bake is ignored, not shown; rerun the script
to get it back, and `--check` exits 1 when one is stale. The wash's middle stop
moved from literals in the four art modules into `PAPER_USE.backdrop[hour].mid`
so the script and the game read one value. Dawn's dust specks and the Dusk and
Midnight leaves are still drawn at runtime over the baked sheet. The script is
a NumPy port of `recolor()`; a change to one needs the same change in the
other.

Grey: `glass` and `plastic` are marked `grey: true` and encoded without
colour. It saved under 1 KB each, because both masters were already neutral and
WebP spends almost nothing on flat chroma. It was applied only where `keep` is
0; a grey source under `keep` > 0 would lose the hue variation that setting
exists to carry.

Verified in the preview browser. Baked against runtime press of the same
settings, per channel out of 255: mean absolute difference 1.3 (Noon,
Midnight), 1.6 (Dusk), 4.6 (Dawn, whose grain is pixel-scale so resampling
differences count for more); all eight keys matched. Title screen fetched 11
files, 474 KB; Dawn I in play brought the total to 13 files, 692 KB. Both
rendered with no console errors. Node suites pass.

Not done: the menu card still tints the hour's backdrop texture for its paper,
so each hour's source texture (34–82 KB) is still fetched once that card is
dressed; the baked files did not remove that. Portrait copies were compared by
pixels but not seen in a portrait viewport. Pure light colours not looked at.

2026-10-09 — Codex — Archived the first aquarium chapter in
[aquariumarchive](aquariumarchive/ARCHIVE.md) and built the first two levels of
its replacement at [aquarium](between-banks/README.md), at Xyh's request. All six
archived files matched their original SHA-256 hashes after the move. The old
tests were relocated and retargeted to the archive; its original save remains
intact. No worktree was created.

The replacement uses top-view guppies and ricefish against faint underwater
plants and paving. A matching pair swims away along its heading, fades, and is
replaced. There is no refuge destination. Guppies wander slowly; ricefish pause
and dart. Level 1 asks for three guppy pairs. Level 2 asks for two pairs of each
kind. One loop or two separate pockets can score, with exactly two matching
fish in each pocket. The meadow's geometry, StringGesture, swept wall
collision, bead movement, length colours, and 1,300 px limit are reused without
editing those modules. Pointer contact threads fish and cancels an enclosure.

The bubble's visible area decreases with remaining time, beginning on the first
gesture. Pause freezes fish and time; practice removes timing and writes no
completion. Save key: `drawing-hours-aquarium-v2`. Browser checks use `?test`,
which ignores saves and disables storage writes. Completion waits for the final
pair's departure. Only the two built levels are selectable; the field numbers
retain the planned total of eight. Story text is left for Xyh.

Decided against the proposed single-fish introduction: matching pairs retain
the main game's recipe structure and let these levels test movement against
the same gesture. Refuge transfer, oxygen pickups, tidal acceptance gates,
fry protection, and exhibit commentary remain in the archive. Schooling and
additional recipes are deferred until the prototype has been played.

Verified with `node test/test_aquarium.js`: pair purity, separate pockets,
closure, threading, length, first-gesture clock start, pause, practice,
departure, replenishment, completion, and darting fish against a held wall.
All ten `test/test_*.js` suites passed, including the archived aquarium suite.
Opened `test/aquarium-browser.html` in the in-app browser and read PASS for the
mounted pointer-handler, timer, pause, practice, replenishment, objective, and
completion checks. Inspected the desktop field through its 1,100 px iframe
and the portrait field in the 504 px browser pane. The game tab reported no
console errors. The browser checks use injected fish positions and synthetic
pointer events, so they do not establish human pacing.

Undone: human playthrough, touch and pen input, orientation changes, difficulty
tuning, aquarium audio, levels 3–8, and Xyh's text. Next: play both levels on a
touch device and assess pair availability, ricefish timing, and bubble duration
before building the schooling level. Both Drawing the Hours entries in
ROADMAP.md were brought into agreement; the meadow pacing pass remains pending.

2026-10-09 — Codex — Added levels 3–5 and revised all five built levels toward
Xyh's wild, pastoral fish direction. The cast now draws on Luzon ricefish,
blue stream gobies, spotted barbs, and Palawan halfbeaks; see
[species references](between-banks/NATIVE-FISH.md). Ricefish drift gently. Gobies rest
on six stones and dart between them. Spotted barbs form three small schools
that gather and spread; level 3 asks for three fish per pocket, plus a ricefish
pair in a separate pocket. School replacements fill vacant slots. Level 4
adds three stems that cut the cord and block fish; initial and replacement
fish spawn clear of them. Level 5 introduces halfbeaks that glide before sharp
turns, beneath drifting leaf shade. Movement, recipes, colours, and timing are
authored game values, not a biological simulation.

Dropped the interim neon-tetra and glass-catfish cast after Xyh's direction
changed. The proposed transparency mechanic was replaced by halfbeak turns;
shade remains part of the background and does not affect scoring. No story
text was added. Reused the canvas, vegetation, paving, gesture modules, and
bubble clock. New artwork uses original Canvas paths and inline SVG.

The map exposes five levels and stops after level 5. Save key and earlier
progress are retained. Ready-card diagrams and objective labels follow the
recipe size. The archive and meadow runtime modules were not edited.

Verified with all ten `test/test_*.js` suites: recipes, school expansion and
contraction over 56 simulated seconds, replacement slots, goby rests and darts,
halfbeak turns, stem contacts and spawn clearance in both field orientations,
and all five completion states. The mounted browser check tests real pointer
handlers with injected fish positions, including school-size rejection, live
stem cuts, practice, bubble expiry, and completion. It waits for observable
states rather than assuming animation frames run within a fixed wall time.
Read PASS for all five levels in `test/aquarium-browser.html`. Inspected the
barb schools, stems, halfbeaks, and goby stones in the 504 px portrait browser
pane; desktop pointer checks run in its 1,100 px test iframe. Human difficulty
is not established by these checks.

Primary fish papers were downloaded to `library/drawing-the-hours-aquarium/`,
checked by title and page count, and cached as Markdown with the library's PDF
converter. The ricefish monograph download returned HTTP 403; the species
identity and locality were checked against the Catalog of Fishes instead.

Undone: human timing and touch/pen playtests, orientation changes during play,
audio, story text, and levels 6–8. Next: play levels 3–5 on a touch device and
tune school spacing, stem passages, and fish contrast before building level 6.
Both root roadmap entries were updated; the meadow pacing pass remains pending.

2026-10-09 — Codex — Completed aquarium levels 6–8 at Xyh's request. Level 6
requires three figure eights, each with a ricefish pair and a goby pair in
separate pockets. Level 7 combines a three-barb school with a halfbeak pair
in each of three figure eights. Both reject single loops and identical kinds
in both pockets. Level 8 brings all four kinds into open water, with two groups
of each kind and a choice of single loops or figure eights. Existing movement,
stones, shade, fish artwork, and the bubble clock were reused. The final level
opens a chapter completion card with replay and level selection.

Added two-pocket ready-card diagrams with the actual kinds and group sizes.
The portrait objectives sit below the title; the four-kind finale reserves
more space above the fish. Kept the final field clear of stems so its challenge
comes from the mixed movements and recipes. Story text remains for Xyh.

Verified with all ten `test/test_*.js` suites and the mounted browser check at
`test/aquarium-browser.html`, which read PASS for all eight levels. The checks
cover the required two-pocket figures, rejected lone pairs and undersized
schools, progression from level 5 to level 8, chapter completion, replay, and
the eight-entry map. Simulated the final three populations for 20 seconds in
landscape and portrait and checked finite positions, bounds, and counts.
Inspected the two-pocket diagrams and the final four-kind HUD at 390 px width;
the game console reported no errors. The browser uses injected fish positions,
so these checks do not establish human difficulty.

Undone: human timing, touch and pen input, orientation changes during play,
audio, and story text. Next: play all eight levels on a touch device and tune
figure-eight spacing, fish contrast, and bubble durations. Both root roadmap
entries were updated; the meadow pacing pass remains pending.

2026-10-10 — Codex — Revised aquarium levels 3–5 and 8 after Xyh's playtest.
Level 3 has two barb shoals of six and seven and a ricefish gathering of six;
the player peels off exactly three barbs or two ricefish. Replacements fill
vacant slots in the larger shoals. Levels 6–7 keep their existing populations,
recipes, timings, and movement, including the original school spawn spacing.

Level 4 replaces three stems with two compact leaf clumps and one water beetle.
Level 5 adds two beetles; level 8 adds one. Beetles paddle, pause, and turn.
Leaves and beetles cut any cord they touch, including when a beetle crosses a
stationary held cord. Swept contact checks prevent a beetle skipping across it.
Enclosing an obstacle without touching it is allowed. Leaf clumps block roaming
fish; initial and replacement spawns clear the leaf disks.

Rising bubbles in levels 3–5 and 8 mildly displace nearby unthreaded fish and
expire. They are disturbances, not pickups. The old timer-restoring bubbles
remain in the archive; timer restoration was deliberately not reintroduced
with these bubbles. The countdown still starts with the first drawing gesture.
Xyh's design distinction is retained: moving disruptors are animals; static
disruptors are terrain, materials, or flora; power-ups are flora, objects, or
materials. This change adds no power-up or story text. Beetles, leaves, and
bubbles use original Canvas drawings.

Verified with all ten `test/test_*.js` suites. The aquarium checks cover larger
shoal membership and replenishment, leaf contact and fish clearance in both
orientations, beetle movement crossing a held cord, paused disturbances, bubble
displacement, bubble expiry, unchanged countdown rate, and all eight completion
states. Populations and beetles remain finite and within bounds after 20
simulated seconds in both orientations. The mounted browser check covers leaf
cuts, pointer contact with a beetle, and a beetle moving into an idle cord,
alongside progression and final replay. Read PASS for all eight levels in `test/aquarium-browser.html`. Inspected the
leaf clumps, beetle, and larger shoals at 390 px width. Browser fixtures inject
fish positions; they do not establish human difficulty.

Undone: human timing, touch/pen playtests, orientation changes during play,
audio, and story text. Next: play the revised levels on a touch device and tune
shoal separation, beetle pacing, and bubble disturbance strength. Both root
roadmap entries were brought into agreement; the meadow pacing pass remains
pending.

## 2026-10-10 — Codex — Aquarium water colors and paper fish

Paired the eight levels into blue, green, peach, and purple water washes.
Removed the straight submerged paving lines, retaining faint vegetation and
water ripples. Fish bodies, tails, and fins reuse mulberry, coir, gold tissue,
and fibre textures through the existing cached paper renderer. Softer body
outlines leave spots, cyan stripes, eyes, and beaks readable. Texture fills
follow each fish's position and heading; flat fills remain the loading fallback.

Checked the rendered first and eighth levels in the in-app browser at its
portrait viewport. All four species showed texture and the paving lines were
absent; the preview reported no console warnings or errors. The Node aquarium
suite passed, and the mounted `test/aquarium-browser.html` check reported PASS
through all eight levels. This replaces the previous turn's blocked browser check.

Undone: touch/pen difficulty and texture contrast on other displays, orientation
changes during play, audio, and story text. Next remains the touch playtest for
shoal separation, beetle pacing, and bubble disturbance strength.

## 2026-10-10 — Codex — Supplied water textures

Added finished water artwork for the four level pairs in both orientations:
blue Fabric 180, green Glass 163, peach Fabric 176, and purple Grunge 328.
`scripts/bake_aquarium_water.py` reuses the meadow backdrop script's cover and
OKLab recoloring functions. Source colors are replaced with the level washes;
lightness relief and some hue variation survive. Images load once, with the
plain wash as fallback, beneath the existing radial light and vegetation.
Supplied originals in `between-banks/tex/` stay local and are excluded from Git;
finished backgrounds are recorded in `ASSETS.md` with the Texturelabs terms.

Left Fabric 181 and Grunge 350 unused because their large stains compete with
fish. Left Grunge 325 unused because its cracks restore sharp background lines.

Inspected all four water treatments in the rendered portrait game, with no
console warnings or errors. The Node aquarium suite passed. The mounted
browser check reported PASS through all eight levels with the new backgrounds.

Undone: human touch/pen playtests, contrast on other displays, orientation
changes during play, audio, and story text. Next remains the touch playtest for
shoal separation, beetle pacing, and bubble disturbance strength.

## 2026-10-10 — Codex — Shared field sizing and pill UI

Aquarium now uses the main game's `fitField` sizing: 960 × 640 landscape or
640 × 960 portrait, with uniform scaling and letterboxing. Navigation, objectives,
practice, pause, status, and menu cards sit inside the fitted field. The main
stage also follows the fitted field, so its pause button and menus stay within
those bounds on wide screens. Aquarium resize cancels an active cord and
repositions fish and terrain on rotation without resetting progress or time.
Both water orientations are preloaded.

Added `ui.css` for shared pill controls. Meadow objectives are separate
translucent Canvas pills, with wrapped labels and dimmed completed backgrounds.
The existing clock, cord meter, palettes, and menu icons remain in use.

Verified with all ten Node suites and the mounted aquarium progression check
through all eight levels. `test/aquarium-layout.html` passed at 390 × 780,
1200 × 800, 1600 × 900, 844 × 390, and 320 × 568, checking logical area,
uniform scaling, UI containment, and preserved play through rotation.
`test/shell-browser.html` passed field sizing, pointer/cord scaling, menu
behavior, and pause placement. Inspected aquarium in portrait and the main
Midnight XXIV screen with five objective pills in landscape. Neither page
reported console warnings or errors.

Undone: human touch/pen playtests, contrast on other displays, audio, and story
text. Aquarium next remains the touch playtest for shoal separation, beetle
pacing, and bubble disturbance strength; the meadow pacing pass remains pending.

## 2026-10-10 — Codex — Between Banks and eight level texts

Renamed the freshwater chapter Between Banks in its page title, header,
accessible field name, main-game links, README, and both root roadmap entries.
The folder and save key remain unchanged. Added Xyh's eight supplied passages
as level data and placed each above its recipe diagram on the opening card.
Wording, capitalization, and sentence fragments are preserved; the sixth
passage is upright and the other passages are italicized as supplied.

The Node aquarium suite passed recipes, movement, disturbances, timer,
replenishment, and all eight completions. Browser card inspection remains
unverified: the in-app tab reached a connection-refused error, then its URL
policy blocked access to that generated error page even after restarting the
root preview server. Existing cards scroll internally on small screens.

Undone: browser inspection of the longer passages, human touch/pen playtests,
and audio. Texts are Xyh's authored copy, not a new scientific verification.
Currents and eddies remain a design discussion; no water mechanic was added.
Next remains the touch playtest for shoal separation, beetle pacing, and bubble
disturbance strength; the meadow pacing pass remains pending.

## 2026-10-10 — Codex — Compressed water and revised ending

Updated level 8 to Xyh's revised passage, preserving its wording and italics.
Rebaked the finished water images at WebP quality 70 rather than 88, retaining
both 960 × 640 and 640 × 960 versions. Combined size fell from 631,480 to
195,368 bytes (69%). The browser already used these baked images rather than
original JPEGs in `between-banks/tex/`; no source texture is shipped. Water images
now load only when their color and orientation are shown, then stay cached.
The plain wash remains visible while an image loads or if it fails.

The Node aquarium suite passed. Inspected the first and final opening cards
in the in-app browser; the revised ending and compressed purple background
rendered, with no console warnings or errors. This resolves the previous
browser-access blocker for those cards. The mounted progression check passed
through all eight levels with on-demand backgrounds.

Undone: a visual pass of the other six passages and touch/pen playtests.
Next remains the touch playtest for shoal separation, beetle pacing, and bubble
strength; the meadow pacing pass remains pending.

## 2026-10-10 — Codex — Shared sound effects

Between Banks now uses the meadow's existing `src/audio.js` for drawing rustle,
release plucks, successful-group harmony, and cord or recipe faults. Trios and
two-pocket figures use their corresponding meadow chords. The pause menu has
a Sound toggle, with M as its keyboard shortcut. Cancelling, pausing, or leaving
the page stops the drawing rustle. No samples or new audio assets were added.

The JavaScript syntax check and Node aquarium suite passed. The mounted browser
check passed through all eight levels, including shared sound calls, trio and
two-pocket chord selection, and the Sound/M controls. These checks exercised
the audio code; they did not include listening on the playback device.

Next remains the touch playtest for shoal separation, beetle pacing, and bubble
strength, with a listening pass to check sound balance. The meadow pacing pass
remains pending.

## 2026-10-10 — Codex — Between Banks concept and mechanics

[Between Banks](between-banks/README.md), developed under the working name Aquarium,
is an eight-level freshwater chapter of Drawing the Hours. It carries the
meadow's childlike wonder into an overlooked stream-and-pool setting, with
leaves, stones, shade, and wild fish. The view is almost top-down; textured
water and faint vegetation leave the surroundings vague. Fish have paper
bodies, and blue, green, peach, and purple water each span two levels.

The player draws a cord around moving fish, crosses it to close a pocket,
and lifts to release a valid group. Most kinds require exactly two matching
fish; spotted barbs require three. Fish swim away after a successful figure
and replacements enter. A figure eight holds different kinds in separate
pockets. Later levels require a ricefish pair with a goby pair, then a barb
trio with a halfbeak pair, before the last level brings all four kinds together.

Movement supplies much of the variation: ricefish drift, gobies rest on stones
and dart, barbs gather into schools, and halfbeaks glide and turn sharply.
Small Schools asks the player to peel the required count from a larger group.
The cord blocks fish while held; passing through a fish threads it and spoils
the enclosure. Leaf clumps obstruct fish and cut the cord, water beetles cut
it while moving, and rising bubbles gently disturb nearby fish. A shrinking
bubble measures remaining time. Practice is untimed.

The fish cast draws on Philippine freshwater species, with movement authored
for play. Xyh's eight opening texts place these encounters alongside introduced
fish, aquaculture, public-health releases, biogeography, and the aquarium trade.
The final passage turns toward weekend visits and the feeling of living
between banks. The chapter retains the meadow's gesture rules and fitted
screen, with all controls inside it.

Rivers, eddies, and sheltered pockets have been discussed as ways for water
to influence fish movement. They are not implemented. The earlier tank-based
chapter remains in [aquariumarchive](aquariumarchive/).

This overview was checked against the chapter README, level definitions, and
the recorded design decisions. Next remains a touch playtest to tune shoal
separation, beetle pacing, and bubble disturbance strength.

## 2026-10-10 — Codex — Chapter folder renamed

Moved the active chapter and its local texture masters from `aquarium/` to
`between-banks/`. Updated main-game links, test imports and iframe URLs, the
water bake script, the texture ignore rule, asset records, and notes links.
Existing filenames and the save key are retained; `aquariumarchive/` and the
fish-reference library folder are unchanged.

The Node aquarium suite passed through the new imports, and the renamed page
returned HTTP 200 and rendered its opening card in the in-app browser. The
mounted browser progression check passed through all eight levels at the new
path. Original textures remain ignored by Git at their new location.

Windows prevented renaming the directory itself because another process holds
it open. Its contents were moved individually; an empty `aquarium/` directory
remains until that handle is released. No chapter file remains in it.
Next remains the touch playtest for shoal separation, beetle pacing, and bubble
strength; the meadow pacing pass remains pending.

## 2026-10-10 — Codex — Main title cover

The main opening screen has a dedicated light paper cover, independent of the
saved visit's hour. A two-line title, four-hour legend, and twenty-four-visit
label establish the meadow campaign. Begin or Continue is the main action;
Between Banks has a smaller companion link. Existing paper textures, cord art,
Mali fonts, and insect drawings are reused. The modal keyboard focus loop now
includes links, so the companion chapter is reachable with Tab.

Checked the rendered page in the in-app browser at 360 × 640, 960 × 640, and
640 × 360. DOM bounds confirmed the cover fits inside the fitted field in each
size. Tab reached the chapter link and wrapped to Continue; Continue dismissed
the title and focused the game canvas. No browser console errors appeared.
The shell-art syntax check and Git whitespace check passed. The touch pacing
and sound-balance playtest remains pending; no gameplay rules changed.

## 2026-10-10 — Codex — Title cover simplified

Following Xyh's direction, removed the visit count, hour legend, and companion
link from the title cover. Only the title and Begin or Continue remain. Larger
Mali lettering uses green, terracotta, and plum with slight line rotations.
The light paper cover and existing insect/cord background remain. Between Banks
is still linked from the pause menu. The removed labels were dropped to let the
display lettering carry the opening, rather than explaining the campaign.

The in-app browser showed only the heading and Continue in the opening dialog.
DOM bounds confirmed the cover and heading fit at 360 × 640, 960 × 640, and
640 × 360. Tab stayed on the sole action, and Continue opened the game canvas.
The pending touch pacing and sound-balance playtest is unchanged.
