# String rules: one drawing gesture

This document specifies the rules that replace the Enclose and Trace modes in
Drawing the Hours with a single drawing gesture whose cord acts on the field
while it is held. Xyh decided these rules on 2026-09-15. **Implemented in the
String sandbox (`practice-string`), the String Trace sandbox
(`practice-string-trace`), Dawn I–VI (`dawn-01`, `dawn-02`, `dawn-03`,
`dawn-04`, `dawn-05`, `dawn-06`), Noon VII–XII (`noon-01`, `noon-02`,
`noon-03`, `noon-04`, `noon-05`, `noon-06`, and Noon VII's practice copy
`practice-noon`), Dusk XIII–XVIII (`dusk-01`, `dusk-02`, `dusk-03`, `dusk-04`,
`dusk-05`, `dusk-06`, and Dusk XIII's practice copy `practice-dusk`), and
Midnight XIX–XXIV (`midnight-01`, `midnight-02`, `midnight-03`, `midnight-04`,
`midnight-05`, `midnight-06`, and Midnight XIX's practice copy
`practice-midnight`).** The campaign grew from twelve visits to twenty-four on
2026-10-03; visit numbers and level ids in the dated sections below are the
twelve-visit ones, and [CAMPAIGN.md](CAMPAIGN.md) maps old to new.
The next build step is named in [NOTES.md](NOTES.md) and in the project's
[ROADMAP.md](../ROADMAP.md) entry.

Under these rules, the mode-switching control, the Trace contract in
[MIDNIGHT.md](MIDNIGHT.md), and the "Midnight firefly and Trace mode" section
of [CAMPAIGN.md](CAMPAIGN.md) are superseded. Every visit across the four
hours runs under the one-gesture string rules.

## Reason for the change

Xyh's playtest found that the main difficulty was insects crossing the
unfinished line, so enclosed insects escaped and bystanders flew in. Mode
switching also divided one drawing practice into two gestures. Under these
rules every action happens inside one stroke. Difficulty comes from closing the
gap before insects leave, keeping the cord short enough, avoiding accidental
threading, wind, and the snail.

Xyh, 2026-09-16: the game rewards patience, coaxing, and timing as well as
quickness. One player draws an opening stretch of cord to wall an insect off, then
keeps holding while other insects move into place; another spots an opening and
closes it fast. Rules and limits should leave room for both, which is why the
snap limit rose to 1,300 px (rule 5).

## Terms

- **Cord**: the polyline drawn by the held pointer, from press to release.
- **Wall**: a drawn cord segment while the stroke is still held.
- **Gap**: the open space between the pointer tip and the cord's first point.
- **Bead**: an insect the pointer tip passed through, now held on the cord.
- **Tap**: a short press that stays inside one target's circle.
- **Day 1**: the twelve authored visits, Dawn I through Midnight XII. Later days
  are future content.

Rules marked **agent default** were proposed by Claude Code and not yet
confirmed by Xyh. Everything else is Xyh's decision.

## 1. The cord is a wall

While the stroke is held, fliers and seeds cannot cross any drawn segment.
Releasing the stroke removes every wall at once. Insects can still leave or
enter through the gap until the loop closes, so the speed of closing becomes
part of the skill.

On Day 1 no kind crosses walls. Later days may add kinds that can. Give each kind
an explicit property, for example `crossesCord: true`, so the collision code has
no per-species special cases.

Every movement model must respect walls, including the scripted ones: Brimstone
wander, damselfly dart, hawkmoth arc, hoverfly hold-and-shift, lacewing leaf
travel, firefly wander, and seed drift under wind. A bounce applied after a
scripted step can already have carried an entity through the wall in that frame.
Each model therefore needs a swept, wall-aware step.

**Failure mode:** a fast entity tunnels through a wall between frames. The
damselfly dart moves at speed 3.2, about 192 px/s, which is 6 px per frame at
30 fps. `constrainToWalls` in `src/string.js` sweeps each step on the hit
circle (`sweptCircleSegmentIntersection`), and test 1 in
`test/test_string_sandbox.js` drives a darting damselfly into a wall at a 30 fps
timestep.

Agent default: a flier that meets a wall turns away from it, and a seed stops
against the wall and slides along it under wind.

## 2. Insects are released

A valid figure sends its insects off the field, as the existing departure
animation does, and per-kind quota replacement brings new ones in. The game does
not capture, collect, or keep insects. Interface text and Field Book entries
avoid "catch" and "capture". What a successful figure means in the fiction is
still open.

## 3. Threading

When the pointer tip passes through an insect's hit circle during a stroke, the
insect becomes a bead on the cord. The hit circle is the visible target radius.
Only pointer movement threads (Xyh, 2026-09-15): the segment the tip travels
between samples threads an insect when it enters that insect's current hit
circle from outside. An insect that flies under a still pointer, or onto the tip
between samples, does not thread; an insect that flies into an existing wall is
blocked by rule 1.

A bead keeps its own movement inside a region on the cord (Xyh, 2026-09-15):
every point within its hit radius of the cord, between the cord's ends. The region
is a band twice the hit radius wide running the length of the cord, with rounded
ends, so its area is about 2rL + πr² for hit radius r and cord length L. Each
frame the insect's own movement model moves it first. The part of that step along
the cord moves the bead's anchor along the cord, and the part across the cord
moves the insect within its radius. A bead that meets the edge of its region
turns back, as a flier does at a wall. Beads cannot pass each other, so the order
of beads stays fixed by first contact. A threaded lacewing holds still, because
its movement follows a route between leaves.

On release, each bead is released from the position it slid to. Sliding matters
for that reason: it changes where released insects end up.

Xyh kept the hit radius as the threading distance after playtesting on
2026-09-15: slowing the pointer near insects avoids threading. The scripted player
in `test/measure_string_sandbox.js` cannot slow down or steer, which is why it
threads on 19–56% of attempts.

Open: whether beads may pass each other on the cord (agent default: they cannot),
and whether seeds thread like fliers (agent default: they do).

A press that starts on an insect and then leaves its circle begins a stroke with
that insect as the first bead. See rule 8 for the short press that stays inside.

## 4. A bead cancels the enclosure on Day 1

Day 1 has one threading recipe, the Trace below. Any other figure with at least
one bead scores nothing
when released: its pockets are not evaluated, no objective advances, and no time
is added. The beads and any enclosed insects are released where they are. There
is no score deduction, consistent with the existing campaign rule that mistakes
cost only elapsed time.

The cost of an accidental thread is therefore the lost attempt plus the
relocated insects. Show the cause in the feedback banner, for example "An insect
was threaded on the cord, so the loop does not count."

### Trace: threading in sequence

Xyh decided on 2026-09-15 that Midnight X–XII keep their objectives and that a
Trace becomes threading in sequence. A stroke whose beads, in threading order, are
exactly the visit's `traceSequence` (a firefly, a lacewing, then a different
firefly) scores a Trace on release instead of being cancelled. The line may stay
open or close. A Trace keeps its current scoring and tags: 240 base points times
the length multiplier, advancing `trace` and `any`. Built and testable in
`practice-string-trace` (String Trace Sandbox). Xyh playtested it on 2026-09-16:
both a completed Trace and a failed one read clearly and feel right. A wrong
order is reported before a count, so the message on release matches the one
shown while drawing.

