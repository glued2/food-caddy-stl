const fs = require("fs");
const path = require("path");

const OUT = __dirname;

function normal(a, b, c) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const length = Math.hypot(nx, ny, nz) || 1;
  return [nx / length, ny / length, nz / length];
}

function tri(mesh, a, b, c) {
  mesh.push([a, b, c]);
}

function quad(mesh, a, b, c, d) {
  tri(mesh, a, b, c);
  tri(mesh, a, c, d);
}

function chamferRect(width, depth, chamfer) {
  const w = width / 2, d = depth / 2;
  const c = Math.min(chamfer, width / 2 - 0.1, depth / 2 - 0.1);
  return [
    [-w + c, -d], [w - c, -d], [w, -d + c], [w, d - c],
    [w - c, d], [-w + c, d], [-w, d - c], [-w, -d + c],
  ];
}

function polyAt(poly, z) {
  return poly.map(([x, y]) => [x, y, z]);
}

function fan(mesh, verts, reverse = false) {
  const center = [
    verts.reduce((sum, v) => sum + v[0], 0) / verts.length,
    verts.reduce((sum, v) => sum + v[1], 0) / verts.length,
    verts.reduce((sum, v) => sum + v[2], 0) / verts.length,
  ];
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i], b = verts[(i + 1) % verts.length];
    reverse ? tri(mesh, center, b, a) : tri(mesh, center, a, b);
  }
}

function prism(mesh, bottomPoly, topPoly, z0, z1, capBottom = true, capTop = true) {
  const bottom = polyAt(bottomPoly, z0), top = polyAt(topPoly, z1);
  const n = bottom.length;
  for (let i = 0; i < n; i++) {
    quad(mesh, bottom[i], bottom[(i + 1) % n], top[(i + 1) % n], top[i]);
  }
  if (capBottom) fan(mesh, bottom, true);
  if (capTop) fan(mesh, top, false);
}

function taperedOpenBucket(mesh, outerBottomPoly, outerTopPoly, innerBottomPoly, innerTopPoly, z0, floorZ, z1) {
  const outerBottom = polyAt(outerBottomPoly, z0);
  const outerTop = polyAt(outerTopPoly, z1);
  const innerFloor = polyAt(innerBottomPoly, floorZ);
  const innerTop = polyAt(innerTopPoly, z1);
  const n = outerBottom.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    quad(mesh, outerBottom[i], outerBottom[j], outerTop[j], outerTop[i]);
    quad(mesh, innerFloor[j], innerFloor[i], innerTop[i], innerTop[j]);
  }

  fan(mesh, outerBottom, true);
  fan(mesh, innerFloor, false);
}

function ringSlab(mesh, outerPoly, innerPoly, z0, z1) {
  const outer0 = polyAt(outerPoly, z0), outer1 = polyAt(outerPoly, z1);
  const inner0 = polyAt(innerPoly, z0), inner1 = polyAt(innerPoly, z1);
  for (let i = 0; i < outerPoly.length; i++) {
    const j = (i + 1) % outerPoly.length;
    quad(mesh, outer0[i], outer0[j], outer1[j], outer1[i]);
    quad(mesh, inner0[j], inner0[i], inner1[i], inner1[j]);
    quad(mesh, outer1[i], outer1[j], inner1[j], inner1[i]);
    quad(mesh, outer0[j], outer0[i], inner0[i], inner0[j]);
  }
}

function taperedRing(mesh, outerLowPoly, outerHighPoly, innerLowPoly, innerHighPoly, z0, z1) {
  const outerLow = polyAt(outerLowPoly, z0), outerHigh = polyAt(outerHighPoly, z1);
  const innerLow = polyAt(innerLowPoly, z0), innerHigh = polyAt(innerHighPoly, z1);
  for (let i = 0; i < outerLow.length; i++) {
    const j = (i + 1) % outerLow.length;
    quad(mesh, outerLow[i], outerLow[j], outerHigh[j], outerHigh[i]);
    quad(mesh, innerLow[j], innerLow[i], innerHigh[i], innerHigh[j]);
    quad(mesh, outerHigh[i], outerHigh[j], innerHigh[j], innerHigh[i]);
  }
}

