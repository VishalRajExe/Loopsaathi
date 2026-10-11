# LoopSaathi

**Every item deserves the right next step.**

LoopSaathi is a local-only prototype for one traceable waste journey:

```text
identify waste → request pickup → accept → confirm actual kg → record destination → update impact
```

There is no login. The Household / Collector switcher changes the demo view only. The browser talks only to Spring Boot; Spring owns MySQL, validation, status transitions, curated instructions and impact math.

## Stack and ports

| Part | Local runtime | Port |
|---|---|---:|
| Frontend | Vite + React JS/JSX + React Router + Tailwind CSS v3 | 5173 |
| API | Spring Boot 3.5 + Java 21 + Maven | 8080 |
| Photo service | FastAPI + Python 3.13 + TensorFlow SavedModel | 8000 |
| Database | MySQL database `loopsaathi` | 3306 |

The API uses the local JDBC URL from `docs/Architecture.md`. Keep the local MySQL password in the ignored `backend/application-local.properties` file or provide `SPRING_DATASOURCE_PASSWORD` in the terminal environment. Never commit that file.

## Prerequisites

- Windows PowerShell / Command Prompt
- Java 21 and Maven 3.9+
- Node.js 24+ and npm
- Python 3.13 available as `py -3.13`
- MySQL running on `localhost:3306`
- A MySQL account that can create/use the `loopsaathi` database. The supplied local setup uses user `root`.

Check the tools:

```powershell
java -version
mvn -v
node --version
npm --version
py -3.13 --version
mysql --version
```

## First-time setup

### 1. Database credentials

Create `app/backend/application-local.properties` locally if it is not already present:

```properties
spring.datasource.password=<your-local-mysql-password>
```

For the fixed local setup in the project brief, use the local MySQL password configured for the `root` account. This file is ignored by Git. The schema and demo data are created by Spring with `spring.jpa.hibernate.ddl-auto=update`.

### 2. Python AI environment

Run from `app/ai-service`:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

The requirements include TensorFlow because this prototype uses the real WasteWise 20-class SavedModel copied into `ai-service/model_20_classes`. No model is trained locally.

### 3. Frontend packages

Run from `app/frontend`:

```powershell
npm install
```

The checked-in `frontend/.env.development` points to `http://localhost:8080/api`. The browser must not call FastAPI directly.

## Run manually

Start MySQL first, then use three PowerShell terminals.

### Spring Boot API

```powershell
cd D:\Loopsathi\app\backend
mvn spring-boot:run
```

### Python photo service

```powershell
cd D:\Loopsathi\app\ai-service
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Check it:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

### React frontend

```powershell
cd D:\Loopsathi\app\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Open <http://localhost:5173>.

## One-click local launcher

After the first-time setup, double-click `app\start-all.bat`. It opens three PowerShell windows for Spring, FastAPI and Vite. MySQL is intentionally not started by the script; start the installed MySQL Windows service first. On a fresh checkout, the launcher creates the Python virtual environment and installs its pinned requirements, and installs frontend packages if `node_modules` is missing.

## API smoke checks

These checks use PowerShell's native HTTP client. They assume Spring is running.

```powershell
Invoke-RestMethod http://localhost:8080/api/impact | ConvertTo-Json -Depth 5
Invoke-RestMethod 'http://localhost:8080/api/waste-items?search=banana'
```

Create a pickup:

```powershell
$body = @{ wasteType='Plastic bottle'; stream='DRY'; estimatedWeightKg=0.45; locality='Library'; preferredSlot='MORNING' } | ConvertTo-Json
$pickup = Invoke-RestMethod http://localhost:8080/api/pickups -Method Post -ContentType 'application/json' -Body $body
$pickup.id
```

Advance it as a demo collector:

```powershell
$id = $pickup.id
Invoke-RestMethod "http://localhost:8080/api/pickups/$id/accept" -Method Patch -ContentType 'application/json' -Body (@{ collectorId='COLLECTOR-DEMO' } | ConvertTo-Json)
Invoke-RestMethod "http://localhost:8080/api/pickups/$id/collect" -Method Patch -ContentType 'application/json' -Body (@{ confirmedWeightKg=0.32 } | ConvertTo-Json)
Invoke-RestMethod "http://localhost:8080/api/pickups/$id/deliver" -Method Patch -ContentType 'application/json' -Body (@{ destinationId='PARTNER-DRY' } | ConvertTo-Json)
```

## Two-minute demo script

1. Open Home and choose **Waste guide**.
2. Search **banana peel** and review the Wet suggestion. Try **plastic bottle** as text; the supplied photo model does not have a plastic-bottle class.
3. Choose **Request pickup**, set an estimate, locality and slot, then save the `PICKUP-XXXXXX` ID.
4. Switch to **Collector**. Accept the new request, enter the measured kg, and record **Demo Dry Recovery Centre**. The partner is explicitly `UNVERIFIED` and marked `Demo data`.
5. Open **Impact**. Confirm Requested (estimated), Collected (confirmed) and Delivered are separate computed values.
6. Open **E-waste** and choose phone, laptop, charger or earphones for the dedicated route. Battery uses `SPECIAL_CARE`; this demo intentionally has no destination for that stream.
7. Stop FastAPI and repeat text classification/manual stream selection. Pickup creation and the rest of the journey still work.

## Verification commands

From `app/backend`:

```powershell
mvn -q package
```

From `app/frontend`:

```powershell
npm run build
```

From `app/ai-service`:

```powershell
py -3.13 -m py_compile main.py classifier.py translator.py
```

The backend test suite covers validation, transitions, destination compatibility, classification fallback and impact arithmetic. The AI service health check loads the real model; photo inference is limited to its 20 trained classes.

## Credits / adapted references

These repositories remain read-only under `D:\Loopsathi\githubrepos\`. Adapted blocks carry `Source:` comments beside the relevant code.

- **TrashTag-main** — request form state, pickup-card/status-action structure, sheet/toast/empty-state interaction patterns. Supabase, maps, chat, payments, auth and live tracking were removed.
- **wt23-wastewise-main** — 20-class label order, SavedModel inference shape/preprocessing evidence, camera/result concepts and class-to-recommendation mapping. The model is copied locally; its original remote inference endpoint and region-specific disposal copy are not used.
- **WasteSegregationUsingAI-main** — upload/preview/camera interaction pattern. Its local TensorFlow.js JSON files had no weight shards, so the app uses the WasteWise Python model instead.
- **EcoFind-main** — e-waste category/booking layout and facility-card composition. Real facilities, maps, auth, contact details, prices and verified claims were not copied.
- **serverless-master** — README-level CRUD/API shape review only; the checkout contained no reusable Java source.
- **aws-plaid-demo-app-main** — architecture review only; its finance/cloud/auth infrastructure is out of scope and not imported.

## Known limitations

- No authentication or real-user ownership: **My requests** shows local demo records because this is an explicit no-login prototype.
- Photo AI recognizes only the copied WasteWise 20-class model. Unknown/low-confidence results ask for manual confirmation.
- Special-care currently has no seeded destination, so collection can be recorded but delivery is correctly blocked.
- This is local-only. There is no cloud deployment, real facility directory, map, notification or environmental-impact claim.
