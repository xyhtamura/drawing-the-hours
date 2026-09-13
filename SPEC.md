# Drawing the Hours: working scope

## Current priority, 2026-09-14

Morning Verge is playable. Xyh accepts its LOOP-like mechanics as a useful
prototype: first establish enjoyable gesture and combination play, then
differentiate further. A later visual pass may replace butterfly color
variants with distinct flier species while retaining the rules for comparison.
No reskin is requested in this sitting. The implementation state and remaining
tablet checks are in [NOTES.md](NOTES.md).

This direction supersedes the earlier requirement to replace matching-pair
and mixed-trio mechanics immediately. Temporary structures, cutting, and
scene-transforming objectives remain optional experiments, not prerequisites.
Original assets and implementation remain the approach; no legal clearance
claim is made. The earlier concept revision below is retained as history.

## Optional mechanical experiments, 2026-09-14

Recorded at Xyh's request. Preserve Morning Verge as the comparison build;
these are candidate experiments, not replacements required before further
playtesting. The real-tablet check in [NOTES.md](NOTES.md) remains next.

### First experiment: correspondence between pockets

Add one optional challenge wave in which a figure-eight succeeds when its
two pockets contain matching compositions. For example, one blue and one
pink flier in each pocket succeeds. Compare counts by kind, not just total
population: two blue fliers in one pocket and two pink in the other do not
correspond under this rule.

Single loops retain the current pair/trio rules. A pocket can therefore hold
a combination that would fail as a standalone loop; the correspondence
between pockets makes the whole figure valid. Pocket size, shape, and visual
symmetry do not need to match. The player divides moving creatures into
corresponding groups while drawing whatever geometry fits their positions.

This differs from the existing Cross-Meadow Correspondence recipe, which
accepts a kindred pair in each pocket without requiring the kinds to match
across pockets. Keep the experimental rule confined to its clearly identified
wave so the two definitions cannot silently conflict.

The experiment tests whether matching compositions creates an enjoyable
decision beyond enclosing two independently valid groups. Use the existing
two-pocket recognition as the starting point. Before implementation, specify
minimum group size, treatment of seeds, and hazard precedence; matching two
empty pockets must not count as a success.

### Second experiment: ordered crossing

An open stroke passes through creatures in a specified sequence. Timing
successive intersections becomes the gesture's challenge. Introduce this in
a dedicated wave with an explicit sequence and contact rule, so touching a
creature cannot ambiguously mean selection, a hazard, or an enclosure error.
The exact sequence, repeat-contact handling, and scoring remain unchosen.

### Third experiment: length as a recipe condition

Certain combinations require a short or extended stroke, rather than longer
strokes always earning more points. Test this separately from correspondence
and ordered crossing. If success reduces to adding scribbles in an empty
corner, the condition adds effort without a useful decision and should be
revised or dropped. Required bands and combinations remain unchosen.

### Experiment order and scope

Try correspondence first in one optional wave, then consider ordered crossing
and length conditions individually. Keep the existing mechanics available for
comparison and change one rule at a time. These are design experiments, not
claims of legal clearance. No implementation is requested by this note.

## Earlier concept revision

**Status: concept revision, 2026-09-13. Nothing built.** Xyh's
[concept and aesthetic direction](CONCEPT.md) supersedes the earlier
[path-and-ingredient spec](SPEC-path-recipes-20260913.md). `relation-garden`
remains the provisional folder name. [Visits, inhabitants, and borrowed
time](HOURS.md) extends the direction with different insects, airborne seeds,
liminal hours, and timer options. **Drawing the Hours** replaces Cradle as
the working title following Xyh's request for a more independent direction.

## Independent design brief

The player visits a meadow during gaps in the day and draws temporary figures
that arrange insects, seeds, and plants into relationships. Each visit has
its own light, inhabitants, and objectives. The paper and cord aesthetic,
gestural difficulty, quiet hours, and increasingly elaborate combinations
remain central.

Xyh requests immediate separation from a LOOP remake. Treat LOOP as a
historical influence, not a specification to reconstruct. Author the code,
art, audio, interface text, levels, and progression independently. Do not
import its assets, trace its screens, or transcribe its rulebook as game copy.

Proposed mechanical direction: make separation and correspondence between
pockets, contact actions, and behavior-dependent arrangements the core of
play. Do not use the reported same-color-pair/mixed-color-triple capture
table as the default recipe set. Develop visit objectives around the effects
of arrangements, such as guiding, releasing, or sheltering, rather than
reproducing the reported capture progression. Exact recipes and outcomes
still require Xyh's design decisions and playtesting.

Keep the sun and moon as possible scenery; do not reproduce the reported
orbital timer or moth-bonus sequence. A different timer alone would not
establish independence. The dandelion clock remains a candidate, and moths
can belong to the game's ordinary cast if their behavior earns a place.

These are design boundaries, not a declaration of legal clearance. The
[rights discussion](HOURS.md#homage-authorship-and-rights) distinguishes
mechanics from protected expression. A limited exact-phrase web search on
2026-09-13 surfaced no obvious game titled Drawing the Hours; this was not
a trademark search and does not establish title availability.

## Version-one direction

A tablet and browser game of moving creatures and temporary drawn gestures,
with roughly 20–30 authored levels. Gesture shape, stroke length, enclosed
combinations, separation into pockets, and contact with objects can affect
the result. The aesthetic is paper-textured vector forms in a childlike,
slightly girly meadow visited at quiet hours, with magic suggested through the consequences
of arranging things. Cat's cradle and rubber-band figures are material and
gesture references.

Dawn, noon, dusk, and midnight are proposed visits to the same place. A
dandelion head losing seeds is a candidate visit timer. The protagonist,
timer, and insect roster remain unselected; see `HOURS.md` for alternatives.

The target is a complete level-based game. Roguelike upgrades and procedural
run variation remain later possibilities. Fixed ingredient sources,
persistent transport paths, transit-time recipes, and the six-object board
are no longer the implementation plan.

## Next design step

Make a visual and gesture study of one meadow wave with moving targets,
live stroke-length bands, and single- and two-pocket enclosure.

Before treating this as an implementation-ready ruleset, settle closure,
crossing tolerance, accidental pockets, membership timing, and the distinction
between enclosure and contact actions. Then define the first valid combinations,
their effects, hazard penalties, wave completion, and failure conditions.
Thresholds and scoring have not been selected.

Use a build-free static browser project when implementation begins. Prepare a
bounded set of visual assets before play and measure first-use frame behavior
on the intended input devices. Follow the root asset-provenance rules when
assets are added. No assets have been acquired or created.
