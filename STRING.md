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
Contact uses the swept relative-motion test in `src/trace.js`, so an insect that
crosses the moving tip between pointer samples also threads. An insect that flies
into an existing wall does not thread, because rule 1 blocks it first.

A bead moves only along the cord. Each update projects the bead's own intended
motion onto the cord's local tangent. Beads are clamped at both ends of the cord.
The order of beads is fixed by first contact, and sliding never changes it.

On release, each bead is released from the position it slid to. Sliding matters
for that reason: it changes where released insects end up.

Open: whether beads may pass each other on the cord (agent default: they cannot),
and whether seeds thread like fliers (agent default: they do).

A press that starts on an insect and then leaves its circle begins a stroke with
that insect as the first bead. See rule 8 for the short press that stays inside.

## 4. A bead cancels the enclosure on Day 1

Day 1 has no threading recipes. A figure with at least one bead scores nothing
when released: its pockets are not evaluated, no objective advances, and no time
is added. The beads and any enclosed insects are released where they are. There
is no score deduction, consistent with the existing campaign rule that mistakes
cost only elapsed time.

The cost of an accidental thread is therefore the lost attempt plus the
relocated insects. Show the cause in the feedback banner, for example "An insect
was threaded on the cord, so the loop does not count."

Later days may add threading recipes: ordered chains, and figures that combine
beads with pockets. Each needs its own evaluator and tests before a visit uses it.

## 5. Long cords snap

Each visit sets `maxCordLength` in pixels. The cord meter fills toward a visible
snap mark. When the stroke length passes the limit, the cord breaks at once in
the same way as a snail break: no score, beads released, walls removed. The
existing length bands and their score multipliers stay, so a longer cord is worth
more until it snaps.

Some later recipes will depend on cord length. Day 1 has none.

Tuning reference: on 2026-09-15 the circle-fit proxy in [NOTES.md](NOTES.md)
measured a median trio loop radius of 190 px in Dawn III, a circumference of
about 1,190 px. A limit below that forces the player to wait for a tighter
grouping.

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

## What the change removes and keeps

Removed when built: the Enclose / Trace button, `gestureMode`,
`setGestureMode`, the `T` shortcut, the mode line in the HUD and footer, the Trace
ready-card diagrams for Visits X and XI, `traceSequence`, the `trace` objective,
and the rule that a trace must start outside every target ring.

Kept: pocket extraction in `src/geometry.js`, the enclosure recipes in
`src/recipes.js`, the swept contact test in `src/trace.js` (reused for
threading), per-kind quotas and replacement, the seam snail, Visit I's clock
hold, the verbatim transition cards, and save IDs.

## Consequences for the twelve visits

- Midnight X–XII are built around Trace objectives (`trace: 3` in X, `trace: 2`
  in XI and XII). With no threading recipes on Day 1, those visits need new
  objectives, and the firefly needs a role that does not depend on Trace.
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
- What Midnight X–XII ask for, and what the firefly does, without Trace.
- What a tap does, and from which visit.
- Whether beads may pass each other, and whether seeds thread.
- Whether `maxCordLength` scales with field size.
- Which later-day insects cross walls.
- Whether hours other than Noon gain wind.
