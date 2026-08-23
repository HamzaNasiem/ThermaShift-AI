# ThermaShift AI — Comprehensive Product & Technical Blueprint
### FortyGuard Global AI Hackathon'26 · Submission deadline: Aug 30, 2026, 11:59 PM GST

---

## 0. Reality Check (pehle yeh padho)

Koi document "100% guaranteed jeet" nahi de sakta — judging panel ka taste, competition level, aur unannounced internal criteria kabhi predict nahi ho sakte. Jo neeche hai woh hai: ek genuinely buildable, technically grounded, aur demo-proof project jo aapke existing stack (Retell AI, FastAPI, Twilio, React+Vite, Supabase — jo aap Clinic OS aur SmallBizAI mein already production mein chala chuke hain) par directly map hota hai. Neuro-symbolic layer completely bahar hai, jaisa aap ne bola tha.

Yeh version v1 se zyada comprehensive hai: code-level detail, full DB constraints, API contract, error handling, deployment plan, testing checklist, README template, aur shot-by-shot demo script — taake koi bhi phase "kaise karoon" mein atak na jaye.

---

## 1. Problem Statement

Outdoor manual workers — construction crews, site carpenters, gig delivery riders, farm labour — extreme heat mein kaam continue karte hain kyunke unhe sirf city-wide weather forecast dikhta hai, jabke unki exact street/site par actual heat load bohot zyada ho sakta hai (open concrete, no shade, direct sun).

