# Midnight chapter and implementation handoff

**Planned replacement, 2026-09-15:** [STRING.md](STRING.md) removes Trace mode
and mode switching in favour of one drawing gesture. This document still
describes the running game. When STRING.md is built, the Trace contract and the
X–XII objectives below need replacing.

2026-09-15. Visit X is implemented. Antigravity owns implementation of XI and
XII; their revised records are present but remain outside `PLAYABLE_LEVEL_IDS`.
The [campaign plan](campaign-plan.json) and [runtime records](src/campaign.js)
agree. All three transition sentences remain Xyh's original text.

## Chapter progression

| Visit | Required drawings | Population | Clock |
| --- | --- | --- | --- |
| X: The window corner | Three ordered traces. | Three fireflies and two lacewings. | 95 seconds |
| XI: Figures | Six combinations, including a Kindred Pair, a Seed & Wing, a figure-eight, and two traces. | Three fireflies, two lacewings, two hoverflies, and two seeds. | 110 seconds |
| XII: Tomorrow keeps happening | Seven combinations, including two single loops, two figure-eights, two traces, and one Nursery. | XI's population plus two Brimstones and one perimeter snail. | 110 seconds |

X teaches one open gesture. XI adds explicit mode switching with familiar
insects and seeds. Its hoverflies provide stationary enclosure partners;
the former damselfly quota is removed, and the snail waits until XII.
Three fireflies preserve X's supply of Trace targets. XII brings back two
familiar inhabitants without adding a gesture, sequence, weather event, or
glow-dependent rule. Its seed quota is two, keeping the field at twelve targets
including the snail. These populations and clocks are first-pass tuning.

Each successful drawing can advance several listed requirements once. In XII,
one Nursery advances `any`, `figure8`, and `nursery`. Its Nursery remains
exactly one insect and one seed in separate pockets. Mixed Echo and
Cross-Meadow figures remain optional scoring opportunities throughout the day.

## What Visit X implements

The `window` scene uses cached blue-gray paper, a warm light wash, a window
frame, an exterior planter edge, and the existing responsive leaf anchors.
The center stays light; nighttime does not hide targets. All scenery remains
outside recipe evaluation.

Window Fireflies use the ordinary flier type and a separate drawing. Their
travel speed is 0.65 times the Brimstone baseline, scaled by `motionScale`.
A three-second cycle contains a 0.8-second glow; initial phases differ.
The dark body, pale abdomen, and target radius remain visible and unchanged
between glows. Glow changes only a surrounding halo. Lacewings retain their
Dusk travel and rest behavior.

Trace is locked in X. The ready card shows the three species slots, and the
Field Book explains the action. A successful trace scores 240 base points,
using the existing 1 / 1.25 / 1.5 length multipliers. The shared success path
adds the ordinary chord, departure animation, objective update, and four-second
bonus. An incomplete or invalid trace grants no score or time.

X follows Dusk IX. All implemented campaign visits remain selectable under
the existing playtesting policy. Practice · Midnight uses the same visit
without writing campaign victories. XI and XII stay inaccessible until built.

## Trace contract

1. Press outside every target ring, including seeds and hazards.
2. Touch a firefly, then a lacewing, then a different firefly, in one stroke.
3. Release after the third contact. The line may remain open or cross itself.

`src/trace.js` contains the pure `TraceGesture` evaluator and `sweptContact`.
It records first contact with each entity by object identity. These references
act as reservations within the stroke, while entities keep moving. Selected
targets receive numbered rings; no entity state, score, or objective changes
until release. Repeated contacts with a selected entity are ignored, so the
first firefly cannot also fill the final slot.

The contact calculation subtracts target movement from pointer movement and
intersects the resulting segment with the target's disk. Each game update
samples the held pointer after moving the insects; pointer events sample all
targets at their current positions. Coalesced pointer samples are consumed in
order. The release position is sampled even without a final move event. This
uses linear motion between consecutive simulation samples, not a prediction
of an insect's future path.

Contacts within a sample are sorted by first-entry time. Two indistinguishable
entry times invalidate the attempt with overlap guidance. Starting inside a
ring, touching the wrong species, touching a fourth distinct target, or
touching a snail invalidates the whole trace. Seeds are wrong targets in Trace
mode, even though they remain valid ingredients in Enclose. Feedback appears
when the mismatch occurs. The user must release before starting again.

New entrants have no trajectory before their appearance; only their endpoint
can count on the first sample that sees them. Harmonizing and departing
entities are excluded. A cancelled attempt discards all contacts. Pause,
Field Book, visit selection, hidden tabs, window blur, resizing, lost pointer
capture, and `pointercancel` clear an active stroke. A different pointer cannot
finish it. Expiry clears it without scoring. A release that completes the
objectives before expiry latches completion; additional input is ignored during
the visual delay.

