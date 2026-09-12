# Food caddy R4 — ALL PRINTED

**No purchased fasteners, metal pins, nuts or structural glue.** The bin,
hangers, flip hinge, axle, positive retainers, bag frame and fit-gauge keys
all print on the K1 SE. No brims or G-code.

This hangs **inside one end of the LEFT recycling bin** in the pullout
drawer, resting on the recessed internal ledge—not clamping the external
flange. The remaining recycling area stays accessible when the lid is closed.
Actual host fit, safe load and kitchen clearance remain **unverified**.

## Current print files — coupons first

- **[Full ALL-PRINTED ZIP](packages/food-caddy-r4-ALL-PRINTED-FULL.zip)**:
  three production print jobs, one combined test job, individual spares, guide and
  machine-readable validation. “Full” means a package, not one giant plate.
- **[R4 guide](docs/R4_GUIDE.md)**: read for coupon sequence, every assembly
  and removal path, keeper orientations, print orientation and local supports.
- **[Production/test plates](production)** and **[individual spares](spares)**.
- **[NO-RAILS accessory ZIP](packages/food-caddy-r4-ALL-PRINTED-NO-RAILS.zip)**:
  one combined alternative plate with liner frame, moving leaf, three standard
  keepers, long rear keeper, axle and axle-lock gate. **Excludes bin, lid, BOTH R4 hanging brackets,
  fixed rear R4 hinge rail and all coupons.** Repeat prints for identical R4
  fittings already in hand only; never compatible with R3 or legacy parts.

The complete assembly has **13 printed pieces**. The production plates
include all required quantities, including three standard keepers and one
long rear keeper. The combined test plate includes the gauge's two **short** keepers;
those short keys must not be used on the caddy.

Print `production/r4-test-fit-kit.stl` first. It combines the gauge and mating
coupons. Then print `production/r4-03-accessories.stl` and test the real fittings
on those coupons before the large `r4-01-bin.stl` and `r4-02-lid.stl` jobs.
The accessory parts sit inside the open liner frame, with at least 5 mm between
their projected footprints; no part shape or orientation has changed.
Use layer-by-layer printing, NOT sequential/complete-individual-object mode.
Localized supports must stay inside the available gaps in the slicer preview.
Individual spares remain available; they are not extra required print jobs.

### Structural redesign, not printed replacement M4 bolts

- Integral broad body dovetails and matching stopped hanger slides carry
  waste weight through sloped bearing seats. Small keys do **not** carry
  the main hanging load. No flexible snap fingers or friction-only joints.
- Solid printed bayonet keepers insert freely, then quarter-turn into
  positive withdrawal stops. A wide lid dovetail captures its moving leaf.
- An **8 mm printed axle** carries the lid only. Its integral head and
  cross-wing retain it axially; a separate **rigid axle-lock gate** prevents
  rotation back to release. A long rear keeper locks that gate in place.
- A removable continuous bag-retainer frame sits on the bin's integral
  ramped shelf. The lid really flips and seats directly on the rim.

## Dimensions and critical assumptions

| Dimension | Current design |
|---|---|
| Full assembly | **230 x 210.5 x 219 mm** |
| Body shell top / bottom | **204 x 190 / 190 x 174 mm** |
| Body height / floor | **200 / 3 mm** |
| Minimum true normal wall, including chamfers | **>=2.496 mm** |
| Straight top corner chamfer | **35 mm** |
| Internal ledge support plane | **216 mm above floor** |
| Body rim recess below support / closed projection above | **16 / 3 mm** |

**230 is total outside width INCLUDING ledges, not the host opening.**
The working opening assumption is **224, unmeasured**, leaving only **3 mm
nominal bearing each side**. The reported 18 mm ledge dimension is a
vertical height, not flange thickness to clamp. Exact taper, internal step,
floor datum and cabinet clearances cannot be inferred from the photo.

Measure the actual internal bearing surfaces and use the printed split
gauge and real joint coupons before spending filament on the bin. The
16 mm recess is a design choice, not a measured step. Prefer the hinge
facing the remaining recycling space; opening requires roughly **195 mm
above the internal ledge** and **54 mm behind the closed hinge end**, plus
clearance. Check the fully extended drawer, shelf/counter and adjacent bin.

## Printing and validation

K1 SE **220 x 220 x 250**, 100% scale, supplied orientations, >=2 mm
plate-edge margin. PLA on a prepared/glued bed; **no brim**. Bin and broad
flat lid pass a support-free downward-face test. Some small-part transverse
head recesses may need **localized removable supports**, as specified in
the guide. Keepers and axle print **horizontally on broad flats**, not upright.

```powershell
npm ci
npm run build
npm test
# In a Python environment with numpy and trimesh:
python source\r4\validate_stl.py
```

Source: `source/r4/generate.mjs`, pinned Manifold WASM CSG. Build writes only
current `production`, `spares`, `packages` and the existing guide bytes.
`npm test` regenerates in memory and checks exact deterministic output/ZIP
parity without rewriting. Tests cover outward single solids, true wall/floor,
per-part bed contact, plate/spare identity and gaps, bearing contact, slide
and bayonet trajectories, positive stops, gate anti-rotation, lid seating
and a full 0–110° movement sweep including all retainers.
See [validation](packages/r4-validation.json) and [manifest](packages/r4-manifest.json).
No mesh is silently repaired. CAD checks are not physical print success,
a load rating, layer-bond validation or a PLA creep-life guarantee.

## Two preserved alternatives — do not mix fittings

**[metal-screws-required](metal-screws-required/FALLBACK_NOTE.md)** contains the
complete valid-but-hardware-dependent **R3 fallback** from commit
`b736c3d7db481300fadee53dfdf104b7b42ae97f`. All 59 original source/doc/STL/ZIP
and dependency files are preserved byte-for-byte with hashes. Its build runs
from that folder; use its small `RUN_AUDIT.py` wrapper for the independent
audit in its new nested location. This fallback is not the unsafe legacy set.

**[archive/legacy](archive/README.md)** retains the 22 much older files with
known unsafe geometry. Those are historical reference only, not print
recommendations. The independent audit verifies both snapshots remain intact.