function cylinderX(mesh, x0, x1, y, z, radius, segments = 24) {
  const left = [], right = [];
  for (let i = 0; i < segments; i++) {
    const a = 2 * Math.PI * i / segments;
    const cy = y + radius * Math.cos(a), cz = z + radius * Math.sin(a);
    left.push([x0, cy, cz]);
    right.push([x1, cy, cz]);
  }
  for (let i = 0; i < segments; i++) {
    const j = (i + 1) % segments;
    quad(mesh, left[i], right[i], right[j], left[j]);
  }
  const lc = [x0, y, z], rc = [x1, y, z];
  for (let i = 0; i < segments; i++) {
    const j = (i + 1) % segments;
    tri(mesh, lc, left[j], left[i]);
    tri(mesh, rc, right[i], right[j]);
  }
}

function tubeX(mesh, x0, x1, y, z, outerRadius, innerRadius, segments = 32) {
  const lo = [], ro = [], li = [], ri = [];
  for (let i = 0; i < segments; i++) {
    const a = 2 * Math.PI * i / segments;
    const co = Math.cos(a), si = Math.sin(a);
    lo.push([x0, y + outerRadius * co, z + outerRadius * si]);
    ro.push([x1, y + outerRadius * co, z + outerRadius * si]);
    li.push([x0, y + innerRadius * co, z + innerRadius * si]);
    ri.push([x1, y + innerRadius * co, z + innerRadius * si]);
  }
  for (let i = 0; i < segments; i++) {
    const j = (i + 1) % segments;
    quad(mesh, lo[i], ro[i], ro[j], lo[j]);
    quad(mesh, li[j], ri[j], ri[i], li[i]);
    quad(mesh, lo[j], lo[i], li[i], li[j]);
    quad(mesh, ro[i], ro[j], ri[j], ri[i]);
  }
}

function teardropSection(y, z, radius, pointHeight = radius * 1.2, segments = 14) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = Math.PI + Math.PI * i / segments;
    pts.push([y + radius * Math.cos(a), z + radius * Math.sin(a)]);
  }
  pts.push([y + radius, z + radius * 0.3]);
  pts.push([y, z + pointHeight]);
  pts.push([y - radius, z + radius * 0.3]);
  return pts;
}

function tubeXPoly(mesh, x0, x1, outerSection, innerSection) {
  const lo = outerSection.map(([y, z]) => [x0, y, z]);
  const ro = outerSection.map(([y, z]) => [x1, y, z]);
  const li = innerSection.map(([y, z]) => [x0, y, z]);
  const ri = innerSection.map(([y, z]) => [x1, y, z]);
  for (let i = 0; i < outerSection.length; i++) {
    const j = (i + 1) % outerSection.length;
    quad(mesh, lo[i], ro[i], ro[j], lo[j]);
  }
  for (let i = 0; i < innerSection.length; i++) {
    const j = (i + 1) % innerSection.length;
    quad(mesh, li[j], ri[j], ri[i], li[i]);
  }
  const pairs = Math.min(outerSection.length, innerSection.length);
  for (let i = 0; i < pairs; i++) {
    const j = (i + 1) % pairs;
    quad(mesh, lo[j], lo[i], li[i], li[j]);
    quad(mesh, ro[i], ro[j], ri[j], ri[i]);
  }
}

function box(mesh, x0, x1, y0, y1, z0, z1) {
  const p = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
  ];
  [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]
    .forEach(([a, b, c, d]) => quad(mesh, p[a], p[b], p[c], p[d]));
}

function extrudeY(mesh, xzPoly, y0, y1) {
  const front = xzPoly.map(([x, z]) => [x, y0, z]);
  const back = xzPoly.map(([x, z]) => [x, y1, z]);
  for (let i = 0; i < xzPoly.length; i++) {
    const j = (i + 1) % xzPoly.length;
    quad(mesh, front[i], front[j], back[j], back[i]);
  }
  fan(mesh, front, true);
  fan(mesh, back, false);
}

