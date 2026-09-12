# R4 all-printed production and test plates

1. `r4-test-fit-kit.stl`: host gauge, its two short keys and all mating coupons.
2. `r4-03-accessories.stl`: liner frame and every small production fitting.
3. After the gauge and real fittings pass the guide's checks, print
   `r4-01-bin.stl` and `r4-02-lid.stl`, one job each.

The three production jobs contain all 13 required printed pieces. No metal
hardware or structural glue is needed. Use the supplied orientations;
read `../docs/R4_GUIDE.md` for localized support decisions and assembly order.
There is no brim or G-code. No R3/legacy part is compatible.

Use layer-by-layer printing, not sequential printing. Accessories are nested
inside the frame opening without changing their shapes or orientations.
Keep localized supports within the checked gaps; inspect toolpaths in Creality
Print before printing. Use `alternatives/r4-03-accessories-no-rails.stl` INSTEAD
of the full accessories plate only when reusing identical R4 rails.
