# Architecture — LoopSaathi (local prototype)

## Runtime and ownership

```text
Browser: Vite + React JS/JSX (:5173)
     │ fetch /api (VITE_API_URL=http://localhost:8080/api)
     ▼
Spring Boot 3.x / Java 21 (:8080) ─── MySQL loopsaathi (localhost:3306)
     │                                  pickups, status log, partners, waste rules
     └── multipart photo, 10 s timeout ──► FastAPI / Python 3.13 (:8000)
                                           TensorFlow WasteWise SavedModel
```

The browser calls **only Spring**; CORS permits `http://localhost:5173`. Spring owns persistence, validation, curated instructions, transitions and impact calculations. FastAPI proposes a photo label/stream; it does not create pickups or write MySQL. If FastAPI cannot classify, Spring returns a review-needed response and text/manual selection still works. No sign-in; the Household/Collector switcher changes the demo view, not permissions.

| Layer | Choice |
|---|---|
| UI | Vite, React JavaScript/JSX, React Router, pinned Tailwind CSS v3, lucide-react, locally packaged Manrope/Inter variable fonts, native `fetch` |
| API | Maven, Spring Web, Spring Data JPA, Bean Validation, MySQL driver; Spring Boot 3.x on Java 21 |
| Image AI | FastAPI, `python-multipart`, Pillow, pinned TensorFlow; Python 3.13 selected explicitly with `py -3.13` |
| Data | MySQL `loopsaathi` on `localhost:3306`; JPA `ddl-auto=update` for this prototype |

## Implemented app file map

`D:\Loopsathi\app\` is the running local project. `D:\Loopsathi\docs\` holds the six specifications; `D:\Loopsathi\githubrepos\` remains read-only reference material. Build output, dependencies and the local database password are intentionally ignored.

| Path under `app\` | Responsibility |
|---|---|
| `README.md`, `start-all.bat` | Windows prerequisites/config, separate startup commands, demo script, credits; launcher for the three app processes (MySQL must already run) |
| `frontend\package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js` | Vite scripts and pinned Tailwind v3 build configuration |
| `frontend\src\main.jsx`, `App.jsx`, `index.css` | React Router entry, view/role shell, tokens and responsive styles |
| `frontend\src\api\client.js` | One `fetch` client using `VITE_API_URL`; multipart upload and JSON/error handling |
| `frontend\src\pages\{Home,WasteGuide,RequestPickup,Collector,EWaste,Impact}.jsx` | Routes `/`, `/guide`, `/request`, `/collector`, `/ewaste`, `/impact` |
| `frontend\src\components\`, `frontend\src\data\`, `frontend\src\lib\` | Shared cards/badges/sheets/SVGs, presentation helpers; authoritative rules and totals stay in Spring/MySQL |
| `backend\pom.xml`, `backend\src\main\resources\application.properties` | Java dependencies, database/AI URL and local CORS settings |
| `backend\src\main\java\com\loopsaathi\{controller,service,repository,model,dto,config,exception}\` | REST entry points, rules/impact/transition logic, JPA entities, DTOs, CORS, centralized errors |
| `ai-service\main.py`, `classifier.py`, `translator.py`, `requirements.txt`, `model_20_classes\` | Health/upload endpoints, SavedModel loading/inference, bounded 20-label mapping, pinned dependencies and copied model files |

## MySQL schema and invariants

JSON uses **camelCase**; MySQL columns use **snake_case**. JPA mappings/DTOs make this explicit. `id` is a string such as `PICKUP-4F9K2A` (six random uppercase alphanumeric characters); collisions are retried.

| Table | Columns / constraints |
|---|---|
| `pickups` | `id` PK, `waste_type`, `stream` (`WET`, `DRY`, `SANITARY`, `SPECIAL_CARE`, `E_WASTE`), `estimated_weight_kg` (>0, ≤100), `confirmed_weight_kg` nullable until collected, `locality`, `preferred_slot` (`MORNING`, `AFTERNOON`, `EVENING`), `status`, nullable `collector_id`/`destination_id`, `is_demo`, `created_at`, `updated_at` |
| `pickup_status_log` | `pickup_id` FK, `status`, `at` timestamp; append once for initial `REQUESTED` and each accepted transition (use a row ID or composite key) |
| `partners` | `id`, `name`, `accepted_streams` (persisted set), `destination_type` (`COMPOSTING`, `BIOGAS`, `RECYCLER`, `E_WASTE`), `verification_status` = `UNVERIFIED`, `is_demo` = true |
| `waste_rules` | `id`, `item_name`, `keywords` (searchable), `stream`, `instruction` (short curated line), `special_route` |

Idempotently seed about 30 rules across all five streams, four **fictional** partners (Campus Composting Unit, Demo Biogas Plant, Demo Dry Recovery Centre, Demo E-Waste Collection Point) and about six synthetic pickups at different statuses. Seeded pickups and partners are `is_demo=true`; no real names, contact details or exact addresses. A user-created request is distinguishable from a seeded record. Use transactions for pickup + status-log changes.

`REQUESTED → ACCEPTED → COLLECTED → DELIVERED` is the only progression. Accept requires `collectorId`; collect requires actual `confirmedWeightKg` (>0, ≤100); deliver requires a destination that accepts that pickup's stream. No skipping, repeat or backward action. Invalid transition is `409`; invalid fields/weight/stream/destination are `400`; unknown pickup/destination is `404`. `confirmedWeightKg` remains null until collection.

## REST contract

All public app paths are prefixed `/api` on port 8080; response keys use camelCase. `POST /api/classify` accepts `multipart/form-data` with **either** `image` file **or** `text` field. The Python-only endpoints live on port 8000 and are called by Spring, not the browser.

| Method | Path | Input → output |
|---|---|---|
| POST | `/api/classify` | image or text → `{ item, stream, confidence, reason, instruction, specialRoute, needsReview }`; proposed fields may be null/unknown pending manual choice |
| GET | `/api/waste-items?search=` | name/keyword search → matching curated rules for suggestions and manual correction |
| GET | `/api/pickups?status=&stream=` | list of pickups with status log, optional enum filters |
| POST | `/api/pickups` | `{ wasteType, stream, estimatedWeightKg, locality, preferredSlot }` → new `REQUESTED` pickup/ID |
| PATCH | `/api/pickups/{id}/accept` | `{ collectorId }` → `ACCEPTED` |
| PATCH | `/api/pickups/{id}/collect` | `{ confirmedWeightKg }` → `COLLECTED` |
| PATCH | `/api/pickups/{id}/deliver` | `{ destinationId }` → `DELIVERED` |
| GET | `/api/partners?stream=` | demo partners, optionally accepting stream |
| GET | `/api/impact` | computed summary below |
| GET / POST | `http://localhost:8000/health`, `/classify` | Python health / multipart `image` → `{ label, confidence, stream, needsReview }` |