function writeStl(filename, name, mesh) {
  let out = `solid ${name}\n`;
  for (const [a, b, c] of mesh) {
    const [nx, ny, nz] = normal(a, b, c);
    out += `  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}\n`;
    out += "    outer loop\n";
    for (const v of [a, b, c]) {
      out += `      vertex ${v[0].toFixed(3)} ${v[1].toFixed(3)} ${v[2].toFixed(3)}\n`;
    }
    out += "    endloop\n  endfacet\n";
  }
  out += `endsolid ${name}\n`;
  fs.writeFileSync(path.join(OUT, filename), out, "ascii");
}

function bounds(mesh) {
  const pts = mesh.flat();
  return [0, 1, 2].map((axis) => [
    Math.min(...pts.map((p) => p[axis])),
    Math.max(...pts.map((p) => p[axis])),
  ]);
}

function bedCenterMesh(mesh, bed = 220) {
  const b = bounds(mesh);
  return transformMesh(mesh, {
    x: bed / 2 - (b[0][0] + b[0][1]) / 2,
    y: bed / 2 - (b[1][0] + b[1][1]) / 2,
    z: -b[2][0],
  });
}

function onBed(mesh) {
  const b = bounds(mesh);
  return transformMesh(mesh, { z: -b[2][0] });
}

function flipForPrint(mesh) {
  const b = bounds(mesh);
  const midZ = (b[2][0] + b[2][1]) / 2;
  return mesh.map((face) => face.map(([x, y, z]) => [x, y, 2 * midZ - z]));
}

function transformMesh(mesh, { x = 0, y = 0, z = 0, rotate = 0, rotateY = 0 } = {}) {
  const c = Math.cos(rotate), s = Math.sin(rotate);
  const cy = Math.cos(rotateY), sy = Math.sin(rotateY);
  return mesh.map((face) => face.map(([px, py, pz]) => [
    (px * cy + pz * sy) * c - py * s + x,
    (px * cy + pz * sy) * s + py * c + y,
    -px * sy + pz * cy + z,
  ]));
}

function mergeMeshes(...meshes) {
  return meshes.flat();
}

function makeBody({
  flangeWidth = 230.0,
  flangeDepth = 188.0,
  outerTopWidth = 218.0,
} = {}) {
  const mesh = [];
  const bodyH = 200.0;
  const rimH = 8.0;
  const wall = 1.25;
  const outerTop = chamferRect(outerTopWidth, 172.0, 28.0);
  const outerBottom = chamferRect(208.0, 148.0, 24.0);
  const innerTop = chamferRect(outerTopWidth - 2 * wall, 172.0 - 2 * wall, 25.5);
  const innerBottom = chamferRect(208.0 - 2 * wall, 148.0 - 2 * wall, 21.5);
  const flangeOuter = chamferRect(flangeWidth, flangeDepth, 30.0);
  const flangeInner = chamferRect(flangeWidth - 10.0, flangeDepth - 10.0, 26.0);

  taperedOpenBucket(mesh, outerBottom, outerTop, innerBottom, innerTop, 0.0, 2.2, bodyH);
  taperedRing(mesh, outerTop, flangeOuter, innerTop, flangeInner, bodyH, bodyH + rimH);
  return mesh;
}

function makeLid({ width = 226.0 } = {}) {
  const mesh = [];
  const lidOuter = chamferRect(width - 8.0, 172.0, 26.0);
  const lidRibInner = chamferRect(width - 20.0, 160.0, 20.0);
  prism(mesh, lidOuter, lidOuter, 0.0, 0.8);
  ringSlab(mesh, lidOuter, lidRibInner, 0.8, 1.8);

  const backY = 86.5;
  // Rear spine: wide base pad bonded to the full lid thickness (z starts at 0,
  // not partway up) so the spine cannot shear off the thin lid skin the way
  // the first-print retainer tabs did.
  box(mesh, -66, 66, 77.0, 93.0, 0.0, 1.2);
  box(mesh, -58, 58, 80.0, 91.0, 0.0, 3.0);
  // Knuckle centre is raised so its round profile never dips below z=0 (was
  // 4.5, radius 4.8, which put part of the tube at z=-0.3: below the bed. That
  // forced onBed() to lift the ENTIRE lid 0.3 mm off the bed, causing bad
  // first layers on the actual test print.
  tubeX(mesh, -50, 50, backY, 5.3, 4.8, 1.9, 32);
  box(mesh, -54, 54, backY - 4, backY + 2, 0.0, 2.8);
  // Front seating tab: wider base pad plus the original tab on top, for the
  // same reason - more bonded area at the base reduces peel risk.
  box(mesh, -34, 34, -172.0 / 2 - 9, -172.0 / 2 + 1, 0.0, 1.2);
  box(mesh, -26, 26, -172.0 / 2 - 8, -172.0 / 2, 0.0, 4.0);
  return mesh;
}

