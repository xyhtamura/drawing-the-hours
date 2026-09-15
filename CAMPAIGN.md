# Drawing the Hours: first twelve visits

Implementation specification, updated 2026-09-15. **Dawn, Noon, and Dusk
(Visits I–IX) and Midnight Visit X are implemented. XI–XII remain planned; tuning remains provisional.** Xyh confirmed four successive groups of three levels: Dawn,
Noon, Dusk, Midnight. Each of their twelve lines introduces one level.
Their [original draft](first12levels.md) remains unchanged.

The [campaign plan](campaign-plan.json) contains all twelve level records,
verbatim transition text, objectives, population counts, and initial tuning.
It is design data for the implementation, not a file the current game loads.
This document defines how to interpret it. It supersedes the 24-level campaign
in `SPEC.md`; twelve levels form a complete release, with later visits optional.

**Planned replacement, 2026-09-15:** [STRING.md](STRING.md) records Xyh's
decision to replace the Enclose and Trace modes with one drawing gesture: the
held cord walls insects in, a pointer passing through an insect threads it, long
cords snap, and a short press is a tap. It is not built. Until it is, this
document describes the running game; once built, it supersedes the Trace and
mode-switching sections below and turns each Trace into threading in sequence;
the Midnight objectives stay.

## Story and setting

The narrator waits for a bus, eats lunch, walks home with medicine, and wakes
during the night. These are the facts supplied by Xyh. Their employment feels
uncertain. The medicine's recipient, their occupation, age, city, and the cause
of their wakefulness are unspecified. Do not assign a diagnosis, invent a
dependent character, or make successful play resolve those circumstances.

Agent proposal: four nearby pockets of nature along an urban routine. Dawn
uses a curbside patch beside the bus stop. Noon uses an open-air atrium with
planting beside paving and glass. Dusk follows a planted passage between a
wall and the walk home. Midnight looks through an open window at an exterior
planter. The last location is a proposed interpretation of the draft's corner,
not a change to its wording. No interior swarm or threat is implied.

The story's movement is growing familiarity with these places. The narrator
continues an uncertain ordinary life and develops a repeated practice of
drawing among its small inhabitants. Keep successful group movement slightly
unlikely without settling whether it is literal magic or imagination. Avoid
an explanatory reveal, villain, employment-resolution ending, or moral about
the player having learned to appreciate nature.

Use the paper textures, cut silhouettes, and cord already established.
Represent urbanity through curb seams, drain-edge weeds, planter lips,
paving joints, a wall, glass, and window frames. No identifiable city assets
or third-party imagery are needed. Keep these at the playable field's edges;
they are scenery in this campaign, not collisions or hidden gesture barriers.

## Transition and campaign flow

Show a transition card before level 1 and between every pair of levels. Each
card contains the upcoming hour, level title, and its exact `transitionText`.
Text stays until the player chooses **Continue**; there is no typewriter delay,
timed reading, narration dependency, or animated text behind the finger.

After Continue, show the level instruction and any first-use diagram in a
ready overlay. Start simulation and the clock only on **Begin**. Keep narrative
and operational instructions separate. Pause all motion, expiry, and victory
timers during transitions, help, background-tab suspension, and ready screens.

On success, freeze gameplay, show the completed objective checklist and score,
then offer **Continue** to the next transition. Do not advance on an old pointer
release; the completion overlay must require a fresh input. Clear held pointer
state when leaving a level. On failure, offer **Retry** or **Level select**;
retry starts the same ready screen without making the player reread the story.
Provide access to its text from the pause menu.

After level 12, show **Twelve visits complete**, the campaign record, and
**Replay a visit**. Leave the quiet window scene visible behind this screen.
Xyh's final sentence has already introduced the level; do not repeat it as an
ending or append a new explanatory monologue. Let the final activity follow
the statement that tomorrow keeps happening.

Save completed IDs, highest unlocked level, best score per level, and current
campaign position in versioned local storage. Use stable IDs from the plan;
array position is presentation order, not save identity. A reload resumes at
the ready screen, never in a half-drawn gesture. Unlock the next level on
completion; preserve replay access. Keep the prototype's two waves separately
accessible as **Practice** for comparison. They are not campaign level IDs.

## Gradual additions to the prototype

