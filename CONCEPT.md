# Meadow gestures: concept and aesthetic

Working direction for a tablet and browser gesture game, recorded on
2026-09-13. The player draws among moving creatures and makes combinations
through enclosure, separation, stroke length, and intersection. The folder
name `relation-garden` remains provisional. Nothing is built.

**Working title update:** Drawing the Hours. The
[independent design brief](SPEC.md#independent-design-brief) supersedes
remake framing; earlier references in this note document the ideation history.

**Later direction:** [Visits, inhabitants, and borrowed time](HOURS.md)
extends this daytime concept to dawn, noon, dusk, and midnight, proposes a
broader cast, and records Cradle as a tentative name. Its expanded hours
supersede the daytime-only restriction in this earlier discussion.

## Xyh's direction

This section records Xyh's spoken concept; subsequent sections are Codex's
proposals for developing it.

- A LOOP-inspired game with successive waves and levels. Version one should
  aim at roughly 20–30 authored levels and a fun complete game. Roguelike
  variation and accumulated upgrades are possible later directions.
- Tablet and browser input, reconsidering the gesture vocabulary after games
  such as Fruit Ninja. Drawing itself should demand skill.
- Short, medium, and long strokes, with visible color changes as length
  thresholds are crossed. Meandering should be capable of changing the result.
- Closed loops, open lines, and multi-lobed shapes such as figure-eights and
  trefoils. Keeping groups separate within one continuous gesture matters.
- Intersecting objects as another action, potentially splitting them, with
  combinations involving multiple kinds of gesture.
- Rules about valid groups of insects or butterflies. The attraction of
  Balatro here is learning combinations and handling increasingly elaborate
  interactions. This does not yet specify a poker scoring system.
- Hazardous creatures that might penalize contact or enclosure. Some creatures
  might cross an unfinished stroke while others are constrained by it.
- A childlike, slightly girly daytime meadow: paper with digital precision,
  vectors carrying paper texture, park edges, and ordinary outdoor play.
- A witchy undertone through putting things into relation. Cat's cradle and
  shapes made with rubber bands are central references. The setting remains
  quotidian, ecological, and sunlit.
- Room for concentrated gestural and combinatorial difficulty within that
  visual world. Xyh frames this through their own neurodivergent and neuroqueer
  sensibility; it is a personal design direction, not a general claim about
  those audiences.
- A loading screen to prepare textures before play and reduce interruptions.
  Smooth play is the goal; the asset budget remains to be measured.

Xyh reports retrieving LOOP's original rules and describes same-color groups,
mixed-color combinations, moth bonus stages, and contact hazards. The retrieved
text has not been supplied in this task, so these remain reported references,
not a verified transcription of LOOP's rulebook.

## Material direction: paper field, drawn cord

Agent proposal: make the playfield feel like colored paper arranged on a
sunlit surface. Broad cream and pale green areas leave room for creatures and
strokes. Clover, verge grass, small flowers, a fence shadow, and a worn path
establish a park edge through a few peripheral details. Ground decoration
should thin out where active play needs contrast.

Use paper texture inside clean silhouettes, with slight edge irregularity and
small contact shadows. A butterfly could have two folded-paper wings with a
visible crease. Wing motion would hinge at that crease. Texture stays attached
to the material as it moves. Keep enough texture to suggest fibers without
making the whole screen look grainy.

The player's stroke could resemble dyed cotton cord, with a narrow contact
shadow and a slight twist. It follows the input immediately. Release can add
a brief recoil after the result is settled; decorative motion must not move
the evaluated boundary. Cat's cradle supplies the tension, crossing, and
division of space. Literal hands are optional and unnecessary for the first
visual study.

A candidate palette is warm cream, grass green, butter yellow, petal pink,
cornflower blue, and a deeper plum for readable outlines. Pink can occupy
meaningful areas rather than appearing only as an accent. Avoid washing all
colors toward the same pale value: creatures, hazards, and the active cord
need separable silhouettes and contrast.

## Magic as an observable consequence

A valid arrangement could briefly synchronize wingbeats, align printed wing
marks, open a paper flower, or send insects along a shared arc. The drawing
would have altered their behavior. Choose one repeatable response for each
rule family so the player can learn the effect.

Success might release the grouped creatures into the border flowers and leave
a small pressed-paper mark on the level record. This is an aesthetic option;
whether creatures leave play, transform, or remain is still a mechanical choice.

Keep the unusual part close to ordinary play: a string shape works, and the
meadow answers in a specific way. Elaborate occult symbols, spell menus, and
a witch character would introduce another premise that Xyh has not requested.

Moths could appear during a passing cloud or in the shade beside a hedge.
Their material could be thin tracing paper with powdery markings. A temporary
change in contrast and sound could make that wave feel different while keeping
the overall world in daytime. This is a proposed bonus treatment, not a claim
about the original game's presentation or moth ecology.

## Give each kind of complexity a visible place

| Rule dimension | Proposed visual feedback |
| --- | --- |
| Short, medium, or long stroke | Cord hue and twist change at a threshold; a small three-step indicator also names the band. |
| Separate enclosed groups | Each completed pocket receives a faint fill and its own group markers. |
| Insect combination | Wing motifs distinguish types alongside color; compact result symbols explain the accepted group. |
| Contact or intersection | A reaction appears where the stroke touches the object. |
| Invalid enclosure | The offending member or pocket is marked; the entire drawing does not fail without explanation. |
| A creature constrained by the unfinished line | Its contact with the line produces visible bending or tension before it changes direction. |

The multi-lobed idea is especially promising because one stroke can express
several groups and a relation among them. A proposed figure-eight recipe might
require a matching pair in each pocket, with different types across pockets.
A proposed three-pocket recipe might require one type per pocket. These are
examples for exploration, not settled validity or scoring rules.

Recognize the enclosed regions and their contents rather than asking whether
the drawing resembles a perfect typographic eight. The player should be able
to stretch a lobe around moving targets. Tiny accidental pockets, ambiguous
crossings, closure tolerance, and which instant determines membership all need
explicit rules and a gesture test before level design.

Stroke intersection also needs a consistent contract: touching an object
cannot unpredictably mean cutting it, selecting it, or failing the enclosure.
One candidate is to assign contact effects to clearly different object types.
For example, a folded seed pod might split into two tokens, while a marked
hazard reacts adversely to contact. Whether butterflies themselves split is
still open. This preserves Xyh's cutting idea without choosing its subject.

## Challenge and progression

Keep demanding play compatible with readable information. Rule reminders
between waves, a pauseable recipe page, and explanations at the failure point
can support complicated combinations without removing the need to perform
them among moving creatures. Color cannot carry the rules alone.

Agent proposal for a 24-level target: six groups of four levels. Introduce
enclosure and combinations first, then length bands, separate pockets, contact
actions, unfinished-border behavior, and finally mixtures of learned rules.
Each group could teach one rule, vary it, combine it, and end with a challenge.
The order is provisional; the gesture test may change it. Keep moth waves as
an optional variation until the ordinary waves work.

The earlier six-object path-and-ingredient sandbox is superseded. Its use of
permanent channels and transit delays does not match this brief's moving
targets, temporary drawings, and spatial groups. Preserve its document as a
record of the direction dropped, not as an implementation prerequisite.

## Loading, motion, and sound

Prepare a bounded set of paper textures and creature variants before a wave
begins. A loading screen could show flat paper pieces assembling into a
butterfly, with honest progress and a clear ready state. Loading every possible
texture is not itself the success criterion; measure whether the chosen set
fits the device and whether first use interrupts drawing. No hitch-free claim
is established by this note.

Keep active movement readable under a finger, with the closure target visible
outside the occluded point. Mouse, finger, and pen should use the same basic
rules without requiring pressure sensitivity or multiple simultaneous touches.

Sound could use close paper movement, a small elastic release, and a different
short response for each recipe family. Layer sparse daytime surroundings under
them. Keep essential feedback visible and offer control over repeated sounds;
the sound treatment is still a proposal, with no samples chosen or produced.

## Playground rules and the level record

Further agent proposal following Xyh's invitation to continue: present the
learned combinations as small illustrated playground rules. A drawing shows
the creatures, the cord, and the result, followed by one plain instruction.
Examples are "Keep both pairs in separate pockets" and "Pass through the pod,
then close around the released seeds." These examples propose a grammar;
neither has been accepted as a shipped rule.

The recipe page could resemble a folded sheet carried outdoors: numbered
figures, a few annotations, and marks for combinations the player has tried.
Keep the rule legible at tablet size. The page should distinguish undiscovered
recipes from rules already taught, so discovery does not conceal a required
instruction. A level's active rules remain available while paused.

A level sequence could move along the edges of one park: a clover patch, the
verge beside a path, a hedge opening, a drainage edge, and the shadow under a
bench. These locations offer changes in framing and available space without
requiring a fantasy world map. Particular terrain mechanics remain unchosen.

Between waves, a narrow strip of paper could advance to the next numbered
figure. Successful combinations leave stamps or little cut-paper records.
Avoid making every success trigger a large overlay: the player's attention
should return quickly to the moving field.

One possible signature moment: two pink patterned butterflies occupy one
lobe of an elongated figure-eight, and two blue striped butterflies occupy
the other. A hazard approaches the waist. The player lengthens the second
lobe until the cord enters the required length band, then closes it. Both
pockets fill faintly; their creatures turn together and depart along mirrored
arcs. The exact group rule, hazard behavior, and departure are proposals. The
scene tests whether material, drawing difficulty, and relational consequence
can be understood as one event.

## Next design artifact

Make a visual and gesture study of one meadow wave: moving targets, one loop,
live length bands, and a two-pocket drawing. Establish what counts as a region
and show exactly which creatures belong to it. Use that study to choose the
visual treatment and resolve the drawing contract before expanding the rules
into 20–30 levels. No art assets, code, or research were produced in this sitting.
