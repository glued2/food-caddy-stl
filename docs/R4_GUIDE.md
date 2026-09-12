# R4 ALL-PRINTED food caddy — measure and print coupons first

**Every assembly part, axle, keeper and gauge fastening is printed. No bought
fasteners, metal pins, nuts, elastic bands or structural glue are required.
No brims or G-code are supplied. This is an untested physical prototype:
CAD validation is not a load rating, a successful print, or proven host fit.**

## Installation and dimensions

This is a suspended inset caddy occupying one end of the **LEFT recycling bin
in the pullout drawer**, leaving the other end accessible for recycling when
closed. Hangers rest freely on the recessed **internal bearing ledge**; they
do not clamp the broad external flange. The photo establishes this arrangement,
not numerical opening, step or cabinet clearances.

All dimensions are mm:

| Item | R4 design |
|---|---|
| Complete installed hanging span | **230**, including both ledges, NOT the clear opening |
| Host opening used for design | **224 assumed, unmeasured** |
| Nominal bearing against that assumption | Only **3 per side**, across 52 front/back length |
| Body shell top / bottom / height | **204 x 190 / 190 x 174 / 200** |
| Body integral rail maximum width | 212 (prints with >=4 mm side margin) |
| Hanger faces below ledges | 220 outside span |
| Straight top corner chamfers | 35, not rounds |
| True horizontal polygon wall offset | 2.5, normal thickness >=2.496 including tapered chamfers |
| Floor | 3 continuous, joined to walls and rail roots |
| Lid flat skin | 206 x 192 x 2.4, with small edge reliefs and an integral slide rail |
| Internal support plane / ledge top | Z=216 / Z=219 |
| Body rim | Z=200: recessed 16 below support |
| Closed assembly | **230 x 210.5 x 219** |
| Closed height above internal ledge / floor below | **3 / 216** |
| Hinge axis | Y=105, Z=209; circular bore core diameter 9 |
| Printed axle | Diameter 8 circular envelope with an intentional flat for printing |

The host's measured 230 total width is not its opening. Its approximate
18 ledge dimension is a **vertical height, not a thickness to clamp**.
The host is slightly tapered, just over 210 wide at 230 depth; exact widths
at intervening heights, bottom datum and chamfer positions remain unknown.
Measure floor clearance **216 below the actual internal bearing plane**,
not from an assumed external rim. The 16 recess is a design choice, not a
measurement extracted from the photo.

The host has 400 front/back available; the caddy occupies approximately 211.
Nominal remaining length is not a claim about usable volume or accessibility
around an actual bag. Prefer the accessible end with the hinge facing the
remaining recycling area, not tight against the host end wall. The open lid
temporarily sweeps above that area.

The computed 0–110 degree opening envelope is approximately **195 above
the internal support plane** and **54 behind the closed hinge end** (rounded
up; add real clearance). See `packages/r4-validation.json` for sampled values.
The cabinet, shelf/counter, adjacent right bin and drawer front are NOT in
the CAD collision model. Check with the drawer fully pulled out; do not
assume either drawer closure or lid opening is possible without measurements.

## Mechanism: printed solids, not substitutes for M4 screws

### Main suspension load path

The body has integral broad male dovetail rails on each side. Each hanger
slides **up from below**, around its matching rail, until the continuous
sloped bottom seat meets the body rail's underside. The seat slope is 1.3
vertical to 1 horizontal and is printable with the bin without supports.
The downward bin load is carried by these broad seats and the captured
dovetail flanks—not by friction, flexing snap fingers or the small keepers.
Each main seat has over 90 mm² **vertical projected bearing area**; actual
surface area is greater because it slopes. The exact computed areas appear
under `intentionalContacts` in the validation report.

The host ledge bearing remains only an assumed 3 x 52 per side. This is not a
safe-load calculation. If the real bearing is narrower, rounded, sloped,
flexible or insufficiently engaged, STOP and change the design after measuring.

The rear hinge rail uses the same stopped slide principle with a narrower
rail. The lid has a separate wide printed dovetail that slides sideways into
the moving hinge leaf. These fittings are new R4 parts, not R3-compatible.

### Solid printed bayonet keepers

Three standard keepers lock the two hanger slides and the lid/leaf slide.
One **long rear keeper** locks the rear rail together with the axle-lock gate.
The two much shorter keepers are **for the host gauge only**.