Xyh explicitly supports new insects and mechanics within these twelve levels.
Add a seed-moving breeze at noon, a resting flier at dusk, and ordered contact
at midnight. Final levels mix learned actions. These are proposed features.

### Noon breeze: levels 5–6

Repeat eight calm seconds, two warning seconds, and two gust seconds. A wind
indicator and leaning leaves announce a rightward gust. During it, add 0.08
playable-field widths per second to seed horizontal movement. Existing drift
continues; no wind force acts on insects, cord, or pointer. Pause stops the
cycle. Seed exit and quota-based re-entry remain visible. Containment uses
positions at release, so waiting through a gust is a valid strategy. Level 5
teaches this condition with extra time; level 6 combines it with Seed & Trio circles.
This is an authored movement rule, not a fluid simulation.

### Dusk lacewing: levels 7–9

Add `lacewing`, with mint veined folded wings and a narrow body. It travels
among three visible leaf anchors inside the safe area: three seconds of smooth
travel, then 1.5 seconds resting. Stagger individuals' phases. `motionScale`
affects travel, not rest. Anchors use normalized positions and allow room for
a surrounding pocket; recompute them on orientation change. Resting insects
remain eligible. Level 7 requires two Counterpart Pairs involving a lacewing.
This is fictional game behavior, not an entomological claim.

The [Dusk chapter design](DUSK.md) specifies the implementation and revised
Visits VII–IX. Hoverflies remain available as stable partners. Visit VIII
requires a Nursery and a lacewing Counterpart Pair; mixed Echoes are deferred
pending gesture calibration.

### Midnight firefly and Trace mode: levels 10–12

Planned for replacement by [STRING.md](STRING.md), which removes Trace mode and
keeps these objectives, with each Trace threaded in sequence.

[Midnight implementation and handoff](MIDNIGHT.md) records the implemented
Trace contract, revised populations, and Antigravity's XI–XII build sequence.

Add `firefly`, a slow wandering beetle silhouette with a cream-yellow glowing
abdomen. Its body and hit radius stay visible and unchanged between glows.
This fictional inhabitant has no hidden invulnerability period.

Level 10 locks to **Trace**, with only fireflies and lacewings. Display names
and silhouettes for firefly, lacewing, firefly. Press in empty space, pass
through three distinct insects in order, and release. The first firefly cannot
also supply the last. A valid trace harmonizes the contacted insects, scores
240 base points with the existing length multiplier, and advances `trace`
and `any` counters where listed. It need not close.

Record first contacts using swept relative-motion segment tests, accounting
for pointer and target movement between samples. Use the visible target
radius. Sort contacts by time; indistinguishable simultaneous contacts produce
an overlap explanation rather than arbitrary ordering. Mark and reserve
touched IDs while letting them move. Ignore repeated contact with the same
ID. A wrong kind, fourth distinct insect, or touched hazard invalidates the
whole trace. Show mismatch immediately; mutate entities, score, and objectives
only on release. Cancellation clears reservations. An incomplete trace cannot
score. No minimum stroke speed is required. Untouched enclosed objects do not
count in this mode.

Levels 11–12 provide **Enclose / Trace**. Enclose uses the existing pocket
grammar; touching a creature does not secretly start a trace. Trace uses
ordered contacts even if the line closes. Disable mode switching mid-stroke.
Show the mode in text and cord treatment. Mixed-mode levels start and retry
in Enclose. Keep the same trace sequence throughout this campaign. New flier
kinds participate generically in enclosure recipes.

## Recipe validity and objective progress

Retain the existing loop and figure-eight grammar. Every valid drawing still
scores and performs its departure animation. Campaign progress is a separate
check on the completed drawing. A valid drawing that does not advance an
unfinished objective should say **Valid combination; objective unchanged**,
without a fault sound. The HUD must show each remaining requirement.

Do not depend solely on the winning `recipeType`. Existing recipe precedence
means a matching mixed composition becomes Symmetric Correspondence before
Twin Seed & Wing; Counterpart Pair and Counterpart Dialogue also share an ID.
Derive enclosure objective tags from normalized pocket contents after the
existing evaluator accepts the drawing; derive Trace tags from its separate
accepted contact sequence. No hazards or empty pockets qualify for enclosure.
Treat the current internal `butterfly` entity type as a flier category, including
damselflies and hawkmoths; normalize legacy kind aliases.

