# Food caddy STL

Parametric food-caddy parts sized for the Creality K1 SE.

## Print set

Print these four files as separate jobs from `production\`:

1. `food_caddy_k1se_body_216mm.stl`
2. `food_caddy_k1se_flip_lid_216mm.stl`
3. `food_caddy_k1se_liner_hanger_plate_v2.stl`
4. `food_caddy_k1se_hinge_kit_plate.stl`

`food_caddy_k1se_liner_hanger_plate_v2.stl` is a replacement for the original liner/hanger plate. It has a stronger, uniform-thickness retainer frame and includes a round collar printed in its reliable orientation. The original remains available for reference.

The complete package is also available as `food-caddy-k1se-stls.zip`. Replacement parts are in `spares\`. Assembly and printing guidance is in `docs\ASSEMBLY_NOTES.txt`.

The G-code ZIP files are retained as historical artifacts. The recommended workflow is to import the production STLs into Creality Print and slice them using the actual printer and filament profiles.

## Source

The generator is in `source\generate_food_caddy_stls.js`.