**Purity (Xyh, 2026-09-16).** A stroke that threads and also encloses fails for
both: no Trace, no enclosure recipe, no objective, and every insect is released
where it is. A stroke encloses when a closed pocket (rule 9) holds a live insect,
seed, or snail that is not threaded on it. Xyh adopted the rule for now for two
reasons: one stroke never has to decide between overlapping recipes, and later
recipes can deliberately require both threading and looping. The rule may be
revisited. The banner reads "A stroke cannot both thread and enclose, so neither
counts.", both while drawing and on release.

Agent defaults, not yet confirmed by Xyh:

- A closed Trace line whose pockets hold nothing except its own beads still
  scores the Trace.
- Beads out of order, a partial sequence, or an extra bead cancel the stroke as
  above, with a banner that names the required order.
- The rule that a trace must start outside every target ring is dropped. A press
  that starts on a firefly threads it first once the pointer leaves the tap radius.

Later days may add further threading recipes, including figures that combine
beads with pockets. Each needs its own evaluator and tests before a visit uses it.

## 5. Long cords snap

Every visit uses the same snap limit, `MAX_CORD_LENGTH` in `src/string.js`, which
Xyh set to 1,200 px on 2026-09-15 as a consistent and forgiving length, then
raised to 1,300 px on 2026-09-16 after playtesting Dawn, to leave room for an
opening wall held while insects move into place. No level
record sets its own limit, and `test/test_string_sandbox.js` fails if one does;
only the measurement script overrides the limit, inside its own level objects.
The cord meter fills toward a visible snap mark. When the stroke length passes the limit, the cord breaks at once in
the same way as a snail break: no score, beads released, walls removed. The
existing length bands and their score multipliers stay, so a longer cord is worth
more until it snaps.

