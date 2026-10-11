# Rules — LoopSaathi contributors

Read `Memory.md` first in each new session, then `PRD.md`, `Architecture.md`, `Phases.md` and `Design.md`; verify the actual app tree before editing because the planned file map may evolve. Work phase by phase, run its **Done when** checks and update `Memory.md` at the end.

## Scope and stack

- Build the local-only journey in `PRD.md` with Spring Boot 3.x/Java 21/Maven, MySQL `localhost:3306`, FastAPI/Python 3.13/TensorFlow SavedModel and Vite React **JavaScript/JSX** with React Router, pinned Tailwind v3, lucide-react, offline Manrope/Inter font packages and native `fetch`.
- Allowed backend dependencies: Spring Web, Data JPA, Validation and MySQL driver. Allowed AI necessities: pinned TensorFlow, FastAPI, Uvicorn, Pillow and `python-multipart`. Avoid auth, state/UI/chart kits, Axios, unrelated ML models/training, Docker, maps, cloud services and other unrequested dependencies.
- Keep `D:\Loopsathi\githubrepos\` read-only. Adapt relevant source/model files into `app\`; annotate adapted blocks with `Source: githubrepos/<repo>/<exact path>` and credit those repos in `app\README.md`. Do not import unrelated verified-facility data, real contact details, remote API URLs or cloud glue. Create only the six docs under `docs\` and `app\README.md` as documentation.

## Non-negotiable data and product rules

1. `REQUESTED → ACCEPTED → COLLECTED → DELIVERED` advances one step at a time, atomically with a status-log row. Repeat, skip and backward actions return `409`. `collectorId` is required for acceptance; confirmed weight for collection; valid destination for delivery.
2. Both weights are finite numbers >0 and ≤100 kg; estimate remains distinct from confirmed weight. Confirmed weight is null before collection. A destination must accept the pickup's stream. Validate all inputs in Spring regardless of frontend controls.
3. Compute every impact number from stored pickups; requested is **estimated**, collected includes confirmed `COLLECTED`/`DELIVERED`, delivered includes only `DELIVERED` and groups by destination type. Never hard-code impact or add these overlapping totals together.
4. Seeded pickups/partners have `isDemo=true` and visibly say **Demo data**. Fictional partners always say `UNVERIFIED`; never imply certification, partnership or a real drop-off service. No real names/contact/address in seed records, fabricated CO₂/kWh/money or unmeasured outcomes.
5. A model result is a suggestion; users may override it. Spring obtains disposal instructions only from `waste_rules` (or clearly generic curated stream advice for an override), never from model prose. Electronics take `E_WASTE`; battery/special-care handling receives a dedicated warning, not normal Dry advice.

## AI and failure handling

- Use the existing WasteWise SavedModel, not a mock classifier or retrained model. Verify its class order and preprocessing on a real image before claiming photo classification; the model covers 20 labels and **does not include plastic bottle** as a label. Pin compatible Python/TensorFlow versions and log the exact tested versions in `Memory.md`.
- Python returns only `label`, `confidence`, proposed `stream`, `needsReview`. Confidence below 0.6, unknown labels, mixed/hazardous uncertainty or load/inference failure must trigger review; do not invent a label or confidence. Spring calls Python with a ~10 s timeout and degrades to manual category selection. Text lookup and pickup must work with Python offline.
- Spring returns `{ "error": "plain-language message" }` with `400` validation, `404` missing entity, `409` transition conflict or `500` unexpected; use `@RestControllerAdvice`, log internal details but do not expose traces. Frontend uses loading, inline error, retry/manual fallback; never silently fail or use `alert()` as the only feedback. Handle bad/oversized/non-image uploads clearly.

## Working practice

- Keep Java, Python and JSX modules small, shared field names consistent with `Architecture.md` and secrets out of tracked files. Never expose database credentials in frontend code; `VITE_API_URL` only points to local Spring.
- Verify API state/validation and full browser journey rather than trusting an optimistic UI. Update `Memory.md` with what really ran, changed paths, AI path status and the next phase; document assumptions as pending until proven. No claims of completed integration before checks pass.