Each keeper has a 6 mm shaft envelope, broad integral D-shaped head, and
solid cross-wing at its inner end. Insert with the wing aligned with the
keyed opening, fully seat the head, then turn it **90 degrees**. Its inner
wing then physically blocks straight withdrawal. This is not a friction-fit
collar or a tiny flexible barb. Small clearance/play is intentional.

The printed head has a flat edge which acts as an orientation indicator.
With the wing aligned for insertion, that edge is parallel to the broad
lower edge of the keyed opening; when locked it is perpendicular. In the
assembled bin, the tested locked D-flat faces:

| Keeper | Flat faces |
|---|---|
| Right hanger | Rear of bin (+Y) |
| Left hanger | Front of bin (-Y) |
| Long rear keeper | Left (-X) |
| Lid keeper | Rear (+Y) |
| Two short gauge keepers | Left along the assembled gauge (-X) |

These are deliberate-turn rigid keys, **not self-latching detents**. Check
the flats are locked and gently pull-test them before hanging or emptying
the caddy. Never rely on tightness to determine retention. If they can pull
straight out while locked, the print/fit has failed. Do not force, glue,
heat-weld or substitute metal hardware to rescue a bad fit.

### Printed hinge axle and positive anti-rotation gate

The low-load hinge carries the lid only, not the waste-bin load. Its printed
axle is much larger than the old small pins: 8 mm envelope with a flat bottom,
printed with its **long axis horizontal**. It runs in complete 9 mm circular
cores with a keyed extension; the extension removes material, never intrudes
into the circular core.

Fixed barrels span X=-34..-20 and 20..34. Moving leaf spans -18..18, leaving
2 gap each side. Shaft runs -34..36; integral head -37..-34; distal wing
36..39. Insert from the left with the wing aligned, rotate so the D-head's
flat faces rear (+Y), then fit the **separate axle-lock gate** from the left.
The gate captures the D-head: it prevents the working hinge from turning
the axle back to its release orientation and limits axial withdrawal.
The long rear keeper then pins that gate to the rear rail/body joint.
**Never operate the hinge without the gate and its locked long keeper.**

This retains a genuine flip hinge and removable bag frame. It is not a
lift-off lid, an external rim clamp, or an assembly of printed M4 fasteners.
There is no latch or built-in opening hard stop; limit use to the tested
0–110 degree range, subject to the actual kitchen clearance.

## What to print

`packages/food-caddy-r4-ALL-PRINTED-FULL.zip` is a package of separate print
jobs, not a crowded single plate. All individual spares are in `spares`.

| Production plate | Contents |
|---|---|
| `production/r4-01-bin.stl` | 1 bin, integral body rails and liner shelf |
| `production/r4-02-lid.stl` | 1 flat lid with integral leaf slide rail |
| `production/r4-03-liner-frame.stl` | 1 continuous removable bag frame |
| `production/r4-04-hanging-rails.stl` | Left and right hangers |
| `production/r4-05-hinge.stl` | Fixed hinge rail, moving leaf, axle-lock gate |
| `production/r4-06-keepers-and-axle.stl` | 3 standard keepers, 1 LONG rear keeper, 1 hinge axle |
| `production/r4-test-01-host-gauge.stl` | 2 gauge halves and 2 SHORT gauge keepers |
| `production/r4-test-02-mating.stl` | Side-joint, rear-joint, lid-joint, corner and bore coupons |

There are **13 production pieces**, representing 11 individual part types.
The eight coupon types require nine pieces because the short keeper is
printed twice. Do not print both a plate and its individual spares unless
you want extra copies.

Distinguish keeper lengths before assembly: standard 14 overall, long rear
18.2, short gauge 8.4 (all share the broad D-head). Short gauge keys must
NEVER be used on the loaded assembly. Quantities are also in
`packages/r4-manifest.json`.

### NO-RAILS option

`packages/food-caddy-r4-ALL-PRINTED-NO-RAILS.zip` contains individual replacement
jobs for the **liner frame, moving hinge leaf, standard keeper, long rear
keeper, hinge axle and axle-lock gate**. It explicitly excludes:

- the bin and lid;
- **BOTH new R4 hanging ledges/brackets**;
- the **fixed rear R4 hinge rail**;
- all fit coupons and short gauge keepers.

It is only for repeat prints reusing identical R4 body/lid/rails already in
hand. It does not work with R3 metal-screw fittings or unsafe legacy rails.
One keeper STL represents one keeper: print the quantity actually needed
(three standards in a complete assembly). The included manifest describes
the whole design, not additional contents secretly present in this ZIP.

