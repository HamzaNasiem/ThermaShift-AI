# AGENTS.md — ThermaShift AI (FortyGuard Hackathon'26)

## Project
ThermaShift AI: autonomous heat-safety system for outdoor workers. Polls FortyGuard's
Temperature API for registered work sites, and when heat crosses a dangerous threshold,
automatically calls + SMSs workers and updates a live dashboard.

**Full spec, DB schema, architecture diagram, and 9-day plan live in `thermashift-ai-prd.md`
at the repo root — read it fully before planning any phase. This file is the rule set;
that file is the source of truth for design decisions.**

Deadline: Aug 30, 11:59 PM GST. Do not scope-creep past what the PRD describes.

## Tech stack — locked, do not substitute
- Backend: FastAPI (Python, async), Supabase Postgres
- Voice: Retell AI (same pattern as an existing project, `bytelytic-clinic-os`, if that repo
  is available for reference — ask the user before assuming its exact structure)
- SMS fallback: Twilio
- Frontend: React + Vite + TypeScript + Tailwind CSS (NOT Next.js)
- Map: Mapbox GL JS or Leaflet — pick whichever has less setup friction, don't spend time
  comparing them

Do not introduce a new framework, ORM, state manager, or UI library not listed above,
even if it seems "better" — time budget does not allow re-learning tools mid-build.

## Non-negotiable rules
1. **Never fabricate FortyGuard API responses.** Before writing any integration code, make
   one real `curl`/Postman call to `https://api.fortyguard.com/v1/heatmap` with the user's
   real API key and show the actual response. If the key isn't set yet, stop and ask for it
   — do not mock a fake response and continue building against it.
2. **The submit-and-poll pattern is async.** Confirm the exact poll endpoint/route against
   `docs-api.fortyguard.com` or the hackathon quickstart repo before wiring it — do not guess
   the route name.
3. **`risk_level` is not returned by the API.** Compute it in-app from the raw temperature
   grid using thresholds defined in `risk_engine.py`, per the PRD.
4. **Build `/internal/trigger-check` before anything else in the alert pipeline.** This
   manual-override endpoint is required for a reliable live demo and is treated as a P0
   feature, not a nice-to-have.
5. **After every phase, verify before moving to the next phase.** Run the backend, hit the
   endpoint with curl, or load the page in the browser and confirm it actually works. Do not
   chain multiple unverified phases together.
6. **Polling over WebSockets for v1.** Only add WebSocket sync if all core phases are done
   with time remaining (see PRD §11, cut order).
7. **No neuro-symbolic / formal-logic verification layer.** Explicitly out of scope for this
   project — do not add it even if it seems like a good idea.
8. Keep `.env` / API keys out of git. Use `.env.example` with placeholder values.

## Build order (map to PRD §10, but sequence by dependency not by day)
1. Repo skeleton (`/backend`, `/frontend`) + Supabase schema from PRD §5.
2. `integrations/fortyguard.py` — real submit call verified against live API, then poll.
3. `services/risk_engine.py` — threshold classification from raw temperature data.
4. `/internal/trigger-check` endpoint + `action_logs` writes.
5. `integrations/retell.py` (voice) + `integrations/twilio_sms.py` (SMS fallback).
6. Frontend skeleton — map renders the seeded site's polygon, static data first.
7. Connect frontend to backend via polling (`GET /heat` every 15–30s).
8. UI polish (dark theme per PRD), then only if time remains: WebSocket upgrade.

Do not start step N+1 until step N has been manually verified working.

## Coding conventions
- Python: type hints everywhere, Pydantic models for all request/response bodies, async
  endpoints throughout (no blocking calls in route handlers).
- React: functional components + hooks only, Tailwind utility classes (no separate CSS
  files unless truly necessary).
- Every new backend route gets a one-line docstring explaining what it's for — this repo
  will need a README generated from it later for hackathon submission.

## When stuck
If FortyGuard's live API, Retell, or Twilio credentials aren't available, stop and ask the
user — don't silently switch to mock data and keep building on top of it. A demo built on
fake data is worse than a smaller demo built on real data.