`/api/impact` returns `{ totalRequests, byStatus, requestedKgEstimated, collectedKgConfirmed, deliveredKgByType, eWastePickups, completionRate, containsDemoData }`. `requestedKgEstimated` sums estimates for **all** pickups; `collectedKgConfirmed` sums confirmed kg only for current `COLLECTED` or `DELIVERED` pickups; `deliveredKgByType` sums confirmed kg only for `DELIVERED`, grouped by partner type. `eWastePickups` counts pickups with `E_WASTE` stream; `completionRate` is delivered count ÷ total (0 when empty). These measures overlap by design and are labelled separately, never added together. `containsDemoData` reflects seeded rows in the summary.

## Classification and fallback

1. Text search uses `waste_rules` names/keywords. Spring returns that rule's stream and instruction; an unknown/mixed/hazardous item requires manual review. The user may change the suggested stream.
2. Image upload goes browser → Spring → FastAPI. FastAPI loads the **actual WasteWise SavedModel** copied from the reference directory, resizes RGB input to 299×299, divides RGB values by 255, and uses the verified 20-class output order from the training notebook. Its translator returns a *proposed* LoopSaathi stream. The local service was exercised with a reference banana-peel photo and returned a supported Wet suggestion.
3. Spring resolves the proposed label against local `waste_rules` for **all instructions**. A score below 0.6, unmapped class, hazardous/mixed uncertainty, timeout (~10 s), incompatible model or offline AI sets `needsReview=true`; show an honest manual category chooser. `confidence` can be null when no model prediction exists; never invent a score or a rule.
4. Electronics go to `E_WASTE`; batteries use the curated dedicated/special-care rule and `specialRoute=true`. A manual correction uses a curated rule or clearly generic stream guidance, never model-generated disposal text. Image-only labels cannot identify items outside the 20 classes: notably, *plastic bottle is not a WasteWise model class*; the demo may classify it by text/manual selection instead.

The source notebook later mentions Xception `preprocess_input` for visualization, but the exported serving graph was validated with the training path used here: RGB 299×299 input divided by 255. Python/model failure must not block pickup creation; low-confidence or unavailable image results still require manual review.

## Local run assumptions