## Fit-first sequence and collision-checked assembly paths

1. **Measure the host before the big bin.** Record the internal opening,
   actual flat bearing widths, internal-to-outer-rim step, ledge height,
   taper at the proposed bottom and rail depths, floor clearance, corners,
   drawer closure and opening sweep. Do not use the 230 outside measurement
   as the opening.
2. Print the host-gauge plate. Mate the central half-thickness tabs by
   bringing the right half against the left along the front/back direction.
   Align BOTH holes, insert the two **short** keys, then quarter-turn them.
   There is no purchased fastening. The assembled gauge spans 230 at the
   tips and 220 below, with an 18-deep vertical sample and 3-thick top tips.
   Rest tips on the **internal** ledge, not the external flange. Check square
   alignment and drawer closure gently. This is not a full tapered-bin,
   56-deep hanger, 216-deep floor or load test.
3. Print the mating plate PLUS all actual small production fittings
   (`04`, `05`, `06`). Assemble the side/rear coupons with their real rails,
   and leaf with the lid coupon. Print orientation and clearance must match
   the production parts. Bore coupon holes are 8.6, **9.0**, 9.4 left-to-right;
   the centre is the production circular core. It checks diameter only:
   test bayonet wings, gate and complete hinge on the real small fittings.
4. On the side coupon, start the hanger below the male rail and slide it
   **up** to the sloped seat. Insert a standard keeper with wing aligned,
   fully seat, then quarter-turn. Check seat contact, positive capture of
   the dovetail, and blocked downward removal with the keeper installed.
   Reverse intentionally: fully reseat, unturn/remove key, slide down.
   Repeat rear coupon with rear rail; its long key is installed later through
   the gate. Do not lift by an unretained fitting.
5. On the detached lid/coupon, slide the leaf **from the right toward the
   centre**, along X, over its integral dovetail. Its base rests at the lid
   top. Fit and lock a standard lid keeper from above. Verify blocked
   lateral removal and captured lift-off. Remove only after unlocking
   that keeper; never pry the undercut apart.
6. After successful coupons, print the full bin, lid and frame. Install
   hangers and their locked standard keys. Slide rear rail up and hold it
   seated during hinge installation. Install the bag/frame: the frame sits
   at Z=196..199 on the integral shelf, 1 below the rim.
7. Lower the assembled lid/leaf/keeper vertically into the rear ear gap.
   With axle absent, the CAD checks a 60 mm lowering path. Insert the
   unturned axle **from the left**, through fixed/moving/fixed barrels.
   Fully seat its head and turn its flat toward the rear (+Y). The solid
   distal wing is now across the release opening.
8. Slide the axle-lock gate **from the left** over the locked D-head. Its
   open side clears the lid sweep; it is not meant to fully surround the
   entire head. Insert the **long rear keeper** through gate, rear rail and
   body, fully seat, then quarter-turn. Check that the gate cannot slide off,
   that the axle cannot turn back toward release, and that neither pulls out.
9. Check closed lid seating directly on the rim, removable frame below it,
   every keeper's locked orientation, and slow opening through only the
   available angle up to 110. CAD checks 0.1-degree intervals with ALL
   retainers present. Then check the REAL drawer and cabinet.
10. To remove the lid: support it, unlock/remove the long rear keeper,
    slide gate left, fully reseat axle, reverse its quarter-turn, withdraw
    axle left, then lift lid assembly. Rear rail is now unretained: hold it.
    Remove leaf from lid only by separately unlocking its standard keeper.

No part is supposed to be magically trapped or snapped through another:
the insertion, locking and reverse-removal directions above are modelled.
Pin/slot clearance is intentional. Verify actual motion and contact by hand;
if it requires force or sanding away a retaining wing, STOP and reparameterize
the source and rerun the tests. Do not remove structural material to make a
failed joint appear to fit.

The host's long risers need separate checking: the brackets extend from
Z=160 to the Z=216 bearing plane (56 below). The simple 18 mm host gauge
does not certify that entire depth. Hang the real bracket/side-coupon pair
inside the host too. Those coupons are interface tests, not representative
load-test specimens.

## Slicing: PLA, glued bed permitted, NO brim

Use a calibrated K1 SE **220 x 220 x 250** profile, millimetres, 100% scale.
All supplied plates are centred with at least 2 mm XY margin and 5 mm
between separate components. Do not auto-orient or scale them.

