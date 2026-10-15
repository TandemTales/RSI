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

Read-only GitHub checks verified authenticated account `shoejunk`, **active admin** membership in `TandemTales`, and no repository resolvable as `TandemTales/RSI`. Initial repository-creation attempts were rejected because later relay approvals were not accepted. After the parent verified the authenticated chat response “Confirm both publications” to the explicit private-repository/public-Pages question, the single requested retry succeeded. `https://github.com/TandemTales/RSI` was created private. No alternate route was used after a rejection.

The Pages bundle is generated into `docs/` using an explicit six-file allowlist. No tests, QA notes, preview helpers or dependencies are included.

## Private push and Pages attempt

- Confirmed new repository `TandemTales/RSI`, `isPrivate: true`, viewer permission `ADMIN`.
- Pushed `main` successfully. GitHub's commit API returned `aff13d4008a252b97338e7bc4d08c32409ee14e6`, identical to local HEAD for the prototype plus static bundle. Final documentation updates are verified by comparing local HEAD and the remote commit API again after their push.
- Organization API reports existing plan `free`.
- Requested Pages creation from branch `main`, folder `/docs`, without changing source visibility or plan.
- GitHub returned **HTTP 422**, exact message: **“Your current plan does not support GitHub Pages for this repository.”** No deployment occurred and there is no verified public playable URL. No purchase, visibility change, credential creation or authorization expansion was attempted.
- A bundle browser check initially hit `ERR_CONNECTION_REFUSED` because the old preview process had stopped. Restarted the local-only preview and added directory-index support for `/docs/` to the development server before retrying. This change affects the local preview helper only.
- The exact `docs/` bundle then passed all **8 browser scenarios** at `http://127.0.0.1:4174/docs/`, including construction through three robots, editing, inheritance, jam resolution and responsive controls. Evidence is in `.preview/pages-bundle/`; the report lists no page errors or HTTP failures. SHA256 comparison confirms all six bundle files match their reviewed root sources.
- A follow-up `GET /repos/TandemTales/RSI/pages` returned **404 Not Found**, confirming there is no Pages site to report as deployed.

## Authorized public publication

The owner explicitly authorized making the existing repository public after Pages rejected the private repository on the existing plan. Before changing visibility, reviewed all **3 commits**, all **21 unique file blobs**, all historical tracked paths, commit authors and the current working tree. Automated scans found no private keys, credential/token patterns, credential URLs, secret assignments, sensitive identifier patterns or credential/database files. Manual inspection found no material private-data disclosure blocker; the history contains prototype source, tests, non-secret environment paths and development notes. No unrelated project, memory file, account credential, private dataset or screenshot is tracked. Commit author fields use the placeholder `User <user@example.com>`.

Changed only the existing `TandemTales/RSI` repository to public, verified `isPrivate: false`, and enabled Pages from `main` → `/docs` with HTTPS enforced. No separate repository, plan purchase, credential creation or persistent authorization expansion was used. An anonymous check during the initial `building` state returned the expected not-yet-published HTTP 404; final deployed verification follows after build completion.

### Verified live result

- Public playable URL: **https://tandemtales.github.io/RSI/**.
- Pages deployment run **38796336750** completed successfully for source commit `02e375d7ad0f04d76522648e5d62792107bd8af9` (build, deploy and status-report jobs all successful). Remote `main` and local HEAD matched for that deployment. The earlier run was superseded by that documentation update.
- Anonymous requests without a GitHub token, authorization header or stored cookies returned **HTTP 200** for the page, stylesheet, app module, simulator module and icon. Every SHA256 matched the local `docs/` bundle. Report: `.preview/public/asset-report.json`.
- A fresh anonymous Chromium session at the public HTTPS URL passed all **8 browser scenarios**: initial rendering; run/pause/step/speed; construction through R03 with R02 contribution; selection/debugging; chosen-program propagation and revision isolation; invalid-code diagnostics; jam resolution through a user-edited detour; responsive controls at 320px, 390px and landscape widths. No page JavaScript errors or HTTP failures occurred. Report and screenshots: `.preview/public/`.
- Re-ran all **12 simulation tests** successfully. The public browser check exercises the same runtime bundle; this final evidence-only documentation commit does not alter any playable asset.
