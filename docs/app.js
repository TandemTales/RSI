import { createState, createJam, step, compile, deploy, setChildProgram, accounting, COURIER, EXPRESS, WIDTH, HEIGHT, BIN, ASSEMBLER, OUTPUT, COST, BUILD_TICKS } from './sim.js';
const $ = id => document.getElementById(id);
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const robotName = id => `R${String(id).padStart(2, '0')}`;
const templates = { courier: compile(COURIER), express: compile(EXPRESS, 'Express'), custom: compile(COURIER, 'Experiment') };
let state = createState(), selected = 1, running = false, timer = null, previous = new Map(), movedAt = 0;
const canvas = $('floor'), ctx = canvas.getContext('2d'), tile = 60;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function message(text, error = false) { $('editor-message').textContent = text; $('editor-message').classList.toggle('error', error); }
function current() { return state.robots.find(r => r.id === selected) || state.robots[0]; }
function loadEditor() {
  const program = templates[$('template').value];
  $('editor').value = program.source; $('revision').textContent = `v${program.version}`;
  $('draft-status').textContent = 'SAVED';
  message('Save a revision, then deploy it or choose it for new robots.');
}
function save() {
  try {
    const key = $('template').value, old = templates[key];
    const changed = $('editor').value !== old.source;
    const program = compile($('editor').value, old.name, old.version + (changed ? 1 : 0));
    templates[key] = program;
    if ($('child-program').value === key) setChildProgram(state, program);
    $('revision').textContent = `v${program.version}`; $('draft-status').textContent = 'SAVED';
    message(`${program.name} v${program.version} saved. Existing robots keep their current revision.`);
    renderUI(); return program;
  } catch (error) { message(error.message, true); return null; }
}
function setRunning(value) {
  running = value; clearInterval(timer); timer = null;
  if (running) timer = setInterval(tick, 600 / Number($('speed').value));
  $('run').textContent = running ? 'Ⅱ Pause' : '▶ Run';
  $('mode').textContent = running ? 'RUNNING' : 'PAUSED'; $('mode-dot').classList.toggle('running', running);
}
function tick() {
  previous = new Map(state.robots.map(r => [r.id, { x: r.x, y: r.y }]));
  step(state); movedAt = performance.now(); renderUI();
}
function reset(jam = false) {
  setRunning(false); state = jam ? createJam() : createState(); selected = 1;
  state.childProgram = structuredClone(templates[$('child-program').value]);
  previous.clear(); renderUI();
}
function renderUI() {
  const r = current(), a = accounting(state), count = state.robots.length;
  $('clock').textContent = `T ${String(state.tick).padStart(4, '0')}`;
  $('bin').textContent = state.bin; $('carried').textContent = a.carried + a.loose;
  $('buffer').textContent = `${state.station} / ${COST}`;
  $('construction').textContent = !state.job ? 'Idle' : state.job.waiting ? 'Output blocked' : `${BUILD_TICKS - state.job.remaining} / ${BUILD_TICKS} ticks`;
  $('build-progress').value = state.job ? BUILD_TICKS - state.job.remaining : 0;
  $('robot-count').textContent = String(count).padStart(2, '0');
  $('milestones').innerHTML = [1,2,3].map(n => `<span class="${count >= n ? 'on' : ''}" title="${n} robot${n > 1 ? 's' : ''}"></span>`).join('');
  $('goal-status').textContent = state.scenario === 'jam' ? 'TRAFFIC LAB / Resolve the deadlock.' : state.goalTick !== null ? `LOOP ESTABLISHED AT T ${state.goalTick} / Keep improving.` : `${count} / 3 ROBOTS ONLINE · ${Math.max(0, 3 - count)} TO GO`;
  $('balance').textContent = `${a.total} / ${state.initialParts} PARTS ACCOUNTED FOR`;
  $('roster').innerHTML = state.robots.map(bot => `<button class="robot-card ${bot.id === selected ? 'selected' : ''} ${bot.blocked ? 'blocked' : ''}" data-robot="${bot.id}" aria-pressed="${bot.id === selected}"><span class="robot-avatar">${String(bot.id).padStart(2,'0')}</span><span><b>${robotName(bot.id)} ${bot.cargo ? '◆' : ''}</b><small>${escape(bot.program.name)} v${bot.program.version}<br>${bot.parent ? '← ' + robotName(bot.parent) : 'SEED ROBOT'} · ${bot.blocked ? 'BLOCKED' : 'ONLINE'}</small></span></button>`).join('');
  $('events').innerHTML = state.events.slice(0, 12).map(e => `<li class="${e.kind}"><time>${String(e.tick).padStart(4,'0')}</time><span>${escape(e.message)}</span></li>`).join('');
  $('deploy').textContent = `Deploy to ${robotName(r.id)}`;
  $('debug-title').textContent = `${robotName(r.id)} / LIVE DEBUG`;
  $('debug-version').textContent = `${r.program.name} v${r.program.version}`;
  $('debug-status').textContent = r.status;
  $('tape').innerHTML = r.program.code.map((c, i) => `<div class="${i === r.pc ? 'active' : ''}"><span>${i === r.pc ? '→' : String(c.line).padStart(2,'0')}</span>${escape(c.op === 'move' ? `move ${c.x} ${c.y}` : c.dir ? `${c.op} ${c.dir}` : c.op)}</div>`).join('');
  $('debug-data').textContent = `POSITION (${r.x}, ${r.y}) · CARGO ${r.cargo} / 1\nDELIVERIES ${r.deliveries} · BUILDS STARTED ${r.activations}\nNEXT LINE ${r.program.code[r.pc].line} · ${r.blocked ? 'WAITING / RETRY' : 'READY'}\nPARTS: ${a.bin} bin + ${a.carried} carried + ${a.loose} floor + ${a.buffered} buffer + ${a.reserved} reserved + ${a.built} built = ${a.total}`;
  $('inherit-note').textContent = state.job ? `Current build: ${state.job.program.name} v${state.job.program.version}, captured by ${robotName(state.job.parent)}. Selection affects the next build.` : 'Captured when construction starts. Existing robots keep their own copy.';
}
function rect(x,y,w,h,fill,radius=0,stroke=null) {
  ctx.beginPath(); ctx.roundRect(x,y,w,h,radius); ctx.fillStyle=fill; ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}
