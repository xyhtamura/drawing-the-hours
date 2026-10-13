# Drawing the Hours, SOMEWAREZ kiosk build

The build of Drawing the Hours shown on a tablet at TOUCH-SCREEN. It is the main
page with a build flag set, so changes to the game reach it without a second copy.

Open either address on the tablet:

- `https://xyhtamura.github.io/drawing-the-hours/somewarez/`
- `https://xyhtamura.github.io/drawing-the-hours/?somewarez`

Locally, with the root server running:
`http://localhost:8000/drawing-the-hours/somewarez/`.

## What differs from the main page

- **Nothing is saved to the device.** Progress, best scores, and settings are held
  in memory for the session ([src/storage.js](../src/storage.js)). Every visit is
  open from the Visits list.
- **A bar below the field** replaces the Pause button:
  - **Main menu** opens the menu: Resume, Visit Card, Visits, Field Book, Settings,
    Restart visit.
  - **Level card** shows the current visit's requirements. During play the clock
    stops while the card is open.
  - **Reset** returns to the title screen and drops the session: progress, scores,
    sound, hints, and colors go back to their starting values.
- **The page resets itself** after 90 seconds without a touch during play or in a
  menu.
- **An idle loop** starts after 20 seconds on an untouched title screen and repeats
  until someone touches the screen:
  1. The game playing itself for up to 45 seconds, without sound. It rotates through
     one visit from each hour.
  2. A card with a QR code for the multicart, 18 seconds.
  3. The title screen, 20 seconds.

  A touch during the first two returns to the title screen. That touch does not
  press anything under it.
- The link to Between Banks is hidden, because that page has no bar and no reset.

## Settings

[config.js](config.js) holds the multicart URL, the timings, the visits the
demonstration plays, and `STATEMENT`.

`STATEMENT` is empty. Put a narration or artist statement there as one string per
line, and each line shows over the demonstration for seven seconds. The
demonstration lengthens to fit all of them.

To try other timings without editing the file, add them to the address in seconds:
`?somewarez&idle=30&title=5&demo=20&ad=8`.

## Changing the multicart address

Change `MULTICART_URL` in [config.js](config.js), then redraw the code:

```bash
python scripts/make_qr.py
```

The script reads the code back with OpenCV before writing it and refuses to write
one that does not decode to the URL. `node test/test_somewarez.js` fails while the
drawing and `config.js` disagree.

## Checks

```bash
node test/test_somewarez.js
```

From the browser console, `kiosk.step(seconds)` advances the idle clock and
`kiosk.state` reports the mode and scene. Step `game.update(1/60)` beside it while
the demonstration runs.
