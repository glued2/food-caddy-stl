import Module from 'manifold-3d';
import { zipSync, unzipSync, strToU8 } from 'fflate';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const checkOnly = process.argv.includes('--check');
const out = root;
const wasm = await Module();
wasm.setup();
const { Manifold: M, CrossSection: C } = wasm;
// Assembly coordinates: X left/right, Y rear positive, Z up; floor underside Z=0.
export const p = Object.freeze({
  width: 212, depth: 194, bottomWidth: 192, bottomDepth: 176,
  height: 205, chamfer: 35, offset: 2.5, minimumWall: 2.4, floor: 3,
  ledgeSpan: 230, assumedOpening: 224, bracketBelowWidth: 220,
  suspensionDrop: 16,
  get ledgeBottom() { return this.height+this.suspensionDrop; },
  get ledgeTop() { return this.ledgeBottom+3; },
  get bracketBottom() { return this.height-21; },
  lidThickness: 2.4,
  get lidWidth() { return this.width+2; },
  get lidDepth() { return this.depth+2; },
  get hingeY() { return this.depth/2+6; },
  get hingeZ() { return this.height+7; },
  hingeRadius: 5.5, hingeBore: 5.8,
  axleDiameter: 5, axleLength: 60, axleStartX: -25,
  fixedEarInnerX: 14, fixedEarOuterX: 24, movingHalfWidth: 12,
  mountBore: 4.6, countersinkDiameter: 8.6,
  printer: [220, 220, 250], bedMargin: 2, plateGap: 5,
  get frameZ() { return this.height-4; },
  frameThickness: 3, frameClearance: 0.5, shelfInset: 2,
});
const report = { revision: 'r3', parameters: p, tests: [], parts: {}, plates: {}, limitations: [
  'Analytical geometry only: actual host opening, taper and ledge fit are unmeasured.',
  'No physical fit, load rating, slicer/toolpath or long-term PLA creep validation.',
  'No printed load-bearing pins: specified metal fasteners are REQUIRED.',
] };
function ok(condition, message) { assert(condition, message); report.tests.push(message); }
const cube = (lo, hi) => M.cube(hi.map((v, i) => v - lo[i])).translate(lo);
const sum = (...s) => M.union(s.flat());
const cut = (s, ...tools) => M.difference([s, ...tools.flat()]);
const intersection = (a, b) => M.intersection([a, b]);
function polygon(w, d, c) {
  return [[w/2,d/2-c],[w/2-c,d/2],[-w/2+c,d/2],[-w/2,d/2-c],
    [-w/2,-d/2+c],[-w/2+c,-d/2],[w/2-c,-d/2],[w/2,-d/2+c]];
}
const dims = z => [p.bottomWidth+(p.width-p.bottomWidth)*z/p.height,
  p.bottomDepth+(p.depth-p.bottomDepth)*z/p.height];
function outline(z, inset=0) {
  const [w,d] = dims(z);
  return polygon(w-2*inset, d-2*inset, p.chamfer-(2-Math.SQRT2)*inset);
}
function loft(a, za, b, zb) {
  return M.hull([...a.map(v => [...v,za]), ...b.map(v => [...v,zb])]);
}
function prism(poly, bottom, height) { return new C([poly]).extrude(height).translate([0,0,bottom]); }
function cyl(radius, length, start, axis='z', topRadius=radius) {
  let s = M.cylinder(length, radius, topRadius, 96);
  if (axis === 'x') s = s.rotate([0,90,0]);
  if (axis === 'y') s = s.rotate([-90,0,0]);
  return s.translate(start);
}
// The roof adds a 45-degree apex to the round clearance core: support-free bin holes.
function teardrop(length, start, axis) {
  const r = p.mountBore/2;
  const profile = C.union([C.circle(r,96), new C([[[-r/Math.SQRT2,r/Math.SQRT2],
    [r/Math.SQRT2,r/Math.SQRT2],[0,r*Math.SQRT2]]])]);
  let s = profile.extrude(length);
  // Local profile Y is assembly Z.
  if (axis === 'x') s = s.rotate([90,0,90]);
  if (axis === 'y') s = s.rotate([90,0,180]);
  return s.translate(start);
}
function sideHoles() {
  return [-18,18].map(y => teardrop(p.ledgeSpan+10,[-p.ledgeSpan/2-5,y,p.height-13],'x'));
}
function rearHoles() {
  return [-20,20].map(x => teardrop(30,[x,p.depth/2-12,p.height-12],'y'));
}
const outer = loft(outline(0),0,outline(p.height),p.height);
const cavity = loft(outline(p.floor,p.offset),p.floor,
  outline(p.height+1,p.offset),p.height+1);