function makeRearHingeRail() {
  const mesh = [];
  // Clip-on U-channel: this wraps over the rear top rim of the bin.
  // Print separately, then slide/press it over the back rim before fitting the lid.
  box(mesh, -98, 98, -6, 8, 10, 14);   // top bridge over rim
  box(mesh, -98, 98, -6, -2, 0, 14);   // inside wall
  box(mesh, -98, 98, 4, 8, 0, 14);     // outside wall

  // Small inward barbs grip below the rim; sand these if the fit is too tight.
  box(mesh, -88, 88, -2.0, 0.2, 0, 3);
  box(mesh, -88, 88, 1.8, 4.0, 0, 3);

  // Outer hinge knuckles on the back of the clip-on rail.
  box(mesh, -104, -58, 7, 15, 10, 18);
  box(mesh, 58, 104, 7, 15, 10, 18);
  tubeX(mesh, -100, -62, 11, 19.5, 4.8, 1.9, 32);
  tubeX(mesh, 62, 100, 11, 19.5, 4.8, 1.9, 32);
  return mesh;
}

function makeBagRetainer() {
  const mesh = [];
  const outer = chamferRect(198.0, 158.0, 21.0);
  const inner = chamferRect(184.0, 144.0, 18.0);
  const thickness = 2.8;
  ringSlab(mesh, outer, inner, 0.0, thickness);

  // Keep the bag-grip tabs flush with the ring to avoid a weak raised transition.
  box(mesh, -30, 30, -158.0 / 2 - 3, -158.0 / 2 + 4, 0.0, thickness);
  box(mesh, -30, 30, 158.0 / 2 - 4, 158.0 / 2 + 3, 0.0, thickness);
  box(mesh, -198.0 / 2 - 3, -198.0 / 2 + 4, -20, 20, 0.0, thickness);
  box(mesh, 198.0 / 2 - 4, 198.0 / 2 + 3, -20, 20, 0.0, thickness);
  return mesh;
}

function makeHingePin({ length = 224 } = {}) {
  const mesh = [];
  cylinderX(mesh, -length / 2, length / 2, 0, 1.45, 1.45, 24);
  box(mesh, -length / 2 - 5, -length / 2, -3.5, 3.5, 0, 2.9);
  return mesh;
}

function makeHingeRetainerCollar() {
  const mesh = [];
  tubeX(mesh, -4, 4, 0, 3.8, 3.8, 1.45, 32);
  return mesh;
}

function makeHingeRetainerCollarStanding() {
  // Stand the circular collar on its face so the pin bore prints vertically.
  return onBed(transformMesh(makeHingeRetainerCollar(), { rotateY: Math.PI / 2 }));
}

function makeHangerEar(side = 1) {
  const mesh = [];
  const y0 = -50;
  const y1 = 50;
  const x = (a) => side * a;

  // Taper-matched hanger ear. The tapered guide follows the 8 mm rim flare:
  // about 2 mm of outward movement from lower rim to upper rim.
  box(mesh, Math.min(x(-2), x(17)), Math.max(x(-2), x(17)), y0, y1, 8.6, 12.0);
  box(mesh, Math.min(x(14), x(17)), Math.max(x(14), x(17)), y0, y1, 0.0, 12.0);
  box(mesh, Math.min(x(-1), x(4)), Math.max(x(-1), x(4)), y0, y1, -3.0, 0.7);
  extrudeY(
    mesh,
    side > 0
      ? [[-0.8, 0.7], [1.2, 8.6], [3.5, 8.6], [1.5, 0.7]]
      : [[0.8, 0.7], [-1.2, 8.6], [-3.5, 8.6], [-1.5, 0.7]],
    y0,
    y1
  );
  return mesh;
}

