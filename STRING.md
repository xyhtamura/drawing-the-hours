# String rules: one drawing gesture

This document specifies the rules that replace the Enclose and Trace modes in
Drawing the Hours with a single drawing gesture whose cord acts on the field
while it is held. Xyh decided these rules on 2026-09-15. **None of it is
implemented yet.** The next build step is named in [NOTES.md](NOTES.md) and in
the project's [ROADMAP.md](../ROADMAP.md) entry.

When built, these rules supersede the mode-switching control, the Trace contract
in [MIDNIGHT.md](MIDNIGHT.md), and the "Midnight firefly and Trace mode" section
of [CAMPAIGN.md](CAMPAIGN.md). Until then, those documents describe the running
game.

## Reason for the change

Xyh's playtest found that the main difficulty was insects crossing the
unfinished line, so enclosed insects escaped and bystanders flew in. Mode
switching also divided one drawing practice into two gestures. Under these
rules every action happens inside one stroke. Difficulty comes from closing the
gap before insects leave, keeping the cord short enough, avoiding accidental
threading, wind, and the snail.

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
30 fps. Check with a swept segment test, following `sweptContact` in
`src/trace.js`, and with a unit test that drives a darting damselfly into a wall
at a 30 fps timestep.

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
the length multiplier, advancing `trace` and `any`. Not built yet.

Agent defaults, not yet confirmed by Xyh:

- A stroke that threads the sequence is judged only as a Trace; insects it
  encloses are released and not scored.
- Beads out of order, a partial sequence, or an extra bead cancel the stroke as
  above, with a banner that names the required order.
- The rule that a trace must start outside every target ring is dropped. A press
  that starts on a firefly threads it first once the pointer leaves the tap radius.

Later days may add further threading recipes, including figures that combine
beads with pockets. Each needs its own evaluator and tests before a visit uses it.

## 5. Long cords snap

Every visit uses the same snap limit, `MAX_CORD_LENGTH` in `src/string.js`, which
Xyh set to 1,200 px on 2026-09-15 as a consistent and forgiving length. No level
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

Open: whether the limit scales with the field. A portrait field measured
359×567 px and the desktop field 996×640 px on 2026-09-15, while the closure
tolerance and length bands are fixed pixel values today.

## 6. The snail

The snail is unchanged from the Dawn revision in [CAMPAIGN.md](CAMPAIGN.md). A
cord that comes within 19 px of a snail's center breaks. Snails do not thread
and are not blocked by walls, because touching the cord breaks it first.

## 7. Wind changes direction

Walls let a player shelter a loop from wind that always blows one way, for
example by drawing every loop in the same rotational direction so the gap trails
downwind. Gust direction varies within a visit so that one habit does not answer
every gust. The warning phase shows the coming direction before the gust starts.

Agent default: each visit with wind lists its directions, for example
`directions: ['right', 'left']`. The attempt's seeded generator picks each
gust's direction and never repeats one direction more than twice in a row. This
applies to Noon V–VI, the visits that have wind today. Whether other hours gain
wind is open.

## 8. Tap

A tap is a press and release that is short and whose pointer never leaves the
circle of the target it pressed. It neither draws a cord nor threads. Day 1
assigns no effect to a tap; its use is open.

Agent default thresholds, to be calibrated on touch hardware:

- The press lasts at most 250 ms.
- The pointer stays within the target's hit radius plus 8 px of the press point.
- The target is the entity under the press point at the moment of the press.

Measure displacement from the press point, not from the insect's current
position. A darting damselfly covers about 48 px in 250 ms, more than its own
radius, so an insect-relative test would turn most taps on moving insects into
threads.

A press that stays inside the circle longer than the time limit does nothing on
release (agent default). A press on empty space that does not move is also
ignored.

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

Archived: making the live closure check incremental, so that each pointer sample
tests only the newest segment. Xyh judged the explicit rule enough, and the
current check measured 0.21 ms per sample at 320 stroke points on desktop.

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
- Walls hold enclosed insects, so enclosure objectives become easier. Clocks and
  populations across all twelve visits need retuning once snap limits exist.
- The Dawn ready-card diagrams added on 2026-09-15 show loops only. They need to
  show walls and warn that threading cancels a loop.
- The touch playtest of the revised Dawn clocks is deferred, because walls change
  the difficulty that playtest would have tuned.

## Build order

1. Add a practice verge, **String sandbox**, with the Dawn II cast: Brimstones,
   damselflies, seeds, and the seam snail. Implement walls for those movement
   models, threading with sliding and clamping, bead cancellation, the
   `maxCordLength` snap, and tap detection that only logs. Leave the campaign
   unchanged.
2. Test tunneling at dart speed, bead order under sliding, clamping at the ends,
   a one-bead figure that scores nothing, a snap exactly at the limit, and the tap
   thresholds against a short stroke.
3. Measure in the live page: time to a pair and to a trio, the accidental thread
   rate, and the snap rate at limits of 800, 1,000, and 1,200 px.
4. Xyh plays the sandbox and settles the open questions below.
5. Extend walls to the remaining movement models, re-author the twelve visits,
   remove the modes, and update CAMPAIGN.md, MIDNIGHT.md, SPEC.md, the Field Book,
   and ROADMAP.md.

## Open questions for Xyh

- What a successful figure means in the fiction, given that insects are released.
- Whether a stroke that threads the Trace sequence may also score what it
  encloses (agent default: no).
- What a tap does, and from which visit.
- Whether beads may pass each other, and whether seeds thread.
- Whether the snap limit scales with field size.
- Which later-day insects cross walls.
- Whether hours other than Noon gain wind.