Yeh koi chhota masla nahi hai — ILO ke 2024/2026 global review ke mutabiq, globally **2.41 billion workers (71% of the world's workforce)** kisi na kisi waqt excessive heat ka saamna karte hain, jiski wajah se har saal **22.85 million occupational injuries aur ~18,970 deaths** hoti hain. ILO yeh bhi kehta hai ke behtar occupational-safety measures se globally **US$361 billion** save ho sakte hain. (Source: ILO, "Heat at Work: Implications for Safety and Health", 2024/2026 update.)

Site managers ke paas is risk ko real-time, hyperlocal tareeke se automatically manage karne ka koi tool nahi hai — sab manual hai (koi supervisor apni feel se "break le lo" bolta hai, jo late bhi ho sakta hai aur inconsistent bhi).

**ThermaShift AI** ek autonomous site-safety layer hai jo FortyGuard ke hyperlocal heat data ko live monitor karta hai, aur jab kisi registered work-site ka heat dangerous threshold cross kare, automatically workers ko voice call + SMS se alert karta hai aur site manager ke dashboard ko real-time update karta hai.

### Track Fit
Uploaded hackathon page par 4 tracks visible thay, lekin FortyGuard ka technical blog "Track 06 — surfacing the API as agent tools" ka zikr karta hai — matlab kul 7 tracks hain, sab list mein nahi thay. **Submission se pehle full tracks section dobara check karein.** Best-fit yahan:
- **Primary: "Industrial & Enterprise"** — "dashboards that turn high-resolution heat data into operational decisions" — yeh literally ThermaShift ki definition hai.
- **Secondary: "Resilient Cities & Infrastructure"** — worker safety/routing framing bhi is track mein fit hoti hai.

---

## 2. Product Overview

### Personas & Needs
| Persona | Primary Need | Touchpoint |
|---|---|---|
| **Field Worker** | Simple, local-language alert: "yahan garmi extreme hai, kaam rok do" | Phone call + SMS |
| **Site Manager** | Live map + who's at risk + who's notified + who's acknowledged | Web dashboard |
| **Judge (demo viewer)** | 2-min mein clear ho jaye ke real API + real autonomous action ho raha hai | Live demo + README |

### Dashboard Low-Fi Wireframe (text)
```
┌──────────────────────────────────────────────────────────────────┐
│  ThermaShift AI              [● Live]        Site: Malir Site 1 ▾ │
├───────────────────┬──────────────────────────────┬───────────────┤
│  WORKERS (7)       │                                │  ALERT FEED   │
│  ● Ahmed   Safe    │        [ MAP: polygon overlay  │  10:41 SMS →  │
│  ● Bilal   Notified│          color-coded by risk ] │   Ahmed sent  │
│  ● Fahad   Safe     │                                │  10:41 Call → │
│  ● ...              │        current temp: 109°F     │   Bilal ringing│
│                     │        risk: elevated          │  10:38 Snapshot│
│  [ + Add Worker ]   │                                │   109°F logged │
└───────────────────┴──────────────────────────────┴───────────────┘
```

---

## 3. FortyGuard API — Confirmed Details + Integration Code

Verified from FortyGuard's actual public docs/product pages (guess nahi hai):

- Real submit endpoint: `POST https://api.fortyguard.com/v1/heatmap`, header `api-key`, JSON body with a `polygon_aoi` GeoJSON polygon, a `date_time` object (`start_date`, `start_time`, `filter_type`), and `granularity` — response deta hai ek `activity_id`.
- Yeh **async submit-and-poll pattern** hai. Exact poll route confirm karo `docs-api.fortyguard.com` ya hackathon quickstart repo se, wiring se pehle.
- Data **2-meter-above-ground air temperature**, **geohash6 granularity** (~street-level), **12-hour hourly forecasting** available.
- Teen **analysis layers**: `snapshot` (is waqt ka reading), `exceedance` (threshold cross karna), `persistence` (continuous elevated heat — worker-safety ke liye sabse important).
- **`risk_level` API return nahi karta** — real API raw geohash6-tiled temperature grid deta hai, `risk_level` khud classify karna padega `risk_engine.py` mein.

---

## 4. System Architecture

```
┌─────────────┐   poll (~every 10 min)   ┌──────────────────┐
│ FortyGuard   │ ◄────────────────────────│  FastAPI Backend  │
│ Temperature   │ ─────────────────────►  │  (Poller Service) │
│ API           │   geohash6 grid + temp   └─────────┬─────────┘
└─────────────┘                                       │
                                              risk_engine.py
                                                        │
                                  ┌─────────────────────┼─────────────────────┐
                                  ▼                     ▼                     ▼
                        heat_snapshots (DB)      notifier.py           push to frontend
                                                (Retell + Twilio)      (polling GET /heat)
                                                        │                     │
                                          ┌─────────────┴─────────┐          ▼
                                          ▼                       ▼   React Dashboard
                                  Worker's phone            action_logs   (map + feed)
                                 (voice call + SMS)             (DB)
```

### Alert Sequence
```
Poller → FortyGuard.submit_heat_query(site.polygon)
       → FortyGuard.poll_result(activity_id)
       → risk_engine.classify(temp, analysis_layer) → "extreme"
       → INSERT heat_snapshots
       → notifier.dispatch(site, snapshot)
             for worker in site.active_workers:
                 if not already_notified(worker, snapshot):
                     retell.trigger_outbound_call(worker, context)
                     twilio_sms.send(worker, message)
                     INSERT action_logs (x2: voice + sms)
                     UPDATE workers.status = 'notified'
```

---

## 5. Database Schema (Supabase / PostgreSQL) — Full DDL

See `supabase_schema.sql` at repo root.

Key design decisions:
- `sites.polygon_geojson` seedha `polygon_aoi` ke roop mein FortyGuard ko bhejo.
- `consented_at` field: null = not yet consented, do not call.
- Unique index `(worker_id, heat_snapshot_id, channel)` prevents double-alerting.

---

## 6. Backend (FastAPI) — Full Structure

See `/backend` directory.

### Critical endpoint — `/internal/trigger-check`
Manual override for live demos. `force_extreme=True` injects a synthetic extreme snapshot instead of waiting for real weather — guarantees demo timing. This is P0, not a nice-to-have.

---

## 7. AI / Notification Workflow

**Primary — Voice (Retell AI):** Uses `/v2/create-phone-call` with `retell_llm_dynamic_variables` for dynamic context (worker name, site, temperature, language).

**Secondary — SMS fallback (Twilio):** Bilingual templates (Urdu + English).

**Dedupe logic:** `already_notified()` check prevents same snapshot from triggering duplicate calls.

**Cooldown:** Re-alert only when transitioning from lower risk level, or every 30-60 min max.

---

## 8. Frontend (React + Vite + TypeScript + Tailwind)

See `/frontend` directory.

- Map: Leaflet (react-leaflet) — no token required, less setup friction.
- Color palette: `extreme` = red-600, `elevated` = amber-500, `normal` = emerald-500.
- Polling: vanilla `fetch` + `setInterval` every 20s — no new dependencies.
- WebSocket: only if all core phases done with time remaining.

---

## 9. API Contract

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/sites` | `{name, polygon_geojson, extreme_threshold_f?, elevated_threshold_f?}` | `{id, name, ...}` |
| GET | `/sites/{id}` | — | full site object |
| POST | `/workers` | `{site_id, name, phone_number, preferred_language}` | `{id, status: "safe", ...}` |
| GET | `/workers?site_id=` | — | `[{id, name, status, ...}]` |
| GET | `/heat?site_id=` | — | latest `heat_snapshot` for the site |
| GET | `/alerts?site_id=&limit=20` | — | `[action_log, ...]` newest first |
| POST | `/internal/trigger-check?site_id=&force_extreme=` | — | `{snapshot_id, risk_level}` |

---

## 10. 9-Day Execution Plan (Aug 21 → Aug 30)

| Day | Date | Sub-tasks |
|---|---|---|
| 1 | Aug 21 | Team register; FortyGuard key; `curl` test `/v1/heatmap`; repo skeleton; Supabase schema |
| 2 | Aug 22 | `fortyguard.py` working end-to-end; 1 demo site + 3-4 demo workers seeded |
| 3 | Aug 23 | `risk_engine.py`; `/internal/trigger-check`; `action_logs`; dedupe tested |
| 4 | Aug 24 | Retell call flow; Twilio SMS; both tested on own phone |
| 5 | Aug 25 | Frontend skeleton — map renders polygon, static data |
| 6 | Aug 26 | `useLiveHeat` polling connected to real backend; risk-based colors |
| 7 | Aug 27 | UI polish (dark theme); record backup demo footage |
| 8 | Aug 28 | Full QA checklist run twice; fix breakage; write README; architecture diagram |
| 9 | Aug 29-30 | Record 2-min pitch video; buffer time; submit before 11:59 PM GST |

---

## 11. Cut Order (if running out of time)

1. WebSocket → stay on polling
2. Multi-site support → hardcode one demo site
3. Voice call → SMS-only fallback
4. Manager login/auth → single hardcoded manager account
5. Call acknowledgment (digit-press) → cut first

**Never cut:** real FortyGuard API call, live-trigger demo moment.

---

## 12. Deployment Plan

- **Backend:** Railway or Render free tier (git push → auto-deploy)
- **Frontend:** Vercel or Netlify (git push → auto-deploy)
- **Database:** Supabase (already hosted)

---

## 13. Testing / QA Checklist (Day 8)

- [ ] `POST /sites` creates real site, polygon submits to FortyGuard successfully
- [ ] `GET /heat` returns real temperature (not mock)
- [ ] `/internal/trigger-check?force_extreme=true`: snapshot inserted, real call, real SMS, dashboard updates in 20-30s
- [ ] Same snapshot triggered twice → no duplicate call/SMS
- [ ] Worker with `consented_at = null` → not called
- [ ] FortyGuard API key wrong/expired → backend doesn't crash, graceful error
- [ ] Full demo flow runs twice consecutively without restart
- [ ] README setup instructions work on a fresh clone

---

## 14. Environment Variables

See `.env.example` at repo root.

---

## 15. Privacy & Consent

`workers.consented_at` field is required. `notifier.dispatch` always filters `consented_at IS NOT NULL`. Demo uses only consented test numbers (your own + teammates'). This signals thoughtful engineering to judges.

---

## 16. 2-Minute Demo Script

| Time | Shot | Talking point |
|---|---|---|
| 0:00-0:15 | Face-to-camera | The problem + ILO stat |
| 0:15-0:35 | Dashboard, safe/green state | "Live site, all workers safe" |
| 0:35-0:50 | Click Trigger Check button | "Pulling real heat data from FortyGuard" |
| 0:50-1:10 | Map turns red, status flips | Explain risk_engine + persistence classification |
| 1:10-1:35 | Phone rings + SMS pops | The "wow" moment — real call, real SMS |
| 1:35-1:50 | action_logs feed | "Every action logged, full audit trail" |
| 1:50-2:00 | Architecture diagram / GitHub | Track name + call to action |
