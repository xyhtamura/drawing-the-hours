# Drawing the Hours: Game Specification

**Version:** Campaign planning revision; two prototype waves built
**Date:** 2026-09-14  
**Working Title:** Drawing the Hours  
**Repository:** `drawing-the-hours/` (Independent Git Repository; backup at `drawing-the-hours-backup/`)  
**Core Reference:** [CONCEPT.md](CONCEPT.md), [HOURS.md](HOURS.md), [NOTES.md](NOTES.md)

---

## 1. Executive Summary & Aesthetic Direction

**Drawing the Hours** is a tablet and desktop browser game of tactile gesture drawing, moving meadow ecologies, and combinatorial relationships. The player visits a quiet meadow during fleeting gaps in the day (Morning, Noon, Dusk, Midnight) and draws temporary cotton cord figures to arrange moving insects, airborne seeds, and botanical elements into harmonious relations.

### 1.1 Aesthetic Pillars
- **Paper Field & Cut Silhouettes**: The playfield resembles layered, sunlit paper (`#f9f6ea` to `#f1ede0`) with peripheral clover patches and soft fence shadows.
- **Creased Origami Wings**: Butterflies are rendered as folded paper vector silhouettes with central crease hinges, subtle paper drop shadows, and 3D-simulated wing flaps.
- **Dyed Cotton Cord**: The player's stroke has the tactile appearance of twisted cotton string, carrying a contact shadow, visible strand highlights, and dynamic recoil on release.
- **Observable Everyday Magic**: Successful arrangements do not vanish in magical explosions; rather, enclosed creatures synchronize wingbeats, receive faint pastel paper fills, stamp pressed-paper watermarks into the verge, and flutter gracefully away into the bordering vegetation.
- **Pure Procedural Audio**: Fully self-contained Web Audio synthesis with bandpass-filtered paper friction, plucked cotton string recoils, pentatonic bell chimes, and dandelion seed puffs (zero external audio asset files).

---

## 2. Gesture Engine & Geometry Contracts

Input is handled via the unified **Pointer Events API** with pointer capture (`setPointerCapture`), providing seamless, low-latency drawing across mouse, stylus/pen, and capacitive touch screens without touch-event conflicts.

### 2.1 Stroke Metrics & Length Bands
The raw drawing path is filtered to remove jitter (points separated by $< 6\text{px}$). Arc length $L = \sum |P_i - P_{i-1}|$ is accumulated in real time:

| Band Name | Length Range | Visual Hue | Twist Accent | Score Multiplier | Gameplay Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Petite (I)** | $L < 450\text{px}$ | Blush Rose (`#e28b8b`) | `#d97777` | $1.0\times$ | Quick, nimble loops around tight pairs |
| **Balanced (II)** | $450\text{px} \le L < 1100\text{px}$ | Warm Terracotta (`#d46b43`) | `#c85a32` | $1.25\times$ | Standard loops and compact figure-eights |
| **Extended (III)** | $L \ge 1100\text{px}$ | Deep Plum (`#6c4b78`) | `#5a3a66` | $1.5\times$ | Wide sweeping multi-pocket correspondences |

The active band is displayed dynamically on the HUD meter and directly tint-shifts the drawn cord.

### 2.2 Planar Cycle & Pocket Recognition
Upon pointer release, the gesture engine evaluates the stroke topology:

1. **Endpoint Proximity (Single Closed Loop)**:
   - If distance $(P_0, P_{\text{end}}) \le 90\text{px}$ and no valid crossing exists, closes the polyline into a single polygon.
   - Must clear minimum area threshold ($\text{Area} \ge 900\text{px}^2$) using the Shoelace formula.
2. **Single Crossing / Lasso**:
   - Detects parametric segment intersection $(S_a, S_b)$ with endpoint tolerance $\varepsilon = 10^{-3}$.
   - The loop formed between $S_a$ and $S_b$ ($X, P_{a+1}, \dots, P_b, X$) is extracted as an enclosed pocket if $\text{Area} \ge 900\text{px}^2$.
3. **Two-Pocket Figure-Eight**:
   - When an intersection point $X$ exists, evaluates both the inner loop (Lobe 1) and the outer closure loop (Lobe 2: $P_0 \dots P_a, X, P_{b+1} \dots P_{\text{end}}, P_0$).
   - If both lobes satisfy $\text{Area} \ge 900\text{px}^2$ and outer closure distance $\le 90\text{px}$, the gesture is classified as a **Two-Pocket Figure-Eight** (`figure8_lobeA` and `figure8_lobeB`).
