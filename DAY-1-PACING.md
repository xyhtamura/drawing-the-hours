# Day 1: mechanics, cast, and pacing

Snapshot: 2026-09-16 — Codex. Read from the active game's `src/campaign.js`,
`src/entities.js`, `src/recipes.js`, `STRING.md`, and `NOTES.md`.
The game is being edited elsewhere; this document is a snapshot, not its specification.

**Updated 2026-09-16 — Claude Code.** Xyh decided the arc below: the crossing
moved out of Noon and into Dusk, and Noon took hazards and a power-up instead.
The tables now describe what is implemented after that change. The proposals in
[Proposed pacing changes](#proposed-pacing-changes) are still proposals, except
where the change below already carried one out.

## Intended feel

Xyh's direction, 2026-09-16: Dawn should definitely feel easy; Noon a bit active;
Dusk should be about carefulness; Midnight should feel magical or mystical,
particularly through threading. Easier openings at each hour change remain welcome.
This direction governs the proposals below; the snapshot tables still describe
the existing implementation.

| Hour | Intended feel | Mechanical interpretation to test | Avoid |
| --- | --- | --- | --- |
| Dawn | Easy | Readable pair opportunities, forgiving time, sparse distractions; introduce seeds and the snail without making either dominate early attempts | Treating III as a demanding examination merely because it ends the chapter |
| Noon | A bit active | Alternate between short opportunities; hoverfly holds and shifts, figure-eights, and warned gusts create movement and response | Stacking population, new recipes, and hazards until activity becomes clutter |
| Dusk | Careful | Observe leaf rests, choose exact contents, leave unwanted neighbors outside, and place the cord deliberately; provide time to wait | Using faster motion or shorter timers as the main escalation |
| Midnight | Magical / mystical | Thread an ordered connection through moving insects; make successful connections perceptible through light, motion, and sound; let earlier enclosure skills support the chapter | Making threading a minor checkbox in a crowded enclosure examination |

**Decided 2026-09-16 (Xyh).** One demand per hour, and the crossing is Dusk's:

| Hour | The one new demand | What carries it |
| --- | --- | --- |
| Dawn | Close a loop around chosen contents | Pair, Seed & Wing, trio |
| Noon | Volume and speed under pressure | Six combinations a visit on Dawn's simple loops, a picked pod for length, a wandering hornet, fixed webs, gusts |
| Dusk | Cross the cord | Counterpart Pair at VII, Nursery at VIII, both shapes at IX |
| Midnight | Thread in order | Ordered Trace, then traces beside enclosure; the jasmine thins the cluster |

Noon IV–VI now require loops only. Nursery Polarity, a crossing recipe, sits at
Dusk VIII where its shape has just been taught. This closes the similarity
described in [Why Noon and Dusk can feel similar](#why-noon-and-dusk-can-feel-similar):
the two chapters no longer share a recipe structure at all.

These are four different demands on attention, not four steps on one speed scale:
learn comfortably → respond to movement → place deliberately → connect in sequence.
Carefulness should arise from readable choices rather than smaller hit tolerances.
The mystical quality should arise from what threading does and how it responds,
without adding obscure rules or operational copy.

### Consequences for the existing proposals

- **Dawn II–III need an ease check.** The simultaneous seed/snail introduction
  and trio grouping may ask too much of a chapter meant to feel easy. First observe
  whether the central snail regularly interrupts beginners; if so, reduce its
  interference before raising speed or adding another challenge.
- **Keep Noon's wind and hoverfly rhythm.** The proposal to simplify V's cast
  supports active play by making moving opportunities easier to read.
- **Dusk's distinction need not be another shape.** Reusing figure-eights works
  if players shift from chasing opportunities to waiting and placing accurately.
  Test IX at the earlier 0.85 motion multiplier before accepting its current 1.00
  as the chapter's culmination. A returning snail should be visible and predictable,
  not another pressure that punishes waiting indiscriminately.
- **Reconsider Midnight XI–XII's emphasis.** Their current broad recipe checklist
  pulls attention back toward enclosure. Trial a clearer threading emphasis, with
  fewer compulsory enclosure categories, before increasing density. Keep X sparse
  enough for the change from avoiding contact to seeking it to register.

These interpretations and trials are Codex proposals, not additional decisions
by Xyh. No populations, objectives, movement, or feedback have been changed.

## Chapter arc

| Chapter | Setting and mood | Mechanical focus | Teaching rhythm |
| --- | --- | --- | --- |
| Dawn · I–III | Pale curbside morning; waiting, observation, imagination | Close a cord around selected contents; seeds, an obstructing snail, then three-species groups | Learn the gesture → collect while avoiding → gather a larger group |
| Noon · IV–VI | Bright atrium; lunch, job uncertainty, a place that feels calming | Figure-eights, separating targets, wind, then four-target single loops | Quiet introduction → several demands at once → large-group collection |
| Dusk · VII–IX | Muted purple passage; habitual route, intermittent cicadas, medicine carried home | Wait for leaf rests; reuse recipes; alternate single loops and figure-eights | Sparse introduction → sharp increase in population → faster, crowded synthesis |
| Midnight · X–XII | Dark green window corner; broken sleep, rustling, continuation | Thread targets in order; choose threading or enclosure; combine learned recipes | New use of contact → mixed objectives → crowded final synthesis |

Xyh accepts easier hour openings while players learn a new mechanic. A rising
difficulty line across all twelve visits is not the aim. The question is whether each
chapter's second and third visits develop its first lesson at a manageable rate.

### Why Noon and Dusk can feel similar

| Chapter position | Noon | Dusk | Difference |
| --- | --- | --- | --- |
| Opening | IV: different-insect figure-eights | VII: lacewing/hoverfly figure-eights | Same drawing recipe; leaf travel and rests replace the earlier movement mix |
| Middle | V: flier/seed Nursery figure-eights, with wind | VIII: Nursery plus lacewing Counterpart Pair | Familiar recipes recur; wind is removed and resting opportunities remain |
| Closing | VI: single loops containing three species plus a seed | IX: three single loops and two figure-eights | Noon tests a particular large grouping; Dusk tests choosing between shapes |

Neither chapter uses only figure-eights, but their first two visits share much of
their recipe structure. Dusk's distinction is primarily when to draw, based on
rests and travel. If that timing is not perceptible in play, it can feel like Noon
with another species. Before inventing another gesture, test whether VII rewards
watching for a leaf rest and whether VIII develops that observation. An optional
design direction is to make Dusk's opening emphasize a familiar single-loop task
around resting insects, then reintroduce figure-eights in VIII; this would change
its teaching sequence and needs separate evaluation, not an automatic edit.

## Entities by visit

Numbers are configured population quotas, not guarantees that every entity is visible
at every instant: departure, replacement, and spawn clearance can reduce the live count.
Totals include seeds and snails. A dash means zero.

| Visit | Brimstone | Damselfly | Hawkmoth | Hoverfly | Lacewing | Firefly | Seed | Snail | Atrium fixtures | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| I · Dawn | 4 | 2 | — | — | — | — | — | — | — | 6 |
| II | 2 | 2 | — | — | — | — | 3 | 1 | — | 8 |
| III | 2 | 2 | 2 | — | — | — | — | 1 | — | 7 |
| IV · Noon | 2 | — | 2 | 2 | — | — | — | — | 1 spool | 7 |
| V | 2 | — | — | 2 | — | — | 3 | — | 1 hornet, 1 spool | 9 |
| VI | 2 | — | 2 | 2 | — | — | 2 | — | 1 hornet, 2 webs, 1 spool | 12 |
| VII · Dusk | — | — | — | 2 | 2 | — | — | — | — | 4 |
| VIII | 2 | — | — | 2 | 2 | — | 3 | 1 | — | 10 |
| IX | 2 | — | 2 | 2 | 2 | — | 2 | 1 | — | 11 |
| X · Midnight | — | — | — | — | 2 | 3 | — | — | — | 5 |
| XI | — | — | — | 2 | 2 | 3 | 2 | — | — | 9 |
| XII | 2 | — | — | 2 | 2 | 3 | 2 | 1 | — | 12 |

| Entity | Movement or role | First appearance | Later development |
| --- | --- | --- | --- |
| Brimstone | Wandering flight | I | Familiar reference species; absent VII and X–XI, returns in XII |
| Damselfly | Hover, then straight dart | I | Present through III only |
| Hawkmoth | Continuous sweeping arcs | III | Returns V–VI and IX; absent at Midnight |
| Hoverfly | Holds position, warns by turning, then shifts | IV | Helps provide predictable opportunities for figure-eights; absent X |
| Lacewing | Travels between visible leaves, rests at anchors | VII | Continues through Midnight; bridges enclosure and threading lessons |
| Firefly | Slow flight and glow; body remains visible between glows | X | Carries the ordered-threading recipe through XII |
| Seed | Drifting non-flier recipe target; affected by wind | II | Returns V–VI, VIII–IX, XI–XII |
| Snail | Invalid enclosure content; does not cut the cord | II | Mid-field seam in II–III; bottom edge in VIII–IX, XII |
| Hornet | Wanders like an insect; cuts a touching cord; invalid enclosure content | V | Returns in VI beside the webs |
| Web patch | Static; cuts a touching cord; terrain, so valid inside a loop | VI | Two patches, placed by the level; the only fixed-path hazard |
| Picked pod | Adds 400 px to the NEXT cord, kept 12 s; not a target | IV | Present through the hour; another grows 8 s after one is taken; flax, and also in VIII and XII |
| Night jasmine | A thread begun in it settles the first insect it crosses for 24 s; not a target | XII | The only visit with one; the bloom is spent while its guest sits and reopens 12 s after it closes |

The snail does return. Its later placement makes it less likely to intersect a useful
drawing than the Dawn seam route. Presence and mechanical prominence are different.

## Mechanics across the day

**N** = first required lesson or first environmental appearance.
**R** = required again. **P** = present, without a named objective.
**—** = absent or not specifically required; a recipe may still be possible.
The matrix tracks authored requirements, not every valid recipe the evaluator accepts.

| Mechanic | I | II | III | IV | V | VI | VII | VIII | IX | X | XI | XII |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Same-kind pair lesson | N | — | — | — | — | — | — | — | — | — | R | — |
| Seed & Wing, one pocket | — | N | — | — | R | — | — | — | — | — | R | — |
| Three-species trio | — | — | N | R | — | — | — | — | — | — | — | — |
| Three species plus seed, one pocket | — | — | — | — | — | N | — | — | — | — | — | — |
| Picked pod for cord length | — | — | — | N | P | P | — | — | — | — | — | — |
| Wandering hornet | — | — | — | — | N | P | — | — | — | — | — | — |
| Web patch | — | — | — | — | — | N | — | — | — | — | — | — |
| Different-species figure-eight | — | — | — | — | — | — | N | R | — | — | — | — |
| Nursery: flier and seed in separate pockets | — | — | — | — | — | — | — | N | — | — | — | R |
| Generic figure-eight quota | — | — | — | — | — | — | — | — | R | — | R | R |
| Ordered threading | — | — | — | — | — | — | — | — | — | N | R | R |
| Threading and enclosure objectives in one visit | — | — | — | — | — | — | — | — | — | — | N | R |
| Snail hazard | — | N | P | — | — | — | — | P | P | — | — | P |
| Changing-direction wind | — | — | — | — | N | P | — | — | — | — | — | — |
| Leaf-rest opportunities | — | — | — | — | — | — | N | P | P | P | P | P |

All twelve visits use cord walls, visible closure, accidental threading, and the shared
1,300 px snap limit. These are available from I; they are not twelve separate introductions.
The first pair lesson is enforced through a single-loop quota and the available cast.
From X, intentional threading can score. A stroke that both threads and encloses
unthreaded contents fails; XI first requires both techniques across separate strokes.

## Required work and pressure

“Total” includes the named recipes; do not add those counts together. Nursery also
advances a figure-eight quota. Each objective-advancing drawing adds four seconds.
Motion is the configured flier motion multiplier, not a universal speed for every entity.

| Visit and title | Starting clock | Motion | Required work | Likely pressure point |
| --- | ---: | ---: | --- | --- |
| I · Before the bus | 75s; waits for first success | 0.80 | 4 single loops; available cast teaches same-kind pairs | Several foundational rules despite a simple objective |
| II · Something in the air | 85s | 0.85 | 5 total; 2 Seed & Wing | Seeds and central hazard arrive together |
| III · The curbside patch | 90s | 0.85 | 4 total; 2 trios | Larger grouping and an arcing species; seeds removed |
| IV · Lunch in the atrium | 90s | 0.80 | 6 total; 2 trios | Known recipes on a clear field; the count is the pressure |
| V · For now | 110s | 0.85 | 6 total; 3 Seed & Wing | A wandering hornet and gusts, against six required drawings |
| VI · The glass and the leaves | 100s | 0.85 | 6 total; 2 Seed & Trio | The day's longest loop, five more drawings, webs and hornet |
| VII · The way through | 100s | 0.85 | 5 total; 2 lacewing Counterpart Pairs | First crossing, taught against the stillest targets in the game |
| VIII · The gaps in the sound | 95s | 0.85 | 5 total; 1 Nursery; 1 lacewing Counterpart Pair | 4 → 10 entities while the timer shortens |
| IX · Carrying something home | 100s | 1.00 | 6 total; 3 single loops; 2 figure-eights | More speed, more contents, and alternating shapes |
| X · The window corner | 95s | 0.85 | 3 firefly–lacewing–different-firefly traces | Contact changes from a mistake into an intended action |
| XI · Figures | 110s | 0.95 | 6 total; 1 pair; 1 Seed & Wing; 1 figure-eight; 2 traces | Mixed techniques, more speed, 5 → 9 entities |
| XII · Tomorrow keeps happening | 110s | 1.00 | 7 total; 2 single loops; 2 figure-eights; 2 traces; 1 Nursery | Highest population and a broad checklist |

Population is not a difficulty score. Extra targets can provide more valid partners,
but also create unwanted pocket contents and accidental threads. Actual pressure
depends on available arrangements, field size, and drawing skill.

## Proposed pacing changes

These are candidates for playtesting, not approved changes or measured improvements.
Keep transition texts and chapter identities while testing mechanics separately.

| Priority | Visit | Candidate change | What it would isolate |
| --- | --- | --- | --- |
| 1 | V | Keep the Nursery and wind. Remove the returning hawkmoths and edge snail: 2 Brimstones + 2 hoverflies + 3 seeds = 7 entities. Keep its timer and objectives initially. | Applying the new figure-eight to drifting seeds without three additional distractors |
| 2 | VIII | Keep VII's four fliers, add two seeds, and defer the Brimstones and snail: 6 entities. Keep the Nursery and lacewing objectives. | Reusing the resting windows with one new target type rather than a 4 → 10 population jump |
| 3 | XI | Trial motion 0.85 instead of 0.95; initially keep the cast and objectives. | Choosing between threading and enclosure before increasing movement speed |
| 4 | IX | Test one snail route that crosses a useful drawing region at predictable intervals, rather than remaining at the bottom. Treat this as a separate trial from cast changes. | A meaningful return of Dawn's hazard without introducing a new rule |
| 5 | VI | If four-target collection becomes prolonged waiting, trial one required Seed & Trio instead of two, keeping four total combinations. | Demonstrating the recipe once without requiring a second favorable arrangement |
| 6 | XII | First retest after earlier changes. If crowded rather than satisfying, remove the two returning Brimstones: 10 entities still support every required recipe. | A synthesis of techniques with fewer accidental bystanders |

Keep IV's hoverflies. Xyh's playtest distinguishes easy circles from difficult
figure-eights: stillness can support the new shape without making its lesson redundant.
Keep VII and X sparse. They introduce movement timing and a new use of contact,
respectively; both benefit from a clear field.

Do not add wind or every species to XII merely for completeness. A final visit can
combine learned decisions without containing every earlier obstacle. Likewise, the
atrium's calming text need not mean an easy level; assess whether VI feels absorbed
and deliberate or obstructed and repetitive.

## What to observe before tuning timers

1. Play the full day on the same device, recording first attempts and retries separately.
2. For each visit, record time to first required recipe, completion time, and failures
   from accidental threading, unwanted contents, incomplete closure, snail contact,
   and cord snapping. Separate these from time spent waiting for a usable arrangement.
3. Compare V with IV, VIII with VII, and XI with X. These are the strongest candidates
   for abrupt changes in demand. Distinguish learning a rule from executing a known one.
4. Try one candidate change at a time. Keep clocks fixed initially so extra time does
   not conceal the reason a visit feels difficult.
5. Ask whether successful play allowed both quick closure and patient wall placement.
   Either should remain possible under the intended string rules.

The current measurement player does not yet cover figure-eights. Mechanical tests
establish rule behavior, not a smooth difficulty curve. Population and objective
tables are verified against the configuration; the pacing judgments still need playtests.

## Record

2026-09-16 — Claude Code — Second pass, after Xyh played the first one. Noon's
pressure became count rather than care: six combinations a visit on the same
simple loops. The hornet was rewritten to fly like an insect, because a creature
on a fixed route reads as scenery; fixed paths now belong to things, which leaves
the web as the only fixed-place hazard. The snail stopped cutting the cord and is
a dud ingredient only. The cord spool became a picked pod that lengthens the next
cord for twelve seconds, and its skin is Codex's to draw. The visit card can be
reopened during play, which Xyh asked for after Midnight XI. Seeds now take the
visit's motion scale, so a Dusk seed no longer outruns every insect on the field.
Xyh's readings that needed no change: Dawn and IV feel right, the trio is fine,
figure-eights suit the current cord length, Dusk VIII after VII ramps well, and
X–XI are challenging in the way intended.

2026-09-16 — Claude Code — Applied Xyh's decision on this document: figure-eights
moved from Noon to Dusk, and Noon took a power-up and hazards instead. Noon IV–VI
now require loops only (trios, Seed & Wing, Seed & Trio) and carry the cord spool,
one patrolling hornet, and two web patches. Nursery Polarity stayed where it
already was, Dusk VIII, which is now the visit after the crossing is taught. The
tables above were rewritten to match the implementation; the proposal list below
was left as Codex wrote it, except that its priority 1 (simplify Noon V's cast)
is now carried out — V lost its hawkmoths and its snail. Priorities 3–6 are still
open. See `NOTES.md` for the implementation entry.

2026-09-16 — Codex — Prepared this read-only assessment outside the active game
repository. Rechecked the twelve campaign records and snail route implementation.
No proposed gameplay changes were applied. This side folder has no git history;
the document can be moved into the project after its active editing session ends.