const shelf = cut(
  loft(outline(p.frameZ-3,p.offset-.2),p.frameZ-3,outline(p.frameZ,p.offset-.2),p.frameZ),
  loft(outline(p.frameZ-3,p.offset),p.frameZ-3,outline(p.frameZ,p.offset+p.shelfInset),p.frameZ));
const bin = cut(sum(cut(outer,cavity),shelf), sideHoles(),rearHoles());
const lidBoltY=p.hingeY-13, lidTop=p.height+p.lidThickness;
const lidHoles = [-7,7].map(x => cyl(p.mountBore/2,16,[x,lidBoltY,p.height-2]));
const lidSinks = [-7,7].map(x => cyl(p.countersinkDiameter/2,2,[x,lidBoltY,p.height],'z',p.mountBore/2));
const lid = cut(prism(polygon(p.lidWidth,p.lidDepth,p.chamfer),p.height,p.lidThickness),
  lidHoles,lidSinks,
  cube([p.width/2-.4,-31,p.height-1],[p.width/2+2,31,lidTop+1]),
  cube([-p.width/2-2,-31,p.height-1],[-p.width/2+.4,31,lidTop+1]),
  cube([p.fixedEarInnerX-1,p.depth/2-.5,p.height-1],[p.fixedEarOuterX+1,p.depth/2+2,lidTop+1]),
  cube([-p.fixedEarOuterX-1,p.depth/2-.5,p.height-1],[-p.fixedEarInnerX+1,p.depth/2+2,lidTop+1]));
const frameOuter = outline(p.frameZ,p.offset+p.frameClearance);
const frameInner = outline(p.frameZ,p.offset+p.frameClearance+4);
const frame = cut(prism(frameOuter,p.frameZ,p.frameThickness),
  prism(frameInner,p.frameZ-1,p.frameThickness+2));

// Each hanger's tapered mating face follows the body; the outward face is flat.
const xb = z => dims(z)[0]/2;
const hangerFace=p.bracketBelowWidth/2, hangerTip=p.ledgeSpan/2;
const hangerProfile = [[xb(p.bracketBottom),p.bracketBottom],[hangerFace,p.bracketBottom],
  [hangerFace,p.ledgeBottom],[hangerTip,p.ledgeBottom],[hangerTip,p.ledgeTop],
  [p.width/2,p.ledgeTop],[p.width/2,p.height]];
function xzExtrusion(profile,y0,length) {
  return new C([profile]).extrude(length).rotate([90,0,0]).translate([0,y0+length,0]);
}
const rightBlank = xzExtrusion(hangerProfile,-30,60);
const rightHanger = cut(rightBlank,
  [-18,18].map(y => cyl(p.mountBore/2,20,[hangerFace-10,y,p.height-13],'x')),
  [-18,18].map(y => cyl(p.mountBore/2,2,[hangerFace-2,y,p.height-13],'x',p.countersinkDiameter/2)));
// Rotation, not a reflection: handed bracket geometry has consistent winding.
const leftHanger = rightHanger.rotate([0,0,180]);

const yb = z => dims(z)[1]/2;
const railBottom=p.height-22, railTop=p.height-2, railFace=p.depth/2+4;
const railBase = M.hull([[-30,yb(railBottom),railBottom],[30,yb(railBottom),railBottom],
  [-30,railFace,railBottom],[30,railFace,railBottom],
  [-30,yb(railTop),railTop],[30,yb(railTop),railTop],[-30,railFace,railTop],[30,railFace,railTop]]);
const axleCut = cyl(p.hingeBore/2,80,[-40,p.hingeY,p.hingeZ],'x');
const earLength=p.fixedEarOuterX-p.fixedEarInnerX;
const ears = [-p.fixedEarOuterX,p.fixedEarInnerX].map(x => sum(
  M.hull([x,x+earLength].flatMap(xx => [[xx,p.depth/2,p.height-6],[xx,railFace,p.height-6],
    [xx,p.hingeY+p.hingeRadius,p.hingeZ-3],[xx,p.hingeY+p.hingeRadius,p.hingeZ],[xx,p.depth/2,p.hingeZ]])),
  cyl(p.hingeRadius,earLength,[x,p.hingeY,p.hingeZ],'x')));
