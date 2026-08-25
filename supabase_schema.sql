-- ThermaShift AI — Supabase / PostgreSQL Production Schema
-- Run this in your Supabase SQL editor (https://supabase.com/dashboard/project/_/sql)

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- managers
-- ─────────────────────────────────────────
create table if not exists managers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- sites
-- ─────────────────────────────────────────
create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid references managers(id) on delete cascade,
  name text not null,
  polygon_geojson jsonb not null,          -- exact aoi, sent as-is to FortyGuard
  extreme_threshold_f numeric not null default 110,
  elevated_threshold_f numeric not null default 100,
  poll_interval_minutes int not null default 10,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- workers
-- ─────────────────────────────────────────
create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete cascade,
  name text not null,
  phone_number text not null,
  preferred_language text not null default 'en',   -- 'en'
  consented_at timestamptz default now(),           -- null = not consented
  status text not null default 'safe'
    check (status in ('safe','elevated','notified','acknowledged')),
  created_at timestamptz default now()
);
create index if not exists idx_workers_site on workers(site_id);

-- ─────────────────────────────────────────
-- heat_snapshots
-- ─────────────────────────────────────────
create table if not exists heat_snapshots (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete cascade,
  fortyguard_activity_id text,
  temperature_f numeric not null,
  analysis_layer text not null default 'snapshot' check (analysis_layer in ('snapshot','exceedance','persistence')),
  risk_level text not null check (risk_level in ('normal','elevated','extreme')),
  raw_response jsonb,                        -- full FortyGuard response
  captured_at timestamptz default now()
);
create index if not exists idx_snapshots_site_time on heat_snapshots(site_id, captured_at desc);

-- ─────────────────────────────────────────
-- action_logs
-- ─────────────────────────────────────────
create table if not exists action_logs (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references workers(id) on delete cascade,
  heat_snapshot_id uuid references heat_snapshots(id) on delete set null,
  channel text not null check (channel in ('voice','sms')),
  provider_ref text,                          -- Retell call_id / Twilio sid / CALL-E id
  status text not null default 'queued'
    check (status in ('queued','delivered','failed','acknowledged')),
  transcript text,
  created_at timestamptz default now()
);
create index if not exists idx_actionlogs_worker on action_logs(worker_id);
create index if not exists idx_actionlogs_snapshot on action_logs(heat_snapshot_id);

-- ─────────────────────────────────────────
-- Seed Global Work Sites
-- ─────────────────────────────────────────
insert into sites (id, name, polygon_geojson, extreme_threshold_f, elevated_threshold_f) values
  (
    '7eec064d-7724-49b9-b99f-9458017fa542',
    'Abu Dhabi ICAD Heavy Industrial Yard, UAE',
    '{"type": "Polygon", "coordinates": [[[54.4881, 24.3272], [54.4961, 24.3272], [54.4961, 24.3352], [54.4881, 24.3352], [54.4881, 24.3272]]]}',
    112.0,
    102.0
  ),
  (
    '74e05dd1-39ae-449d-b894-729eb166edf8',
    'Dubai Al Quoz Logistics & Construction Yard, UAE',
    '{"type": "Polygon", "coordinates": [[[55.2306, 25.1289], [55.2376, 25.1289], [55.2376, 25.1359], [55.2306, 25.1359], [55.2306, 25.1289]]]}',
    110.0,
    100.0
  ),
  (
    '4c417991-d47a-4f62-a82c-1a9e7aab65fb',
    'Los Angeles Downtown Thermal Corridor, CA',
    '{"type": "Polygon", "coordinates": [[[-118.2498, 34.0377], [-118.2438, 34.0377], [-118.2438, 34.0437], [-118.2498, 34.0437], [-118.2498, 34.0377]]]}',
    105.0,
    96.0
  ),
  (
    '0bce18cc-6a3d-45db-b34b-e89491279632',
    'Phoenix Sky Harbor Cargo & Freight Yard, AZ',
    '{"type": "Polygon", "coordinates": [[[-112.0141, 33.4312], [-112.0061, 33.4312], [-112.0061, 33.4392], [-112.0141, 33.4392], [-112.0141, 33.4312]]]}',
    114.0,
    104.0
  ),
  (
    'f6d5e1d6-15f8-4b1b-af71-aabb9df179be',
    'Fresno Solar & Ag Field, Central Valley, CA',
    '{"type": "Polygon", "coordinates": [[[-119.7766, 36.7428], [-119.7686, 36.7428], [-119.7686, 36.7508], [-119.7766, 36.7508], [-119.7766, 36.7428]]]}',
    108.0,
    100.0
  )
on conflict (id) do update set
  name = excluded.name,
  polygon_geojson = excluded.polygon_geojson;

-- Seed Workers
insert into workers (id, site_id, name, phone_number, preferred_language, consented_at) values
  ('11111111-1111-1111-1111-111111111111', '7eec064d-7724-49b9-b99f-9458017fa542', 'Rashid Al-Mansoor (Site Foreman)', '+923172532350', 'en', now()),
  ('22222222-2222-2222-2222-222222222222', '74e05dd1-39ae-449d-b894-729eb166edf8', 'Tariq Mehmood (Safety Officer)', '+923172532350', 'en', now()),
  ('33333333-3333-3333-3333-333333333333', '4c417991-d47a-4f62-a82c-1a9e7aab65fb', 'Carlos Rodriguez (Civil Supervisor)', '+12135550192', 'en', now()),
  ('44444444-4444-4444-4444-444444444444', '0bce18cc-6a3d-45db-b34b-e89491279632', 'David Martinez (Ground Ops)', '+16025550183', 'en', now()),
  ('55555555-5555-5555-5555-555555555555', 'f6d5e1d6-15f8-4b1b-af71-aabb9df179be', 'Hamza (Field Operations Lead)', '+923172532350', 'en', now())
on conflict (id) do nothing;
