# R3 corrected food caddy — print coupons first

**R3 is a new, incompatible design. Do not use previously printed hanging or
hinge parts with it. Fit, strength and slicing are NOT physically validated.
There is no load rating. Do not fill or hang a full bin until you have checked
the actual host and progressively tested the assembly over a safe surface.**

## Installation intent — suspended INSIDE the left recycling bin

The caddy occupies one end of the LEFT bin in the pullout kitchen recycling
drawer, leaving the remaining length accessible for existing recycling when
the lid is closed. It is not an external clip-on bin or a freestanding insert.
Its two hanging ledges rest freely on the host's **recessed INTERNAL ledge**.
There is no hook or clamp around the broad outer flange. The photograph
establishes this arrangement, not numerical opening, step or clearance sizes.

For a low closed profile, the caddy rim is recessed **16 mm below the internal
support plane**. The complete closed assembly extends only **3 mm above that
plane**, while the floor hangs **221 mm below it**. The 16 mm recess is an
explicit design choice, not a measured ledge step. We cannot state its height
relative to the host's outer rim without measuring that step.

Prefer the accessible end of the host, with the hinge facing the **remaining
recycling space**, not tight against the host end wall. The open lid briefly
sweeps over that remaining area; it does not permanently partition it.
The CAD opening envelope needs roughly **193 mm height above the internal
support plane** and extends roughly **59 mm behind the closed hinge end**
at up to 110°. These are caddy geometry, not photo measurements; add clearance.
The shelf/counter, adjacent right bin, drawer front and end wall are not in the
CAD collision model. Measure their clearance with the drawer fully pulled out.
**Do not assume the drawer closes or the lid opens based on these STLs alone.**

## Dimensions and assumptions (mm)

- The user's **230 is the total outside width INCLUDING host hanging ledges**,
  not the opening. This design's complete ledge span is also 230. That does
  **not** prove that it fits within/on the host: the precise host opening and
  usable bearing surfaces must be measured.
- Assumed opening: 224, **unmeasured**. Body top: 212 x 194; base: 192 x 176;
  height: 205. Top corners are straight 35 mm chamfers, not rounds. The host
  is slightly tapered, just over 210 wide at 230 depth, but its intermediate
  widths and exact corner geometry are unknown.
- Detachable hanging brackets: 60 long front/back, below-ledge outside span
  220, ledge total outside span 230, ledge underside Z=221, top Z=224.
  Nominal bearing is only **3 mm per side** against the assumed 224 opening.
  Approximate host ledge height 18 is represented by the test gauge; it is
  a **vertical height, not a thickness to clamp**. Actual bracket risers extend
  37 below the bearing surface. Verify their full depth against the host;
  the 18 mm gauge is not a full-depth bracket/host-envelope proof.
- Body interior uses a **true 2.5 mm horizontal polygon offset** on straight
  AND chamfer faces. Taper-normal thickness is at least 2.4. Floor is 3.
  The integral liner shelf ramps inward 2 over 3 height (no support).
  Wall thickness statements exclude intentional fastener holes.
- Flat lid: 214 x 196 x 2.4; underside seats on rim Z=205, no hinge float.
  Separate moving hinge leaf bolts onto the lid. Hinge axis Y=103, Z=212;
  outside barrel radius 5.5. The hinge reaches Z=217.5, lid screw tips Z=221,
  and the raised hanging ledges set the full assembled height **224**;
  depth is **206.5**. Rim Z=205 is 16 below the support plane Z=221.
  Small lid-edge reliefs clear both hanging brackets and the fixed hinge
  webs; the remaining underside still seats directly on the rim.
  Host front/back space is 400; this caddy is approximately 200, not 400.
- Liner frame: 3 thick, sits on internal shelf at Z=201, top Z=204,
  0.5 radial nominal clearance at the seating plane. Bag thickness consumes
  clearance. It lifts out through the top. It is not a structural hanger.
- Printed parts fit the K1 SE's **220 x 220 x 250** build volume with at least
  2 mm XY edge margin in the supplied centred layouts. The 230 span is
  assembled from separate parts, NEVER printed across that bed.

