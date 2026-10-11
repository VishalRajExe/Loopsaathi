# PRD — LoopSaathi local prototype

**Tagline:** Every item deserves the right next step.

## Goal and user story

A hostel resident has a bottle, food scraps and old earphones. They search for an item or upload a photo, review/correct the suggested **Wet, Dry, Sanitary, Special-care or E-waste** stream, and request a pickup. A collector accepts it, enters the **actual kg** collected and records a matching destination. The Impact screen updates from MySQL rows: **requested estimate → collected confirmation → delivered outcome**. This is a small local demonstration, not an operational collection service.

| Role | Demo task |
|---|---|
| Household / hostel resident | Identify waste; request and track a pickup |
| Collector | View jobs; accept, collect with weight, deliver to an eligible destination |
| Viewer | Inspect computed impact and its demo-data disclosure |

No authentication: a Household/Collector view switcher uses fixed demo identities, not real authorization.

## Required features

1. **Waste Guide:** searchable curated items and photo upload/camera input; show proposed item, stream, instruction, uncertainty and a correction control. Text/manual selection works without the Python image service. Only supported photo classes can be suggested; never pretend a fallback is photo recognition.
2. **Request:** item, stream, estimated kg (>0 and ≤100), synthetic locality and slot (`MORNING`, `AFTERNOON`, `EVENING`); return `PICKUP-XXXXXX` with `REQUESTED` and a four-step status timeline. My requests remain after refresh.
3. **Collector:** list/filter pickups, with the next valid action only: `REQUESTED → ACCEPTED → COLLECTED → DELIVERED`; collection requires confirmed kg, delivery requires an eligible destination.
4. **E-waste:** distinct `E_WASTE` route and page for devices; batteries/special-care items get a dedicated caution. Display a fictional e-waste point and allow an e-waste pickup; do not treat devices as ordinary Dry recycling.
5. **Impact:** live computed counts and estimated requested kg vs confirmed collected kg vs delivered kg by destination type (compost, biogas, recycler, e-waste), e-waste pickup count and completion rate; recent status activity. No fabricated benefits.
6. **Demo disclosure:** six or so seeded pickups and four fictional partners visibly marked **Demo data**; partners marked `UNVERIFIED`. Sources of instructions are curated local waste rules, not AI prose.

The app runs locally with React (:5173), Spring Boot (:8080), MySQL (:3306) and Python FastAPI (:8000). Spring owns data and is the only API the browser calls; see `Architecture.md` for schema/contracts.

## Boundaries and honesty

No auth, public deployment, cloud service, maps/live tracking, chat, payment/prices, real partner directory, notifications, rewards, route optimization, image storage, invented CO₂/energy/revenue figures or multilingual system. Seed data has no real personal information. Model results are **suggestions**; users can correct them. `confirmedWeightKg` contributes only after `COLLECTED`, and delivered totals only after `DELIVERED`; labels always distinguish estimates from measured quantities. A failed/uncertain classifier leads to manual selection, never a fabricated prediction.

## Two-minute walkthrough

1. Home → Guide: search “banana peel” (Wet); try a supported-class photo such as a smartphone (model suggestion if integration passes checks), then review/change category. A bottle can be found by text; the 20-class model has no dedicated bottle label.
2. Request a **Dry** bottle pickup, see its ID and `REQUESTED` timeline; refresh and find it again.
3. Switch to Collector, accept it, confirm e.g. `0.45 kg`, deliver to **Demo Dry Recovery Centre** (`UNVERIFIED`, Demo data).
4. Impact shows the new request in estimated totals, the confirmed weight after collection, and that weight in Recycler only after delivery. Show the separate e-waste route and note seeded totals.

## Done when

- The complete local journey survives a browser refresh because MySQL persists it; invalid transitions return `409`, bad weights `400`, unknown IDs `404`.
- Search, correction and pickup creation still work with FastAPI stopped; actual photo inference is claimed only after loading the SavedModel and exercising a real image end to end.
- Demo badges, `UNVERIFIED` partners, status-specific totals, mobile-friendly controls and a runnable `app\README.md` are present.
