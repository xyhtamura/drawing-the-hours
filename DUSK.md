# Dusk chapter

Chapter design, 2026-09-15. Visits VII, VIII, and IX are implemented.
The [runtime records](src/campaign.js) and [campaign plan](campaign-plan.json)
carry the same Dusk objectives and populations. Xyh's transition text stays
verbatim in all three visits.

## Progression

| Visit | Task | Population | Clock |
| --- | --- | --- | --- |
| VII: The way through | Five combinations, including two figure-eights with a lacewing and a hoverfly in separate pockets. | Two lacewings and two hoverflies. | 100 seconds |
| VIII: The gaps in the sound | Five combinations, including one Nursery and one lacewing Counterpart Pair. | Two each of lacewings, hoverflies, and Brimstones; three seeds and one perimeter snail. | 95 seconds |
| IX: Carrying something home | Six combinations, including three single loops and two figure-eights. | Two each of lacewings, hoverflies, Brimstones, and hawkmoths; two seeds and one perimeter snail. | 100 seconds |

Xyh's playtest distinguishes gesture difficulty: amber hoverflies make pairs
and circles easy, but their stillness helps with difficult figure-eights.
Their movement stays unchanged. VII introduces one species with only two
required figure-eights. VIII adds seeds without Noon gusts. IX asks the player
to switch between familiar gestures. The former VIII mixed Echo requirement
is deferred because it adds four-target precision before the two-target form
has been calibrated on a touch device. Mixed Echo remains an available recipe.

## Lacewing behavior

`src/lacewing.js` owns the three leaf positions and the travel/rest state.
The renderer and insect movement read the same normalized anchors. At normal
speed, a lacewing travels between consecutive leaves in three seconds using
smoothstep interpolation, then rests for 1.5 seconds. `motionScale` changes
travel duration only. VII and VIII use 0.85; IX uses 1.0. Initial rests are
staggered by 0.75 seconds, and initial hoverflies sit near separate occupied
leaves. Travel remains inside the triangle between those leaves.

The leaves sit inside a rectangle that reserves space for the HUD and edge
scenery. Resizing reprojects both resting and traveling lacewings onto the
same route phase. The leaf itself has no hitbox and never enters a recipe.
Resting insects use the ordinary flier category and remain eligible for all
existing recipes. Two lacewings separated into figure-eight pockets still
fail the existing divided-kindred rule.

Captured lacewings harmonize and depart using the existing animation.
Replacement uses the 0.8-second quota queue. A replacement chooses a leaf
with at least 65 pixels of clearance from roaming entities, or waits another
0.2 seconds if all leaves are occupied. It begins a full rest there.
Pauses, story cards, and ready screens stop the behavioral clock.
These are authored game movements, not biological claims.

## Presentation and access

`src/dusk-art.js` caches a pale mauve and warm-paper passage with a wall edge,
paving seams, boundary plants, and three veined leaves. The center stays bright
enough for mint wings, amber bodies, and cord to remain visible. Scenery does
not obstruct drawing. Paper lacewings have narrow bodies, long antennae, and
veined wings that fold during rests.

VII follows Noon VI in campaign progression. **Visits** also offers **Practice ·
Dusk**, using the same timer and objectives without writing campaign victories.
Its ready card diagrams the two different insects in separate pockets.
The Field Book explains leaf rests and their exclusion from recipe contents.
VIII and IX are fully implemented and verified in the Dusk progression suite.

The intermittent cicada layer for VIII is synthesized in Web Audio with
natural buzzing pulses and gaps in sound, honoring Xyh's story card.
No sound-dependent objective or timing cue is required. IX's medicine remains
part of the narrator's supplied sentence, with no invented recipient or
medicine mechanic.

## Checks and next work

Run `node test/test_mechanics.js` and `node test/test_dusk.js` from this folder.
The Dusk suite checks rest and travel duration, large-step equivalence,
portrait bounds, resizing, recipe acceptance, progression across all three visits,
and agreement between the Dusk plan and runtime.

Serve the workspace root and open `test/dusk-browser.html` to exercise the real
game in an iframe: pause, transition freeze, replacement quotas, and five
prepared Pointer Event drawings through victory. `?view=ready&width=390`
keeps a portrait ready card; `?view=playing` keeps the field visible.
This harness controls target placement for gesture checks. It does not measure
how often a player can find or draw a successful arrangement during live motion.

Next: Hour IV: Midnight (Visits X–XII) introducing fireflies and Trace mode.
Dusk timing, initial spacing, and rest length remain first-pass tuning pending
Xyh's touch-device playtest.