const rail = cut(sum(railBase,ears),axleCut,
  [-20,20].map(x => cyl(p.mountBore/2,20,[x,railFace-11,p.height-12],'y')),
  [-20,20].map(x => cyl(p.mountBore/2,2,[x,railFace-2,p.height-12],'y',p.countersinkDiameter/2)));
const leaf = cut(sum(
  cube([-p.movingHalfWidth,p.hingeY-18,lidTop],[p.movingHalfWidth,p.hingeY,lidTop+4]),
  cyl(p.hingeRadius,2*p.movingHalfWidth,[-p.movingHalfWidth,p.hingeY,p.hingeZ],'x')),axleCut,lidHoles);

const wallCoupon = intersection(bin,cube([p.width/2-8,-32,p.height-22],[hangerFace,32,p.height]));
const rearCoupon = intersection(bin,cube([-32,p.depth/2-7,p.height-24],[32,p.depth/2+2,p.height]));
const lidCoupon = intersection(lid,cube([-15,lidBoltY-7,p.height-1],[15,lidBoltY+7,lidTop+1]));
// A split 230 mm gauge avoids placing a 230 mm part across a 220 mm bed.
const gaugeBlank = sum(cube([-hangerFace,-3,-18],[hangerFace,3,0]),
  cube([-hangerTip,-3,0],[hangerTip,3,3]));
const gaugeHoles = [-5,5].map(x => cyl(1.8,10,[x,-5,-8],'y'));
const gaugeLeft = cut(intersection(gaugeBlank,sum(
  cube([-hangerTip-1,-4,-19],[-10,4,4]),cube([-10,-3,-19],[10,0,4]))),gaugeHoles);
const gaugeRight = cut(intersection(gaugeBlank,sum(
  cube([10,-4,-19],[hangerTip+1,4,4]),cube([-10,0,-19],[10,3,4]))),gaugeHoles);
// Small actual top corner section, for comparison against the host chamfer.
const cornerCoupon = intersection(bin,cube([p.width/2-41,p.depth/2-41,p.height-7],[p.width/2+1,p.depth/2+1,p.height]));
const boreBlock = cut(cube([0,0,0],[36,12,6]),
  [p.hingeBore-.4,p.hingeBore,p.hingeBore+.4].map((d,i) => cyl(d/2,8,[6+i*12,6,-1])));

