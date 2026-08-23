# ThermaShift AI — Autonomous Heat-Safety Guardian

> **FortyGuard Global AI Hackathon'26** | Track: *Industrial & Enterprise Safety*  
> **Mission:** Autonomous, zero-latency heat-illness prevention for outdoor workforces powered by FortyGuard's Hyperlocal Thermal API and CALL-E Voice Telephony.

---

## 🌍 The Critical Problem
Globally, **2.41 billion outdoor workers** face extreme occupational heat, resulting in over **22.85 million occupational injuries** and **~18,970 fatalities** each year (ILO, 2024). Traditional weather apps measure ambient airport temperatures miles away, completely missing the **urban heat island effect**, direct solar radiation, and scorching asphalt/concrete surfaces where construction and agricultural crews actually labor.

Site supervisors are busy and cannot manually monitor thermal indexes every 10 minutes. When dangerous microclimatic heat spikes occur, manual warnings are too slow.

---

## 🛡️ What ThermaShift AI Does
ThermaShift AI is a **24/7 autonomous watchdog system**:
1. **Hyperlocal Thermal Polling:** Continuously queries **FortyGuard's Temperature API** (`/v1/heatmap`) using exact polygon AOIs (Area of Interest) down to **100m microcell resolution**.
2. **OSHA & ILO Risk Engine:** Calculates Wet Bulb Globe Temperature (WBGT), evaluates dynamic Work/Rest cycles (e.g., 50/10, 30/30, 15/45 min), and computes continuous hydration quotas.
3. **Autonomous Outbound Voice & SMS:** The instant a work site crosses danger thresholds, the backend autonomously triggers **CALL-E Voice AI** to call field personnel directly on their mobile phones in natural English, followed by **Twilio SMS** fallback.
4. **Mission Control GIS Radar:** Renders interactive 100m spatial heat microcells with radial heat variance, dynamic basemap layers (Satellite, Street, Obsidian), real-time action audit trails, and worker telemetry.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                     FORTYGUARD TEMPERATURE API                         │
│  • /v1/heatmap (Async Job Submission with Polygon AOI)                 │
│  • /v1/status/{activity_id} (Exponential backoff poller)               │
│  • /v1/system/fetch-api-key-usage (Live Credit & Quota Telemetry)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 100m Microcell Grid (°C / °F)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   THERMASHIFT FASTAPI BACKEND                          │
│                                                                        │
│   ┌───────────────────┐    ┌─────────────────┐    ┌────────────────┐  │
│   │ Background Poller │───►│ OSHA Risk Engine│───►│ Alert Notifier │  │
│   │   (scheduler.py)  │    │ (risk_engine.py)│    │ (notifier.py)  │  │
│   └───────────────────┘    └─────────────────┘    └────────┬───────┘  │
│                                                            │          │
└────────────────────────────────────────────────────────────┼──────────┘
                                                             │
                      ┌──────────────────────────────────────┴──────────────────────────────────────┐
                      ▼                                                                             ▼
┌───────────────────────────────────────────────┐                             ┌───────────────────────────────────────────────┐
│              CALL-E VOICE AGENT               │                             │             POSTGRESQL DATABASE               │
│  • Outbound phone calls to worker mobiles     │                             │  • sites (GeoJSON AOIs, thresholds)           │
│  • Professional English OSHA heat broadcast   │                             │  • workers (E.164 phone, safety consent)      │
│  • Structured worker acknowledgment schema    │                             │  • heat_snapshots (FortyGuard raw results)    │
│  • Live telephony transcript & status stream  │                             │  • action_logs (deduplicated audit trail)     │
└───────────────────────────────────────────────┘                             └───────────────────────┬───────────────────────┘
                                                                                                      │
                                                                                                      ▼
                                                                              ┌───────────────────────────────────────────────┐
                                                                              │            REACT + VITE + TAILWIND            │
                                                                              │  • Geospatial Leaflet Radar (100m cells)      │
                                                                              │  • Autonomous Guardian Live Action Feed       │
                                                                              │  • OSHA Work/Rest Protocol Cards              │
                                                                              │  • Site Pinpointing & Worker Management       │
                                                                              └───────────────────────────────────────────────┘
