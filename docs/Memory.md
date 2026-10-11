# Memory — LoopSaathi (read first; update after each phase)

**As of 11 October 2026:** Phases **0–6 complete** (specification, scaffold, backend, browser vertical slice, real photo AI, presentation, and local end-to-end checks). This file records evidence from the current workspace; it is not a deployment claim.

## Project and fixed choices

- Local-only prototype: identify waste → request pickup → accept → confirm actual kg → deliver to eligible destination → compute impact. No login, cloud, maps, chat, payment or invented metrics.
- `D:\Loopsathi\app\` contains Vite React **JavaScript/JSX** + React Router + pinned Tailwind v3 + lucide-react; Spring Boot **3.5.6** / Java 21 / Maven; FastAPI / TensorFlow SavedModel on **Python 3.13**; MySQL `loopsaathi` at `localhost:3306`.
- Ports: UI **5173**, Spring **8080**, Python **8000**, MySQL **3306**. Browser uses only Spring `http://localhost:8080/api`; role switcher changes view, not identity/authorization.
- Statuses `REQUESTED → ACCEPTED → COLLECTED → DELIVERED`. Curated MySQL `waste_rules` owns guidance. Demo partners/seeded rows carry Demo data labels; partner verification stays `UNVERIFIED`.

## Evidence and AI decision

- Toolchain: `java -version` → **21.0.8**; `mvn -v` → **3.9.11** using Java 21; `node -v` → **24.19.0**; `npm -v` → **11.17.0**. `py -0p` lists Python **3.14** default and installed **3.13**; the AI service explicitly uses `py -3.13`. MySQL accepted the configured local connection on port 3306; Spring created/updated the schema and loaded the expected seed counts. The local password is kept in ignored `app\backend\application-local.properties`.
- **AI path 1 completed:** the real TensorFlow SavedModel from `githubrepos\wt23-wastewise-main\AI\models\model_20_classes\` is copied into `app\ai-service\model_20_classes\`. Pinned environment versions are FastAPI **0.116.1**, TensorFlow **2.20.0**, Pillow **11.3.0**, NumPy **2.2.6**, Uvicorn **0.35.0**, Python **3.13.3**. The graph loader uses the verified 20 labels and 299×299 RGB `/255` preprocessing; a reference banana-peel photo returned `banana_peels` / `WET` with confidence about **0.87** during the final live check. “Plastic bottle” is not one of its labels and remains text/manual.
- `TrashTag-main` contributes form/card/list patterns from `src\components\PostForm.jsx`, `TrashCard.jsx`, `DispatchHome.jsx`; its current `TopBar.jsx` is brand-only, so the LoopSaathi role switch is new. `WasteSegregationUsingAI-main` contributes the upload/preview interaction pattern, but its local TF.js model folders contain JSON without weight shards. `EcoFind-main` contributes e-waste/facility-card layout ideas only; its real facility data and verified claims are not used. `serverless-master` has only a README locally; `aws-plaid-demo-app-main` is unrelated cloud/finance infrastructure. Exact paths and caveats are in `Architecture.md` → Repo Map.

## File map

| Path | State / purpose |
|---|---|
| `docs\PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md` | Local-stack specifications, verified Repo Map and progress |
| `app\README.md`, `app\start-all.bat`, `.gitignore` | Windows runbook, three-process launcher and local-secret exclusions |
| `app\frontend\src\pages\`, `components\`, `api\client.js`, `lib\` | Six JSX screens, shared UI/artwork, Spring-only fetch wrapper, validation/error helpers |
| `app\backend\src\main\java\com\loopsaathi\` | JPA entities, demo seeds, REST controllers, service rules/impact, CORS and central errors |
| `app\ai-service\{main.py,classifier.py,translator.py,model_20_classes\}` | FastAPI health/upload service, real SavedModel inference and translator |

## API and local config snapshot

- Contract: `Architecture.md` REST table. Spring `/api/classify`, `/api/waste-items`, `/api/pickups` (create/list/accept/collect/deliver), `/api/partners`, `/api/impact`; Python `/health`, `/classify`. Live checks exercised text classify, photo classify, all transitions and errors.
- `VITE_API_URL=http://localhost:8080/api`; Spring defaults to the fixed local JDBC URL and reads `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` or ignored `backend/application-local.properties`; `LOOPSAATHI_AI_URL` defaults to `http://localhost:8000/classify`. CORS allows `http://localhost:5173`; no password is tracked.
- Data policy: status/log writes and impact are MySQL-backed; model instruction text is never trusted. Python timeout/uncertainty returns `needsReview=true`; text/manual flow remains available when Python is down.

## Checks completed

1. `mvn -q package` in `app\backend`: **passed**, 12 tests, 0 failures/errors.
2. `npm run build` in `app\frontend`: **passed** with Vite 6.3.5 and local font assets.
3. `py -3.13 -m py_compile main.py classifier.py translator.py` in `app\ai-service`: **passed**.
4. Live services: MySQL-backed Spring on :8080, FastAPI/model health on :8000, Vite on :5173. Text classify, real banana photo classify, create → accept → collect → deliver, invalid transitions (409), bad weight (400), wrong destination (400), refresh/API persistence and empty special-care destinations were checked. Built-in browser navigation timed out in this environment; HTTP route smoke checks returned 200.

## Known issues / boundaries

- There is no authentication or real-user ownership: **My requests** shows local demo records because the product explicitly has no login.
- Photo AI recognizes only the copied WasteWise 20-class model. Unknown/low-confidence results ask for manual confirmation.
- Special-care currently has no seeded destination, so collection can be recorded but delivery is correctly blocked.
- The built-in browser could not complete navigation in this environment, so visual browser verification remains a manual follow-up even though Vite HTTP routes and production build pass.
- This is local-only. No cloud deployment, real facility directory, map, notification or environmental-impact claim is planned.

## Next concrete step

Use `app\README.md` to run the local demo. Keep the scope frozen; if manual browser use finds a regression, make a focused fix, rerun the smallest meaningful check and update this file.

## Reference repos used

- `TrashTag-main` — request form/card/status/sheet interaction patterns; Supabase/maps/chat/payment removed.
- `wt23-wastewise-main` — real 20-class SavedModel, label order, preprocessing evidence and translator mapping.
- `WasteSegregationUsingAI-main` — upload/preview/camera interaction pattern; incomplete local TF.js weights not used.
- `EcoFind-main` — e-waste booking/facility-card layout only; real facilities and verified claims not used.
- `serverless-master` and `aws-plaid-demo-app-main` — architecture/CRUD review only; no code imported.
