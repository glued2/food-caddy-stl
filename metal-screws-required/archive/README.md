# Unsafe historical files — do not print

`legacy/` contains the complete pre-R3 tracked repository: old STL parts,
old generator, original README/assembly notes, STL ZIP, and historical
G-code ZIPs. These are preserved for traceability, **not recommended files**.
Instructions inside that snapshot are obsolete and unsafe to follow.

Use only the current root `production/`, `spares/`, `packages/`, `source/r3/`
and `docs/R3_GUIDE.md`. R3 is a different design; **no old hanging or hinge
fitting is compatible**. No-rails packages refer only to identical R3 fittings.

`legacy-manifest.json` records all 22 original paths, their archived paths,
byte lengths, SHA-256 hashes and immutable source commit. Binary assets and
the old generator were moved without changing their working-tree bytes.
Original README/assembly notes were recovered byte-for-byte from the original
Git commit, before the R3 documentation rewrite. The STL audit verifies the
archive against both these preservation hashes and the immutable Git baseline.