4. **Accidental Pocket Rejection**:
   - Tiny loops, pen hitches, and crossings below $900\text{px}^2$ are discarded, preventing unintended faults or empty-pocket triggers.

### 2.3 Containment Test
Evaluated atomically on release using standard raycasting point-in-polygon tests. An entity is assigned to a pocket if its center coordinates $(x, y)$ lie strictly within the pocket polygon.

---

## 3. Inhabitants & Meadow Ecology

| Inhabitant | Entity Type | Palette & Visual Design | Movement Mechanics | Behavioral Role |
| :--- | :--- | :--- | :--- | :--- |
| **Brimstone** | Butterfly | Body `#5c5238`, Wings `#fae37d` / `#f1d152`, Edge `#e5be38`, Mark `#d69e2e` | Size 22, Speed 1.1, Flap 14 Hz. Wandering flight with intermittent smooth glides (0.6–1.4s) and soft verge steering. | Foundational flier. Moderate speed, steady flight paths. |
| **Azure** | Butterfly | Body `#30424f`, Wings `#8ecae6` / `#70b2d6`, Edge `#529bc4`, Mark `#219ebc` | Size 19, Speed 1.4, Flap 18 Hz. Swift, agile flight with sharper turning radius and rapid wingbeats. | Quick flier. Demands anticipation or wider gestures. |
| **Roseate** | Butterfly | Body `#4f303e`, Wings `#f7b2bd` / `#ee9ca7`, Edge `#e2808e`, Mark `#d1536b` | Size 20, Speed 0.95, Flap 12 Hz. Gentle hovering flutter, lingering near clover patches. | Slower flier. Ideal anchor for mixed trios and multi-pocket lobes. |
| **Dandelion Seed** | Airborne Seed | Feathery white pappus (`#f8f5eb`), slender stalk (`#a89d87`), dark achene (`#655743`) | Radius 14. Drifts diagonally with ambient breeze ($v_x \approx 0.5–0.9$, $v_y \approx 0.15–0.35 + 0.4\sin(2t)$). Gracefully wraps across screen boundaries. | Passive airborne traveler. Pairs with butterflies or fills dedicated nursery lobes. |
| **Snail** | Ground Hazard | Spiral paper shell (`#a67c52`), cream foot (`#eddcc8`), delicate eye stalks | Radius 16, Speed 0.12. Crawls slowly along the lower meadow verge; reverses at boundaries. | Ground hazard. If caught in a flight gesture, its heavy shell snarls and breaks the cord. |

---

## 4. Combinatorial Harmony Rules & Grammar

Drawings are evaluated by checking the contents of extracted pockets against authored recipes. Final score = $\text{round}(\text{Base Score} \times \text{Length Band Multiplier})$.

### 4.1 Single-Pocket Recipes
- **Kindred Pair**:
  - *Condition*: Exactly 2 butterflies of the *same* species (e.g. 2 Brimstones, 2 Azures, or 2 Roseates); 0 seeds; 0 hazards.
  - *Base Score*: 120 pts.
  - *Effect*: Wingbeats synchronize; creatures ascend peacefully to border flora.
- **Trio of Flight**:
  - *Condition*: Exactly 3 butterflies of 3 *distinct* species (1 Brimstone + 1 Azure + 1 Roseate); 0 seeds; 0 hazards.
  - *Base Score*: 300 pts.
  - *Effect*: Crystalline bell chord; all three butterflies disperse outward in mirrored arcs.
- **Seed & Wing**:
  - *Condition*: Exactly 1 butterfly (any species) + 1 floating dandelion seed; 0 hazards.
  - *Base Score*: 160 pts.
  - *Effect*: Soft air puff; seed disintegrates into paper shimmer while the butterfly departs.

### 4.2 Two-Pocket (Figure-Eight) Recipes
- **Symmetric Correspondence (Twin Echoes)**:
  - *Condition*: Pocket A and Pocket B contain identical species compositions ($\ge 1$ creatures in each, 0 hazards).
  - *Base Score*: $600\text{ pts} + 50\text{ pts per creature}$.
  - *Effect*: Mixed combinations that fail alone harmonize through bilateral symmetry.
- **Counterpart Pair**:
  - *Condition*: Pocket A contains exactly 1 insect of species $X$; Pocket B contains exactly 1 insect of species $Y$, where $X \ne Y$; 0 seeds; 0 hazards.
  - *Base Score*: 320 pts.
  - *Philosophy*: While two dissimilar insects cannot share a single loop (which yields "Two mismatched species"), separating them with a crossing figure-eight cord balances their contrast into a harmonious bilateral dialogue.
