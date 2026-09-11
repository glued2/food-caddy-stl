# Food caddy STL

Parametric food-caddy parts sized for the Creality K1 SE.

## Print set

All files are now the current, standard design (after the reinforcement update following the first test print). Print these as separate jobs from `production\`:

1. `food_caddy_k1se_body_216mm.stl` - not yet printed.
2. `food_caddy_k1se_flip_lid_216mm.stl` - not yet printed; the rear hinge spine and front seating tab now have wider, full-thickness base pads so they can't shear off the lid skin the way the retainer frame tab did.
3. `food_caddy_k1se_liner_hanger_plate.stl` - bag-retainer frame is now a uniform 2.8 mm thickness with flush grip tabs, and the collar is printed standing on its round face so its pin bore is vertical.
4. `food_caddy_k1se_hinge_kit_plate.stl` - unchanged; the rear hinge rail already printed successfully, and this plate also contains the hinge pin.

Alternative accessory plates, useful if you don't want to reprint parts that already came out fine:

- `food_caddy_k1se_accessories_everything.stl` - every small part on one plate: bag-retainer frame, hanger ears, collar, hinge rail, and hinge pin.
- `food_caddy_k1se_accessories_no_rails.stl` - everything except the hinge rail, since the rail already printed successfully. Contains the bag-retainer frame, hanger ears, collar, and hinge pin.
- `food_caddy_k1se_failed_parts_only.stl` - just the two parts that actually failed on the first print: the bag-retainer frame and the collar.

The complete package is also available as `food-caddy-k1se-stls.zip`. Replacement parts are in `spares\`. Assembly and printing guidance is in `docs\ASSEMBLY_NOTES.txt`.

The G-code ZIP files are retained as historical artifacts. The recommended workflow is to import the production STLs into Creality Print and slice them using the actual printer and filament profiles.

## Source

The generator is in `source\generate_food_caddy_stls.js`.