| Objective key | Predicate for one accepted drawing |
| --- | --- |
| `any` | Any valid enclosure or trace. |
| `single` | Accepted Enclose drawing with exactly one pocket. |
| `figure8` | Accepted Enclose drawing with exactly two pockets. |
| `pair` | One pocket with exactly two same-kind fliers and no seeds. |
| `trio` | One pocket with exactly three fliers of three different kinds and no seeds. |
| `seedWing` | One pocket with exactly one flier and one seed. |
| `counterpartPair` | Two pockets, each with exactly one flier, with different kinds and no seeds. |
| `lacewingCounterpart` | A Counterpart Pair with a lacewing in one pocket. |
| `trace` | A completed exact Trace sequence; no enclosure tags apply. |
| `nursery` | Two pockets: one has one or more fliers only; the other has one or more seeds only. |
| `mixedEcho` | Two pockets have identical flier counts by kind, at least two distinct flier kinds in each, and no seeds. |
| `twinSeedWing` | Two pockets each have exactly one flier and one seed; flier kinds may match or differ. |

Each objective value in the plan is a required count. All listed requirements
must be met. One drawing increments each applicable counter once, never once
per pocket or creature. Overlap is intentional: a Nursery advances `figure8`,
`nursery`, and `any` when those keys are present. Clamp displayed counters at
their targets. Do not infer `any` when it is not specified. Count each entity
only once in the snapshot and exclude harmonizing/departing entities from
subsequent captures, so a success cannot be scored repeatedly during departure.

A drawing earns the existing four-second bonus only if at least one listed,
unfinished counter advances. Award it once per drawing, even if several
counters advance. Other valid drawings still score but grant no time. Keep the
remaining-time cap at initial duration plus 15 seconds. This prevents unlimited
pair farming while an unmet figure-eight requirement remains. Mistakes consume
elapsed time only; add no new score deduction, life loss, or hazard time penalty.

The final qualifying pointer release wins if processed before expiration.
Latch completion immediately before its visual delay; no later expiry can
reverse it. A release at or after expiry fails. Use one simulation clock and
cancel pending state on restart. There is no active-stroke grace period in
this campaign; the earlier idea was never selected. Reduced motion and muted
audio must not change objective or clock semantics.

## Population and first-pass tuning

Every plan record lists live quotas for the existing and proposed flier kinds,
seeds, and snails. Initialize and replenish by kind, not by a random choice
against a total flier count. A 2/2/2 profile must not drift into 6/0/0 and make
the required trio impossible. Ignore departing and harmonizing entities when
calculating active deficits. Schedule replacement after 0.8 simulation seconds;
pending replacements count toward the quota so updates do not schedule extras.

Use a seeded generator per level attempt for reproducible testing; retry may
repeat the seed, while replay can offer another. Place entrants inside the
safe play rectangle with a visible entrance and without overlapping another
target. Top HUD space, controls, and footer are outside that rectangle. Spawn
the first taught arrangement in loose neighboring groups with room for a
loop or two lobes; do not draw a forced solution path. If placement fails,
queue the entrant instead of placing it beneath the HUD.

`motionScale` multiplies spatial travel rates, including dart and arc movement;
it does not slow the simulation clock, wing animation, or behavioral waiting
periods. These values and durations are proposed tuning, not measured outcomes.
The campaign initially keeps 90 px closure and the existing length bands;
neither becomes a mandatory objective. Keep portrait/landscape preferences
and verify finger-scale behavior before treating these tolerances as settled.

After twelve seconds without objective progress, offer a dismissible hint for
one unfinished requirement. Use a diagram, not target teleportation or auto-win.
Any retry offers an untimed **Practice this visit** option; it does not unlock
the next campaign level or overwrite a timed best score. Normal completion
never requires a minimum score, flawless gestures, or an unannounced combo.

## Level sequence

The plan file is authoritative for numbers and exact transition text. The
following titles and mechanical assignments are agent proposals grounded in
Xyh's confirmed order. No extra narrative lines are required.

