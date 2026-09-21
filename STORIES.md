# Other stories for the same mechanic

Recorded 2026-09-21. The twelve-visit campaign in [CAMPAIGN.md](CAMPAIGN.md) is
one story told with the string mechanic. This note keeps the other stories Xyh
has proposed for it. Nothing here is scheduled, and nothing here changes the
current campaign or the **Next in Dev** line in [ROADMAP.md](../ROADMAP.md).

## Xyh's direction

On 2026-09-21 Xyh asked what a Filipino edgelands campaign would look like,
especially in which insects change. Xyh then noted the main story could be a
different kind of story altogether, and named three the mechanic applies to
easily:

1. Fish, on a trip to an aquarium or a pond.
2. Actual buttons, and arts and crafts.
3. Words, syllables, letters, and numbers, where the character has to speak in
   a given situation.

Everything below the Filipino campaign's first paragraph is Claude Code's
proposal for developing those directions.

## What any new story has to keep

The mechanic reads a small set of relations. The rules are in
[STRING.md](STRING.md). A story works with this mechanic if its things can take
part in these relations:

- **Enclosure.** A closed cord gathers what is inside it into a pocket. Pockets
  are judged on purity and on which kinds are in them.
- **Threading in order.** The cord passes through things one after another, and
  the order is the figure.
- **Crossing.** From Dusk on, the cord has to cross itself to close.
- **Length.** A cord snaps at 1,300 px, and a pickup can lengthen the next
  cord.
- **Hazards.** A hazard either cuts the cord or spoils a pocket that holds it.
- **Motion.** Targets move on their own and differ in how they move. That
  difference is what makes a name worth adding (see [HOURS.md](HOURS.md)).

The last point is the test for every cast below. A new name must come with a
different decision for the player. Otherwise it is a relabel.

## A Filipino edgelands campaign

This keeps the current story, the narrator's twelve lines, and every rule, and
moves the four places to Filipino urban edges. It is the smallest change of the
four stories here.

**Places.**

- **Dawn:** a waiting shed by a highway or jeepney stop. Talahib, weeds in a
  drainage grate, a cracked curb, an estero behind it.
- **Noon:** a mall or office atrium with planters, and a kapok tree past the
  glass. [CAMPAIGN.md](CAMPAIGN.md) leaves the narrator's occupation
  unspecified. A BPO lobby would settle it, so keep the building generic.
- **Dusk:** an eskinita between hollow-block walls. Plants in paint cans, a vine
  on chain-link, a botika bag implied.
- **Midnight:** a window with rehas, a ledge of potted plants, a neighbour's
  shrub beyond it.

**Cast, matched to behaviour already in `src/entities.js`.**

| Current | Candidate | What stays the same |
| --- | --- | --- |
| Brimstone (wanders, glides) | Grass yellow or lemon emigrant butterfly | Low yellow flutter along roadside grass |
| Azure damselfly (hovers, darts) | Tutubi, a dragonfly such as a skimmer | Hover-and-dart. This also corrects the current game: that is dragonfly behaviour, and damselflies mostly perch |
| Roseate hawkmoth (sweeping arcs) | Oleander hawkmoth | Adelfa (oleander) lines road medians |
| Paper lacewing (flies leaf to leaf, rests) | Tipaklong (grasshopper), or keep the lacewing | Rest intervals and leaf anchors. A hop would be a new movement rule |
| Window firefly | Alitaptap | Slow wander. Few fireflies in lit cities suits a single window |
| Hornet (cuts the cord) | Putakti (paper wasp) | Wandering hazard |
| Snail (spoils a pocket) | Kuhol, the golden apple snail | Pink egg clusters on estero walls |
| Cicadas (ambience) | Kuliglig | Also the name of a motorised pedicab in Manila |

**Plants.**

- **Flax flower → cadena de amor.** A pink fence vine whose name means "chain
  of love", for the pickup that lengthens the next cord.
- **Night jasmine → dama de noche.** The yard shrub English calls night jasmine.
  Sampaguita is the alternative, and vendors string it into garlands at
  intersections.
- **Dandelion clock → Tridax (coat-buttons).** A roadside weed with a small
  dandelion-like seed head.
