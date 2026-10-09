# Aquarium

An eight-level drawing chapter. Fish are seen from
above, against faint vegetation and paving under water. Completed figures
release fish; they swim away, and replacements enter.

Hold and drag to draw. Cross the cord to close a loop, then lift. Each occupied
pocket needs a matching pair, or three spotted barbs.
A figure eight can release two groups in separate
pockets. Passing the pointer through a fish threads it onto the cord and cancels
the enclosure. The held cord blocks fish, and snaps beyond 1,300 logical pixels.
Geometry, cord walls, threading, bead movement, and length colours come from the
meadow modules. Recipe evaluation is specific to this chapter. Leaf clumps cut a cord
on contact and block roaming fish; fish spawn clear of them. Beetles cut any
cord they touch, including a held cord. Merely enclosing an obstacle is allowed.
Rising bubbles mildly displace nearby fish; they expire without changing the
countdown. These are disturbances, separate from the archived timer pickups.

The water uses four palettes, each shared by two consecutive levels: blue
(1–2), green (3–4), peach (5–6), and purple (7–8).

Fish bodies, tails, and fins reuse the project's paper textures, tinted to each
species' colors. Soft vegetation and water washes form the background.

## Levels

1. Shallow water: three ricefish pairs, with gentle drifting movement.
2. Stream stones: two ricefish pairs and two blue-goby pairs. Gobies pause on
   stones, then dart between them.
3. Small schools: peel exactly three barbs from shoals of six and seven, or two
   ricefish from a gathering of six. Complete three barb groups and one ricefish
   pair. Shoals spread and gather; each kind needs its own pocket.
4. Between leaves: four ricefish pairs around two leaf clumps and one beetle.
5. Under leaves: three halfbeak pairs and one ricefish pair. Halfbeaks glide,
   then turn sharply beneath drifting leaf shade. Two beetles cross the field.
6. Two pockets: three figure eights, each enclosing a ricefish pair and a goby
   pair in separate pockets. A single loop does not count.
7. School and pair: three figure eights, each enclosing three barbs and two
   halfbeaks in separate pockets.
8. Open water: two groups of each of the four kinds. Barbs need three fish;
   the others need pairs. One beetle crosses the field. Single loops and figure
   eights both count. Completing
   the objectives opens the chapter completion card.

The cast draws on wild Philippine freshwater fish. [Species references](NATIVE-FISH.md)
record the chosen taxa; movement and recipes are authored for play.

The bubble's area decreases with remaining time. Timing begins with the first
drawing gesture. Pause freezes movement and time. Practice removes the time limit
and writes no completion. The prototype saves separately under
`drawing-hours-aquarium-v2`; the archived chapter's save is left intact.

Story text is reserved for Xyh. Counts, school spacing, contrast, and durations
await a touch playtest.

## Checks

From the project folder, run `node test/test_aquarium.js` for the recipes,
timer, departures, replenishment, goby rests and darts, halfbeak turns, shoal spacing, leaf contacts and spawn clearance, swept beetle
contacts, bubble displacement and expiry, shade, and all eight completions.
Open [the browser check](../test/aquarium-browser.html) through the shared server
for real pointer handlers and the mounted game. Its `?test` iframe ignores saves
and disables storage writes. It injects known fish positions for deterministic
gesture checks; it does not measure human difficulty.

The earlier eight-tank chapter is preserved in [aquariumarchive](../aquariumarchive/).
Its files are unchanged. Its relocated checks are
`node test/test_aquariumarchive.js` and
[the archived browser check](../test/aquariumarchive-browser.html).

Next: play all eight levels on a touch device and tune shoal separation, beetle pacing,
and bubble disturbance strength.
