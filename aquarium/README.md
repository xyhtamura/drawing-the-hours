# Aquarium

A two-level prototype of an eight-level drawing chapter. Fish are seen from
above, against faint vegetation and paving under water. Enclosing exactly two
fish of the same kind releases them; they swim away, and replacements enter.

Hold and drag to draw. Cross the cord to close a loop, then lift. Each occupied
pocket needs a matching pair. A figure eight can release two pairs in separate
pockets. Passing the pointer through a fish threads it onto the cord and cancels
the enclosure. The held cord blocks fish, and snaps beyond 1,300 logical pixels.
Geometry, cord walls, threading, bead movement, and length colours come from the
meadow modules. Pair evaluation is specific to this chapter.

## Levels

1. Guppies: three matching pairs, with slow wandering movement.
2. Ricefish: two guppy pairs and two ricefish pairs. Ricefish pause, then dart.

The bubble's area decreases with remaining time. Timing begins with the first
drawing gesture. Pause freezes movement and time. Practice removes the time limit
and writes no completion. The prototype saves separately under
`drawing-hours-aquarium-v2`; the archived chapter's save is left intact.

Story text is reserved for Xyh. Levels 3–8 are unbuilt. The intended later
variation comes from schooling, fish movement, and recipes, with grouping and
sorting introduced after these first two levels have been played.

## Checks

From the project folder, run `node test/test_aquarium.js` for the recipes,
timer, departures, replenishment, completion, and darting fish against a wall.
Open [the browser check](../test/aquarium-browser.html) through the shared server
for real pointer handlers and the mounted game. Its `?test` iframe ignores saves
and disables storage writes. It injects known fish positions for deterministic
gesture checks; it does not measure human difficulty.

The earlier eight-tank chapter is preserved in [aquariumarchive](../aquariumarchive/).
Its files are unchanged. Its relocated checks are
`node test/test_aquariumarchive.js` and
[the archived browser check](../test/aquariumarchive-browser.html).

Next: play both levels on a touch device and assess pair availability, ricefish
timing, and the bubble duration before building the schooling level.
