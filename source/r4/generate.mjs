import Module from 'manifold-3d';
import { zipSync, unzipSync } from 'fflate';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const checkOnly=process.argv.includes('--check');
const wasm=await Module(); wasm.setup();
const {Manifold:M,CrossSection:C}=wasm;
const p=Object.freeze({
  width:204,depth:190,bottomWidth:190,bottomDepth:174,height:200,
  chamfer:35,offset:2.5,minWall:2.4,floor:3,span:230,assumedOpening:224,
  suspensionDrop:16,ledgeThickness:3,sideLength:52,fit:.35,
  jointRootInset:2,jointNeckOut:1,jointCapOut:4,jointOuterOut:8,
  jointBottom:164,jointTop:198,jointSlope:1.3,jointPinZ:186,
  bracketBottom:160,lidThickness:2.4,frameThickness:3,
  keeperDiameter:6,keeperBore:6.8,keeperHeadR:6,keeperHeadDepth:2.2,
  hingeY:105,hingeZ:209,hingeRadius:9.5,hingeBore:9,axleDiameter:8,
  fixedEarInner:20,fixedEarOuter:34,movingHalf:18,
  lidTrackY:82,lidTrackHalfLength:15,lidTrackHeight:4,leafTop:211.2,
  openingDegrees:110,printer:[220,220,250],margin:2,plateGap:5,
});
const support=p.height+p.suspensionDrop, ledgeTop=support+p.ledgeThickness;
const lidTop=p.height+p.lidThickness,frameZ=p.height-4;
const report={revision:'r4-all-printed',parameters:p,tests:[],parts:{},plates:{},assemblyPaths:{},
  intentionalContacts:[],limitations:[
    'No purchased hardware or structural glue. All keepers and the axle are printed.',
    'Actual host opening, internal ledge step, taper and cabinet clearances are unmeasured.',
    'No load rating, physical print/fit validation, slicer validation or PLA creep-life claim.',
    'Discrete CAD trajectories are not a formal continuous-motion proof.',
  ]};
function ok(c,message){assert(c,message);report.tests.push(message);}
const sum=(...s)=>M.union(s.flat()),cut=(s,...tools)=>M.difference([s,...tools.flat()]);
const intersect=(a,b)=>M.intersection([a,b]);
const box=(a,b)=>M.cube(b.map((v,i)=>v-a[i])).translate(a);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const dims=z=>[p.bottomWidth+(p.width-p.bottomWidth)*z/p.height,
  p.bottomDepth+(p.depth-p.bottomDepth)*z/p.height];
function polygon(w,d,c){return [[w/2,d/2-c],[w/2-c,d/2],[-w/2+c,d/2],[-w/2,d/2-c],
  [-w/2,-d/2+c],[-w/2+c,-d/2],[w/2-c,-d/2],[w/2,-d/2+c]];}
function outline(z,inset=0){const[w,d]=dims(z);return polygon(w-2*inset,d-2*inset,p.chamfer-(2-Math.SQRT2)*inset);}
const loft=(a,za,b,zb)=>M.hull([...a.map(v=>[...v,za]),...b.map(v=>[...v,zb])]);
const prism=(poly,z,h)=>new C([poly]).extrude(h).translate([0,0,z]);
function cylinder(r,h,at,axis='z',rt=r){
  let s=M.cylinder(h,r,rt,96);
  if(axis==='x')s=s.rotate([0,90,0]);
  if(axis==='y')s=s.rotate([-90,0,0]);
  return s.translate(at);
}
// Profile local X/Y becomes assembly Y/Z; extrusion becomes assembly X.
const alongX=(section,x,length)=>section.extrude(length).rotate([90,0,90]).translate([x,0,0]);
const section=poly=>new C([poly]);
const dSection=(r,flat)=>C.intersection([C.circle(r,96),C.square([2*r+2,2*r+2])
  .translate([-r-1,flat])]);
function keySection(bore,wing,low,high){
  // A 45-degree roof preserves the complete circular core, while the lower
  // wall catches the bayonet wing after its deliberate quarter turn.
  return C.union([C.circle(bore/2,96),section([[-wing,low],[wing,low],
    [wing,high],[0,high+wing],[-wing,high]])]);
}
const keeperHole=keySection(p.keeperBore,5.4,-2.4,.9);
const axleHole=keySection(p.hingeBore,6.4,-3.4,.4);
const sideTransform=s=>s;
const leftTransform=s=>s.rotate([0,0,180]);
const rearTransform=s=>s.rotate([0,0,90]);
function joint(edge,neck,cap,pinZ=p.jointPinZ){
  const a=edge-p.jointRootInset,n=edge+p.jointNeckOut,c=edge+p.jointCapOut;
  const poly=[[a,-neck],[n,-neck],[c,-cap],[c,cap],[n,neck],[a,neck]];
  const bottom=x=>p.jointBottom+p.jointSlope*(x-a);
  const slab=(top)=>M.hull([...[edge-20,edge+15].flatMap(x=>
    [[x,-60,bottom(x)],[x,60,bottom(x)],[x,-60,top],[x,60,top]])]);
  const male=intersect(prism(poly,100,150),slab(p.jointTop));
  const expanded=section(poly).offset(p.fit,'Miter').toPolygons();
  assert.equal(expanded.length,1);
  const open=expanded[0].map(([x,y])=>[x<a+.01?edge-20:x,y]);
  const femaleCut=intersect(prism(open,100,150),slab(250));
  const bore=alongX(keeperHole,edge-20,40).translate([0,0,pinZ]);
  const pocket=cylinder(p.keeperHeadR+.4,4,[edge+8-p.keeperHeadDepth-.05,0,pinZ],'x');
  return {male,femaleCut,bore,pocket,edge,bottom,poly,pinZ};
}
const sideJoint=joint(p.width/2,14,20),rearJoint=joint(p.depth/2,8,12,182);
const outside=loft(outline(0),0,outline(p.height),p.height);
const cavity=loft(outline(p.floor,p.offset),p.floor,outline(p.height+1,p.offset),p.height+1);
const shelf=cut(
  loft(outline(frameZ-3,p.offset-.2),frameZ-3,outline(frameZ,p.offset-.2),frameZ),
  loft(outline(frameZ-3,p.offset),frameZ-3,outline(frameZ,p.offset+2),frameZ));
