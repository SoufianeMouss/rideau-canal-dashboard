# Rideau Canal Monitoring Dashboard  
Real-Time Web Dashboard for Ice and Weather Conditions

This repository contains the **web dashboard** for the Rideau Canal Skateway real-time monitoring system.  
It reads aggregated telemetry from **Azure Cosmos DB** and displays live ice thickness, temperature, snow accumulation, safety status, and historical trends for three locations:

- Dow’s Lake  
- Fifth Avenue  
- NAC  

The dashboard runs locally or in **Azure App Service** and refreshes automatically every **30 seconds**.

---

# 1. Overview

### What this dashboard does

- Displays **real-time conditions** for each monitored location  
- Shows a **safety status badge** (Safe, Caution, Unsafe)  
- Draws a **Last Hour Ice Thickness Trend** chart using Chart.js  
- Pulls data from Cosmos DB through two API endpoints:
  - `/api/latest`
  - `/api/history`  
- Refreshes automatically without needing a page reload  
- Runs on Node.js (Express) with a static frontend

### Technologies Used

- **Backend:** Node.js, Express  
- **Database:** Azure Cosmos DB (`@azure/cosmos` SDK)  
- **Hosting:** Azure App Service  
- **Frontend:** HTML, CSS, JavaScript, Chart.js  
- **Environment:** `.env` file for secrets (ignored by Git)

---

# 2. Prerequisites

Before running the dashboard:

### Software Requirements
- **Node.js 18+ or 20+**
- **npm** (included with Node)
- Web browser (Chrome, Edge, Firefox, etc.)

### Azure Requirements
You must have:

- **A Cosmos DB account** with:
  - Database: `RideauCanalDB`
  - Container: `SensorAggregations`
- Documents written by Azure Stream Analytics in 5-minute windows
- Optional: Azure App Service for deployment

---

# 3. Installation

Clone the repository:

```bash
git clone https://github.com/SoufianeMouss/rideau-canal-dashboard.git
cd rideau-canal-dashboard
````

Install dependencies:

```bash
npm install
```

---

# 4. Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and configure:

```env
COSMOS_ENDPOINT=https://your-cosmos-db.documents.azure.com:443/
COSMOS_KEY=your_primary_key_here
COSMOS_DATABASE=RideauCanalDB
COSMOS_CONTAINER=SensorAggregations

# Local development port
PORT=3000
```

> **Note:** Do not commit `.env`. It is already included in `.gitignore`.

---

# 5. Running Locally

Start the server:

```bash
node server.js
```

If successful, you will see:

```
Dashboard server running on port 3000
```

Open in your browser:

```
http://localhost:3000
```

You should now see:

* 3 condition cards
* Status badges
* A line chart showing ice thickness for the last hour
* Auto-refresh every 30 seconds

If nothing appears, ensure the Stream Analytics job is running and Cosmos DB has documents.

---

# 6. API Endpoints

The backend exposes two REST endpoints for the frontend.

---

## **GET /api/latest**

Returns the **most recent aggregation window** for each location.

### Example Response:

```json
{
  "DowsLake": {
    "location": "DowsLake",
    "windowEnd": "2025-12-10T20:20:00Z",
    "avgIceThicknessCm": 27.5,
    "avgSurfaceTempC": -3.2,
    "avgExternalTempC": -6.1,
    "maxSnowAccumulationCm": 8.9,
    "readingCount": 29,
    "safetyStatus": "Caution"
  },
  "FifthAvenue": { ... },
  "NAC": { ... }
}
```

Used by the cards at the top of the dashboard.

---

## **GET /api/history**

Returns the **last 60 minutes** of Stream Analytics window outputs.

Used to render the Chart.js “Last Hour Ice Thickness Trend” line graph.

### Example Response:

```json
[
  {
    "location": "DowsLake",
    "windowEnd": "2025-12-10T20:00:00Z",
    "avgIceThicknessCm": 28.4
  },
  {
    "location": "FifthAvenue",
    "windowEnd": "2025-12-10T20:00:00Z",
    "avgIceThicknessCm": 27.1
  }
]
```

---

# 7. Deployment to Azure App Service

### Step 1 — Create the App Service

* Runtime stack: **Node.js 18 LTS**
* Region: same as Cosmos DB (recommended)

### Step 2 — Deploy code

Options:

* VS Code → *Deploy to Web App*
* GitHub Actions
* ZIP deploy
* Azure CLI

### Step 3 — Configure Application Settings

In **Azure Portal → App Service → Configuration → Application Settings**, add:

| Setting          | Value                   |
| ---------------- | ----------------------- |
| COSMOS_ENDPOINT  | your Cosmos DB endpoint |
| COSMOS_KEY       | your key                |
| COSMOS_DATABASE  | RideauCanalDB           |
| COSMOS_CONTAINER | SensorAggregations      |

> **Do NOT set PORT manually.**
> App Service injects `process.env.PORT`.

### Step 4 — Restart App Service

### Step 5 — Test deployment

Visit:

```
https://your-app-service-name.azurewebsites.net
```

Confirm:

* Cards display values
* Status badges show correctly
* Historical chart renders
* Auto-refresh works

---

# 8. Dashboard Features

### ✔ Real-time location cards

Shows:

* Ice thickness
* Surface temperature
* External temperature
* Snow accumulation
* Safety badge
* Last window timestamp

### Safety status classification

Badges:

* 🟩 **Safe**
* 🟨 **Caution**
* 🟥 **Unsafe**

### Last-hour trend chart

* One line per location
* Built with **Chart.js**
* Updates every 30 seconds

### Auto-refresh engine

Frontend calls both APIs every 30 seconds.

### Error handling & fallback messages

If data is missing, cards show:

```
No data yet...
```

---

# 9. Troubleshooting

### Blank dashboard

* Stream Analytics job may not be running
* Cosmos DB key may be incorrect
* API failing — check DevTools console

### “500 Internal Server Error”

Likely caused by:

* Wrong Cosmos DB URI
* Wrong database/container name
* Firewall blocking App Service

### Safety badge shows “[object Object]”

Happens when `safetyStatus` was inserted as an object instead of a string.
Fixed by normalizing the value in `server.js`.

### Chart shows only one or two lines

Check that Cosmos DB contains documents for all three locations.

---

# 10. AI Tools Disclosure

AI tools (ChatGPT) were used for:

* Debugging the `[object Object]` safety badge bug
* Structuring this README

All code was reviewed and tested.

---

# 11. References

* Azure Cosmos DB – Node.js SDK
* Chart.js documentation
* Node.js + Express documentation