- **Noon seeds → kapok (bulak).** Kapok cotton drifts off the trees in the dry
  season.

**Behaviours that would add a decision.**

- **Makahiya.** It folds when touched. A patch could close when the held cord
  crosses it and hide what rests on it until it reopens.
- **Butiki or tuko.** At the Midnight window, a lizard that hunts insects rather
  than cutting the cord. Tuko calls could mark time.

**Before shipping.** No range, local name, or behaviour above has been checked.
Regional names differ across Tagalog, Cebuano, Ilocano, and other languages.
The narrator's lines stay verbatim. Whether the Field Book uses Filipino
names, English names, or both is Xyh's decision. All art stays original
canvas drawing under [ASSETS.md](ASSETS.md).

## Fish: an aquarium or pond trip

**How the mechanic maps.** Fish school, which insects do not. Enclosing a whole
school is one figure. Splitting a school across two pockets is another, and it
gives the figure-eight a reason to exist. Threading in order follows a line of
fish passing single file.

**Places.** A public aquarium's tanks, a garden pond, and a fishpond. Keep them
generic rather than naming a real institution. The aquarium's glass is where
the player draws, so the cord could read as a mark on the glass rather than a
thing in the water.

**Movement worth a name.** Schooling fish turn together. Bottom feeders hold
still, then glide. A koi rises when food lands. An eel stays in a crevice and
comes out briefly.

**Hazards.** A heron at the pond edge, a net, a feeding frenzy that breaks a
school apart.

**Open question.** Depth. The field is flat. Fish at different depths could
read as layers the cord passes over or under, and that is a new rule, not a
reskin. Decide it before designing levels around it.

## Buttons, arts and crafts

**How the mechanic maps.** This one is the most literal. The cord becomes
thread. Threading in order becomes sewing through buttonholes, and enclosing
becomes sorting buttons into piles on a table. Crossing already reads as a
stitch.

**The problem.** Buttons do not move on their own, and moving targets are what
make the game. Motion has to come from the situation:

- A button whirligig spinning on its own string.
- Beads rolling on a tilted tray.
- A table jostled by someone else working at it.
- Sequins and glitter blown by an electric fan.

**What could vary by kind.** Two-hole and four-hole buttons, beads that only
thread, sequins that only enclose, a toggle that rolls. Each kind would need a
different rule, per the test above.

**Link.** Tridax is also called coat-buttons, which ties this story to the
Filipino campaign's clock.

## Words, syllables, letters, and numbers

**Situation.** The character has to speak, and each figure the player draws
becomes a thing the character says. Situations with a clear time limit suit the
existing clock:

- Saying "para po" to stop a jeepney before the stop passes.
- Passing a fare forward with "bayad po" and getting the right change.
- Ordering at a counter.
- Answering at an interview, a clinic, or a pharmacy counter. This would be the
  medicine line from the current story, told another way.

**How the mechanic maps.**

- Threading in order builds a word from syllables, or a sentence from words.
  Order is the figure, as in Midnight.
- Enclosure groups what belongs together: the syllables of one word, or coins
  that make an amount.
- Crossing could mark a code-switch between Filipino and English inside one
  utterance.
- Hazards would be filler words and interruptions, and a spoiled pocket would
  be a word that does not belong.

**Syllables rather than letters.** Filipino spelling is close to syllabic, and
baybayin writes a syllable per character. That makes the syllable a natural
unit to thread, where English would need letters. Any use of baybayin needs a
cultural and orthographic check before it ships.

**Numbers.** The fare, the change, and prices at a sari-sari store make
arithmetic into enclosure. A pocket's contents add up to an amount.

**Care.** Speaking under pressure can be hard for players in ways that are not
a skill to practise. Failure here should read as the moment passing, not as
the character being wrong. That is consistent with the current campaign, which
does not make play resolve the narrator's circumstances.

## Status

Four directions, none chosen. The Filipino edgelands campaign reuses the most
existing code. The fish and speech stories each need one new rule before
levels can be designed (depth, and what counts as saying something). The craft
story needs a new source of motion. No research, art, or code was done for any
of them.