## Files: full does not mean one giant plate

Use only the current root **`production`, `spares` and `packages`** folders.
**Never print from `archive/legacy`**: its old geometry, code, original
instructions and G-code ZIPs are preserved historical material only.
`packages/food-caddy-r3-FULL.zip` contains all seven
production parts, all seven coupon parts, five production plates, two test
plates, this guide, manifest and machine-readable validation.

| Production job | Contents |
|---|---|
| `r3-01-bin.stl` | One bin |
| `r3-02-lid.stl` | One flat lid |
| `r3-03-liner-frame.stl` | One continuous liner frame |
| `r3-04-hanging-rails.stl` | Left AND right detachable hanging brackets |
| `r3-05-hinge.stl` | Fixed rear rail AND moving lid hinge leaf |

Every physical part also has its own `spares/r3-*.stl` individual spare, already in
print orientation. Plates reuse those exact solids by translation, not an
independent geometry implementation. `packages/r3-manifest.json` contains SHA-256 hashes.
Do not print both a plate and its individual contents unless you want spares.

**`packages/food-caddy-r3-accessories-NO-RAILS.zip` is accessory-only:** liner frame
and moving hinge leaf, supplied as individual print jobs. It explicitly
excludes the **bin, lid, BOTH hanging brackets/ledges, fixed rear hinge rail,
all coupons, and all metal hardware**. Only use it to reuse identical **R3**
rails. It is not a complete caddy and does not reuse any legacy fittings.

### Functionality retained and changed

The hanging waste bin, hinged lid and removable bag retainer are retained.
R3 deliberately replaces every old fitting rather than preserving unsafe
compatibility. The significant change is **required metal hardware**:
M4 bolted hanging/lid joints and an M5 bolt/locknut hinge axle replace
glued mounting joints and the old printed pin/collar. No-rails is solely an
option for subsequent prints that reuse **new R3** fittings. There is no
load rating, latch, opening stop or claim of physically proven host fit.

## Required nonprinted hardware — no glue structural joints

Use corrosion-resistant metal fasteners. Countersunk screws must match the
model's 90-degree head recess; verify actual head dimensions on coupons.

- Six **M4 x 16 countersunk screws**, six M4 washers (nominal 1 mm), six
  M4 nyloc nuts (allow 5 mm envelope): four for hanging brackets, two for
  rear fixed hinge rail. Heads are on the outside and must sit flush,
  especially on the hanging brackets. Nuts and washers are inside the bin.
  Check thread engagement with real hardware; do not crush PLA.
- Two **M4 x 16 countersunk screws**, two M4 washers, two M4 nyloc nuts:
  attach moving leaf to the lid. Heads sit flush in the lid underside;
  washers/nuts above the leaf. Verify actual supplier stack dimensions.
  All eight production M4 screws therefore use the same 16 mm size.
  Modelled M4 head envelope is <=8 mm diameter, washers <=9 mm diameter
  and 1 mm thick, nyloc nuts <=9.4 mm across corners and 5 mm thick.
  At least 2 mm shaft projects past each nominal nut. Real tapered inside
  walls may leave a small gap under a flat washer; tighten gently.
- One **M5 x 60 hex-head bolt**, two M5 washers (nominal 1 mm), one M5 nyloc nut
  (nominal 5 mm) for hinge axle. Full thread or suitable partial thread with
  at least enough threaded length to tighten at a 50–55 mm grip. Shaft
  length is measured UNDER the head. Do not overtighten the moving hinge.
  Validated head envelope: <=9.6 mm across corners, <=4 mm high;
  washers <=10 mm outside diameter, nut <=9.4 mm across corners.
  There is deliberately **no printed pin, friction collar or glue joint**:
  the metal bolt head and locknut give positive axial retention.
- Split host gauge only: two **M3 x 12 bolts**, washers and nuts, through
  the central overlapping half-thickness tabs. Not part of the loaded bin.

