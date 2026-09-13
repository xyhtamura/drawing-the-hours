# Relation garden: first playable version

A proposed browser game about drawing paths between objects and arranging the
order in which ingredients meet. The paths persist, carry visible pulses, and
take time to traverse. Their length changes the recipe's timing.

**Status:** specification only, 2026-09-13. `relation-garden` is a provisional
folder name. Xyh requested a small starting spec exploring lines, gestures,
recipes, and relationships after the
[LOOP-inspired brainstorm](../unbuilt/loop-meadow-forest_ideas_20260913.md).
The rules below are Codex's proposed first version, open to revision.

## First minute

Draw from a water source to a bud, then from a light source to the same bud.
Pulses travel down both lines. Water reaches the bud first; light follows, and
the bud opens into a cup-shaped flower. Draw from that bud to a bell: its next
flower pulse travels down the new line and makes the bell visibly ring.

Redraw the water path with a long curve. Light now arrives first, so the same
bud produces a star-shaped flower. The ingredient pair is unchanged; the
drawn relationship changes what it makes.

The intended pleasure is tracing a route, watching something traverse it, and
revising the route after seeing its effect. This remains to be playtested.

## One board

Six fixed objects: one water source, one light source, three buds, and one
bell. Use a landscape field with enough open space for long curves. Objects
have distinct silhouettes and short labels. Everything fits on one screen.

Both sources emit together every eight simulation seconds. A visible shared
countdown announces the next emission. A source without an outgoing path
emits nothing. The player can pause, reset the board, and undo the last edit.

These are fictional recipe rules, with no claim to model botany. The first
version has no species catalog, succession model, resource economy, or score.

## Gesture rules

| Gesture | Effect |
| --- | --- |
| Press on an object, draw, and release on another | Make a directed path in drawing order. |
| Continue a stroke through a bud and release on the bell | Make source-to-bud and bud-to-bell paths in one stroke. |
| Draw another path from an object | Replace that object's outgoing path. Preview the replacement before release. |
| Choose **Cut**, then stroke across paths | Remove crossed paths on release, then return to drawing mode. |

Curves and straight lines follow the same rule. A loop through empty space
adds travel time; it does not select everything inside it. Crossed paths do
not connect. Junctions exist only at objects, so overlapping lines cannot
silently change a recipe.

Allowed connections are source to bud and bud to bell. Each source and bud
has at most one outgoing path; incoming paths may converge. Reverse links,
bud-to-bud links, and repeated objects within one stroke are invalid. Show
the visited object sequence and direction arrows while drawing. Commit a
valid stroke atomically; an invalid stroke leaves the board unchanged and
names the unsupported connection. Releasing in empty space cancels it.

Use generous hit regions, pointer capture, and segment-based hit detection so
a fast stroke cannot skip an object between sampled pointer positions. Cut
mode is explicit because a crossing must remain available when drawing.

## Recipes and timing

Pulses move at a constant speed along the actual drawn path. Simplify pointer
jitter without replacing the curve with a straight connection. On a logical
960 by 640 board, start with 180 units per second and a maximum of 900 units
per path. These are tuning values. Reject an overlong path visibly rather
than silently shortening it. Screen resizing preserves logical lengths.

A bud holds its first ingredient for four seconds and displays that ingredient
with a shrinking expiry ring. A complementary arrival completes a recipe:

| Arrival at a bud | Result |
| --- | --- |
| Water, followed by light within four seconds | Cup flower pulse |
| Light, followed by water within four seconds | Star flower pulse |
| Both within 0.1 seconds | Round flower pulse |
| No complement before expiry | Ingredient fades; bud returns to empty |

The near-simultaneous rule takes precedence over order. Hold a first arrival
for the 0.1-second comparison window before resolving its state. At exactly
four seconds the complement is accepted; later arrivals begin a new recipe.
A repeated ingredient replaces the stored one and restarts its expiry.
Resolve by simulation arrival times, independent of render frame order.

Completion consumes both ingredients, briefly displays the flower, emits one
flower pulse along the bud's outgoing path if present, and empties the bud.
An unconnected bud still flowers, but does not store an output for a later
connection. Each flower shape produces a distinct visible ring at the bell.
Sound is optional for a later pass; the recipe is fully readable while muted.

Path edits discard pulses already on the removed or replaced paths. Buds
retain ingredients already received. New paths start carrying pulses at the
next source emission or bud completion; connecting a path does not itself
create an ingredient. Pause freezes simulation time, including all expiry
and countdown timers. Undo restores the pre-edit board and simulation state.

## Feedback and small goal

The opening instruction is: "Draw from each source to the same bud."
Once the first flower appears, show: "Change a path to change arrival order."
Leave timing rules available in a compact help panel.

A three-entry discovery strip records the cup, star, and round recipes when
first produced. Each entry shows the observed ingredient order. The optional
first-session goal is to discover all three and send a flower to the bell;
completion leaves the board playable. No timer penalizes exploration.

Show approximate travel time beside the active stroke and selected paths.
Pulse symbols, stored-ingredient icons, flower shapes, and direction arrows
carry meaning independently of color. A failed recipe should show the
ingredient expiring at the bud, so the player can identify what to change.

## Implementation boundary

Build a static page with `index.html`, `style.css`, and native JavaScript
modules, reachable through the shared root server at
`http://localhost:<port>/relation-garden/`. Use authored SVG or canvas shapes,
with no package installation or external assets. Keep recipe definitions and
tuning values in a separate data module; keep simulation updates independent
of rendering.

For the first version, fixed objects make path length and arrival order
predictable. Moving creatures are deferred deliberately: motion would change
the path geometry or require an attachment rule before the basic mechanic is
tested. Also defer branching, free relocation, gesture-shape recognition,
saved gardens, and additional ingredients.

## Acceptance and stop condition

Check in a browser that a player can draw and replace curved routes, chain a
source through a bud to the bell, and cut a crossing without moving objects.
Confirm cancellation and invalid strokes preserve existing links.

Check the simulation against known arrivals: water at 1 second and light at
2 produces a cup; reversing them produces a star; arrivals at 1 and 1.05
produce a round flower; a gap of 4.01 produces no completed recipe. Repeat
the same cases at different rendering rates. Check pause, undo, path
replacement with pulses in flight, and viewport resizing.

The playtest question is whether redrawing a curve to change an outcome feels
worth doing twice. If it feels like adjusting a delay control with extra
effort, revise the gesture before adding content. Stop the first build when
the six-object board supports these checks and one short playtest. Xyh's
response determines whether to add moving targets, richer recipes, or a
different relation verb.
