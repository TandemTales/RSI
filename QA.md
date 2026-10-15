# Validation record — 2026-10-15

## Scope and isolation

Created only `C:\dev\tandem_tales\rsi` after confirming it did not exist. Read the available global instructions and local memory summary. No ancestor `AGENTS.md` or existing RSI content was found. No files from other projects or automations were edited.

## Simulation: 12 / 12 passing

Command: `npm test` (Node.js v24.14.0).

- Default seed builds R02 at tick **64** and R03 at **112**. R02 contributes parts before R03 construction. At tick 112, R02 has delivered two parts; 11 parts remain in the bin, 1 is buffered and 6 are embodied in new robots.
- Construction consumes exactly **3** buffered parts, reserves them during **6** build ticks, and accounts for them in the completed robot.
- Program name, version and code are captured at construction start. Later template edits do not change existing robots or active construction.
- Blocked output retains the completed job and its reserved parts. Clearing the output spawns exactly once.
- Head-on movement never swaps or overlaps robots. A deliberate detour clears both robots.
- Contested destinations use ascending robot ID priority, even if the robot array order differs.
- Wall/machine obstruction and invalid interactions wait safely.
- Pickup, loose drop, pickup and return-to-bin preserve the resource total.
- Empty-bin pickup waits. An under-supplied activation advances so delivery can continue.
- Compiler rejects malformed, out-of-bounds, machine-targeted and missing-loop programs, with line diagnostics.
- Two separate **10,000-tick** runs finish with deeply identical complete state. Every tick validates unique walkable positions, instruction bounds, capacity, nonnegative integer inventories and **18 / 18** conserved parts. Final state has seven robots, an empty bin and 18 embodied parts.
- Reset creates a fresh independent state.

JavaScript syntax checks: `node --check app.js`, `node --check sim.js`.

One initial test assertion sampled a detour after its repeat had already started returning. Corrected the observation to tick 4; simulation behavior did not need changing.

## Actual browser: 8 / 8 scenarios passing

Command: `node tests/browser-smoke.mjs`, using the installed Playwright package and Chromium, with the real locally served page at `http://127.0.0.1:4174`. No simulator state mutation was used by the browser test: it clicks controls, edits text, chooses selects, and reads the exposed snapshot.

1. Initial paused game renders.
2. Run, pause, speed and single step work; pause remains stable across a timed interval.
3. Clicking Step 112 times reaches three robots, including R02 contribution; roster selection, debugger and part audit update.
4. Choosing Express gives R02 that program. Saving Express v2 leaves the already running R02 at v1.
5. Invalid code shows a line diagnostic and is not deployed.
6. Loading the jam shows blocked robots; editing/deploying a detour resolves it.
7. **390×844**, **320×740**, and **844×390** CSS viewports have no horizontal overflow and Step remains functional.
8. No page JavaScript errors or HTTP failures were observed.

Local evidence in `.preview/`:

- `browser-report.json`: browser version, scenarios, error and request lists.
- `desktop-initial.png`: 1440px initial interface.
- `desktop-three-robots.png`: successful loop and live R02 debugger.
- `desktop-jam.png`: blocked traffic and highlighted instruction.
- `viewport-390x844.png`, `viewport-320x740.png`, `viewport-844x390.png`: responsive captures.

The initial desktop screenshot was visually inspected. These are headless-browser renders and scripted paths; no claim of human playtesting, real touchscreen input, audio verification or hardware performance follows.

## Environment and remote limits

The provided browser-control tool failed before initialization: `failed to prepare MXC sandbox: permission path cannot be represented losslessly`. Sandboxed localhost HTTP also failed with a socket-permission error. Existing Playwright/Chromium and a local-only preview outside that socket restriction successfully supplied actual browser evidence instead. The accessible preview is on port **4174**; the normal default launch port remains 4173.

Read-only GitHub checks verified authenticated account `shoejunk`, **active admin** membership in `TandemTales`, and no repository resolvable as `TandemTales/RSI`. The repository-create command was **not executed**: automatic approval review rejected it, stating that the original trusted delegation blocked remote creation and that later relay text did not lift that boundary. No alternate remote creation, upload, push or publication was attempted. Parent must resolve approval before any remote mutation. GitHub Pages plan eligibility was therefore not tested.
