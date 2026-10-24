# Drawing the Hours, SOMEWAREZ kiosk build

The build of Drawing the Hours shown on a tablet at TOUCH-SCREEN. It is the main
page with a build flag set, so changes to the game reach it without a second copy.

Open either address on the tablet:

- `https://xyhtamura.github.io/drawing-the-hours/somewarez/`
- `https://xyhtamura.github.io/drawing-the-hours/?somewarez`

Locally, with the root server running:
`http://localhost:8000/drawing-the-hours/somewarez/`.

## Install on the Android exhibition tablet

After this version is published, open the kiosk address above in Chrome with
internet available. Wait for **Offline ready**, then tap **Install game** if it
appears, or use Chrome’s **Install app** / **Add to Home screen** menu item.
Open the resulting home-screen icon, enable airplane mode, close and reopen the
app, and try a visit, About, and sound before handing the tablet to the venue.
The installed game needs neither another computer nor a local server.

The app downloads its scripts, images, and fonts, and uses synthesized audio.
The optional recorded audition bank is not in this offline cache. Clearing the
app’s site data removes the download; reinstall while online if that happens.
Sound still needs a tap after opening the app. The QR destination needs internet
on the visitor’s phone. A plain HTTP address on a local Wi-Fi network cannot
install the offline worker; use the published HTTPS page.

For developers: run `python scripts/build_offline.py` after changing runtime
files, and `python scripts/build_offline.py --check` before publishing. The
export script runs the check too. New versions download in the background and
wait until the old app closes before replacing its cache.

## What differs from the main page

- **Progress is not saved to the device.** The offline installation caches game files, while progress, best scores, and settings are held
  in memory for the session ([src/storage.js](../src/storage.js)). Every visit is
  open from the Visits list.
- **Three controls at the foot of the field** replace the Pause button. Nothing
  is drawn outside the field:
  - **Main menu** opens the menu: Resume, Visits, Field Book, Encyclopedia, About, Settings,
    Restart visit.
  - **Level card** shows the current visit's requirements. During play the clock
    stops while the card is open.
  - **Reset** returns to the title screen and drops the session: progress, scores,
    sound and colors go back to their starting values. Music and graphics choices remain for this session.
- **The page resets itself** after 90 seconds without a touch during play or in a
  menu.
- **An idle loop** starts after 60 seconds on an untouched title screen:
  1. Dawn self-play with paragraph one of the statement.
  2. Title screen, 30 seconds.
  3. Noon self-play with paragraph two.
  4. Title screen, 30 seconds.
  5. Dusk self-play with paragraph three.
  6. Title screen, 30 seconds.
  7. Midnight self-play with paragraph four.
  8. Multicart QR card, 12 seconds, then the title screen for 60 seconds before repeating.

  Each self-play lasts at least 45 seconds and extends to fit its paragraph.
  Sentences show for at least seven seconds, with longer ones allowed three words
  per second. The last sentence stays until the scene ends. A finished visit
  restarts within the same scene; captions keep their place. Empty circles are
  allowed when no clear group is available. Self-play stays silent; title music
  can play once a visitor has unlocked browser audio. A touch interrupts the loop.
  The older multicart clips remain on disk but are not loaded or played.
- **A local cast.** Creatures and plants carry Philippine names (paruparo, tutubi,
  alitaptap, putakti, dama de noche, abaca, cogon), the hawkmoth is an oleander
  hawkmoth in green and pink, dandelion seeds are cogon plumes, and the poppy
  that slows the field is ylang-ylang. Mechanics and
  recipes are the same. The table is in [src/edition.js](../src/edition.js).
- The link to Between Banks is hidden, because that page has no controls and no reset.

## Settings

[config.js](config.js) holds timings, visits, `IDLE_SCENES`, and `STATEMENTS`.
The first four statement paragraphs run over the four hours. About contains the
whole statement, including paragraph five. Update both when revising the text;
the kiosk test checks captions against `ARTIST-STATEMENT.md`.

For shorter checks, override timings in the URL:
`?somewarez&idle=30&title=5&interlude=3&demo=20&ad=8`.

## Changing the multicart address

Change `MULTICART_URL` in [config.js](config.js), then redraw the code:

```bash
python scripts/make_qr.py
```

The script reads the code back with OpenCV before writing it and refuses to write
one that does not decode to the URL. `node test/test_somewarez.js` fails while the
drawing and `config.js` disagree.

## Offline copy

The title has a **Play music** button to unlock browser audio before Begin. Its sixteen-bar xylophone theme has an opening, varied answer, lower bridge and closing return, with quiet accents from the hour instruments. The unattended attract loop remains silent, including its title and QR card. Main and SOMEWAREZ share the same sample loader and synth fallback.

The optional local audition bank in `assets/audio-local/` is gitignored and excluded from exports by default. For a local copy with that bank, use `python scripts/export_somewarez.py --include-local-audio`; the zip has a `-local-audio` suffix. This includes the local instrument recordings whose standalone redistribution is not cleared in [ASSETS.md](../ASSETS.md). The default export works with synthesized instruments and requires no bank.

```bash
python scripts/export_somewarez.py
```

This writes `dist/somewarez/` and a zip of it beside it: every file the kiosk
build loads and nothing else, with the build flag set so its `index.html` is the
kiosk. `BUILD.txt` records the source commit and a hash of each file. The folder
is a product of this repository, so rerun the script after a change instead of
editing the copy.

The folder has to be served over HTTP. Opened by double-click it shows the title
and a Begin button that does nothing, because a browser does not load the
scripts from a `file://` address. `README.txt` in the export says how to serve it.

## Checks

```bash
node test/test_somewarez.js
```

From the browser console, `kiosk.step(seconds)` advances the idle clock and
`kiosk.state` reports the mode and scene. Step `game.update(1/60)` beside it while
the demonstration runs.

## Performance settings

Settings includes Paper textures, Paper shadows, Drawing resolution, and Frame
rate. Reduced resolution draws at one backing pixel per logical field pixel;
all four hour backdrops use that same resolution. The 30 fps option limits
canvas painting while simulation and pointer input keep their usual timing.
Music can be disabled independently of sound effects. These graphics and music
choices survive visitor resets and idle scene changes, but graphics choices
return to defaults when the page reloads.

On the exhibition tablet, first compare full and reduced resolution, then try
textures off, shadows off, and 30 fps as needed. No tablet speedup has been
measured yet. The artwork, title animations, and UI still have some work to do
with textures off; this is not a replacement for profiling the device.