function onBed(s) {
  const {min,max}=s.boundingBox();
  return s.translate([-(min[0]+max[0])/2,-(min[1]+max[1])/2,-min[2]]);
}
const parts = {
  'bin': onBed(bin),
  'lid': onBed(lid),
  'liner-frame': onBed(frame),
  'hanger-left': onBed(leftHanger.rotate([90,0,0])),
  'hanger-right': onBed(rightHanger.rotate([90,0,0])),
  'hinge-rail': onBed(rail),
  'hinge-leaf': onBed(leaf.rotate([0,90,0])),
  'coupon-side-wall': onBed(wallCoupon),
  'coupon-rear-wall': onBed(rearCoupon),
  'coupon-lid': onBed(lidCoupon),
  'coupon-host-left': onBed(gaugeLeft.rotate([90,0,0])),
  'coupon-host-right': onBed(gaugeRight.rotate([-90,0,0])),
  'coupon-corner': onBed(cornerCoupon),
  'coupon-axle-bores': onBed(boreBlock),
};
const production = ['bin','lid','liner-frame','hanger-left','hanger-right','hinge-rail','hinge-leaf'];
// Plate coordinates are offsets from bed centre, not part-specific remeshed variants.
const layouts = {
  '01-bin': [['bin',0,0]],
  '02-lid': [['lid',0,0]],
  '03-liner-frame': [['liner-frame',0,0]],
  '04-hanging-rails': [['hanger-left',-50,0],['hanger-right',50,0]],
  '05-hinge': [['hinge-rail',-35,0],['hinge-leaf',35,0]],
  'test-01-host-gauge': [['coupon-host-left',0,-18],['coupon-host-right',0,18]],
  'test-02-mating': [['coupon-side-wall',-85,0],['coupon-rear-wall',0,-45],
    ['coupon-lid',0,0],['coupon-corner',65,-25],['coupon-axle-bores',0,40]],
};
function cross(a,b) { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
const sub = (a,b) => a.map((v,i)=>v-b[i]);
const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
function meshStats(s,name) {
  ok(s.status()==='NoError',`${name}: Manifold kernel NoError`);
  ok(s.decompose().length===1,`${name}: one connected physical solid`);
  const mesh=s.getMesh(), v=mesh.vertProperties, t=mesh.triVerts, stride=mesh.numProp;
  let signedVolume=0,bedArea=0;
  const edges = new Map();
  const vertex = i => Array.from(v.slice(i*stride,i*stride+3));
  const key = a => a.map(n=>Object.is(n,-0)?0:n).join(',');
  for(let i=0;i<t.length;i+=3) {
    const tri=[vertex(t[i]),vertex(t[i+1]),vertex(t[i+2])];
    assert(tri.flat().every(Number.isFinite),`${name}: finite triangle`);
    const n=cross(sub(tri[1],tri[0]),sub(tri[2],tri[0]));
    assert(Math.hypot(...n)>1e-9,`${name}: nondegenerate triangle`);
    signedVolume+=dot(tri[0],cross(tri[1],tri[2]))/6;
    if(tri.every(a=>Math.abs(a[2])<1e-5)) bedArea+=Math.hypot(...n)/2;
    for(let j=0;j<3;j++) {
      const a=key(tri[j]),b=key(tri[(j+1)%3]),k=a<b?`${a}|${b}`:`${b}|${a}`;
      const e=edges.get(k)??[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(k,e);
    }
  }
  ok([...edges.values()].every(([n,w])=>n===2 && w===0),`${name}: closed oppositely directed edges`);
  ok(signedVolume>0 && Math.abs(signedVolume-s.volume())<Math.max(.03,s.volume()*1e-5),
    `${name}: outward signed volume agrees with kernel`);
  ok(bedArea>35,`${name}: individual flat bed contact >35 square mm`);
  const {min,max}=s.boundingBox(), extent=max.map((n,i)=>n-min[i]);
  ok(min[2]>-1e-5 && extent.every((n,i)=>n <= p.printer[i]-(i<2?2*p.bedMargin:0)+1e-5),
    `${name}: printer dimensions with >=2 mm XY margin`);
  return { triangles:t.length/3, volumeMm3:s.volume(), approximatePLAgrams:s.volume()*1.24/1000,
    bedContactMm2:bedArea, bounds:{min,max}, extent };
}
for(const [name,solid] of Object.entries(parts)) report.parts[name]=meshStats(solid,name);
function supportFreeFaces(s) {
  const m=s.getMesh();
  for(let i=0;i<m.triVerts.length;i+=3) {
    const tri=[0,1,2].map(j=>Array.from(m.vertProperties.slice(m.triVerts[i+j]*m.numProp,m.triVerts[i+j]*m.numProp+3)));
    if(tri.every(v=>Math.abs(v[2])<1e-5)) continue;
    const n=cross(sub(tri[1],tri[0]),sub(tri[2],tri[0]));
    assert(n[2]/Math.hypot(...n)>=-Math.SQRT1_2-1e-4,'bin: no non-bed down-facing surface steeper than 45 degree printable limit');
  }
}
supportFreeFaces(parts.bin);
ok(true,'bin: every non-bed downward face satisfies 45 degree support-free surface criterion');
ok(report.parts.lid.bedContactMm2>35000,'lid: broad actual flat skin at print Z=0, not tiny hinge feet');
ok(report.parts.bin.bedContactMm2>28000,'bin: broad continuous floor bed contact');
ok(p.ledgeSpan===230 && p.bottomWidth<210 && p.height<230,'host: full ledge span 230, bottom <210, body height <230');
ok(p.bracketBelowWidth < p.assumedOpening,'host: bracket vertical faces below ledges < assumed 224 opening');
ok((p.ledgeSpan-p.assumedOpening)/2===3,'host: only 3 mm assumed bearing each side; real measurement REQUIRED');

// Polygon offset proof on every edge and sampled height; slope converts horizontal to true normal thickness.
let minNormal=Infinity;
for(let z=0;z<=p.height;z+=.5) {
  const a=outline(z), b=outline(z,p.offset), aNext=outline(z+1);
  for(let i=0;i<a.length;i++) {
    const j=(i+1)%a.length,e=sub(a[j],a[i]),len=Math.hypot(...e),n=[-e[1]/len,e[0]/len];
    const d=dot(sub(b[i],a[i]),n);
    assert(Math.abs(d-p.offset)<1e-9,'true polygon offset, including chamfers');
    const slope=dot(sub(aNext[i],a[i]),n);
    minNormal=Math.min(minNormal,d/Math.sqrt(1+slope*slope));
  }
}
report.minimumNormalWallMm=minNormal;
ok(minNormal>=p.minimumWall,'all eight tapered faces including chamfers: true normal wall >=2.4 mm');
const floorSlice=intersection(bin,cube([-120,-120,0],[120,120,p.floor-.01]));
ok(Math.abs(floorSlice.volume()-intersection(outer,cube([-120,-120,0],[120,120,p.floor-.01])).volume())<.01,
  'bin: unbroken 3 mm floor continuously joined to walls');
ok(Math.abs(intersection(frame,bin).volume())<1e-6,'liner frame: no bin collision, shelf contact at Z=201');
ok(p.frameZ+p.frameThickness<p.height,'liner frame: top Z=204 below seated lid Z=205');
const shelfContact=intersection(prism(frameOuter,p.frameZ-.1,.1),shelf).volume()/.1;
ok(shelfContact>500,'liner frame: >500 mm2 actual shelf bearing area');

const fixed={bin,frame,'hanger-left':leftHanger,'hanger-right':rightHanger,'hinge-rail':rail};
const moving={lid,'hinge-leaf':leaf};
function noOverlap(a,b,label,tol=1e-5) { ok(intersection(a,b).volume()<tol,label); }
const assembled={...fixed,...moving};
const entries=Object.entries(assembled);
for(let i=0;i<entries.length;i++) for(let j=i+1;j<entries.length;j++) {
  noOverlap(entries[i][1],entries[j][1],`assembly: ${entries[i][0]} / ${entries[j][0]} no solid collision`);
}
ok(lid.boundingBox().min[2]===p.height,'closed lid: underside seats at rim Z=205 (zero vertical float)');
const lidContact=intersection(lid.translate([0,0,-.01]),bin).volume()/.01;
ok(lidContact>1500,'closed lid: actual rim seating area >1500 mm2');
const fullBounds=sum(Object.values(assembled)).boundingBox();
report.printedAssemblyBounds=fullBounds;
ok(fullBounds.max[0]-fullBounds.min[0]===230 && fullBounds.max[2]<230 &&
  fullBounds.max[1]-fullBounds.min[1]<215,'assembly envelope: 230 wide, <215 deep, <230 tall');
function opened(s,deg) {
  return s.translate([0,-p.hingeY,-p.hingeZ]).rotate([-deg,0,0]).translate([0,p.hingeY,p.hingeZ]);
}
// Discrete sweep: the lid intentionally separates from rim contact at the start.
// No continuous-motion or physical-fit proof is claimed.
for(let deg=0;deg<=110;deg+=.1) {
  for(const [name,s] of Object.entries(moving)) {
    const rotated=opened(s,deg);
    for(const [other,t] of Object.entries(fixed))
      assert(intersection(rotated,t).volume()<1e-5,`opening collision at ${deg}: ${name}/${other}`);
  }
}
ok(true,'lid opening: CSG collision-free at 0.1 degree steps from closed to 110 degrees (not physical validation)');
ok(p.fixedEarInnerX-p.movingHalfWidth===2,'hinge: 2 mm axial gap on each side of moving leaf');
const metalAxle=cyl(p.axleDiameter/2,p.axleLength,[p.axleStartX,p.hingeY,p.hingeZ],'x');
for(const [name,s] of entries) noOverlap(metalAxle,s,`M5 axle: circular bore clears ${name}`);
ok(p.hingeBore-p.axleDiameter>=.8-1e-9,'hinge: full circular bore 5.8 mm / metal shaft 5.0 mm, 0.8 mm diametral clearance');
ok(p.hingeRadius-p.hingeBore/2>=2.4,'hinge: minimum radial barrel wall >=2.4 mm');
const nutEnd=p.fixedEarOuterX+1+5;
ok(p.axleStartX+p.axleLength-nutEnd>=2,'M5x60 axle: washer + 5 mm locknut + >=2 mm exposed thread');
report.axle={type:'M5 x 60 bolt, two 1 mm washers, 5 mm-envelope nyloc nut',
  shaftX:[p.axleStartX,p.axleStartX+p.axleLength],
  fixedBarrelX:[[-p.fixedEarOuterX,-p.fixedEarInnerX],[p.fixedEarInnerX,p.fixedEarOuterX]],
  movingBarrelX:[-p.movingHalfWidth,p.movingHalfWidth],
  washerX:[[-p.fixedEarOuterX-1,-p.fixedEarOuterX],[p.fixedEarOuterX,p.fixedEarOuterX+1]],
  nutX:[p.fixedEarOuterX+1,nutEnd], exposedThreadMm:p.axleStartX+p.axleLength-nutEnd,
  headEnvelopeX:[p.axleStartX-4,p.axleStartX], bore:p.hingeBore};
// Check fastener envelopes as well, rather than only nominal axis alignment.
const axleHead=cyl(4.8,4,[p.axleStartX-4,p.hingeY,p.hingeZ],'x');
const axleNut=cyl(4.7,5,[p.fixedEarOuterX+1,p.hingeY,p.hingeZ],'x');
const axleWashers=[-p.fixedEarOuterX-1,p.fixedEarOuterX].map(x=>cut(
  cyl(5,1,[x,p.hingeY,p.hingeZ],'x'),cyl(2.65,1,[x,p.hingeY,p.hingeZ],'x')));
for(const [name,s] of entries) {
  noOverlap(axleHead,s,`axle head envelope clears ${name}`);
  noOverlap(axleNut,s,`axle nut envelope clears ${name}`);
}
const sideMountZ=p.height-13, rearMountZ=p.height-12;
const sideWasherOuter=xb(sideMountZ)-p.offset-.25;
const sideMounts=[-18,18].map(y=>sum(
  cyl(2,14,[hangerFace-16,y,sideMountZ],'x'),cyl(2,2,[hangerFace-2,y,sideMountZ],'x',4),
  cut(cyl(4.5,1,[sideWasherOuter-1,y,sideMountZ],'x'),cyl(2.1,1,[sideWasherOuter-1,y,sideMountZ],'x')),
  cut(cyl(4.7,5,[sideWasherOuter-6,y,sideMountZ],'x'),cyl(2.1,5,[sideWasherOuter-6,y,sideMountZ],'x'))));
const rearWasherOuter=yb(rearMountZ)-p.offset-.25;
const rearMounts=[-20,20].map(x=>sum(
  cyl(2,14,[x,railFace-16,rearMountZ],'y'),cyl(2,2,[x,railFace-2,rearMountZ],'y',4),
  cut(cyl(4.5,1,[x,rearWasherOuter-1,rearMountZ],'y'),cyl(2.1,1,[x,rearWasherOuter-1,rearMountZ],'y')),
  cut(cyl(4.7,5,[x,rearWasherOuter-6,rearMountZ],'y'),cyl(2.1,5,[x,rearWasherOuter-6,rearMountZ],'y'))));
const lidMounts=[-7,7].map(x=>sum(
  cyl(4,2,[x,lidBoltY,p.height],'z',2),cyl(2,14,[x,lidBoltY,p.height+2]),
  cut(cyl(4.5,1,[x,lidBoltY,lidTop+4]),cyl(2.1,1,[x,lidBoltY,lidTop+4])),
  cut(cyl(4.7,5,[x,lidBoltY,lidTop+5]),cyl(2.1,5,[x,lidBoltY,lidTop+5]))));
const fixedHardware=sum(...sideMounts,...sideMounts.map(s=>s.rotate([0,0,180])),...rearMounts,
  axleHead,axleNut,...axleWashers);
const movingHardware=sum(lidMounts);
for(const [name,s] of entries) {
  noOverlap(fixedHardware,s,`M4 fixed mounting fastener envelopes clear ${name}`);
  noOverlap(movingHardware,s,`M4 lid mounting fastener envelopes clear ${name}`);
}
noOverlap(fixedHardware,movingHardware,'fixed and moving hardware do not collide when closed');
for(let deg=0;deg<=110;deg+=.5) {
  const swung=opened(movingHardware,deg);
  for(const s of Object.values(fixed)) assert(intersection(swung,s).volume()<1e-5,'moving hardware opening clearance');
  assert(intersection(swung,fixedHardware).volume()<1e-5,'hardware-to-hardware opening clearance');
  for(const s of Object.values(moving)) assert(intersection(opened(s,deg),fixedHardware).volume()<1e-5,
    `moving printed solid / fixed hardware opening clearance at ${deg}`);
}
ok(true,'hardware: moving lid screw/washer/nyloc envelopes clear fixed assembly in 0.5 degree sweep');
ok(sideWasherOuter-6-(hangerFace-16)>=2 && rearWasherOuter-6-(railFace-16)>=2 &&
  p.height+16-(lidTop+10)>=2,
  'all M4x16 joints: full 5 mm nut envelope engagement plus >=2 mm exposed shaft');
report.mountHardware={screws:'Eight M4 x 16 countersunk, head <=8 mm diameter / 90 degrees',
  washers:'Eight M4, 1 mm thick / <=9 mm diameter',nuts:'Eight M4 nyloc, <=5 mm thick / <=9.4 mm corner diameter',
  sideExposedThreadMm:sideWasherOuter-6-(hangerFace-16),
  rearExposedThreadMm:rearWasherOuter-6-(railFace-16),lidExposedThreadMm:p.height+16-(lidTop+10)};
report.assemblyBounds=sum(...Object.values(assembled),fixedHardware,movingHardware,metalAxle).boundingBox();
ok(report.assemblyBounds.max[2]<230,'full assembly INCLUDING projecting metal screw tips remains <230 mm tall');
report.internalLedgeInstallation={
  supportPlaneZ:p.ledgeBottom,bodyRimBelowSupportMm:p.suspensionDrop,
  closedHeightAboveSupportMm:report.assemblyBounds.max[2]-p.ledgeBottom,
  floorBelowSupportMm:p.ledgeBottom,
  closedBoundsRelativeToSupport:{
    min:report.assemblyBounds.min.map((v,i)=>i===2?v-p.ledgeBottom:v),
    max:report.assemblyBounds.max.map((v,i)=>i===2?v-p.ledgeBottom:v),
  },
  openingObstructionCheck:'Not measured: host end, adjacent bin, cabinet and drawer clearances are unknown.',
};
ok(report.internalLedgeInstallation.closedHeightAboveSupportMm<=3+1e-6,
  'inset installation: closed assembly protrudes no more than 3 mm above INTERNAL bearing ledge');
ok(report.internalLedgeInstallation.floorBelowSupportMm<230,
  'inset installation: floor less than 230 mm below INTERNAL bearing ledge');
const sweepBounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
for(let deg=0;deg<=110;deg+=.5) {
  for(const s of [...Object.values(moving),movingHardware]) {
    const b=opened(s,deg).boundingBox();
    for(let i=0;i<3;i++) {
      sweepBounds.min[i]=Math.min(sweepBounds.min[i],b.min[i]);
      sweepBounds.max[i]=Math.max(sweepBounds.max[i],b.max[i]);
    }
  }
}
report.internalLedgeInstallation.lidOpeningEnvelope={
  sampledStepDegrees:.5,
  maxHeightAboveSupportMm:sweepBounds.max[2]-p.ledgeBottom,
  rearReachBeyondClosedAssemblyMm:sweepBounds.max[1]-report.assemblyBounds.max[1],
  assemblyCoordinateBounds:sweepBounds,
  note:'CAD envelope only, add real clearance. Prefer hinge facing remaining recycling space, not tight against host end wall.',
};
noOverlap(gaugeLeft,gaugeRight,'split host gauge: lap faces meet without overlap');
const gaugeBounds=sum(gaugeLeft,gaugeRight).boundingBox();
ok(gaugeBounds.max[0]-gaugeBounds.min[0]===230,'bolted split gauge: assembled full width exactly 230 mm');

function stl(solids) {
  const meshes=solids.map(s=>s.getMesh()), count=meshes.reduce((n,m)=>n+m.triVerts.length/3,0);
  const b=Buffer.alloc(84+count*50);
  b.write('food-caddy-r3; manifold-3d CSG; millimetres');b.writeUInt32LE(count,80);
  let offset=84;
  for(const m of meshes) for(let i=0;i<m.triVerts.length;i+=3) {
    const tri=[0,1,2].map(j=>Array.from(m.vertProperties.slice(m.triVerts[i+j]*m.numProp,m.triVerts[i+j]*m.numProp+3)));
    const n=cross(sub(tri[1],tri[0]),sub(tri[2],tri[0])),l=Math.hypot(...n);
    for(const f of [...n.map(x=>x/l),...tri.flat()]) {b.writeFloatLE(f,offset);offset+=4;}
    offset+=2;
  }
  return b;
}
const files=new Map();
const put=(name,data)=>files.set(name,typeof data==='string'?Buffer.from(data):Buffer.from(data));
for(const [name,s] of Object.entries(parts)) put(`spares/r3-${name}.stl`,stl([s]));
for(const [plate,layout] of Object.entries(layouts)) {
  const items=layout.map(([name,x,y])=>({name,s:parts[name].translate([x,y,0])}));
  for(const {name,s} of items) {
    const b=s.boundingBox();
    ok(b.min[0]>=-108-1e-5 && b.max[0]<=108+1e-5 && b.min[1]>=-108-1e-5 && b.max[1]<=108+1e-5,
      `${plate}/${name}: centred plate has >=2 mm printer XY margin`);
    ok(Math.abs(s.volume()-parts[name].volume())<1e-5,`${plate}/${name}: canonical spare solid reused exactly`);
  }
  for(let i=0;i<items.length;i++) for(let j=i+1;j<items.length;j++) {
    const a=items[i].s.boundingBox(),b=items[j].s.boundingBox();
    const gap=Math.max(b.min[0]-a.max[0],a.min[0]-b.max[0],b.min[1]-a.max[1],a.min[1]-b.max[1]);
    ok(gap>=p.plateGap,`${plate}: ${items[i].name}/${items[j].name} bounding-box separation >=5 mm`);
    noOverlap(items[i].s,items[j].s,`${plate}: separate objects CSG intersection empty`);
  }
  const composed=M.compose(items.map(i=>i.s));
  ok(composed.decompose().length===items.length,`${plate}: one connected component per intended part`);
  put(`production/r3-${plate}.stl`,stl(items.map(i=>i.s)));
  report.plates[plate]={parts:layout,componentCount:items.length};
}
const instructions=fs.readFileSync(path.join(root,'docs','R3_GUIDE.md'));
put('docs/R3_GUIDE.md',instructions);
put('packages/r3-validation.json',JSON.stringify(report,null,2)+'\n');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest={
  revision:'r3', units:'mm', generation:'npm ci && npm run build; npm test',
  productionParts:production, hardwareRequired:true,
  packages:{
    full:'All seven production solids, all coupons, five production plates + two test plates, guide and validation.',
    noRails:'ACCESSORY-ONLY: liner-frame and hinge-leaf. EXCLUDES bin, lid, BOTH hanging ledges/rails, fixed rear hinge rail, coupons, and ALL metal hardware. ONLY for reusing identical R3 rails, NEVER legacy parts.',
  },
  files:[...files].map(([name,data])=>({name,bytes:data.length,sha256:sha(data)})),
};
put('packages/r3-manifest.json',JSON.stringify(manifest,null,2)+'\n');
function zipFor(names) {
  const entries={};
  for(const name of names) entries[`food-caddy-r3/${name}`]=new Uint8Array(files.get(name));
  return Buffer.from(zipSync(entries,{level:6}));
}
const fullNames=[...files.keys()];
const noRailNames=['spares/r3-liner-frame.stl','spares/r3-hinge-leaf.stl','docs/R3_GUIDE.md','packages/r3-manifest.json'];
const archives=new Map([
  ['packages/food-caddy-r3-FULL.zip',zipFor(fullNames)],
  ['packages/food-caddy-r3-accessories-NO-RAILS.zip',zipFor(noRailNames)],
]);
for(const [name,bytes] of archives) {
  const unpacked=unzipSync(bytes), names=name.includes('FULL')?fullNames:noRailNames;
  assert(Object.keys(unpacked).length===names.length,'archive entry count');
  for(const file of names) assert(Buffer.from(unpacked[`food-caddy-r3/${file}`]).equals(files.get(file)),
    `${name}/${file}: ZIP parity`);
}
if(checkOnly) {
  for(const [name,data] of files) assert(fs.readFileSync(path.join(out,name)).equals(data),`stale generated file: ${name}`);
  for(const [name,data] of archives) {
    // ZIP timestamps are not geometry; compare extracted entries, not archive container bytes.
    const live=unzipSync(fs.readFileSync(path.join(out,name))), expected=unzipSync(data);
    assert.deepEqual(Object.keys(live).sort(),Object.keys(expected).sort());
    for(const key of Object.keys(expected)) assert(Buffer.from(live[key]).equals(Buffer.from(expected[key])),`stale ZIP entry: ${key}`);
  }
} else {
  for(const [name,data] of [...files,...archives]) {
    const dest=path.join(out,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data);
  }
}
console.log(`${checkOnly?'VERIFIED':'GENERATED'} r3: ${Object.keys(parts).length} canonical parts; ${Object.keys(layouts).length} plates; ${report.tests.length} checks + 11,010 opening intersections; ZIP parity.`);
console.log(`Normal wall minimum ${minNormal.toFixed(4)} mm; including-hardware envelope ${JSON.stringify(report.assemblyBounds)}.`);
