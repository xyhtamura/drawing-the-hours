# Aquarium

An eight-tank bonus chapter for Drawing the Hours, at [aquarium/index.html](index.html).
The visitor turns through a fictional aquarium displaying Philippine fish and
aquaculture situations. It uses the meadow's pocket geometry, with separate
movement, objectives, graphics, and saved progress.

Draw around fish and cross the cord before lifting. Accepted pockets send fish
into a resting ring; the transfer takes time, and progress counts arrivals.
The cord blocks fish while held and snaps at 1,500 logical pixels. There is no
threading rule in this chapter. Fry must remain free. Each tank card introduces
its group size, sorting requirement, or hazard before play.

| Tank | Added decision |
| --- | --- |
| Hatchery | Guide bangus into refuge. |
| Mangrove | Leave fry free and avoid roots. |
| Sardines | Gather at least three schooling tamban per pocket. |
| Pen | Restore oxygen with bubble loops and avoid loose netting. |
| Seagrass | Slow danggit with a seaweed pickup and avoid jellyfish. |
| Channel | Finish paired bangus loops during slack tide. |
| Sorting | Put bangus and tilapia into separate figure-eight pockets. |
| Last window | Combine groups, species purity, fry protection, oxygen, and hazards. |

Every tank is open from the map. Practice restarts the selected tank, removes
oxygen depletion, and records no completion. Escape pauses, R retries while
the canvas has focus, and changing tabs pauses the field. The save uses
`drawing-hours-aquarium-v1`, independently of the meadow. Storage failures do
not prevent play.

Exhibit notes link to SEAFDEC's [milkfish culture overview](https://www.seafdec.org.ph/milkfish/)
and [mangrove aquaculture code](https://www.seafdec.org.ph/wp-content/content/pages/FreeDownloads/code%20of%20practice/Code_of_Practice_Mangrove.pdf),
and BFAR's [sardine closed-season explanation](https://www.bfar.da.gov.ph/sardines-closed-fishing-season-now-on-its-12th-year-implementation-2/).
The oxygen units, refuge transfers, fish motion, seaweed effect, and 12-second
tide are authored game rules. They are not numerical ecological models or
aquaculture instructions. Tilapia and coastal fish share a field only in the
sorting exhibit, which explicitly marks that arrangement as a puzzle.

## Checks

From the project folder, run `node test/test_aquarium.js` for the pocket rules.
Open [test/aquarium-browser.html](../test/aquarium-browser.html) through the
shared HTTP server for a pointer-handler transfer, completion, map, pause,
and practice check. This browser check exercises the aquarium save and can
change the remembered tank and completion stamps. It does not touch meadow progress.

The fish, glass, sand, vegetation, visitor reflection, jellyfish, and pickups
are original Canvas drawings. The chapter reuses the project's licensed Mali
fonts and original favicon. It does not load the meadow's texture images.

Next: play all eight tanks on a touch device and tune group counts, motion,
oxygen depletion, and the slack-tide window from those play sessions.
