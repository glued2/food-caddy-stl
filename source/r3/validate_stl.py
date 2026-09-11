"""Independent exported-STL checks. No mesh repairs or output writes."""
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT
manifest = json.loads((OUT / "packages" / "r3-manifest.json").read_text())
report = json.loads((OUT / "packages" / "r3-validation.json").read_text())


def load_checked(file, expected_components):
    raw = trimesh.load_mesh(file, file_type="stl", process=False)
    assert isinstance(raw, trimesh.Trimesh), file
    assert np.isfinite(raw.triangles).all(), f"{file}: finite"
    assert (raw.area_faces > 1e-9).all(), f"{file}: nondegenerate"
    mesh = raw.copy()
    # STL repeats its vertices for every triangle. Weld coordinate duplicates
    # for topology only; do not repair, fill, reorient or discard any triangles.
    mesh.merge_vertices(digits_vertex=7)
    assert len(mesh.faces) == len(raw.faces), f"{file}: no face removal"
    assert mesh.is_watertight, f"{file}: watertight"
    assert mesh.is_winding_consistent, f"{file}: winding"
    components = mesh.split(only_watertight=False)
    assert len(components) == expected_components, f"{file}: physical component count"
    for component in components:
        assert component.is_volume and component.volume > 0, f"{file}: outward volume"
        on_bed = np.all(np.abs(component.triangles[:, :, 2]) < 1e-5, axis=1)
        assert component.area_faces[on_bed].sum() > 35, f"{file}: individual bed area"
        assert component.bounds[0, 2] >= -1e-5, f"{file}: Z minimum"
    return raw, mesh


individuals = {}
for name, dimensions in report["parts"].items():
    raw, mesh = load_checked(OUT / "spares" / f"r3-{name}.stl", 1)
    assert abs(mesh.volume - dimensions["volumeMm3"]) < max(.1, mesh.volume * 1e-5), name
    assert np.allclose(mesh.extents, dimensions["extent"], atol=2e-5, rtol=0), name
    individuals[name] = raw

for plate, layout in report["plates"].items():
    raw, mesh = load_checked(
        OUT / "production" / f"r3-{plate}.stl", layout["componentCount"]
    )
    assert (mesh.bounds[0, :2] >= -108.00001).all(), plate
    assert (mesh.bounds[1, :2] <= 108.00001).all(), plate
    assert mesh.bounds[1, 2] <= 250, plate
    start = 0
    for name, x, y in layout["parts"]:
        expected = individuals[name].triangles
        actual = raw.triangles[start:start + len(expected)] - [x, y, 0]
        # Same triangle sequence, with only the manifest's translation and
        # binary-STL float32 quantization permitted.
        assert np.allclose(actual, expected, atol=2e-5, rtol=0), f"{plate}/{name}: spare parity"
        start += len(expected)
    assert start == len(raw.faces), f"{plate}: no extra shells"

for item in manifest["files"]:
    data = (OUT / item["name"]).read_bytes()
    assert len(data) == item["bytes"], item["name"]
    assert hashlib.sha256(data).hexdigest() == item["sha256"], item["name"]

for archive in (OUT / "packages").glob("*.zip"):
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None, archive
        for member in z.namelist():
            relative = Path(member).relative_to("food-caddy-r3")
            assert z.read(member) == (OUT / relative).read_bytes(), f"{archive}/{member}: parity"

# Preserve the immutable pre-R3 baseline after the user-authorized archive move.
legacy_manifest = json.loads((ROOT / "archive" / "legacy-manifest.json").read_text())
tracked = subprocess.check_output(
    ["git", "-C", str(ROOT), "ls-tree", "-r", "--name-only",
     legacy_manifest["legacyCommit"]], text=True
).splitlines()
legacy = legacy_manifest["files"]
assert {item["originalPath"] for item in legacy} == set(tracked), "all original files archived"
for item in legacy:
    name = item["originalPath"]
    archived = (ROOT / item["archivedPath"]).read_bytes()
    assert len(archived) == item["bytes"], name
    assert hashlib.sha256(archived).hexdigest() == item["sha256"], name
    original = subprocess.check_output(
        ["git", "-C", str(ROOT), "show", f"{legacy_manifest['legacyCommit']}:{name}"])
    if name.startswith("source/"):
        # The original Windows checkout used CRLF; preserve its original bytes
        # while comparing normalized content to the immutable Git blob.
        assert archived.replace(b"\r\n", b"\n") == original.replace(b"\r\n", b"\n"), name
    else:
        assert archived == original, f"legacy blob changed: {name}"
    if name != "README.md":
        assert not (ROOT / name).exists(), f"legacy asset still in current layout: {name}"

print(f"PASS independent STL audit: {len(individuals)} individuals, "
      f"{len(report['plates'])} plates; topology, winding, positive volumes, bed "
      "contact per component, exact translated triangle/spare parity, "
      f"manifest and ZIP parity; all {len(legacy)} original assets archived "
      "with verified preservation hashes and immutable Git-baseline parity.")