function text(value,x,y,color='#8ca997',size=12,align='center') {ctx.fillStyle=color;ctx.font=`${size}px Consolas, monospace`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(value,x,y);}
function part(x,y,scale=1) {
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);rect(-6*scale,-6*scale,12*scale,12*scale,'#edc476',2*scale);ctx.restore();
}
function draw(now) {
  ctx.clearRect(0,0,900,660);ctx.fillStyle='#12211c';ctx.fillRect(0,0,900,660);
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
    const wall = x===0||y===0||x===WIDTH-1||y===HEIGHT-1;
    rect(x*tile+2,y*tile+2,56,56,wall?'#293d32':((x+y)%2?'#1c3026':'#1e3228'),3);
    if(wall){rect(x*tile+8,y*tile+8,44,39,'#344b3c',2);ctx.fillStyle='#405d49';ctx.fillRect(x*tile+10,y*tile+9,40,2);}
    else {ctx.fillStyle='#385442';ctx.fillRect(x*tile+5,y*tile+5,2,2);}
  }
  for(let x=1;x<14;x++)text(String(x),x*tile+30,79,'#658672',10);
  for(let y=2;y<10;y++)text(String(y),81,y*tile+30,'#658672',10);
  // A suggested clockwise logistics route, drawn beneath robots.
  ctx.setLineDash([5,8]);ctx.strokeStyle='#63876166';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(210,270);ctx.lineTo(630,270);ctx.lineTo(630,450);ctx.lineTo(210,450);ctx.closePath();ctx.stroke();ctx.setLineDash([]);
  text('→',420,270,'#688665',23);text('↓',630,390,'#688665',23);text('←',420,450,'#688665',23);text('↑',210,390,'#688665',23);
  text('INPUT',150,207,'#d2be8b',11);text('ASSEMBLER',690,207,'#c2d8b8',11);
  // Parts bin, a recessed tray with a visible inventory.
  rect(123,247,54,54,'#0c1914',6);rect(122,241,56,50,'#52634b',5,'#8a976a');rect(129,249,42,32,'#253329',3);
  for(let i=0;i<Math.min(6,state.bin);i++)part(137+(i%3)*13,257+Math.floor(i/3)*15,.65);
  text(String(state.bin),150,303,'#e9c677',12);
  // Assembly platen, weld head and progress lights.
  rect(660,248,60,54,'#0c1914',7);rect(660,239,60,52,'#667c60',5,'#a6c591');rect(668,247,44,34,'#263c2c',3);
  for(let i=0;i<3;i++)rect(668+i*16,285,11,4,i<state.station?'#edc476':'#344d39',1);
  if(state.job){const p=(BUILD_TICKS-state.job.remaining)/BUILD_TICKS;rect(675,256,30,20,'#779b79',4);rect(679,261,6,4,'#192e21');rect(695,261,6,4,'#192e21');ctx.strokeStyle=state.job.waiting?'#ef927c':'#b7f0bf';ctx.lineWidth=3;ctx.beginPath();ctx.arc(690,266,28,-Math.PI/2,-Math.PI/2+Math.PI*2*p);ctx.stroke();}
  else {text('⚙',690,263,'#aac196',25);}
  rect(OUTPUT.x*tile+5,OUTPUT.y*tile+5,50,50,'#314533',4,'#799065');text('OUT',OUTPUT.x*tile+30,OUTPUT.y*tile+31,'#9cb38a',10);
  text('BIN (2,4)',150,342,'#7f9c83',10);text('BUILD / 3 PARTS',720,342,'#8ca689',10);
  text('ONE-WAY COURIER LOOP',420,548,'#789b80',11);text('DELIVER → ACTIVATE → REPEAT',420,571,'#4e745b',10);
  for(const [position,count] of Object.entries(state.floorParts)){const [x,y]=position.split(',').map(Number);part(x*tile+30,y*tile+30);text(String(count),x*tile+45,y*tile+46,'#efc577',10);}
  if(state.scenario==='jam')text('DEADLOCK / CHANGE A ROUTE',450,150,'#f1a086',15);
  const blend = reducedMotion?1:Math.min(1,(now-movedAt)/Math.min(130,500/Number($('speed').value)));
  for(const r of state.robots){
    const old=previous.get(r.id)||r, x=(old.x+(r.x-old.x)*blend)*tile+30, y=(old.y+(r.y-old.y)*blend)*tile+30;
    if(r.id===selected){ctx.strokeStyle=r.blocked?'#ed927b':'#bbf7c7';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x-26,y-26,52,52,10);ctx.stroke();}
    rect(x-20,y-8,40,32,'#0a1511',9);rect(x-19,y-17,38,33,r.blocked?'#dd9c80':r.id===1?'#b3edbf':'#92c6cb',9,'#d4ead0');
    rect(x-13,y-10,26,13,'#1b3527',4);rect(x-9,y-6,5,4,'#d8f5c9',1);rect(x+4,y-6,5,4,'#d8f5c9',1);
    rect(x-7,y+9,14,3,'#4d7254',1);ctx.strokeStyle='#b9deaf';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-18);ctx.lineTo(x,y-23);ctx.stroke();
    if(r.cargo)part(x+18,y+11,.95);
    text(robotName(r.id),x,y+34,r.blocked?'#f4b095':'#b5d2b7',10);
    if(r.blocked)text('!',x+25,y-24,'#ffc0a9',16);
  }
  requestAnimationFrame(draw);
}
$('run').onclick = () => setRunning(!running);
$('step').onclick = () => {setRunning(false);tick();};
$('reset').onclick = () => reset(state.scenario === 'jam');
$('speed').onchange = () => {if(running)setRunning(true);};
$('jam').onclick = () => {reset(true); $('floor').scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'center'});};
$('factory').onclick = () => reset(false);
$('template').onchange = loadEditor;
$('editor').oninput = () => {$('draft-status').textContent = $('editor').value === templates[$('template').value].source ? 'SAVED' : 'UNSAVED';};
$('save').onclick = save;
$('deploy').onclick = () => {const program=save();if(program){setRunning(false);deploy(state,selected,program);renderUI();message(`Deployed ${program.name} v${program.version} to ${robotName(selected)}. Press Run or Step.`);}};
$('child-program').onchange = () => {setChildProgram(state,templates[$('child-program').value]);renderUI();};
$('roster').onclick = event => {const card=event.target.closest('[data-robot]');if(card){selected=Number(card.dataset.robot);renderUI();}};
canvas.onclick = event => {const box=canvas.getBoundingClientRect(),x=Math.floor((event.clientX-box.left)/box.width*WIDTH),y=Math.floor((event.clientY-box.top)/box.height*HEIGHT);const r=state.robots.find(r=>r.x===x&&r.y===y);if(r){selected=r.id;renderUI();}};
document.addEventListener('keydown',event=>{if(['TEXTAREA','SELECT','INPUT','BUTTON','SUMMARY'].includes(document.activeElement.tagName))return;if(event.code==='Space'){event.preventDefault();setRunning(!running);}if(event.code==='ArrowRight'){event.preventDefault();setRunning(false);tick();}});
// Read-only state inspection for deterministic browser QA; no hidden mutation controls.
Object.defineProperty(window, 'rsi', { value: Object.freeze({ snapshot: () => structuredClone(state) }) });
loadEditor();renderUI();requestAnimationFrame(draw);