Some later recipes will depend on cord length. Day 1 has none.

Tuning reference: `test/measure_string_sandbox.js` plays Dawn I–III under these
rules with a scripted player that plans its loops under the limit; the 2026-09-15
results are in [NOTES.md](NOTES.md). The limit bound only in Dawn III, the trio
visit. At pointer speeds of 700 and 450 px/s, 1,150 px was the lowest tested limit
that kept completions at the unlimited level, and trio completions fell at 900 px
and below. The chosen 1,200 px matched 1,150 and 1,300 px in all three Dawn visits
(Dawn III: 30/30 at 700 px/s, 26/30 at 450 px/s) with 1–3 s of waiting per visit.
In that 2026-09-15 run, the current 1,300 px gave the same Dawn III completions
with 1.3–2.4 s of waiting per visit.

Xyh, 2026-09-16: field measurements must stay independent of the viewport.
The logical field is 960×640 in landscape and 640×960 in portrait: equal area,
rotated. The canvas scales uniformly to fit, with margins rather than cropping
or stretching. Cord length, closure width, radii, and speeds use logical units;
CSS pointer positions are converted into those units. The 1,300-unit snap limit
therefore stays the same on every screen. These baseline dimensions are Codex's
implementation choice; touch comfort still needs playtesting.

### A picked flax flower raises the limit for the next stroke

A flax flower appears in Noon IV–VI and returns in Dusk VIII and Midnight XII. Drawing the held
cord within its radius picks it. The cord that picks it is **not** lengthened;
`BEAN_BONUS` (400 px in `src/game.js`) is added to the *next* stroke's
`maxCordLength`, and the meter's snap mark shows the longer allowance before that
stroke begins. A kept flower wilts after `BEAN_KEEPS_SECONDS` (12 s) if it is
not used. Another grows `BEAN_REGROW_SECONDS` (8 s) after picking at Noon;
Dusk VIII and Midnight XII set `beanRegrowSeconds: 24`. The internal `bean`
type and population key remain for pickup filtering; the class is `FlaxFlower`.

It is not a target: never threaded as a bead, never pocket content, never
tappable. This is the one way a level departs from the shared snap limit, and it
does so per stroke rather than per level, so the rule above — no level record
sets its own `maxCordLength` — still holds.

## 6. Hazards

A hazard disturbs a drawing in one of two ways: it **cuts** the cord it touches,
or it is a **dud ingredient** that spoils a pocket holding it. Xyh decided on
2026-09-16 that one hazard should not usually do both by design — though under
the purity rule (rule 4) anything uninvited inside a pocket spoils it, so every
hazard is a dud, and the axis that actually varies is whether it cuts.

A second rule from the same decision: **a hazard that keeps a fixed path is a
thing, not a creature.** Creatures fly or crawl as themselves; scenery holds
still. The hornet was rewritten to wander for this reason, and the web is the
only fixed-place hazard.

| Hazard | Where | Movement | Cuts the cord | Inside a pocket |
| --- | --- | --- | --- | --- |
| Snail | Dawn II–III, Dusk VIII–IX, Midnight XII | Crawls a seam or the bottom edge | No — the cord crosses it safely | Spoils the drawing |
| Hornet | Noon V–VI | Wanders and turns like the other insects | Yes | Spoils the drawing |
| Web patch | Noon VI | Static, placed by the level | Yes | Valid — a web is terrain, not an inhabitant |