const bin=cut(sum(cut(outside,cavity),shelf,sideJoint.male,leftTransform(sideJoint.male),
  rearTransform(rearJoint.male)),sideJoint.bore,leftTransform(sideJoint.bore),rearTransform(rearJoint.bore));
const hangerCross=[[p.width/2+.5,p.bracketBottom],[p.width/2+8,p.bracketBottom],
  [p.width/2+8,support],[p.span/2,support],[p.span/2,ledgeTop],[p.width/2+.5,ledgeTop]];
const hangerBlank=section(hangerCross).extrude(p.sideLength).rotate([90,0,0])
  .translate([0,p.sideLength/2,0]);
const rightHanger=cut(hangerBlank,sideJoint.femaleCut,sideJoint.bore,sideJoint.pocket);
const leftHanger=leftTransform(rightHanger);

const rearFace=p.depth/2+8;
const railBase=box([-42,p.depth/2+.5,p.bracketBottom],[42,rearFace,198.5]);
const ears=[-p.fixedEarOuter,p.fixedEarInner].map(x=>sum(
  M.hull([x,x+p.fixedEarOuter-p.fixedEarInner].flatMap(xx=>[
    [xx,p.depth/2+.5,190],[xx,rearFace,190],
    [xx,p.hingeY+p.hingeRadius,p.hingeZ-3],[xx,p.hingeY+p.hingeRadius,p.hingeZ],
    [xx,p.depth/2+.5,p.hingeZ]])),
  cylinder(p.hingeRadius,p.fixedEarOuter-p.fixedEarInner,[x,p.hingeY,p.hingeZ],'x')));
const axleTool=alongX(axleHole,-60,120).translate([0,p.hingeY,p.hingeZ]);
const rail=cut(sum(railBase,ears),rearTransform(rearJoint.femaleCut),
  rearTransform(rearJoint.bore),axleTool);

const trackProfile=[[p.lidTrackY-4,lidTop-.1],[p.lidTrackY+4,lidTop-.1],
  [p.lidTrackY+7,lidTop+p.lidTrackHeight],[p.lidTrackY-7,lidTop+p.lidTrackHeight]];
const track=alongX(section(trackProfile),-p.lidTrackHalfLength,2*p.lidTrackHalfLength);
const trackOffset=section(trackProfile).offset(p.fit,'Miter').toPolygons()[0];
// Offset already extends below the leaf's Z=lidTop bottom, leaving its mouth open.
const trackTool=alongX(section(trackOffset),-60,120);
const lidPinTransform=s=>s.rotate([0,-90,0]).translate([0,p.lidTrackY,p.leafTop]);
const lidHole=lidPinTransform(alongX(keeperHole,-30,35));
const lidPocket=lidPinTransform(cylinder(p.keeperHeadR+.4,4,[-p.keeperHeadDepth-.05,0,0],'x'));
const lidBlank=prism(polygon(p.width+2,p.depth+2,p.chamfer),p.height,p.lidThickness);
const lid=cut(sum(lidBlank,track),lidHole,
  box([p.width/2+.1,-p.sideLength/2-1,p.height-1],[p.width/2+2,p.sideLength/2+1,lidTop+1]),
  box([-p.width/2-2,-p.sideLength/2-1,p.height-1],[-p.width/2-.1,p.sideLength/2+1,lidTop+1]),
  box([p.fixedEarInner-1,p.depth/2+.1,p.height-1],[p.fixedEarOuter+1,p.depth/2+2,lidTop+1]),
  box([-p.fixedEarOuter-1,p.depth/2+.1,p.height-1],[-p.fixedEarInner+1,p.depth/2+2,lidTop+1]));
const leaf=cut(sum(
  box([-p.movingHalf,p.lidTrackY-10,lidTop],[p.movingHalf,p.hingeY,p.leafTop]),
  cylinder(p.hingeRadius,2*p.movingHalf,[-p.movingHalf,p.hingeY,p.hingeZ],'x')),
  trackTool,lidHole,lidPocket,axleTool);