Starting geometry-aware settings, not a validated filament profile: 0.4 mm
nozzle, 0.20 mm layers, six walls for load-bearing fittings and body where
the slicer can fit them. Make the bin's 3 mm floor solid (15 bottom layers
at 0.20). Lid skin is 2.4 (12 layers); retain its solid skin. Use solid
infill for small keepers, axle, gate and load-bearing fittings. The thin
body walls are already modelled; inspect gap filling and perimeter continuity.
No brisk speed/temperature recipe is prescribed.

| Part | Supplied orientation and supports |
|---|---|
| Bin and joint/corner coupons | Floor/cut base down. **Supports OFF**: tapered walls, integral male-rail undersides, shelf and keyed hole roofs meet the 45-degree face test. |
| Lid and lid coupon | Broad flat underside at Z=0. **Supports OFF**: integral rail widens with a printable slope; holes are vertical. |
| Liner frame | Flat. Supports OFF. |
| Hangers | Flat end face down, 52 tall; sloped load-seat cross-section lies in the layer plane. Do not lay ledge tips down. Inspect the short throat bridges and keeper head recesses; localized support in recesses only if coupons need it. |
| Fixed hinge rail | Bottom edge down. Integral ramped webs support barrels; axle keyway has a 45-degree roof around a complete circular core. Inspect all bore roofs in preview; local removable bore support is permitted if your coupon quality needs it. |
| Moving leaf | Axle direction vertical, one end face down. Dovetail runs vertically. **Localized removable support may be needed in the transverse keeper head recess and hole**; never leave support inside mating surfaces. |
| Axle-lock gate | Left end down, 53 tall, as supplied. The D-head socket is open to the next layers, not bridged over. Its long-keeper head recess is transverse: support that recess locally if needed. |
| All keepers and axle | **Long axes horizontal**, flats down. They have real flat bed contact, not a round shaft balancing on a line. Supports OFF. Never print the axle upright. |
| Gauge halves and bore strip | Broad faces flat. Supports OFF unless your gauge head-recess bridges need localized help. |

Use a clean, properly prepared/glued bed; bed adhesive is not a structural
joint. **No brims, glue assembly or G-code.** If an upright narrow fitting
will not adhere without a brim, fix bed preparation/calibration rather than
using a warped part. Preview every layer and remove all localized supports
before testing fits; do not “repair” STL solids in the slicer.

## What automated checks do and do not establish

From the repository root:

```powershell
npm ci
npm run build
npm test
python source\r4\validate_stl.py
```

The Python audit needs numpy/trimesh; it is separate from the WASM generator.
Source is `source/r4/generate.mjs`, with pinned manifold-3d 3.5.1 and fflate.
One shared parameter set creates canonical parts, their translated plates,
coupons, production quantities, hashes and deterministic ZIPs. `npm test`
rebuilds in memory without rewriting anything and fails on stale files.
Changing dimensions requires all tests, documentation and physical coupons
to be revisited; arbitrary parameter combinations are not guaranteed.

Tests require finite nondegenerate triangles, closed consistently oriented
topology, positive volume, one joined solid per part, bed contact for EVERY
physical copy, exact plate/spare geometry, printer margins and plate gaps.
CSG starts from valid cross sections and convex primitives; real unions
overlap where features join, not appended touching shells. No exported mesh
is silently repaired.

Checks also cover true normal wall/chamfer offsets, continuous floor,
support-free bin/lid face angles, seat areas, zero lid float, all closed
pairwise intersections, slide-in paths, quarter-turn paths, reverse removal
directions, locked withdrawal/head stops, rail/leaf capture, the axle gate's
positive anti-rotation and axial stop, and full lid motion with every keeper.
The report enumerates intended bearing contacts and sampled paths instead
of blanket-ignoring colliding pairs.

The independent audit reads exported STLs, checks topology/volume/bed contact
and exact translated triangle identity, verifies ZIP/hash parity, and verifies
the untouched **22-file legacy snapshot plus 59-file R3 fallback snapshot**.
The fallback is `metal-screws-required`, not the unsafe `archive/legacy`.

None of this validates layer adhesion, tolerances on your printer, fatigue,
PLA creep, actual host/cabinet geometry, bag snagging or a safe waste load.
Use a liner, smooth/remove only nonstructural print burrs, inspect before
use, and test progressively over a safe supported surface. Do not hang over
people or valuables. Do not dishwasher or expose PLA to hot waste. Frequent
emptying/inspection is prudent; no service life or load rating is claimed.
