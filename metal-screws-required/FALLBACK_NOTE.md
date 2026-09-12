# Preserved R3 fallback — metal screws required

This is the complete R3 deliverable from commit
`b736c3d7db481300fadee53dfdf104b7b42ae97f`, preserved without changing any
original source, STL, ZIP, documentation or dependency-manifest bytes.
`PRESERVATION.json` records all 59 original files and hashes, including a
copy of the original historical archive. The root historical archive was
not modified. This folder is a hardware-dependent fallback, **not the unsafe
legacy design** inside its archive subfolder.

From this folder, `npm ci`, `npm run build`, and `npm test` run normally.
`npm test` is non-writing. To regenerate without changing the preserved
snapshot hashes, first copy this fallback to a separate working folder:
the original generator writes its local outputs and may change ZIP container
timestamps even when the STL geometry is identical.
For the independent audit, use a Python environment containing numpy/trimesh:
`python RUN_AUDIT.py`. The original audit assumes it is at the Git repository
root; this small wrapper adds `git ls-tree --full-tree` for the new nested
location only. The original audit source is unchanged.

The current root R4 design is all-printed. Do not mix R3 and R4 fittings.