M5 axle geometry: fixed ear outer faces X=-24 and +24; inner faces -14/+14;
moving leaf spans -12..12, giving 2 mm gap per side. Bore is a complete
5.8 mm circle (96 segments), metal shaft 5.0: 0.8 diametral nominal clearance.
Washers occupy -25..-24 and 24..25, shaft -25..35, nut 25..30; 5 mm remains
past the nominal nut. The circular bores have no hidden support intrusions.

## Print sequence — stop before the full bin if any check fails

1. Measure the actual host's **internal** clear opening and usable bearing
   ledge width, vertical
   ledge height, width at the planned bin bottom and intermediate heights,
   and chamfer positions. Measure depth from the **internal support plane**,
   not an assumed outer-rim datum; floor clearance at 221 below that plane
   must be checked. Measure the step to the outer rim, closed-drawer clearance,
   and opening clearance with the drawer fully out. **230 outside is not
   sufficient information.**
2. Print `production/r3-test-01-host-gauge.stl`; bolt the two halves together
   with their centre lap faces in contact, holes aligned. Its assembled
   width is 230 across top tips and 220 below, extending 18 below the
   bearing plane. Rest the tips on the **internal ledge**, not across or
   clamped onto the exterior flange. Check actual hanger locations on both sides, with
   the gauge level. It is only a width/ledge coupon, not a tapered full
   bin envelope or a load test. A separate small corner sample is below.
   Check the gauge's 3 mm top projection against drawer closure gently;
   do not force the drawer against an obstruction.
3. Print `production/r3-test-02-mating.stl` and the **actual**
   `r3-04-hanging-rails.stl` + `r3-05-hinge.stl` small fittings.
   Test plate contains actual side/rear wall sections with matching taper
   and holes, a lid mounting patch, the actual top corner section, and a
   bore strip. Bore strip holes left-to-right are **5.4, 5.8, 6.2** in its
   supplied view; centre hole is production 5.8. Select no new production
   clearance without updating source and rerunning all checks.
4. Bolt a hanger to its side-wall sample; verify full mating-face contact,
   flush heads, washers/nuts, thread engagement and no splitting. Repeat
   rear rail on rear-wall sample. Bolt leaf to lid patch; insert M5 axle
   through fixed/moving/fixed ears with washers and locknut. Check freely
   moving hinge, axial retention, seated patch height and nut clearance.
   The corner piece is an actual short rim corner, not a complete host
   outline. Use dimensional measurements too. Tiny wall samples must be
   handled gently: they are interface checks, not representative load tests.
   Hang the real bracket/wall coupons inside the host as well: their longer
   risers represent the 16 mm inset that the simple width gauge does not.
5. Only after satisfactory dimensional checks, print bin, frame, lid.
   Install brackets/rail first; cover internal hardware smoothly with the
   liner so it does not puncture the bag. Inspect for protruding sharp
   threads. Install frame/bag, bolt leaf to lid, then install metal axle.
   Lid underside must rest on rim, frame below lid. Open only to **110°**
   maximum verified CAD sweep; no built-in hard stop is provided.
   Orient the hinge toward available open space and confirm its complete
   opening envelope clears the host and kitchen before using it.
6. Preview every layer in your slicer, inspect completed parts for gaps,
   and test gently over a supported surface. Add waste progressively, not
   all at once. Never rely on this untested PLA design above people,
   valuables or where a spill would be dangerous.

## PLA on a glued bed — no brim, no G-code

Starting settings, not a validated profile: 0.4 mm nozzle, 0.20 mm layers,
5 walls for bin, 6 for load-bearing small fittings, 6+ top/bottom layers,
25–35% infill where there is an interior (small fittings can be solid).
The 3 mm modelled floor is continuous regardless of the layer-count setting.
Use your own calibrated temperatures, speed, extrusion and shrinkage.

- **No brims. No G-code supplied.** Use a clean, appropriately glued bed.
- Bin: floor down as supplied, **supports off**. Walls taper outward very
  slightly; shelf underside is a 2:3 ramp. Mounting holes have a circular
  clearance core and 45-degree teardrop roof to avoid support inside bin.
