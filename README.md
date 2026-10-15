# RSI — Recursive Self-Improvement

A small, playable programmable factory. One robot carries parts to an assembler; new robots run your chosen instruction tape and join the supply loop. Built with native JavaScript, Canvas 2D and CSS. No runtime dependencies, backend, build step, external assets, analytics or paid services.

## Launch locally

Requires Node.js 20 or newer.

```powershell
cd C:\dev\tandem_tales\rsi
npm start
```

Open **http://127.0.0.1:4173**. If that port is occupied:

```powershell
$env:PORT='4174'
npm start
```

The preview binds to your own computer only. Stop it with Ctrl+C. Do not open `index.html` directly as a file: browsers restrict JavaScript module loading there.

## First experiment

1. Press **Run**. The supplied Courier tape is already installed on R01.
2. Watch R01 deliver three parts, activate the assembler, and build R02 at tick 64.
3. R02 follows the same route and contributes to R03, which comes online at tick 112. You can keep running after this milestone. Eighteen supplied parts can build six additional robots.
4. Click a robot or its roster card to see its instruction pointer, status, cargo, deliveries, build count, parent and program revision.
5. Use **Pause**, **Step** and speed controls to inspect the construction and traffic. Space toggles run; Right Arrow steps when focus is outside a control.

## Change the system

Choose an editable program slot, change the tape, then **Save revision**. Save validates the program and updates that slot. **Deploy to Rxx** saves and installs the revision on the selected robot, pauses, and restarts its instruction pointer at line 1. It preserves the robot's location and cargo, so the route must make sense from there.

Choose **New robots will run** to select a saved program for future builds. Each construction job captures its own program copy when activated. Editing the template later does not rewrite that job or existing robots. Express uses a shorter return route; Experiment is a spare slot for your own design.

The floor has 15 columns and 11 rows. Coordinates start at `(0, 0)` in the upper left. Outer walls and machines are not walkable. The bin is at `(2, 4)`, assembler `(11, 4)`, and new-robot output `(10, 5)`.

```text
move 10 7
move 3 7
move 3 4
pick W
move 10 4
drop E
activate E
repeat
```

- `move x y`: move one tile per tick toward a waypoint, horizontal first. This is explicit routing, with no automatic pathfinding around obstacles.
- `pick N|E|S|W`: take one adjacent part from the bin or floor. Capacity is one.
- `drop N|E|S|W`: put the carried part into an adjacent machine, back in the bin, or onto a floor tile.
- `activate N|E|S|W`: start an adjacent assembler if it is idle and holds at least three parts. A busy or under-supplied assembler is a no-op, so couriers can continue supplying it.
- `repeat`: return to the first instruction. It takes a tick and must end the tape.

Failed movement, pickup, drop or wrongly aimed activation waits on the same instruction and retries. `#` starts a comment. The live debug arrow marks the **next** instruction; the status describes the **previous** tick.

## Traffic lab

**Load traffic jam** replaces the current floor with two opposing robots. Press Step to see both block. Select R01, choose Experiment, paste the following and deploy:

```text
move 6 5
move 9 5
repeat
```

Four steps later R01 has detoured to `(9, 5)` and R02 has reached `(4, 4)`. **Return to factory** restores the seed scenario. Reset restarts the current scenario while keeping your saved program slots and child-program choice.

## Verify

```powershell
npm test
```

Twelve Node tests cover resource conservation, construction timing, spawning, program snapshots, output blockage, collision priority, deadlock resolution, all instruction types, compiler diagnostics, reset and 10,000-tick determinism. See [QA.md](QA.md) for recorded evidence.

Optional `node tests/browser-smoke.mjs` uses an **already installed** Playwright and Chromium. This environment's paths are defaults; override `PLAYWRIGHT_PACKAGE`, `CHROMIUM_PATH`, and `RSI_URL` for your machine. It downloads nothing. Screenshot/report output goes to ignored `.preview/`.

## Static hosting readiness

The game files use relative URLs and work under a GitHub Pages repository path. `npm run build` copies only `index.html`, `style.css`, `app.js`, `sim.js`, `icon.svg` and `.nojekyll` into `docs/`, the Pages publication folder. Tests, QA notes and preview tools stay outside that public bundle. `server.mjs` is only a local preview helper. No Actions workflow or paid service is needed.

The source repository is [private TandemTales/RSI](https://github.com/TandemTales/RSI). Initial remote attempts were blocked; the later authenticated chat confirmation was accepted for creation. Publication status and verification are recorded in [QA.md](QA.md). Repository visibility and paid plan must remain unchanged.

**Public hosting is blocked by the existing plan.** GitHub rejected Pages creation with HTTP 422: “Your current plan does not support GitHub Pages for this repository.” No site was published, no plan purchased, and source visibility remains private. The prepared `docs/` bundle is playable locally at `http://127.0.0.1:4173/docs/` while the preview server runs (or substitute your chosen port).

## Prototype boundaries

One fixed floor, one parts bin and one assembler. The factory fabricates additional robots; it does not expand its building footprint. Program improvements are written by the player, not invented autonomously. There is no mining, tech tree, server, Godot, automatic pathfinding, audio or save-game system. Programs and state live in the current tab and reset on refresh. Deliberately bad routes can block forever; use the debugger and deploy a correction or Reset. Browser screenshots and scripted interactions are not human playtesting or real-device performance evidence.