- **Counterpart Dialogue**:
  - *Condition*: Pocket A contains insects of species $X$; Pocket B contains insects of species $Y$ ($X \ne Y$, total count $> 2$); 0 seeds; 0 hazards.
  - *Base Score*: $300\text{ pts} + 40\text{ pts per creature}$.
- **Cross-Meadow Correspondence**:
  - *Condition*: Pocket A contains a Kindred Pair (2 of kind $X$); Pocket B contains a Kindred Pair (2 of kind $Y$, where $X$ and $Y$ may be identical or distinct).
  - *Base Score*: 550 pts.
- **Nursery Polarity**:
  - *Condition*: Pocket A contains $\ge 1$ butterflies (0 seeds); Pocket B contains $\ge 1$ dandelion seeds (0 butterflies).
  - *Base Score*: $250\text{ pts} + 50\text{ pts per entity}$.
- **Twin Seed & Wing**:
  - *Condition*: Pocket A contains 1 butterfly + 1 seed; Pocket B contains 1 butterfly + 1 seed.
  - *Base Score*: 480 pts.
- **Double Harmony**:
  - *Condition*: Both Pocket A and Pocket B satisfy independent single-pocket recipes.
  - *Base Score*: $\text{Base}_A + \text{Base}_B + 150\text{ pts bonus}$.

### 4.3 Fault Precedence & Player Explanations
When an invalid enclosure occurs, the game does not silently fail; an informative banner explains the condition:
1. **Hazard Fault**: If any pocket contains a Snail $\to$ *"A ground crawler disturbed the cord!"* (recoil snap sound).
2. **Open Gesture**: If the path does not close $\to$ *"Figure did not close. Trace back or cross over."*
3. **Empty Pocket**: If enclosed area contains no targets $\to$ *"Empty pocket — nothing was gathered."*
4. **Mismatched Pair**: If 2 butterflies of different kinds $\to$ *"Two mismatched wings: need a matching pair or a third for a trio."*
5. **Solitary Flier**: If 1 butterfly with no seeds $\to$ *"A solitary wing needs a companion or a seed."*
6. **Crowded Enclosure**: $> 3$ butterflies in a single loop $\to$ *"Too many wings to gather peacefully in one loop."*

---

## 5. Time Economics: The Dandelion Clock

- **Visit Duration**: 60 simulation seconds per level.
- **Visual Representation**: A delicate 12-seed radial dandelion clock rendered in the upper HUD.
- **Shedding Cadence**: Every $5.0\text{s}$, one seed detaches from the central receptacle cushion and floats away into the breeze with a soft synthesized air puff.
- **Harmony Bonus**: Each successful harmony arrangement awards $+4\text{s}$ of borrowed time (capped at $\text{Total} + 15\text{s}$), re-attaching or delaying seed departures.
- **Completion Condition**: Achieving the visit goal (e.g. 5 harmonies) before the 12th seed detaches triggers **Visit Complete** victory. If time expires, the remaining seeds scatter into the wind (**The Hour Has Passed**).

---

## 6. First twelve visits: campaign authority

The [twelve-level campaign](CAMPAIGN.md) and [level data](campaign-plan.json)
supersede the earlier 24-level plan. Xyh confirmed four groups of three
levels: Dawn, Noon, Dusk, Midnight, with the twelve transition lines in
[first12levels.md](first12levels.md) preserved verbatim.

The campaign gradually adds a warned seed breeze, lacewings, fireflies,
and ordered Trace gestures to the existing enclosure grammar. Dawn, Noon,
and Dusk Visit VII are implemented; VIII–XII remain planned. The
[Dusk chapter design](DUSK.md) specifies its revised progression. Follow the
campaign document for progression,
objectives, replenishment, story flow, and acceptance checks. Keep the two
prototype waves available for comparison.

The [previous spec](SPEC-before-campaign-20260914.md) preserves the 24-level
proposal as history; later expansion is optional. Implementation next steps
live in [NOTES.md](NOTES.md). The folder rename was completed on 2026-09-14.

---

## 7. Verification & Implementation Standards

- **Code Quality**: Build-free ES modules (`src/*.js`), native Canvas 2D, zero third-party dependencies, strict lint and syntax check (`node --check`).
- **Automated Testing**: Headless Node.js test suite (`test/test_mechanics.js`) testing geometry, length bands, loop extraction, and recipe validation.
- **Asset Integrity**: 100% procedural vector and synthesized audio — no third-party copyrighted artwork, fonts, or sample recordings.