```

---

## 🔬 Real Integrations Verified

| Provider | Endpoint / Service | Purpose | Status |
|---|---|---|---|
| **FortyGuard** | `POST /v1/heatmap` | Submit AOI polygon for high-resolution thermal grid | ✅ Verified Live |
| **FortyGuard** | `GET /v1/status/{id}` | Poll async temperature calculation with retry logic | ✅ Verified Live |
| **FortyGuard** | `POST /v1/system/fetch-api-key-usage` | Telemetry modal displaying live credits & tier | ✅ Verified Live |
| **FortyGuard** | `POST /v1/env_params` | Solar irradiance, humidity & environmental metrics | ✅ Verified Live |
| **CALL-E** | `POST /v1/calls` | Real outbound telephony with custom OSHA task prompt | ✅ Verified Live |
| **CALL-E** | `GET /v1/calls/{id}` | Live telephony status, acknowledgment & duration | ✅ Verified Live |
| **Supabase** | `PostgreSQL (asyncpg)` | Strict relational schema with deduplication bounds | ✅ Verified Live |

---

## ⚡ Tech Stack

- **Backend:** Python 3.11+, FastAPI (Async), SQLAlchemy 2.0 (Asyncpg), Pydantic v2, HTTPX
- **Voice AI Telephony:** CALL-E API (HeyCall-E)
- **SMS Fallback:** Twilio REST Client
- **Database:** Supabase / PostgreSQL (with unique constraint deduplication)
- **Thermal Data:** FortyGuard Temperature API
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Leaflet GIS
- **Design System:** Obsidian / Deep Charcoal Palette (`#1A2224`, `#242D30`, `#2C3639`, `#A27B5C`, `#DCD7C9`)

---

## 🚀 Quickstart & Setup

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Ensure FORTYGUARD_API_KEY, CALLE_API_KEY, and DATABASE_URL are set
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Interactive Swagger API Docs available at `http://localhost:8000/docs`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Dashboard available at `http://localhost:5173`*

---

## 📋 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/sites` | List all registered geo-fenced work sites |
| `POST` | `/sites` | Register a new site with GeoJSON polygon & thresholds |
| `DELETE` | `/sites/{id}` | Cascade delete a site and all related logs |
| `GET` | `/workers` | List all workers (supports optional `?site_id=`) |
| `POST` | `/workers` | Enroll field worker with phone number & consent |
| `DELETE` | `/workers/{id}` | Remove worker from heat safety coverage |
| `GET` | `/heat?site_id={id}` | Get latest FortyGuard heat snapshot |
| `GET` | `/alerts?site_id={id}` | Get real-time PostgreSQL action & call logs |
| `POST` | `/internal/trigger-check` | Manual heat trigger with real FortyGuard + CALL-E |
| `POST` | `/internal/calle/direct-call` | Direct demo phone dialer via CALL-E |
| `GET` | `/internal/fortyguard/usage` | Fetch remaining FortyGuard API credits |

---

## 🏆 Hackathon Demo Script (2 Minutes)

1. **Mission Control (`/`):** Open dashboard showing California work sites (e.g. Fresno Solar Field). Point out the **Live Temp readout**, **100m thermal microcells**, and **OSHA Work/Rest recommendations**.
2. **Autonomous Watchdog:** Explain how the background scheduler polls FortyGuard continuously without human intervention.
3. **Emergency Trigger Test:** Click **"Test AI Emergency Response"** — watch FortyGuard snapshot persist to PostgreSQL, CALL-E dispatch outbound call, and live action log update in real time.
4. **Site & Worker Management (`/sites` & `/workers`):** Show geo-fencing pinpointing and worker enrollment with E.164 phone formatting.