| Level | Hour and title | Learning or application | Scene treatment |
| --- | --- | --- | --- |
| 1 | Dawn — Before the bus | Four single loops around matching pairs; the clock starts after the first loop. | A narrow curb, grass seam, and the lower edge of a bus-stop post; spacious center. |
| 2 | Dawn — Something in the air | Five combinations, including two Seed & Wing loops. | Seed drift, and the first snail crawling a paving seam through the middle of the field. |
| 3 | Dawn — The curbside patch | Four combinations, including two three-kind trios. | Same patch, third flier silhouette introduced; the seam snail stays. |
| 4 | Noon — Lunch in the atrium | Four combinations, including three Counterpart Pairs. | Planting beside pale paving; teach one different flier in each lobe. |
| 5 | Noon — For now | Four figure-eights, including two Nurseries (1 flier + 1 seed); introduce warned gusts. | Choose when to close around drifting seeds. |
| 6 | Noon — The glass and the leaves | Four combinations, including two Seed & Trio loops, with breeze. | Glass seams frame single-loop groupings. |
| 7 | Dusk — The way through | Five combinations, including two Counterpart Pairs with a lacewing. | Leaf anchors offer visible resting intervals. |
| 8 | Dusk — The gaps in the sound | Five combinations, including one Nursery (1 flier + 1 seed) and one lacewing Counterpart Pair. | Same passage; a sound layer may intermittently fall quiet without changing the rules. |
| 9 | Dusk — Carrying something home | Six combinations, including three single loops and two figure-eights. | Slightly denser field; gesture switching, with no medicine gameplay metaphor. |
| 10 | Midnight — The window corner | Three firefly–lacewing–firefly traces. | Sparse cast teaches open tracing. |
| 11 | Midnight — Figures | Six combinations including a pair, Seed & Wing, a figure-eight, and two traces. | Explicit Enclose/Trace switching. |
| 12 | Midnight — Tomorrow keeps happening | Seven combinations including two singles, two figure-eights, two traces, and a Nursery. | Flexible synthesis with no new rule. |

The midnight scene must not hide valid targets or hazards. Lamplight is a
palette and framing treatment in these twelve levels. The selected
flier kinds remain available for the grammar at each hour as fictional game
inhabitants; this is not a claim about their real activity cycles. If realistic
regional species become a goal, do that research separately before relabeling.

## Implementation changes and boundaries

1. Convert the plan into a native data module or load its JSON. Validate unique
   IDs, recognized scene/hour/tag values, positive durations, nonnegative integer
   quotas, and positive integer objective targets before entering the campaign.
2. Replace the two-way `currentWave` branching with level records, a current ID,
   and explicit transition/ready/playing/paused/completed/failed states. Keep
   Practice able to load the original two profiles.
3. Add pure objective-tag derivation and progress evaluation. Keep the existing
   score evaluator and presentation title; do not reorder recipes to make
   objective checks work.
4. Replenish per-kind populations and keep all interaction inside a responsive
   safe rectangle. Render the four scene treatments from reusable local shapes.
5. Add transition cards, level select, versioned progress, and campaign ending.
   Keep the Field Book available, teaching a diagram when its form first appears.
6. Add the warned seed gust, lacewing anchor behavior, firefly rendering, and
   Trace evaluator. Implement and verify these separately before mixed-mode
   levels. Set a baseline firefly travel speed of 0.65 times the current
   Brimstone travel speed; glow in a three-second cycle with a 0.8-second bright
   interval and staggered phases. These are first-pass tuning values.

Preserve build-free ES modules, the Pointer Events path, and procedural assets.
No trefoils, contact-cutting, real-time-of-day lock, currency, roguelike
upgrades, or new audio dependency is needed for release one.
The optional ambient sound for line 8 can be deferred; its text remains intact.
The earlier existing-recipes-only draft was expanded after Xyh explicitly
invited gradual new mechanics and insects; the JSON reflects the revision.

The folder rename to `drawing-the-hours` was executed on 2026-09-14 per Xyh's
instruction, with root roadmap, backlog inbound links, and local URLs updated;
level/save IDs (`dth_campaign_save_v1`) and internal relative links were preserved.
Coordinate edits in this project sequentially; no concurrent implementation agents are authorized here.

To extend the campaign, append records with new stable IDs and reuse scenes,
objective tags, and profiles. New mechanics require their own evaluator and
tests, not a guessed field that the loader silently ignores. Reordering records
must not attach an existing save to another level.

## Acceptance and handoff