A cut is identical in each case — no score, beads released, walls removed — and
the message names what cut it. Hazards do not thread. The snail's cord break,
added in the 2026-09-15 Dawn revision, was removed on 2026-09-16 under the rule
above; Dawn II–III keep the snail as a dud ingredient crawling the seam.

Open: whether a hazard can later be a wanted ingredient. Xyh raised it on
2026-09-16 as a future direction — a recipe that asks for the hornet, so the
thing to avoid becomes the thing to catch. Nothing is built for it.

## 7. Wind changes direction

Walls let a player shelter a loop from wind that always blows one way, for
example by drawing every loop in the same rotational direction so the gap trails
downwind. Gust direction varies within a visit so that one habit does not answer
every gust. The warning phase shows the coming direction before the gust starts.

This applies to Noon VIII–XII (`noon-02` through `noon-06`), the visits that have wind.
Whether other hours gain wind is open. Built on 2026-09-16 in Enclose mode, before
Noon adopts the string rules; `Game.chooseWindDirection`, `Game.windVelocity`,
and `Game.windBadgeText` hold the logic, and the atrium wind test in
`test/test_mechanics.js` runs ten wind periods per windy visit.

Agent defaults as built, not yet confirmed by Xyh. The list names what was
changed from the earlier rightward-only wind:

- **Data.** Each windy visit replaces `direction: 'right'` with
  `directions: ['right', 'left']` in `src/campaign.js` and `campaign-plan.json`.
  Period, warning, gust length, and seed speed stay as they are (12 s, 2 s, 2 s,
  0.08 field widths per second).
- **Choice.** The game picks the next gust's direction when the warning phase
  starts, stores it on the game (for example `windDirection`), and never picks
  the same direction more than twice in a row. It uses `Math.random`, which the
  measurement script seeds; the game has no per-attempt seeded generator yet.
  `initLevel` resets the direction and the run count.
- **Everything that assumes rightward must follow the sign.** Seed displacement
  (`windVx` in `Game.update`); seed lean (`DandelionSeed.update` leans only when
  `windVx > 0`); seed wrapping (`DandelionSeed.update` wraps only off the right
  and bottom edges, so a leftward gust would carry seeds off the left edge for
  good); wind streaks (`spawnWindStreaks` and `updateWindStreaks` start at the
  left and move right); planter leaves (`drawWindPlanters` leans both sides
  toward the centre instead of downwind); the HUD badge ("Rightward Gust »»" in
  `drawHUD`); and the Noon V and VI ready-card captions, which say the breeze
  blows rightward.
- **Warning copy** names the direction before the gust, for example "Gust
  coming: blowing left" during the warning and "Gust: blowing left" during it.
- **Walls need no change.** `constrainToWalls` sweeps the seed's actual step,
  wind included, so seeds already slide along a held cord in either direction.
- Panning the wind sounds toward the gust direction was left out.

## 8. Tap

A tap is a short press that stays inside a target's circle (or on open ground).
It neither draws a cord nor threads.

Xyh decided on 2026-09-15 to try placing a stationary salt grain on tap as a
visual-only mark (`game.saltGrains`, rendered in `drawSaltGrains`), with no
gameplay effect yet.

Thresholds:

- The press lasts at most 250 ms.
- For a target, the pointer stays within the target's hit radius plus 8 px of the
  press point. The target is the entity under the press point at the moment of
  the press.
- For open ground (empty space), the pointer stays within 14 px of the press
  point.
- Measure displacement from the press point, not from the insect's current
  position. A darting damselfly covers about 48 px in 250 ms, more than its own
  radius, so an insect-relative test would turn most taps on moving insects into
  threads.
- A press starting on an insect that is held for more than 250 ms without moving
  cancels the stroke, so it does nothing on release. A press on empty space held
  without moving is ignored.

## 9. A cord closes only where it visibly closes

Xyh decided on 2026-09-15 that a cord encloses a pocket only when the drawing
shows a closed shape. That happens when the cord crosses itself, when its tip
lands on an earlier part of the drawn cord, or when its start lies on a later
part. "Lands on" means the two drawn strokes overlap on screen: their centerlines
come within the drawn cord width, `CORD_WIDTH` (4.5 px) in `src/game.js`. There
is no distance-to-start tolerance, so a loop that ends 20 px short of its start
encloses nothing. A figure-eight's outer lobe closes by the same rule.