## Entry points for Antigravity

| Entry point | Responsibility |
| --- | --- |
| `TraceGesture(point, entities, sequence)` | Begin an isolated ordered-contact attempt. |
| `trace.sample(point, entities)` | Update contacts without committing a result. |
| `trace.finish(strokeLength)` | Return a valid Trace result or rejection message. |
| `Game.cancelStroke()` | Release capture, stop drawing audio, and clear reservations and cord state. |
| `Game.setGestureMode(mode)` | Accept only a mode listed by the current visit; reject switching during a stroke or completion delay. |
| `Game.acceptDrawing(result, pockets)` | Commit accepted enclosure or Trace results through one score/objective/departure path. Trace supplies an empty pocket array. |
| `deriveObjectiveTags(result, pockets)` | Accepted Trace results produce only `any` and `trace`; enclosure keeps its existing predicates. |
| `Game.onGestureModeChanged` | Callback for presentation updates. The existing footer already uses it. |

`initLevel()` defaults to the first entry in `gestures`. XI and XII already list
`['enclose', 'trace']`, so starts and retries default to Enclose. Their sequence
remains `['firefly', 'lacewing', 'firefly']`. Do not infer mode from the shape
of a stroke, and do not add Trace tags to a successful enclosure.

The source supports mode selection, but the mixed-mode control and XI–XII
instruction cards are deliberately left for Antigravity. The existing
`window` art, fireflies, leaf behavior, Trace target rings, blue dashed cord,
and Trace status HUD can be reused directly.

## Build XI

1. Add a visible Enclose / Trace control for mixed visits, with a text label and
   keyboard access. Keep X visibly locked to Trace. Use `setGestureMode`, expose
   the selected state accessibly, and disable the control while drawing.
2. Teach switching in the ready card. State that seeds belong to Enclose, and
   retain the three-slot sequence while Trace is selected. Update the footer
   and mode control on starts, retries, and changes. Keep the mode visible in
   Enclose as well as Trace.
3. Check initial placement of the larger population at portrait and landscape
   sizes. X's authored five-insect arrangement is not a placement guarantee for
   nine targets. Use clearance-aware placement or queue an entrant rather than
   covering another target. Replacement already checks window flier clearance.
4. Complete XI through both gesture routes, verify each counter and bonus,
   then add `midnight-02` to `PLAYABLE_LEVEL_IDS`. The hour list and next-visit
   routing already consume that registry.

Do not enable XII in this step. XI should end with its own replay until XII
has passed its checks.

## Build XII and close the day

Reuse XI's controls and chapter scene. Teach the return of Brimstones and the
snail, then present the existing objective checklist without another gesture
diagram. Check that a Nursery also satisfies the figure-eight count and that
Trace cannot advance the single-loop count. Inspect the longer HUD at phone
width; wrapping the narrow HUD exists, but this five-counter combination has
not been visually tested.

Add a day-completion view with the campaign record and **Replay a visit**.
Keep the window scene visible. Preserve the final transition sentence as the
introduction to XII; do not repeat it as an ending or invent another narrator
monologue. The final gesture's release must not dismiss the completion view.

Use the actual set of completed campaign IDs when displaying **Twelve visits
complete**. The current testing controls allow a player to skip ahead, so
finishing XII alone must not claim all twelve visits were completed. A partial
record can say **Visit XII complete** and offer the same visit-selection route.
Never derive completion from `highestUnlockedIndex` or array position.

The existing end-of-available-content behavior replays the same visit. Replace
that branch deliberately for a completed first day, while retaining practice
replay and preserving saves and best scores. Add `midnight-03` to the playable
registry only after its completion and replay routes pass.

## Checks before handoff

Run from this folder:

```text
node test/test_mechanics.js
node test/test_dusk.js
node test/test_midnight.js
```

Serve the workspace root and open `test/midnight-browser.html`. It uses the
real Pointer Event handlers to check contacts, interrupted strokes, moving
targets, expiry, three traces through victory, replacement quotas, and practice
save isolation. `?view=ready&width=390` shows the portrait instruction card;
`?view=playing` shows the field. Run `test/dusk-browser.html` after changing
input coordination, since enclosure uses the same handlers.

Extend coverage for XI–XII: switching during an active stroke must fail;
switching between strokes must clear the previous attempt; retry must restore
Enclose; practice must not write completion; glow must never change hit tests;
the complete-day message must require all twelve IDs. Test returning from the
ending to visit selection, reloading saved progress, and replaying an earlier
visit. The existing startup does not resume a saved `currentLevelId`; address
that as part of the demo's save-flow pass rather than assuming the save field
already supplies a resume screen.

Headless checks use controlled target arrangements. They do not measure
finger occlusion, natural target availability, player timing, or perceived
difficulty. A real-device run across all twelve remains the final demo pass.