Before shipping the campaign, test progress with deliberately overlapping
recipes: same-kind Twin Seed & Wing still advances its objective despite an
Echo score title; a one-flier-per-lobe Echo does not advance `mixedEcho`;
Counterpart Dialogue does not advance `counterpartPair`. Repeating ordinary
pairs must not complete a level with unmet specialized quotas or keep adding
time once all applicable objectives are full.

Test each plan's objectives with known pocket fixtures and its population
quotas. Verify refill restores each missing kind and no harmonizing entity
can score twice. Check completion/expiry ordering, retry during success delay,
pause/help, backgrounding, save migration, and transition input isolation.

Test Trace with the exact sequence, a wrong order, duplicate-ID contact,
an extra target, a crossed hazard, cancellation, simultaneous overlap, and
a moving insect crossing between pointer samples. Enclose must ignore the
Trace sequence; Trace must not score enclosure contents. Check the gust's
warning and phase boundaries, pause behavior, and seed-only displacement.
Check lacewing rest eligibility and firefly visibility between glow peaks.

Run every level through the actual page using normal input. Read all twelve
transition cards against `first12levels.md`. On mouse and real touch devices
in both orientations, verify no clipping, reachable goal counters, visible
targets, closure behavior, and smooth motion. Record attempts, completion
times, invalid-gesture causes, and hint use; unit-test success is not a balance
finding. Start with the supplied generous clocks and tune only from play.

At this handoff, the existing mechanics suite passes. Source inspection found
that the two prototype waves both advance on any valid recipe; no campaign
objective filtering exists yet. The formal spec also retains stale closure
and species details, corrected by the current source and notes. Browser
automation could not start (access denied), so no fresh visual playtest was
performed. The JSON and story sequence were checked as design artifacts only.

## Insect cast revision, 2026-09-14

Noon replaces its damselflies with Amber Hoverflies; the Brimstone stays as a
familiar insect. All three Noon population definitions use this replacement,
including the independent Noon practice entry. Existing objectives stay intact.
Visits 5–6 remain Antigravity's implementation scope.

The hoverfly has a compact amber abdomen with three dark bands, two broad
translucent wings, and large eyes. At motion scale 1, it holds for 1.4–2 seconds,
turns in place for 0.3 seconds, then shifts 47.5 pixels over 0.5 seconds. Noon 1's
0.8 scale lengthens these phases without changing the shift distance. The turn
signals the next movement; wing vibration continues during the stationary
capture window. Boundary steering directs the next shift inward. These are
stylized game behaviors, not a biological simulation.

| Hour | Cast direction | Movement role |
| --- | --- | --- |
| Dawn | Brimstone, damselfly, hawkmoth | Wandering, darting, sweeping |
| Noon | Brimstone and hoverfly; retain other authored ingredients as needed | Passing and pausing |
| Dusk | Hawkmoth, new lacewing, occasional damselfly | Broad arcs and gentle drifting |
| Midnight | New firefly and returning lacewing | Pulsing visibility and drifting |

Dusk and Midnight are design directions, not implemented population changes.
Reconcile their existing visit quotas and recipes when building those chapters.
Keep firefly visibility readable enough to draw; decide the pulse timing through
playtesting. Six insect types across the campaign are sufficient for this plan;
seeds and snails add other interactions. Introduce one new insect per later hour
and reuse familiar ones so the changing hour remains legible.

## Dawn revision, 2026-09-15

Xyh swapped the mechanics of Visits II and III. Each transition line stays in
its slot and keeps its save ID; the titles moved with their mechanics. Visit II,
*Something in the air*, adds seeds and the first snail to the two familiar
insects. Visit III, *The curbside patch*, introduces the Roseate Hawkmoth for
wide trio loops. Dawn now ends on its hardest visit instead of its easiest.

At Dawn the snail crawls a visible paving seam through the middle of the field
(`snailRoute: 'seam'`). Later snails keep the bottom-edge route. Everywhere, an
unfinished enclosure cord that comes within 19 pixels of a snail's center breaks
at once, with no score and no time change. This applies whether the pointer
reaches the snail or the snail crawls into a held line. Trace mode keeps its
own rule: touching a snail invalidates the trace on release.

Visit I holds its clock until the first accepted drawing
(`clockStartsOnFirstCombination`). All three Dawn ready cards carry diagrams.
The feedback banner moved from the bottom of the field to below the top HUD,
because the canvas bottom can sit below the fold.
