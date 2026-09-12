"""Independent R4 STL/archive/fallback audit. No output writes or mesh repair."""
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parents[2]
manifest = json.loads((ROOT / "packages" / "r4-manifest.json").read_text())
report = json.loads((ROOT / "packages" / "r4-validation.json").read_text())


def checked(file, expected):
    raw = trimesh.load_mesh(file, file_type="stl", process=False)
    assert isinstance(raw, trimesh.Trimesh)
    assert np.isfinite(raw.triangles).all() and (raw.area_faces > 1e-9).all(), file
    mesh = raw.copy()
    # STL repeats coordinates per triangle. Weld only for topology inspection.
    mesh.merge_vertices(digits_vertex=7)
    assert len(mesh.faces) == len(raw.faces), "no faces removed"
    assert mesh.is_watertight and mesh.is_winding_consistent, file
    components = mesh.split(only_watertight=False)
    assert len(components) == expected, file
    for component in components:
        assert component.is_volume and component.volume > 0, file
        bed = np.all(np.abs(component.triangles[:, :, 2]) < 1e-5, axis=1)
        assert component.area_faces[bed].sum() > 30, f"{file}: individual bed contact"
        assert component.bounds[0, 2] >= -1e-5, file
    return raw, mesh


individual = {}
for name, stats in report["parts"].items():
    raw, mesh = checked(ROOT / "spares" / f"r4-{name}.stl", 1)
    assert abs(mesh.volume - stats["volumeMm3"]) < max(.1, mesh.volume * 1e-5), name
    assert np.allclose(mesh.extents, stats["extent"], atol=2e-5, rtol=0), name
    individual[name] = raw

for name, layout in report["plates"].items():
    raw, mesh = checked(ROOT / layout["path"], layout["componentCount"])
    assert (mesh.bounds[0, :2] >= -108.00001).all(), name
    assert (mesh.bounds[1, :2] <= 108.00001).all() and mesh.bounds[1, 2] <= 250, name
    start = 0
    for part, x, y in layout["parts"]:
        expected = individual[part].triangles
        actual = raw.triangles[start:start + len(expected)] - [x, y, 0]
        assert np.allclose(actual, expected, atol=2e-5, rtol=0), f"{name}/{part}: spare parity"
        start += len(expected)
    assert start == len(raw.faces), f"{name}: no extra shells"

counts = {}
for filename in manifest["printJobs"]:
    layout = next(v for v in report["plates"].values() if v["path"] == filename)
    for part, _, _ in layout["parts"]:
        counts[part] = counts.get(part, 0) + 1
assert counts == manifest["productionQuantities"], "production quantities exactly once"
assert len(manifest["printJobs"]) == 3
assert report["plates"]["test-fit-kit"]["componentCount"] == 9
assert {p[0] for p in report["plates"]["03-accessories-no-rails"]["parts"]} == {
    "liner-frame", "hinge-leaf", "bayonet-keeper", "rear-gate-keeper", "hinge-axle", "axle-lock-gate"
}
for name in individual:
    data = (ROOT / "spares" / f"r4-{name}.stl").read_bytes()
    original = subprocess.check_output([
        "git", "-C", str(ROOT), "show",
        f"5a6008d61f7a816cb92a9e0977931b034bc7628f:spares/r4-{name}.stl"
    ])
    assert data == original, f"plate consolidation changed canonical geometry: {name}"

for item in manifest["files"]:
    data = (ROOT / item["name"]).read_bytes()
    assert len(data) == item["bytes"], item["name"]
    assert hashlib.sha256(data).hexdigest() == item["sha256"], item["name"]

for archive in (ROOT / "packages").glob("*.zip"):
    assert "r4" in archive.name, f"unexpected current package: {archive}"
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        for name in z.namelist():
            rel = Path(name).relative_to("food-caddy-r4")
            assert z.read(name) == (ROOT / rel).read_bytes(), f"{archive}/{name}"

legacy = json.loads((ROOT / "archive" / "legacy-manifest.json").read_text())
for item in legacy["files"]:
    data = (ROOT / item["archivedPath"]).read_bytes()
    assert len(data) == item["bytes"] and hashlib.sha256(data).hexdigest() == item["sha256"]

fallback = ROOT / "metal-screws-required"
preserved = json.loads((fallback / "PRESERVATION.json").read_text())
tracked = subprocess.check_output([
    "git", "-C", str(ROOT), "ls-tree", "--full-tree", "-r", "--name-only",
    preserved["commit"]
], text=True).splitlines()
assert {item["path"] for item in preserved["files"]} == set(tracked), "complete R3 snapshot"
for item in preserved["files"]:
    name = item["path"]
    data = (fallback / name).read_bytes()
    assert len(data) == item["bytes"], name
    assert hashlib.sha256(data).hexdigest() == item["sha256"], f"R3 changed: {name}"
    blob = subprocess.check_output(["git", "-C", str(ROOT), "show", f"{preserved['commit']}:{name}"])
    if name.lower().endswith((".stl", ".zip")):
        assert data == blob, f"R3 binary baseline parity: {name}"
    else:
        assert data.replace(b"\r\n", b"\n") == blob.replace(b"\r\n", b"\n"), name
    if name.startswith("archive/legacy"):
        assert (ROOT / name).read_bytes() == data, f"historical archive changed: {name}"

assert manifest["purchasedHardwareRequired"] is False
assert manifest["structuralGlueRequired"] is False
print(f"PASS R4 independent audit: {len(individual)} individuals + "
      f"{len(report['plates'])} plates; closed outward topology/volume, per-part "
      "bed contact, exact translated triangles, manifest/ZIP parity; "
      f"{len(legacy['files'])} legacy assets and {len(preserved['files'])} "
      "R3 fallback files preserved byte-for-byte.")