const frameOuter=outline(frameZ,p.offset+.5);
const frame=cut(prism(frameOuter,frameZ,p.frameThickness),
  prism(outline(frameZ,p.offset+4.5),frameZ-1,p.frameThickness+2));

function bayonet(tip=-14){
  const head=alongX(dSection(p.keeperHeadR,-2),-p.keeperHeadDepth,p.keeperHeadDepth);
  const shaft=alongX(dSection(p.keeperDiameter/2,-2),tip+1.9,-p.keeperHeadDepth-tip-1.8);
  const wing=box([tip,-5,-2],[tip+2,5,.5]);
  return sum(head,shaft,wing);
}
const keeper=bayonet(),shortKeeper=bayonet(-8.4),rearGateKeeper=bayonet(-18.2);
const locked=s=>s.rotate([90,0,0]);
const rightKeeper=s=>s.translate([p.width/2+8,0,p.jointPinZ]);
const leftKeeper=s=>leftTransform(rightKeeper(s));
const rearKeeper=s=>rearTransform(s.translate([p.depth/2+12.2,0,rearJoint.pinZ]));
const keeperTransforms=[rightKeeper,leftKeeper,rearKeeper,lidPinTransform];
const keeperModels=[keeper,keeper,rearGateKeeper,keeper];
const keeperNames=['keeper-right','keeper-left','keeper-rear','keeper-lid'];
const installedKeepers=Object.fromEntries(keeperTransforms.map((f,i)=>[keeperNames[i],f(locked(keeperModels[i]))]));
const axle=sum(
  alongX(dSection(7,-2.75),-37,3),
  alongX(dSection(p.axleDiameter/2,-2.75),-34.1,70.2),
  box([36,-6,-2.75],[39,6,0]));
const axleAt=s=>s.translate([0,p.hingeY,p.hingeZ]);
const installedAxle=axleAt(locked(axle));
// A rigid gate captures the axle's locked D-head. The rear keeper passes through
// the gate and rail, so the working hinge cannot turn the axle back to release.
const gateSocket=C.intersection([C.circle(7.4,96),C.square([13.4,20]).translate([-10,-10])]);
const gate=cut(sum(
  box([-44,103,174],[9,107.2,190]),
  box([-44,103,188],[-38.5,110,219]),
  box([-44,98.8,199],[-34.4,112,214.5])),
  alongX(gateSocket,-38,6).translate([0,p.hingeY,p.hingeZ]),
  rearKeeper(alongX(keeperHole,-35,40)),
  rearKeeper(cylinder(6.4,4,[-2.25,0,0],'x')));

const gaugeBlank=sum(box([-110,-3,-18],[110,3,0]),box([-115,-3,0],[115,3,3]));
const gaugeHoleAt=(s,x)=>s.rotate([0,0,90]).translate([x,3,-8]);
const gaugeTools=[-8,8].flatMap(x=>[
  gaugeHoleAt(alongX(keeperHole,-20,25),x),
  gaugeHoleAt(cylinder(6.4,4,[-2.25,0,0],'x'),x)]);
const gaugeLeft=cut(intersect(gaugeBlank,sum(box([-116,-4,-19],[-16,4,4]),
  box([-16,-3,-19],[16,0,4]))),gaugeTools);
const gaugeRight=cut(intersect(gaugeBlank,sum(box([16,-4,-19],[116,4,4]),
  box([-16,0,-19],[16,3,4]))),gaugeTools);
const sideCoupon=intersect(bin,box([p.width/2-8,-24,160],[p.width/2+5,24,p.height]));
const rearCoupon=intersect(bin,box([-24,p.depth/2-8,160],[24,p.depth/2+5,p.height]));
const lidCoupon=intersect(lid,box([-22,70,p.height-1],[22,94,lidTop+p.lidTrackHeight+1]));
const cornerCoupon=intersect(bin,box([p.width/2-41,p.depth/2-41,p.height-7],[p.width/2+1,p.depth/2+1,p.height]));
const boreCoupon=cut(box([0,0,0],[45,18,6]),[8.6,9,9.4].map((d,i)=>
  cylinder(d/2,8,[7.5+15*i,9,-1])));
function onBed(s){const{min,max}=s.boundingBox();return s.translate([-(min[0]+max[0])/2,-(min[1]+max[1])/2,-min[2]]);}
const parts={
  bin:onBed(bin),lid:onBed(lid),'liner-frame':onBed(frame),
  'hanger-left':onBed(leftHanger.rotate([90,0,0])),
  'hanger-right':onBed(rightHanger.rotate([90,0,0])),
  'hinge-rail':onBed(rail),'hinge-leaf':onBed(leaf.rotate([0,90,0])),
  'bayonet-keeper':onBed(keeper),'hinge-axle':onBed(axle),
  'rear-gate-keeper':onBed(rearGateKeeper),'axle-lock-gate':onBed(gate.rotate([0,-90,0])),
  'coupon-host-left':onBed(gaugeLeft.rotate([90,0,0])),
  'coupon-host-right':onBed(gaugeRight.rotate([-90,0,0])),
  'coupon-gauge-keeper':onBed(shortKeeper),
  'coupon-side-joint':onBed(sideCoupon),'coupon-rear-joint':onBed(rearCoupon),
  'coupon-lid-joint':onBed(lidCoupon),'coupon-corner':onBed(cornerCoupon),'coupon-axle-bores':onBed(boreCoupon),
};
const quantities={bin:1,lid:1,'liner-frame':1,'hanger-left':1,'hanger-right':1,
  'hinge-rail':1,'hinge-leaf':1,'bayonet-keeper':3,'hinge-axle':1,'rear-gate-keeper':1,'axle-lock-gate':1};