function makeK1seHangerEarsPlate() {
  return mergeMeshes(
    transformMesh(makeHangerEar(-1), { x: -18, y: 0 }),
    transformMesh(makeHangerEar(1), { x: 18, y: 0 })
  );
}

function makeK1seAccessoryPlate() {
  return mergeMeshes(
    makeBagRetainer(),
    transformMesh(onBed(flipForPrint(makeK1seHangerEarsPlate())), { x: 0, y: 0 }),
    transformMesh(onBed(makeRearHingeRail()), { x: 0, y: 94 }),
    transformMesh(onBed(makeHingePin({ length: 206 })), { x: 0, y: -94 }),
    transformMesh(makeHingeRetainerCollarStanding(), { x: 76, y: 0 })
  );
}

function makeK1seAccessoryNoRailsPlate() {
  return mergeMeshes(
    makeBagRetainer(),
    transformMesh(onBed(flipForPrint(makeK1seHangerEarsPlate())), { x: 0, y: 0 }),
    transformMesh(onBed(makeHingePin({ length: 206 })), { x: 0, y: -94 }),
    transformMesh(makeHingeRetainerCollarStanding(), { x: 76, y: 0 })
  );
}

function makeK1seLinerHangerPlate() {
  return mergeMeshes(
    makeBagRetainer(),
    transformMesh(onBed(flipForPrint(makeK1seHangerEarsPlate())), { x: 0, y: 0 }),
    transformMesh(makeHingeRetainerCollarStanding(), { x: 76, y: 0 })
  );
}

function makeK1seFailedPartsOnlyPlate() {
  return mergeMeshes(
    makeBagRetainer(),
    transformMesh(makeHingeRetainerCollarStanding(), { x: 76, y: 0 })
  );
}

function makeK1seHingeKitPlate() {
  return mergeMeshes(
    transformMesh(onBed(makeRearHingeRail()), { x: 0, y: 35 }),
    transformMesh(onBed(makeHingePin({ length: 206 })), { x: 0, y: -35 })
  );
}

const parts = {
  "food_caddy_k1se_body_216mm.stl": makeBody({
    flangeWidth: 216.0,
    flangeDepth: 180.0,
    outerTopWidth: 212.0,
  }),
  "food_caddy_k1se_flip_lid_216mm.stl": onBed(makeLid({ width: 216.0 })),
  "food_caddy_k1se_liner_hanger_plate.stl": makeK1seLinerHangerPlate(),
  "food_caddy_k1se_hinge_kit_plate.stl": makeK1seHingeKitPlate(),
  "food_caddy_k1se_accessories_everything.stl": makeK1seAccessoryPlate(),
  "food_caddy_k1se_accessories_no_rails.stl": makeK1seAccessoryNoRailsPlate(),
  "food_caddy_k1se_failed_parts_only.stl": makeK1seFailedPartsOnlyPlate(),
  "food_caddy_k1se_bag_retainer_ring_spare.stl": makeBagRetainer(),
  "food_caddy_k1se_hinge_pin_spare.stl": onBed(makeHingePin({ length: 212 })),
  "food_caddy_k1se_hinge_retainer_collar_spare.stl": makeHingeRetainerCollarStanding(),
};

for (const [filename, mesh] of Object.entries(parts)) {
  writeStl(filename, filename.replace(/\.stl$/, ""), mesh);
  if (filename.includes("_body_216mm") || filename.includes("_flip_lid_216mm") || filename.includes("_liner_hanger_plate") || filename.includes("_hinge_kit_plate") || filename.includes("_accessories_")) {
    const centeredName = filename.replace(".stl", "_bed_centered.stl");
    writeStl(centeredName, centeredName.replace(/\.stl$/, ""), bedCenterMesh(mesh));
  }
  console.log(`${filename}: ${mesh.length} triangles`);
}
