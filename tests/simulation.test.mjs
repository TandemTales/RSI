import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, createJam, createRobot, step, compile, deploy, setChildProgram, accounting, COURIER, EXPRESS, COST, BUILD_TICKS, isFloor } from '../sim.js';
const ticks = (s, n) => { for (let i=0;i<n;i++) step(s); return s; };
function invariants(s) {
  assert.equal(accounting(s).total, s.initialParts, 'parts are conserved');
  assert.equal(new Set(s.robots.map(r=>`${r.x},${r.y}`)).size,s.robots.length,'robots never overlap');
  for(const r of s.robots){assert.ok(isFloor(r.x,r.y));assert.ok(r.cargo===0||r.cargo===1);assert.ok(r.pc>=0&&r.pc<r.program.code.length);}
  for(const n of [s.bin,s.station,s.builtParts,...Object.values(s.floorParts)]) assert.ok(Number.isInteger(n)&&n>=0);
}
test('default factory builds a second, then third robot with R02 contributing',()=>{
  const s=createState();let secondTick;
  while(s.robots.length<3&&s.tick<300){step(s);invariants(s);if(s.robots.length===2&&secondTick===undefined)secondTick=s.tick;}
  assert.equal(secondTick,64);assert.equal(s.goalTick,112);assert.equal(s.robots.length,3);
  assert.ok(s.robots[1].deliveries>=1);assert.equal(s.builtParts,2*COST);
  assert.deepEqual(s.robots[2].program,compile(COURIER));
});
test('construction reserves exactly three parts and takes six ticks',()=>{
  const s=createState();s.bin-=COST;s.station=COST;
  Object.assign(s.robots[0],{x:10,y:4,pc:6});step(s);
  assert.equal(s.station,0);assert.equal(s.job.remaining,BUILD_TICKS);assert.equal(accounting(s).reserved,COST);
  ticks(s,BUILD_TICKS-1);assert.equal(s.robots.length,1);
  step(s);assert.equal(s.robots.length,2);assert.equal(s.job,null);invariants(s);
});
test('program propagation captures a revision at build start and does not rewrite existing robots',()=>{
  const s=createState(), p=compile(EXPRESS,'Express',7);
  setChildProgram(s,p);s.bin-=COST;s.station=COST;Object.assign(s.robots[0],{x:10,y:4,pc:6});step(s);
  p.code[0].y=8;setChildProgram(s,compile(COURIER,'Changed',8));ticks(s,BUILD_TICKS);
  assert.equal(s.robots[1].program.name,'Express');assert.equal(s.robots[1].program.version,7);
  assert.equal(s.robots[1].program.code[0].y,6);assert.equal(s.robots[0].program.name,'Courier');
  deploy(s,2,compile(COURIER,'New',9));assert.equal(s.robots[1].pc,0);assert.equal(s.robots[0].program.version,1);
});
test('blocked output waits without losing reserved resources or duplicating robots',()=>{
  const s=createState();Object.assign(s.robots[0],{x:10,y:5,program:compile('move 10 5\nrepeat'),pc:0});
  s.bin-=COST;s.job={remaining:1,started:0,program:compile(COURIER),parent:1};
  ticks(s,10);assert.equal(s.robots.length,1);assert.equal(s.job.waiting,true);assert.equal(accounting(s).reserved,COST);invariants(s);
  deploy(s,1,compile('move 9 5\nrepeat'));step(s);
  assert.equal(s.robots.length,2);assert.equal(s.job,null);invariants(s);
});
test('head-on traffic cannot overlap or swap; routing around it resolves the jam',()=>{
  const s=createJam();ticks(s,10);assert.ok(s.robots.every(r=>r.blocked));assert.equal(s.robots[0].x,6);assert.equal(s.robots[1].x,7);
  deploy(s,1,compile('move 6 5\nmove 9 5\nrepeat','Detour'));ticks(s,4);
  assert.equal(s.robots[0].x,9);assert.equal(s.robots[0].y,5);assert.equal(s.robots[1].x,4);invariants(s);
});
test('simultaneous tile claims use stable robot ID priority',()=>{
  const s=createJam();s.robots=[createRobot(2,8,4,compile('move 7 4\nrepeat')),createRobot(1,6,4,compile('move 7 4\nrepeat'))];
  step(s);assert.equal(s.robots.find(r=>r.id===1).x,7);assert.equal(s.robots.find(r=>r.id===2).x,8);invariants(s);
});
test('wall/machine movement and invalid interactions wait without corrupting state',()=>{
  const s=createState(),r=s.robots[0];deploy(s,1,compile('move 1 4\nrepeat'));
  step(s);assert.ok(r.blocked);assert.equal(r.x,3); // Bin at (2,4) obstructs route.
  deploy(s,1,compile('drop N\nrepeat'));step(s);assert.ok(r.blocked);
  deploy(s,1,compile('activate N\nrepeat'));step(s);assert.ok(r.blocked);assert.equal(s.job,null);invariants(s);
});
test('pick, loose drop, pick and bin return conserve parts',()=>{
  const s=createState(),r=s.robots[0];step(s);assert.equal(r.cargo,1);assert.equal(s.bin,17);
  deploy(s,1,compile('drop S\npick S\ndrop W\nrepeat'));step(s);assert.equal(s.floorParts['3,5'],1);invariants(s);
  step(s);assert.equal(r.cargo,1);assert.equal(Object.keys(s.floorParts).length,0);
  step(s);assert.equal(s.bin,18);assert.equal(r.cargo,0);invariants(s);
});
test('empty bin waits; activating without enough parts continues the supply route',()=>{
  const s=createState(),r=s.robots[0];s.bin=0;s.floorParts['4,4']=18;step(s);assert.ok(r.blocked);assert.equal(r.pc,3);
  Object.assign(r,{x:10,y:4,pc:6});step(s);assert.equal(r.pc,7);assert.equal(s.job,null);invariants(s);
});
test('compiler rejects malformed or unsafe tapes with useful diagnostics',()=>{
  for(const source of ['move 0 0\nrepeat','move 2 4\nrepeat','move 10\nrepeat','move 3.5 4\nrepeat','pick E extra\nrepeat','activate X\nrepeat','repeat','pick W','repeat\nmove 3 4\nrepeat','<script>\nrepeat'])assert.throws(()=>compile(source));
  assert.equal(compile('# comment\nPICK W # supply\nrepeat').code[0].line,2);
});
test('10,000-tick run conserves resources, never overlaps, and repeats exactly',()=>{
  const a=createState(),b=createState();
  for(let i=0;i<10000;i++){step(a);step(b);invariants(a);}
  assert.deepEqual(a,b);assert.equal(a.robots.length,7);assert.equal(a.bin,0);assert.equal(a.builtParts,18);
});
test('reset produces a fresh identical state with no shared mutable program',()=>{
  const a=createState();ticks(a,150);a.robots[0].program.code[0].x=5;
  const b=createState(),c=createState();assert.deepEqual(b,c);assert.equal(b.tick,0);assert.equal(b.robots.length,1);assert.equal(b.bin,18);assert.equal(b.robots[0].program.code[0].x,10);
});