- Lid: its broad flat **underside is at print Z=0**, supports off. Its
  countersinks widen at the bed and taper inward going up.
- Frame: flat, supports off.
- Hangers: **flat narrow end faces** down as supplied, 60 mm tall on the
  bed. This places the continuous ledge-to-wall cross-section and vertical
  hanging load in the layer plane, rather than peeling an upright-printed
  ledge off the wall. Each end has over 120 square mm flat contact.
  Do NOT lay the ledge tip down: that would leave most of the bracket
  unsupported. M4 holes/countersinks are horizontal; apply localized
  supports there if the mating test cannot bridge them cleanly.
- Fixed hinge rail: **bottom mounting edge down**, 34.5 mm tall, not axle
  vertical. Integral sloping webs support the barrel exteriors. Its round
  **5.8 mm horizontal axle bores require localized removable bore supports**
  for a dependable circular fit; inspect those supports in the slicer.
  Support horizontal M4 bores locally too if the coupon needs it.
- Moving hinge leaf: axle direction along build Z; flat end face down.
  Its axle bore is vertical and needs no support. Its M4 mounting bores
  run horizontally: localized supports only if the coupon cannot span
  4.6 mm cleanly. Remove every support fragment before fitting hardware;
  never leave material intruding into an axle bore. No global support forest.
- Coupon wall/corner pieces: short upright actual wall sections as supplied;
  teardrop holes and ledge ramps need no supports. Gauge halves: broad
  side face down; supports off. Bore strip and lid sample: flat.
- If adhesion fails without a brim, stop and correct bed preparation/profile
  rather than proceeding with warped structural parts.

PLA creeps under sustained stress and heat; no safe load or service life is
established. Do not dishwasher, expose to hot waste, or treat FDM surfaces as
certified food-contact surfaces. Use a liner, empty frequently, and inspect.

## Reproducibility and limits of automated verification

From repository root: `npm ci`, `npm run build`, `npm test`.
Source: `source/r3/generate.mjs`; pinned kernel: manifold-3d 3.5.1 WASM.
The `p` parameter block defines body size, taper, true wall offset, floor,
hinge clearance and host assumptions; mating features and coupons derive
from those shared parameters. This is one validated parameter set, not a
promise that every parameter combination will fit. Changed parameters must
pass all assertions and require regenerated guides/physical coupon tests.
Generation writes directly into root `production`, `spares` and `packages`,
never into the archived snapshot. The original generator is isolated in
`archive/legacy/source` and must not be used to generate current parts.
CSG union/difference creates actual solids, not appended overlapping shells.
Every canonical part must have kernel `NoError`, one connected solid,
closed consistently directed edges, finite nondegenerate triangles, positive
signed volume, and individual bed contact. Kernel construction from convex
primitives and boolean operations avoids the legacy self-intersecting shell
construction; topology checks alone are not offered as proof of printability.

Checks cover true polygon offsets including chamfers and tapered face normals,
the bin's support-free downward surface angles,
floor continuity, shelf bearing, rim/lid seating, assembly intersections,
complete axle and M4 screw/washer/nut clearance/retention envelopes, and a 0..110° CSG movement sweep
at **0.1° discrete intervals** (hardware sweep 0.5°, neither is a formal continuous-motion proof).
Plate clearances are checked pairwise, with exact canonical-solid reuse;
ZIP contents must byte-match the manifest's spare/production files.
`npm test` regenerates in memory and fails on stale output, without rewriting.
No mesh is silently repaired. Independent STL validation is documented in
the repository's README once run.

None of these checks measures the real host, establishes layer bonding or a
load rating, guarantees hardware tolerances, or substitutes for slicing and
physical coupon testing. Full fit remains **unverified** until you do those
checks. Legacy production/spare STL and G-code archives are unsafe historical
reference only under `archive/legacy`. `archive/legacy-manifest.json` records
preservation hashes for all 22 original tracked files; the independent audit
verifies those bytes and their original Git baseline.
