export const WIDTH = 15, HEIGHT = 11, COST = 3, BUILD_TICKS = 6;
export const BIN = { x: 2, y: 4 }, ASSEMBLER = { x: 11, y: 4 }, OUTPUT = { x: 10, y: 5 };
const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
export const COURIER = `move 10 7
move 3 7
move 3 4
pick W
move 10 4
drop E
activate E
repeat`;
export const EXPRESS = `move 10 6
move 3 6
move 3 4
pick W
move 10 4
drop E
activate E
repeat`;
export function isFloor(x, y) {
  return x > 0 && y > 0 && x < WIDTH - 1 && y < HEIGHT - 1 &&
    !((x === BIN.x && y === BIN.y) || (x === ASSEMBLER.x && y === ASSEMBLER.y));
}
export function compile(source, name = 'Courier', version = 1) {
  const code = [];
  source.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.split('#')[0].trim().toLowerCase();
    if (!line) return;
    const [op, a, b, ...rest] = line.split(/\s+/);
    const fail = (message) => { throw new Error(`Line ${index + 1}: ${message}`); };
    if (op === 'move') {
      if (rest.length || b === undefined || !/^\d+$/.test(a) || !/^\d+$/.test(b) || !isFloor(+a, +b)) fail('move needs a walkable x y coordinate (inside the walls).');
      code.push({ op, x: +a, y: +b, line: index + 1 });
    } else if (['pick', 'drop', 'activate'].includes(op)) {
      if (!DIRS[a?.toUpperCase()] || b !== undefined) fail(`${op} needs one direction: N, E, S or W.`);
      code.push({ op, dir: a.toUpperCase(), line: index + 1 });
    } else if (op === 'repeat' && a === undefined) code.push({ op, line: index + 1 });
    else fail('use move, pick, drop, activate or repeat.');
  });
  if (code.length < 2 || code.at(-1).op !== 'repeat' || code.filter(c => c.op === 'repeat').length !== 1) throw new Error('End the program with exactly one repeat; add at least one action before it.');
  if (code.length > 64) throw new Error('Keep programs to 64 instructions or fewer.');
  return { name, version, source, code };
}
const clone = value => structuredClone(value);
const key = (x, y) => `${x},${y}`;
function log(s, message, kind = 'info') {
  s.events.unshift({ tick: s.tick, message, kind });
  s.events = s.events.slice(0, 40);
}
export function createRobot(id, x, y, program, parent = null) {
  return { id, x, y, program: clone(program), parent, pc: 0, cargo: 0, status: 'Ready', blocked: false, deliveries: 0, activations: 0 };
}
export function createState() {
  const program = compile(COURIER);
  const first = createRobot(1, 3, 4, program);
  first.pc = 3;
  return { tick: 0, initialParts: 18, bin: 18, floorParts: {}, station: 0, job: null,
    builtParts: 0, robots: [first], nextId: 2, childProgram: clone(program),
    events: [{ tick: 0, message: 'R01 online. Deliver 3 parts, then activate the assembler.', kind: 'spawn' }],
    goalTick: null, scenario: 'factory' };
}
export function setChildProgram(s, program) {
  s.childProgram = clone(program);
  log(s, `Next build will boot ${program.name} v${program.version}.`);
}
export function deploy(s, robotId, program) {
  const r = s.robots.find(r => r.id === robotId);
  if (!r) return;
  r.program = clone(program); r.pc = 0; r.blocked = false; r.status = 'Program deployed; restarting at line 1';
  log(s, `R${String(r.id).padStart(2, '0')} received ${program.name} v${program.version}.`);
}
export function accounting(s) {
  const carried = s.robots.reduce((n, r) => n + r.cargo, 0);
  const loose = Object.values(s.floorParts).reduce((a, b) => a + b, 0);
  const reserved = s.job ? COST : 0;
  return { bin: s.bin, carried, loose, buffered: s.station, reserved, built: s.builtParts,
    total: s.bin + carried + loose + s.station + reserved + s.builtParts };
}
function advance(r) { r.pc = (r.pc + 1) % r.program.code.length; }
function blocked(r, message) { r.status = message; r.blocked = true; }
export function step(s) {
  s.tick++;
  // Occupancy is frozen for this tick: no swaps or walking into a vacating tile.
  const occupancy = new Set(s.robots.map(r => key(r.x, r.y)));
  const claims = new Set();
  for (const r of [...s.robots].sort((a, b) => a.id - b.id)) {
    r.blocked = false;
    const c = r.program.code[r.pc];
    if (c.op === 'repeat') { r.pc = 0; r.status = 'Repeat → line 1'; continue; }
    if (c.op === 'move') {
      if (r.x === c.x && r.y === c.y) { r.status = `Reached (${c.x}, ${c.y})`; advance(r); continue; }
      const nx = r.x + Math.sign(c.x - r.x), ny = r.x === c.x ? r.y + Math.sign(c.y - r.y) : r.y;
      const dest = key(nx, ny);
      if (!isFloor(nx, ny)) blocked(r, `Wall or machine at (${nx}, ${ny})`);
      else if (occupancy.has(dest) || claims.has(dest)) blocked(r, `Traffic: (${nx}, ${ny}) occupied`);
      else {
        claims.add(dest); r.x = nx; r.y = ny; r.status = `Moving → (${c.x}, ${c.y})`;
        if (r.x === c.x && r.y === c.y) advance(r);
      }
      continue;
    }
    const [dx, dy] = DIRS[c.dir], tx = r.x + dx, ty = r.y + dy, target = key(tx, ty);
    const atBin = tx === BIN.x && ty === BIN.y, atStation = tx === ASSEMBLER.x && ty === ASSEMBLER.y;
    if (c.op === 'pick') {
      if (r.cargo) { r.status = 'Already carrying a part'; advance(r); }
      else if (atBin && s.bin > 0) { s.bin--; r.cargo = 1; r.status = 'Picked part from bin'; advance(r); }
      else if ((s.floorParts[target] || 0) > 0) {
        s.floorParts[target]--; if (!s.floorParts[target]) delete s.floorParts[target];
        r.cargo = 1; r.status = 'Picked loose part'; advance(r);
      } else blocked(r, atBin ? 'Waiting: parts bin empty' : 'Waiting: no part in that direction');
    } else if (c.op === 'drop') {
      if (!r.cargo) blocked(r, 'Cannot drop: empty hands');
      else if (atStation) {
        s.station++; r.cargo = 0; r.deliveries++; r.status = 'Delivered part to assembler'; advance(r);
        log(s, `R${String(r.id).padStart(2, '0')} delivered a part (${s.station} buffered).`, 'delivery');
      } else if (atBin) { s.bin++; r.cargo = 0; r.status = 'Returned part to bin'; advance(r); }
      else if (isFloor(tx, ty)) { s.floorParts[target] = (s.floorParts[target] || 0) + 1; r.cargo = 0; r.status = 'Dropped loose part'; advance(r); }
      else blocked(r, 'Cannot drop into a wall');
    } else if (c.op === 'activate') {
      if (!atStation) blocked(r, 'No assembler in that direction');
      else {
        if (!s.job && s.station >= COST) {
          s.station -= COST;
          s.job = { remaining: BUILD_TICKS, program: clone(s.childProgram), parent: r.id, started: s.tick };
          r.activations++; r.status = 'Construction started';
          log(s, `R${String(r.id).padStart(2, '0')} started a build → ${s.job.program.name} v${s.job.program.version}.`, 'build');
        } else r.status = s.job ? 'Assembler busy; continue route' : `Needs ${COST - s.station} more parts; continue route`;
        // An under-supplied activation is a no-op so the courier can keep supplying.
        advance(r);
      }
    }
  }
  if (s.job && s.job.started < s.tick) {
    s.job.remaining = Math.max(0, s.job.remaining - 1);
    if (s.job.remaining === 0) {
      if (s.robots.some(r => r.x === OUTPUT.x && r.y === OUTPUT.y)) s.job.waiting = true;
      else {
        const id = s.nextId++;
        s.robots.push(createRobot(id, OUTPUT.x, OUTPUT.y, s.job.program, s.job.parent));
        s.builtParts += COST;
        log(s, `R${String(id).padStart(2, '0')} online ← R${String(s.job.parent).padStart(2, '0')} · ${s.job.program.name} v${s.job.program.version}`, 'spawn');
        s.job = null;
      }
    }
  }
  if (s.robots.length >= 3 && s.goalTick === null && s.scenario === 'factory') {
    s.goalTick = s.tick;
    log(s, 'Recursive loop established: 3 robots online. Keep experimenting.', 'goal');
  }
  return s;
}
export function createJam() {
  const s = createState();
  s.scenario = 'jam'; s.bin = 15; s.builtParts = 3; s.nextId = 3;
  s.robots = [createRobot(1, 6, 4, compile('move 9 4\nrepeat', 'Eastbound')),
    createRobot(2, 7, 4, compile('move 4 4\nrepeat', 'Westbound'), 1)];
  s.events = [{ tick: 0, message: 'Head-on traffic. Edit a route around the other robot, then deploy it.', kind: 'info' }];
  return s;
}