The rule agrees with the walls. A closed cord leaves no gap, so nothing the walls
hold can leave a pocket the preview shows as closed; the smallest hit circle is a
seed's, at 14 px radius.

`extractClosedPockets` in `src/geometry.js` implements the rule. It takes the
outermost closure, trims the stroke to that closed cycle, and finds single,
lasso, and figure-eight pockets inside it. The live closure preview and release
evaluation both call it. Campaign visits keep the 90 px end-to-start tolerance
until they adopt these rules.

### Live pre-release closure preview

While drawing, each pointer sample evaluates `extractClosedPockets` to signal
valid loop closure before the pointer lifts:

- **Cord glow**: when closed, the cord strand radiates a warm golden luminous
  aura (`shadowBlur: 12`, underglow line), or a terracotta warning aura if an
  insect was threaded as a bead. The drawing head ring pulses green or rust.
- **Paper wash shadow**: the enclosed pocket area fills with a translucent
  watercolor wash (`drawLiveLoopPreview`: fresh meadow green
  `rgba(220, 240, 205, 0.32)` when enclosing insects, warm parchment honey
  `rgba(245, 235, 210, 0.25)` when empty, or terracotta if cancelled by a bead).
- **Watermark loop sign**: each pocket's centroid displays a soft translucent
  watermark sign (a botanical ring with four corner pips for single loops and
  lassos; a double-petal infinity sign for figure-eights).
- **Visible closure enforcement**: in string visits, closure requires an actual
  crossing or tip landing within `CORD_WIDTH` (4.5 px); the 90 px gap tolerance
  and dashed gap seam bridge from campaign enclose mode are removed.

Archived: making the live closure check incremental, so that each pointer sample
tests only the newest segment. Xyh judged the explicit rule enough, and the
current check measured 0.21 ms per sample at 320 stroke points on desktop.

## 10. Three relations between a stroke and an entity

Xyh named these on 2026-09-16, so rules can ask for one of them instead of each
rule inventing its own test. `gestureRoles(points, entity)` in `src/string.js`
returns all three.

| Relation | Test | Read by |
| --- | --- | --- |
| **Thread starter** | The stroke's first point lies inside the entity's radius (`startsIn`) | The night jasmine |
| **Threaded** | The stroke begins outside and crosses the entity (`crosses && !startsIn`) | Bead threading (rule 3), the Trace (rule 4) |
| **Thread ended** | The stroke's last point lies inside the radius (`endsIn`) | Nothing yet — named so the third case is not reinvented |

A stroke can hold more than one relation to the same entity: one that begins
inside a flower and comes back through it both starts in it and crosses it.

### The night jasmine

Added 2026-09-16 for Midnight XII. The jasmine stands still, is never pocket
content, and is never threaded. A stroke that is a **thread starter** on an open
jasmine takes the first insect it threads: the cord ends there, that insect flies
to the flower and settles on it for `JASMINE_STAY` (24 s), and the bloom is spent
while its guest sits. It scores nothing and advances no objective.

What it is for: the last visit mixes every required figure, and insects cluster,
which makes a clean pocket hard to find. The jasmine buys one insect out of the
cluster and leaves it stationary — a target that can be drawn around at leisure,
and one fewer body in the crowd. XI does without it: Xyh played that visit
through unaided, and its ready card has enough to say already.

A guest gathered into a drawing frees its flower early. When the stay ends the
spent bloom closes and another opens `JASMINE_REGROW` (12 s) later, so the move
is a resource rather than a standing facility. A thread begun in a spent bloom is
an ordinary thread, and its bead cancels the loop as usual.

Open: whether a hazard can be a wanted ingredient later (rule 6), and what a
**thread ended** relation should do.

## What the change removes and keeps

Removed when built: the Enclose / Trace button, `gestureMode`,
`setGestureMode`, the `T` shortcut, the mode line in the HUD and footer,
`TraceGesture` in `src/trace.js` once no visit uses Trace mode, and the rule that a
trace must start outside every target ring. The Trace ready-card diagrams for
Visits X and XI are redrawn for threading rather than removed.