Start MySQL on `localhost:3306` first. Use database `loopsaathi` (Spring's local JDBC URL can enable `createDatabaseIfNotExist=true`); configure the supplied local database account via `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD`, without committing its password. Set `LOOPSAATHI_AI_URL=http://localhost:8000/classify` for Spring→FastAPI and `VITE_API_URL=http://localhost:8080/api` for Vite. The implementation also accepts the ignored `backend/application-local.properties` for the local password.

In three separate PowerShell terminals (or by running `app\start-all.bat`) after MySQL and the ignored local password configuration are ready:

| Working directory | Commands |
|---|---|
| `D:\Loopsathi\app\backend` | `mvn spring-boot:run` |
| `D:\Loopsathi\app\ai-service` | `py -3.13 -m venv .venv`; `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`; `.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000` |
| `D:\Loopsathi\app\frontend` | `npm install`; `npm run dev -- --host 127.0.0.1 --port 5173` |

Open `http://localhost:5173`. `start-all.bat` launches the three app processes after MySQL and local credentials are ready; `app\README.md` is the runbook for the actual files and tested commands. Text/manual pickups still work with the Python process stopped.

## Repo Map — verified local references

Paths below are exact and relative to `D:\Loopsathi\githubrepos\`. These repos are **sources to adapt**, not the running LoopSaathi stack. Any reused block gets a `Source:` comment and `app\README.md` credit; do not copy unrelated services or unverified facility claims.

| Repo | Verified purpose and key paths | Adapted → `app\` destination |
|---|---|---|
| `TrashTag-main` | Current React/Vite pickup UI: `src\App.jsx` holds Supabase request mutators; `src\components\PostForm.jsx` handles form/preview; `src\components\TrashCard.jsx` shows an accept action; `src\components\StatusBadge.jsx`, `src\components\DispatchHome.jsx`, `src\components\Toast.jsx` show card/status/list/feedback patterns. **Current** `src\components\TopBar.jsx` is only a brand header; the README's role-switch description is stale. | Adapt form/card/badge/list interactions to `frontend\src\components\` and `pages\{RequestPickup,Collector}.jsx`; implement our own Household/Collector switcher, local REST calls, 4-step lifecycle. No Supabase, location/map, chat, payment, verification or live tracking. |
| `wt23-wastewise-main` | **Real Python-side model**: `AI\models\model_20_classes\saved_model.pb`, `keras_metadata.pb`, `variables\variables.index`, `variables\variables.data-00000-of-00001`. Training and 20 labels/preprocessing: `AI\classifier_tensor_flow\tensorflow_pretrained_model_20classes_v02.ipynb`. Disposal mapping examples: `AI\MLOps\deploy_fastai\deploy_fastai_notebook.ipynb`, `WD\next-js-app\src\components\ShowResult.js`; camera/result UI: `WD\next-js-app\src\components\TakePicture.js`. Its bins/text are region-specific and its remote inference URL is not local. | Copied the model into `ai-service\model_20_classes\`; adapted graph inference and 20-label mapping in `classifier.py`/`translator.py`; ported scan/result concepts to `frontend\src\pages\WasteGuide.jsx`; curated local stream/instruction rows in backend, not the foreign bin directions. SavedModel photo inference is verified on a reference banana-peel image. |
| `WasteSegregationUsingAI-main` | React/TF.js camera/upload example: `react_app\src\components\UploadImageButton\UploadImageButton.js`, `react_app\src\components\Button\Button.js`, `react_app\src\Model_logic.js`; `react_app\public\data1_web\model.json` and `data2_web\model.json` exist, but those folders contain no local weight shards. | Adapt basic upload/preview/camera affordances into `frontend\src\pages\WasteGuide.jsx`; use WasteWise Python SavedModel instead of depending on these incomplete local TF.js assets. Its e-waste-as-recyclable label must become our distinct `E_WASTE` route. |
| `EcoFind-main` | Next.js/TypeScript e-waste views: `src\app\recycle\Recycle.tsx`, `src\app\recycle\smartphone\Smartphone.tsx`, `src\app\e-facilities\Efacility.tsx`, `src\app\data\facility.ts`. Booking reads a remote server; facility data contains actual names/contact/address and `verified: true`. | Borrow category-card and booking-field layout ideas for `frontend\src\pages\EWaste.jsx` and `RequestPickup.jsx`; **do not copy** facility data, contact info, verified badges, auth, Mapbox, pricing or remote server calls. Use four synthetic `UNVERIFIED` demo partners from MySQL. |
| `serverless-master` | Local checkout has only `README.md` describing a separately hosted app; **no Java, CRUD implementation or reusable source files here**. | No code to port. Build `backend\` in Spring Boot from this contract. |
| `aws-plaid-demo-app-main` | Unrelated finance sample; `frontend\src\App.js`, `backend\api\app\lambda_handler.py`, `backend\resolvers\Query.getAccounts.js`, `template.yml` are coupled to its own infrastructure/data. | No code or infrastructure imported into `app\`; only confirms it is not a relevant local Spring/MySQL reference. |