const layouts={
  '01-bin':[['bin',0,0]],
  '02-lid':[['lid',0,0]],
  '03-liner-frame':[['liner-frame',0,0]],
  '04-hanging-rails':[['hanger-left',-45,0],['hanger-right',45,0]],
  '05-hinge':[['hinge-rail',-40,-25],['hinge-leaf',40,-25],['axle-lock-gate',0,40]],
  '06-keepers-and-axle':[['bayonet-keeper',-60,-35],['bayonet-keeper',-20,-35],
    ['bayonet-keeper',20,-35],['rear-gate-keeper',60,-35],['hinge-axle',0,25]],
  'test-01-host-gauge':[['coupon-host-left',0,-20],['coupon-host-right',0,20],
    ['coupon-gauge-keeper',-20,65],['coupon-gauge-keeper',20,65]],
  'test-02-mating':[['coupon-side-joint',-85,0],['coupon-rear-joint',0,-50],
    ['coupon-lid-joint',0,0],['coupon-corner',65,-25],['coupon-axle-bores',0,45]],
};
function meshStats(s,name){
  ok(s.status()==='NoError',`${name}: Manifold NoError`);
  ok(s.decompose().length===1,`${name}: one joined physical solid`);
  const m=s.getMesh(),edges=new Map();
  const vert=i=>Array.from(m.vertProperties.slice(i*m.numProp,i*m.numProp+3));
  let vol=0,area=0,downward=0;
  const key=v=>v.map(x=>Object.is(x,-0)?0:x).join(',');
  for(let i=0;i<m.triVerts.length;i+=3){
    const t=[0,1,2].map(j=>vert(m.triVerts[i+j]));
    assert(t.flat().every(Number.isFinite),`${name}: finite vertices`);
    const n=cross(sub(t[1],t[0]),sub(t[2],t[0])),len=Math.hypot(...n);
    assert(len>1e-9,`${name}: nondegenerate triangles`);
    vol+=dot(t[0],cross(t[1],t[2]))/6;
    if(t.every(v=>Math.abs(v[2])<1e-5))area+=len/2;
    else if(n[2]/len<-Math.SQRT1_2-1e-4)downward+=len/2;
    for(let j=0;j<3;j++){
      const a=key(t[j]),b=key(t[(j+1)%3]),k=a<b?`${a}|${b}`:`${b}|${a}`;
      const e=edges.get(k)??[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(k,e);
    }
  }
  ok([...edges.values()].every(([n,w])=>n===2&&w===0),`${name}: closed consistently oriented topology`);
  ok(vol>0&&Math.abs(vol-s.volume())<Math.max(.05,s.volume()*1e-5),`${name}: positive outward volume matches kernel`);
  ok(area>30,`${name}: individual flat bed contact >30 mm2`);
  const bounds=s.boundingBox(),extent=bounds.max.map((v,i)=>v-bounds.min[i]);
  ok(bounds.min[2]>=-1e-5&&extent.every((v,i)=>v<=p.printer[i]-(i<2?2*p.margin:0)+1e-5),
    `${name}: K1SE extents and >=2 mm XY margins`);
  return {triangles:m.triVerts.length/3,volumeMm3:s.volume(),approximatePLAgrams:s.volume()*1.24/1000,
    bedContactMm2:area,steepDownwardFaceAreaMm2:downward,bounds,extent};
}
for(const [name,s]of Object.entries(parts))report.parts[name]=meshStats(s,name);
ok(report.parts.bin.steepDownwardFaceAreaMm2<.01,'bin: all non-bed downward faces satisfy 45-degree support-free criterion');
ok(report.parts.lid.steepDownwardFaceAreaMm2<.01,'lid: all non-bed downward faces satisfy 45-degree support-free criterion');
for(const name of ['hinge-axle','bayonet-keeper','rear-gate-keeper','coupon-gauge-keeper'])
  ok(report.parts[name].steepDownwardFaceAreaMm2<.01,`${name}: horizontal flat orientation is support-free at 45-degree criterion`);
ok(report.parts.lid.bedContactMm2>35000,'lid: broad flat skin at print Z=0');
let minNormal=Infinity;
for(let z=0;z<=p.height;z+=.5){
  const a=outline(z),b=outline(z,p.offset),next=outline(z+1);
  for(let i=0;i<8;i++){
    const e=sub(a[(i+1)%8],a[i]),len=Math.hypot(...e),n=[-e[1]/len,e[0]/len];
    const d=dot(sub(b[i],a[i]),n),slope=dot(sub(next[i],a[i]),n);
    assert(Math.abs(d-p.offset)<1e-9,'exact polygon offset including chamfers');
    minNormal=Math.min(minNormal,d/Math.sqrt(1+slope*slope));
  }
}
report.minimumNormalWallMm=minNormal;
ok(minNormal>=p.minWall,'true tapered normal wall >=2.4 mm including all chamfers');
const floorBox=box([-120,-120,0],[120,120,p.floor-.01]);
ok(Math.abs(intersect(bin,floorBox).volume()-intersect(outside,floorBox).volume())<.01,
  'continuous 3 mm floor, joined with body and rail roots');
const shell=cut(outside,cavity);
for(const [name,male]of [['side',sideJoint.male],['rear',rearTransform(rearJoint.male)]])
  ok(intersect(male,shell).volume()>100,`${name} rail roots overlap body wall by >100 mm3, not a coplanar join`);
ok(intersect(track,lidBlank).volume()>10,'lid slide rail overlaps skin with positive volume');
const fixed={bin,'liner-frame':frame,'hanger-left':leftHanger,'hanger-right':rightHanger,
  'hinge-rail':rail,'keeper-left':installedKeepers['keeper-left'],
  'keeper-right':installedKeepers['keeper-right'],'keeper-rear':installedKeepers['keeper-rear'],
  'hinge-axle':installedAxle,'axle-lock-gate':gate};
const moving={lid,'hinge-leaf':leaf,'keeper-lid':installedKeepers['keeper-lid']};
const assembly={...fixed,...moving};
function clear(a,b,label){assert(intersect(a,b).volume()<1e-5,label);}
const ae=Object.entries(assembly);
for(let i=0;i<ae.length;i++)for(let j=i+1;j<ae.length;j++){
  clear(ae[i][1],ae[j][1],`closed collision: ${ae[i][0]}/${ae[j][0]}`);
  report.tests.push(`closed CSG disjoint: ${ae[i][0]}/${ae[j][0]}`);
}
const seating=intersect(lid.translate([0,0,-.01]),bin).volume()/.01;
ok(seating>1400&&lid.boundingBox().min[2]===p.height,'lid seats directly at body rim; no hinge float');
const frameBearing=intersect(prism(frameOuter,frameZ-.1,.1),shelf).volume()/.1;
ok(frameBearing>400,'frame has continuous shelf bearing >400 mm2');
report.intentionalContacts.push({pair:['lid','bin'],kind:'rim seat',projectedAreaMm2:seating},
  {pair:['liner-frame','bin'],kind:'integral ramped shelf seat',projectedAreaMm2:frameBearing});
for(const[name,hanger,male]of [
  ['right',rightHanger,sideJoint.male],['left',leftHanger,leftTransform(sideJoint.male)],
  ['rear',rail,rearTransform(rearJoint.male)]]){
  const bearing=intersect(male.translate([0,0,-.01]),hanger).volume()/.01;
  ok(bearing>(name==='rear'?45:90),`${name} dovetail: broad positive sloped load seat, not keeper/friction`);
  report.intentionalContacts.push({pair:['bin',name==='rear'?'hinge-rail':`hanger-${name}`],
    kind:'1.3:1 downward load-bearing seat',projectedAreaMm2:bearing});
}
// Stage 1: hangers/rail slide UP onto the body from below, before keepers/lid.
for(const[name,s]of [['hanger-right',rightHanger],['hanger-left',leftHanger],['hinge-rail',rail]]){
  for(let dz=-80;dz<=0;dz+=.5)clear(s.translate([0,0,dz]),bin,`${name}: upward assembly path at ${dz}`);
  report.assemblyPaths[name]={motion:'translate Z -80 to 0, before keeper insertion',stepMm:.5,reverse:'unlock/remove keeper, slide down'};
  ok(true,`${name}: full upward slide-in and reverse removal path checked`);
}
// Stage 2: lid leaf slides from its right-hand side, on the detached lid.
for(let dx=60;dx>=0;dx-=.5)clear(leaf.translate([dx,0,0]),lid,`leaf slide at X ${dx}`);
ok(intersect(leaf.translate([0,0,1.2]),lid).volume()>1,'lid dovetail positively blocks lift-off');
report.assemblyPaths['hinge-leaf']={motion:'translate X +60 to 0 on detached lid',stepMm:.5,reverse:'remove lid keeper, slide +X'};
const lockAudit=[];
function auditKeeper(name,model,transform,obstacles,displacementLimit=3){
  for(let dx=35;dx>=0;dx-=.5)for(const o of obstacles)
    clear(transform(model.translate([dx,0,0])),o,`${name}: insertion ${dx}`);
  for(let deg=0;deg<=90;deg+=1)for(const o of obstacles)
    clear(transform(model.rotate([deg,0,0])),o,`${name}: quarter-turn ${deg}`);
  const installed=transform(locked(model));
  let stop=null;
  for(let dx=.1;dx<=displacementLimit;dx+=.1){
    if(obstacles.some(o=>intersect(transform(locked(model).translate([dx,0,0])),o).volume()>.01)){stop=dx;break;}
  }
  ok(stop!==null,`${name}: locked bayonet wing mechanically blocks straight withdrawal`);
  ok(obstacles.some(o=>intersect(transform(locked(model).translate([-.2,0,0])),o).volume()>.01),
    `${name}: broad head positively stops over-insertion`);
  report.assemblyPaths[name]={motion:'insert unturned along local -X; rotate 90 degrees after seating',
    insertionStepMm:.5,rotationStepDegrees:1,lockedWithdrawalStopBeforeMm:stop,
    reverse:'quarter-turn back while fully seated, then withdraw +local X'};
  lockAudit.push({name,stopMm:stop});
  return installed;
}
auditKeeper('keeper-right',keeper,rightKeeper,[bin,rightHanger]);
auditKeeper('keeper-left',keeper,leftKeeper,[bin,leftHanger]);
auditKeeper('keeper-rear',rearGateKeeper,rearKeeper,[bin,rail,gate]);
auditKeeper('keeper-lid',keeper,lidPinTransform,[lid,leaf,frame]);
// With keepers fitted, reversing any joint's installation direction is blocked.
for(const[name,s,k]of [['right',rightHanger,installedKeepers['keeper-right']],
  ['left',leftHanger,installedKeepers['keeper-left']],['rear',rail,installedKeepers['keeper-rear']]]){
  ok(intersect(s.translate([0,0,-2]),name==='rear'?sum(k,gate):k).volume()>.05,
    `${name}: fitted keeper/gate system blocks downward hanger/rail removal`);
}
ok(intersect(leaf.translate([2,0,0]),installedKeepers['keeper-lid']).volume()>.05,
  'lid: fitted keeper blocks lateral leaf removal');
// Stage 3: offer complete lid assembly from above, with axle absent.
const fixedWithoutAxle=Object.entries(fixed).filter(([n])=>!['hinge-axle','axle-lock-gate','keeper-rear'].includes(n));
for(let dz=60;dz>=0;dz-=.5)for(const [n,s]of Object.entries(moving))
  for(const [other,t]of fixedWithoutAxle)clear(s.translate([0,0,dz]),t,`lid placement ${n}/${other}/${dz}`);
ok(true,'complete lid assembly can be lowered into alignment with fixed ears before axle insertion');
// Stage 4: insert keyed axle from left, then rotate the entire axle 90 degrees.
const withoutAxle=ae.filter(([n])=>!['hinge-axle','axle-lock-gate','keeper-rear'].includes(n));
for(let dx=-120;dx<=0;dx+=.5)for(const[n,s]of withoutAxle)
  clear(axleAt(axle.translate([dx,0,0])),s,`axle insertion ${dx}/${n}`);
for(let a=0;a<=90;a+=1)for(const[n,s]of withoutAxle)
  clear(axleAt(axle.rotate([a,0,0])),s,`axle locking ${a}/${n}`);
ok(intersect(installedAxle.translate([-2.3,0,0]),rail).volume()>.01,
  'axle: distal bayonet crossbar positively blocks withdrawal after quarter-turn');
ok(intersect(installedAxle.translate([.2,0,0]),rail).volume()>.01,
  'axle: broad integral head stops over-insertion');
report.assemblyPaths['hinge-axle']={motion:'insert unturned from X -120 to 0, then rotate 90 degrees',
  insertionStepMm:.5,rotationStepDegrees:1,reverse:'fully reseat, reverse quarter-turn, withdraw left',
  shaftX:[-34,36],fixedBarrelsX:[[-34,-20],[20,34]],movingBarrelX:[-18,18],
  positiveHeadX:[-37,-34],positiveWingX:[36,39],diametralCoreClearanceMm:p.hingeBore-p.axleDiameter,
  axialBarrelGapsMm:2,axialRetentionPlayMm:2};
for(let dx=-80;dx<=0;dx+=.5)for(const[n,s]of ae.filter(([n])=>!['axle-lock-gate','keeper-rear'].includes(n)))
  clear(gate.translate([dx,0,0]),s,`axle lock gate insertion ${dx}/${n}`);
ok(intersect(gate.translate([-2,0,0]),installedKeepers['keeper-rear']).volume()>.01,
  'rear keeper positively blocks removal of the axle lock gate');
for(const a of [80,100])ok(intersect(axleAt(axle.rotate([a,0,0])),gate).volume()>.01,
  `axle gate positively blocks rotation away from locked position (${a} degrees)`);
for(const dx of [-.8,.05])for(const a of [80,100])
  ok(intersect(axleAt(axle.rotate([a,0,0]).translate([dx,0,0])),gate).volume()>.01,
    `axle gate still blocks unlocking across axial play X=${dx}, angle=${a}`);
ok(intersect(installedAxle.translate([-1.2,0,0]),gate).volume()>.01,
  'axle gate also positively limits axial withdrawal before the bayonet stop');
report.assemblyPaths['axle-lock-gate']={motion:'slide X -80 to 0 AFTER locking axle, then install LONG rear keeper',
  stepMm:.5,reverse:'unlock/remove long rear keeper, slide gate left, then unlock/remove axle'};
function opened(s,a){return s.translate([0,-p.hingeY,-p.hingeZ]).rotate([-a,0,0]).translate([0,p.hingeY,p.hingeZ]);}
const sweep={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
let sweepChecks=0;
for(let a=0;a<=p.openingDegrees+.00001;a+=.1){
  for(const[n,s]of Object.entries(moving)){
    const swung=opened(s,a),b=swung.boundingBox();
    for(let i=0;i<3;i++){sweep.min[i]=Math.min(sweep.min[i],b.min[i]);sweep.max[i]=Math.max(sweep.max[i],b.max[i]);}
    for(const[other,t]of Object.entries(fixed)){clear(swung,t,`opening ${a}: ${n}/${other}`);sweepChecks++;}
  }
}
ok(true,'0..110 degree lid/leaf/keeper opening sweep against ALL fixed parts including axle and keepers');
report.openingSweep={stepDegrees:.1,checks:sweepChecks,bounds:sweep,
  heightAboveInternalLedgeMm:sweep.max[2]-support,rearReachBeyondClosedMm:sweep.max[1]-(p.hingeY+p.hingeRadius)};
for(let dz=0;dz<=80;dz+=.5){
  const lifted=frame.translate([0,0,dz]);
  for(const[n,s]of Object.entries(fixed).filter(([n])=>n!=='liner-frame'))
    clear(lifted,s,`frame removal at ${dz}/${n}`);
  for(const[n,s]of Object.entries(moving))
    clear(lifted,opened(s,p.openingDegrees),`frame removal with open lid at ${dz}/${n}`);
}
ok(true,'bag frame can lift vertically 80 mm with lid fully open, and insert by the reverse path');
report.assemblyPaths['liner-frame']={motion:'with lid at 110 degrees, lift Z 0 to +80',stepMm:.5,
  reverse:'lower onto shelf with lid open',note:'Real host/liner clearances unmeasured.'};
// Gauge halves first lap together along Y; only then insert the two SHORT keys.
clear(gaugeLeft,gaugeRight,'host gauge: final interlocking lap has no overlap');
for(let dy=20;dy>=0;dy-=.5)clear(gaugeRight.translate([0,dy,0]),gaugeLeft,'host gauge lap insertion');
for(const x of [-8,8])auditKeeper(`gauge-keeper-${x}`,shortKeeper,s=>gaugeHoleAt(s,x),
  [gaugeLeft,gaugeRight],1);
ok(sum(gaugeLeft,gaugeRight).boundingBox().max[0]-sum(gaugeLeft,gaugeRight).boundingBox().min[0]===230,
  'all-printed host gauge assembled width exactly 230 mm');
const bounds=sum(Object.values(assembly)).boundingBox();
report.assemblyBounds=bounds;
report.internalLedgeInstallation={bearingZ:support,closedAboveBearingMm:bounds.max[2]-support,
  floorBelowBearingMm:support,rimRecessMm:p.suspensionDrop,assumedHostBearingEachSideMm:(p.span-p.assumedOpening)/2,
  note:'Internal ledge only; never clamp the unknown external host flange.'};
ok(bounds.max[0]-bounds.min[0]===230&&bounds.max[1]-bounds.min[1]<215&&bounds.max[2]<230,
  'installed envelope: 230 total span, <215 depth, <230 total height');
ok(bounds.max[2]-support<=3.00001&&support<230,'closed projection <=3 above internal ledge; floor <230 below');
ok(p.width+2*p.jointOuterOut<p.assumedOpening,'hanger faces below ledges clear assumed 224 opening');
const assumedPatch=box([p.assumedOpening/2,-p.sideLength/2,support-.01],
  [p.span/2,p.sideLength/2,support]);
const assumedBearing=intersect(rightHanger.translate([0,0,-.01]),assumedPatch).volume()/.01;
ok(assumedBearing>155,'hypothetical flat 224-opening ledge: 156 mm2 bearing per hanger, NOT measured host fit');
report.internalLedgeInstallation.assumedHostBearingAreaEachMm2=assumedBearing;

function stl(solids){
  const meshes=solids.map(s=>s.getMesh()),count=meshes.reduce((n,m)=>n+m.triVerts.length/3,0);
  const b=Buffer.alloc(84+50*count);b.write('food-caddy-r4 ALL PRINTED; Manifold CSG; mm');b.writeUInt32LE(count,80);let off=84;
  for(const m of meshes)for(let i=0;i<m.triVerts.length;i+=3){
    const t=[0,1,2].map(j=>Array.from(m.vertProperties.slice(m.triVerts[i+j]*m.numProp,m.triVerts[i+j]*m.numProp+3)));
    const n=cross(sub(t[1],t[0]),sub(t[2],t[0])),len=Math.hypot(...n);
    for(const f of [...n.map(v=>v/len),...t.flat()]){b.writeFloatLE(f,off);off+=4;}off+=2;
  }
  return b;
}
const files=new Map(),put=(n,b)=>files.set(n,Buffer.from(b));
for(const[n,s]of Object.entries(parts))put(`spares/r4-${n}.stl`,stl([s]));
for(const[n,layout]of Object.entries(layouts)){
  const placed=layout.map(([name,x,y])=>({name,s:parts[name].translate([x,y,0])}));
  for(const{name,s}of placed){
    const b=s.boundingBox();
    ok(b.min[0]>=-108-1e-5&&b.max[0]<=108+1e-5&&b.min[1]>=-108-1e-5&&b.max[1]<=108+1e-5,
      `${n}/${name}: centred plate XY margin >=2 mm`);
  }
  for(let i=0;i<placed.length;i++)for(let j=i+1;j<placed.length;j++){
    const a=placed[i].s.boundingBox(),b=placed[j].s.boundingBox();
    const gap=Math.max(b.min[0]-a.max[0],a.min[0]-b.max[0],b.min[1]-a.max[1],a.min[1]-b.max[1]);
    ok(gap>=p.plateGap,`${n}: objects ${i}/${j} separated >=5 mm`);
    clear(placed[i].s,placed[j].s,`${n}: objects have empty CSG intersection`);
  }
  ok(M.compose(placed.map(o=>o.s)).decompose().length===placed.length,`${n}: exactly one component per intended copy`);
  report.plates[n]={parts:layout,componentCount:placed.length};
  put(`production/r4-${n}.stl`,stl(placed.map(o=>o.s)));
}
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const legacy=JSON.parse(fs.readFileSync(path.join(root,'archive','legacy-manifest.json'),'utf8'));
for(const f of legacy.files)assert.equal(sha(fs.readFileSync(path.join(root,f.archivedPath))),f.sha256,
  `legacy preservation: ${f.archivedPath}`);
const fallback=JSON.parse(fs.readFileSync(path.join(root,'metal-screws-required','PRESERVATION.json'),'utf8'));
for(const f of fallback.files)assert.equal(sha(fs.readFileSync(path.join(root,'metal-screws-required',f.path))),f.sha256,
  `R3 fallback preservation: ${f.path}`);
ok(legacy.files.length===22&&fallback.files.length===59,'22 legacy and all 59 R3 fallback file hashes preserved');
put('docs/R4_GUIDE.md',fs.readFileSync(path.join(root,'docs','R4_GUIDE.md')));
put('packages/r4-validation.json',JSON.stringify(report,null,2)+'\n');
const manifest={revision:'r4-all-printed',units:'mm',purchasedHardwareRequired:false,structuralGlueRequired:false,
  productionQuantities:quantities,couponShortKeeperQuantity:2,
  noRails:'Accessory-only: liner-frame, hinge-leaf, bayonet-keeper, rear-gate-keeper, hinge-axle and axle-lock-gate. EXCLUDES bin, lid, BOTH R4 hangers, fixed R4 hinge rail, coupons. Only for reusing identical R4 parts; never R3/legacy.',
  files:[...files].map(([name,b])=>({name,bytes:b.length,sha256:sha(b)}))};
put('packages/r4-manifest.json',JSON.stringify(manifest,null,2)+'\n');
const full=[...files.keys()],noRails=['spares/r4-liner-frame.stl','spares/r4-hinge-leaf.stl',
  'spares/r4-bayonet-keeper.stl','spares/r4-hinge-axle.stl','docs/R4_GUIDE.md','packages/r4-manifest.json'];
noRails.push('spares/r4-rear-gate-keeper.stl','spares/r4-axle-lock-gate.stl');
const archives=new Map();
for(const[name,names]of [['packages/food-caddy-r4-ALL-PRINTED-FULL.zip',full],
  ['packages/food-caddy-r4-ALL-PRINTED-NO-RAILS.zip',noRails]]){
  const entries={};
  for(const n of names)entries[`food-caddy-r4/${n}`]=[new Uint8Array(files.get(n)),{mtime:new Date(2026,8,11)}];
  const zipped=Buffer.from(zipSync(entries,{level:6})),unpacked=unzipSync(zipped);
  assert.equal(Object.keys(unpacked).length,names.length);
  for(const n of names)assert(Buffer.from(unpacked[`food-caddy-r4/${n}`]).equals(files.get(n)),'ZIP parity');
  archives.set(name,zipped);
}
if(checkOnly){
  for(const[n,b]of [...files,...archives])assert(fs.readFileSync(path.join(root,n)).equals(b),`stale output ${n}`);
  for(const folder of ['production','spares']){
    const expected=[...files.keys()].filter(n=>n.startsWith(`${folder}/`)&&n.endsWith('.stl'))
      .map(n=>path.basename(n)).sort();
    assert.deepEqual(fs.readdirSync(path.join(root,folder)).filter(n=>n.endsWith('.stl')).sort(),expected,
      `unexpected or stale STL in current ${folder}`);
  }
}else{
  for(const[n,b]of [...files,...archives]){const dest=path.join(root,n);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b);}
}
console.log(`${checkOnly?'VERIFIED':'GENERATED'} all-printed R4: ${Object.keys(parts).length} canonical solids, ${Object.keys(layouts).length} plates, ${report.tests.length} checks, ${sweepChecks} opening intersections.`);
console.log(`Envelope ${JSON.stringify(bounds)}; normal wall ${minNormal.toFixed(4)}; support plane ${support}.`);