Kept: pocket extraction in `src/geometry.js`, the enclosure recipes in
`src/recipes.js`, `traceSequence` and the `trace` objective (a Trace is now threading in sequence,
rule 4), per-kind quotas and replacement, the seam snail, Visit I's clock
hold, the verbatim transition cards, and save IDs.

## Consequences for the twelve visits

- Midnight X–XII keep their objectives (`trace: 3` in X, `trace: 2` in XI and
  XII). Each Trace is threaded in sequence under rule 4, so fireflies keep their
  role.
- Walls hold enclosed insects, so enclosure objectives become easier. With the
  shared 1,200 px limit in place, clocks and populations can be retuned visit by
  visit as each adopts these rules; Dawn I–III have not been retuned.
- The Dawn ready-card diagrams were redrawn on 2026-09-15 for walls, threading,
  and closure by crossing. Xyh kept them as they are on 2026-09-16, including the
  loss of Dawn I's note that two kinds cannot share a loop and of the snail
  picture on Dawn II's card.
- The touch playtest of the revised Dawn clocks is deferred, because walls change
  the difficulty that playtest would have tuned.

## Build order

1. **Done (2026-09-15)**: Add a practice verge, **String sandbox**, with the Dawn
   II cast: Brimstones, damselflies, seeds, and the seam snail. Implement walls,
   hit-circle perimeter collision, threading with sliding and clamping, bead
   cancellation, the single shared 1,200 px snap limit, and tap salt grains.
2. **Done (2026-09-15)**: Test tunneling at dart speed, bead 2D movement and
   order under sliding, clamping at the ends, bead cancellation, 1,200 px snap,
   and tap thresholds.
3. **Done (2026-09-15)**: Measure in full visit simulations across limits with
   `test/measure_string_sandbox.js`.
4. **Done (2026-09-15)**: Xyh playtested and settled: 1,200 px single snap limit,
   hit radius threading distance, 2D bead movement freedom, salt grains on tap,
   and Midnight X–XII Trace as threading in sequence.
5. **Done (2026-09-15)**: Roll out string rules to Dawn I–III (`dawn-01`, `dawn-02`,
   `dawn-03`). Add `stringRules: true`, redraw ready-card diagrams (cord wall,
   threading cancellation, crossing closure), update Field Book and tests.
6. **Done (2026-09-16)**: Build Trace as threading in sequence (rule 4) for string
   visits, testable in `practice-string-trace`.
7. **Done (2026-09-16)**: Build wind direction changes (rule 7) for Noon V–VI.
   Noon IV–VI and Dusk VII–IX adopted string rules the same day. The measurement
   script's player draws circles only, so figure-eight objectives are
   unmeasured.
8. **Done (2026-09-16)**: Roll out string rules to Midnight X–XII, remove modes,
   `gestureMode`, and mode buttons/shortcuts.
9. Touch device playtest across the day.

## Keeping this document current

This file records what was decided about string visits and why. The code and
tests are the authority for numbers and names, so a sentence here that disagrees
with them is the stale one. Update this file in the same commit as the change it
describes:

- When a visit adopts these rules, add its ID to the status line at the top.
  Test 21 in `test/test_string_sandbox.js` fails if a level with
  `stringRules: true` is missing from that paragraph.
- When a build step lands, mark it **Done** with its date under Build order.
- When Xyh decides something, write it into the rule it changes, with "Xyh" and
  the date, and delete the agent default or open question it settles. Leaving
  both lets the next agent build the superseded version.
- When an agent has to choose without Xyh, mark the choice **agent default** in
  its rule and add the question under Open questions.
- When a function, constant, or file named here is renamed or removed, search
  this file for the old name and fix it.
- Keep a measurement's method, date, and headline result here, and point to the
  NOTES.md entry that holds the full table rather than copying it.

## Open questions for Xyh

- What a successful figure means in the fiction, given that insects are released.
- Touch comfort of the fixed logical field and shared snap limit.
- Which later-day insects cross walls.
- Whether hours other than Noon gain wind.
