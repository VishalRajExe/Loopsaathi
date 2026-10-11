# Phases — LoopSaathi local build

Complete each **Done when** check before marking a phase done. Keep a working vertical slice ahead of visual polish. Update `Memory.md` after each phase with actual files, commands/results, decisions, issues and the next step.

## Phase 0 — Discover and specify (**done**)

- Read existing docs and all six local reference repos; verify usable source/model paths and current toolchain.
- Rewrite the six docs under `docs\`, rename `Rules (1).md` to `Rules.md`, and record the exact-path Repo Map in `Architecture.md`.
- **Done when:** six expected docs describe only the local stack, Repo Map paths exist, Java 21/Maven/Python 3.13/MySQL findings and the real SavedModel decision appear in `Memory.md`.

## Phase 1 — Scaffold and connect (**done**)

- Create `app\frontend` (Vite React **JavaScript/JSX**, React Router, pinned Tailwind v3, lucide-react and local fonts), `app\backend` (Boot 3.x / Java 21 / Maven), `app\ai-service` (Python 3.13 FastAPI), plus `app\start-all.bat` and an initial `app\README.md`.
- Configure Spring to reach local MySQL `loopsaathi` on port 3306; add minimal entities/bootstrap so idempotent fictional rules/partners/pickups seed once. Provide frontend routes and Python `/health`.
- **Done when:** Maven boot succeeds against MySQL, the expected demo seed counts are present, FastAPI health answers on :8000 and Vite routes render on :5173. `start-all.bat` starts the three processes with MySQL already running.

## Phase 2 — Spring API and business rules (**done**)

- Implement the schema/DTOs, server validation, status log and transactional forward-only transitions in `Architecture.md`; add searchable rules, partner filtering and computed impact endpoints.
- Centralize JSON errors: `400` bad input, `404` absent IDs, `409` invalid transition, `500` unexpected errors without stack traces.
- **Done when:** direct API calls create → accept → collect → deliver, bad weight is `400`, skipping/repeating a state is `409`, wrong-stream destination is rejected and impact matches stored records.

## Phase 3 — Browser vertical slice (**done**)

- Connect Home, Waste Guide **text/manual**, Request/My requests, Collector and Impact to Spring through one `fetch` client; role switch is view-only. Add status/stream/demo badges and basic loading/error/empty states.
- **Done when:** from :5173 the text/manual journey reaches `DELIVERED`, totals update and reload preserves the pickup; the browser uses only the Spring `/api` URL.

## Phase 4 — Real photo AI and fallback (**done**)

- Copy the supplied WasteWise `model_20_classes` SavedModel out of the read-only repo; pin Python 3.13-compatible TensorFlow, FastAPI upload dependencies, and verify loading/signature, 299×299 preprocessing and the 20-class order with a real fixture photo. Implement Python `/classify` and the label→stream translator; Spring obtains curated instructions and applies a 10-second timeout, <0.6 review threshold and unknown/hazardous review rules.
- **Done when:** an actual supported-class photo produces a traceable, tentative label/stream; an ambiguous/unsupported image asks for manual review; with Python stopped, search/selection/pickup remain usable. If loading fails, record the limitation honestly in `Memory.md` rather than simulating recognition.

## Phase 5 — E-waste and presentation (**done**)

- Add the distinct E-waste page/route and fictional drop-point card. Apply `Design.md`: local Manrope/Inter, inline SVG art, mobile bottom nav, accessible sheets, big collector actions, feedback and demo labels.
- **Done when:** phone/earphones route to `E_WASTE`, battery displays special handling, only eligible `UNVERIFIED` demo partners are offered, and phone/desktop layouts remain operable with keyboard and touch.

## Phase 6 — End-to-end check and handoff (**done with browser follow-up**)

- Exercise text and real-photo paths, all pickup states, invalid requests, an AI outage and refresh persistence with all local services. Complete `app\README.md` with prerequisites, exact Windows startup commands, demo script, any `Source:`-credited repo use and honest AI limitations; update `Memory.md` last.
- **Done when:** another person can start the three app processes with MySQL running and reproduce the whole API-backed journey locally; tests/check results and remaining gaps are recorded. Built-in browser navigation timed out in the current environment, so visual browser verification remains a manual follow-up; HTTP route checks and the production build pass.

If time is tight, simplify animations and secondary cards first. Preserve a real API-backed text/manual pickup journey, truthful totals and the AI fallback; report any incomplete photo integration explicitly.
