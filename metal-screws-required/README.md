# Food caddy STL — corrected R3

## Current R3 files only; print fit coupons before the bin

This is an **inset suspended food caddy inside one end of the LEFT recycling
bin in a pullout kitchen drawer**, not an external rim clip. The hanging
ledges rest on the host's **recessed internal bearing ledge** without clamping
its broad outer flange. The roughly 200 mm caddy occupies about one end of
the 400 mm host; the remaining recycling area stays accessible when closed.
Exact usable volume and clearances depend on the actual host.

**Legacy files are UNSAFE historical reference, not current print files.**
All 22 original tracked files—old STL parts, generator, original documentation,
STL ZIP and historical G-code ZIPs—are preserved under
[`archive/legacy`](archive/legacy). Preservation hashes and the original Git
commit are recorded in [`archive/legacy-manifest.json`](archive/legacy-manifest.json).
Their thin/collapsed chamfer walls, overlapping or inverted
shells, and mismatched fittings are not fixed by slicer mesh repair.
**Do not reuse the previously printed hangers or hinge rail with R3.**

R3 is real manifold-3d solid CSG, with separately bolted hanging ledges,
a flat lid and separate hinge leaf, a **metal M5 bolt/locknut axle**, and a
continuous liner frame. It does not depend on glue or a printed friction pin.
**Metal hardware is required**, not included in STL downloads.

- **[Full R3 ZIP](packages/food-caddy-r3-FULL.zip)** — all parts,
  small fit coupons, separate printable plates, guide and validation.
  “Full” means a package of print jobs, not a crowded single plate.
- **[R3 assembly/printing guide](docs/R3_GUIDE.md)** — dimensions, required
  hardware, coupon sequence, supports and limitations. Read this first.
- **[Production/test plates](production)** — five production
  jobs and two test jobs. Import centred, at 100%, millimetres.
- **[Individual parts / spares](spares)** — seven production
  parts plus seven coupons, each in its intended print orientation.
- **[NO-RAILS accessory-only ZIP](packages/food-caddy-r3-accessories-NO-RAILS.zip)**
  — **liner frame and moving hinge leaf ONLY**. Excludes bin, lid, **both
  hanging ledges/brackets, fixed rear hinge rail**, coupons and all hardware.
  This is for identical R3 rail reuse, never old fittings, and is not a
  complete caddy.

The root now contains only the new design's `source/r3`, `docs`, `production`,
`spares` and `packages`; **the archive is not a source of usable spare parts**.
The hanging bin, hinged lid and removable bag-retainer functions are retained.
Significant changes are mechanical M4 mounting joints, a positively retained
metal M5 axle instead of a printed pin/collar, and wholly new hanging/hinge
fittings. No artificial compatibility with already printed legacy parts is
maintained. No-rails means omitting **new R3** rails for repeat prints only.

### Confirmed measurements versus assumptions

230 mm is the host's **total outside left/right width including ledges**,
NOT its clear opening. Actual clear opening is **unmeasured**. R3 assumes
224 for design checks; its ledges span 230 overall (only 3 mm nominal
bearing each side), below-ledge bracket envelope is 220, bin top is
212 x 194, base 192 x 176, body height 205. Corners use 35 mm chamfers.
Full closed assembly is **230 x 206.5 x 224 mm**. The body rim is deliberately
recessed **16 mm below the internal support plane**, keeping the entire
closed assembly, including hardware, **at most 3 mm above that plane**;
the floor is 221 mm below it. This recess is a design choice, not a dimension
measured from the photo. Height relative to the host's outer rim is unknown.

Body wall is a true 2.5 mm polygon offset, giving **minimum 2.4946 mm
normal thickness including tapered chamfers**, with a 3 mm floor.
Lid skin is 2.4 mm, seats directly at rim height, and prints with over
39,000 mm² actual flat contact on the bed.

These dimensions do **not** establish real host fit or safe loading. The
user's approximate “just over 210 at depth 230” and 18 mm ledge height
do not describe the whole taper or ledge profile; 18 mm is a vertical height,
**not flange thickness to grip**. Drawer/shelf clearance and lid-opening
space at the chosen end are also unmeasured. Measure these and test
the split full-span gauge, wall joints and complete small hinge assembly
**before spending filament on the bin**. No physical fit, load rating,
creep life or slicer validation is claimed.

### Slicing summary

K1 SE: 220 x 220 x 250. Supplied layouts have >=2 mm XY edge margin.
PLA on a correctly prepared/glued bed. **No brims, no new G-code.**
Bin and broad flat lid: supports off. The fixed rear hinge rail's horizontal
5.8 mm bores need localized removable supports; other small-part horizontal
M4 holes may need local support depending on coupon results. Use the supplied
orientations and read the full guide. Do not automatically lay hangers on
their projecting ledge tips.

### Source and validation

```powershell
npm ci
npm run build
npm test
# Independent audit, in an environment with numpy and trimesh:
python source\r3\validate_stl.py
```

The generator is `source/r3/generate.mjs`; dependencies are pinned in
`package-lock.json`. It writes directly to `production`, `spares` and `packages`
using a single file manifest, never into `archive`. `npm test` rebuilds in
memory and fails on stale files.

Automated checks cover valid closed outward single-part solids; true
chamfer offsets and continuous floor; individual bed contact; printer margins;
plate separation and translated spare identity; lid seating and assembly
collisions; 0–110° opening at 0.1° intervals; metal axle clearance and positive
retention dimensions; archive parity. Details are in
[`packages/r3-validation.json`](packages/r3-validation.json).
The independent Python audit checks the exported STL topology/winding/volume,
per-component bed contact, triangle-level plate/spare parity, manifest/ZIP
hashes and complete archive preservation against its immutable baseline.
Neither test substitutes for physical
fit, layer adhesion, stress analysis or a slicer preview.
