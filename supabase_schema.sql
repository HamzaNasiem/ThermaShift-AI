-- ThermaShift AI — Supabase / PostgreSQL Schema
-- Run this in your Supabase SQL editor or against a local Postgres instance.
-- Requires: uuid-ossp, pgcrypto extensions

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- managers
-- ─────────────────────────────────────────
create table if not exists managers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- sites
-- ─────────────────────────────────────────
create table if not exists sites (
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references sites(id) on delete cascade,
  name text not null,
  phone_number text not null,
  preferred_language text not null default 'ur',   -- 'ur' | 'en'
  consented_at timestamptz,                          -- null = not consented, do not call
  status text not null default 'safe'
    check (status in ('safe','elevated','notified','acknowledged')),
  created_at timestamptz default now()
);
create index if not exists idx_workers_site on workers(site_id);

-- ─────────────────────────────────────────
-- heat_snapshots
-- ─────────────────────────────────────────
create table if not exists heat_snapshots (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references sites(id) on delete cascade,
  fortyguard_activity_id text,
  temperature_f numeric not null,
  analysis_layer text not null check (analysis_layer in ('snapshot','exceedance','persistence')),
  risk_level text not null check (risk_level in ('normal','elevated','extreme')),
  raw_response jsonb,                        -- store full FortyGuard response for debugging
  captured_at timestamptz default now()
);
create index if not exists idx_snapshots_site_time on heat_snapshots(site_id, captured_at desc);

-- ─────────────────────────────────────────
-- action_logs
-- ─────────────────────────────────────────
create table if not exists action_logs (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid references workers(id) on delete cascade,
  heat_snapshot_id uuid references heat_snapshots(id) on delete set null,
  channel text not null check (channel in ('voice','sms')),
  provider_ref text,                          -- retell call_id / twilio message_sid
  status text not null default 'queued'
    check (status in ('queued','delivered','failed','acknowledged')),
  transcript text,
  created_at timestamptz default now()
);
create index if not exists idx_actionlogs_worker on action_logs(worker_id);
create index if not exists idx_actionlogs_snapshot on action_logs(heat_snapshot_id);

-- Prevents double-alerting the same worker for the same snapshot on the same channel
create unique index if not exists uq_worker_snapshot_channel
  on action_logs(worker_id, heat_snapshot_id, channel);

-- ─────────────────────────────────────────
-- Demo seed data (safe to run in dev)
-- Comment out before production deployment
-- ─────────────────────────────────────────

-- Seed a demo manager
insert into managers (id, name, email) values
  ('00000000-0000-0000-0000-000000000001', 'Demo Manager', 'demo@thermashift.ai')
on conflict do nothing;

-- Seed a demo site (Phoenix Downtown Construction Zone, Arizona)
insert into sites (id, manager_id, name, polygon_geojson, extreme_threshold_f, elevated_threshold_f) values
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Phoenix Downtown Worksite 1',
    '{
      "type": "Polygon",
      "coordinates": [[
        [-112.0800, 33.4450],
        [-112.0700, 33.4450],
        [-112.0700, 33.4550],
        [-112.0800, 33.4550],
        [-112.0800, 33.4450]
      ]]
    }',
    108,
    100
  )
on conflict (id) do update set
  name = excluded.name,
  polygon_geojson = excluded.polygon_geojson,
  extreme_threshold_f = excluded.extreme_threshold_f,
  elevated_threshold_f = excluded.elevated_threshold_f;

-- Seed demo workers (use your own phone numbers for testing)
-- NOTE: consented_at is set — only use real consented numbers
insert into workers (id, site_id, name, phone_number, preferred_language, consented_at) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'Ahmed Khan',  '+923001234567', 'ur', now()),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', 'Bilal Raza',   '+923009876543', 'ur', now()),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', 'Fahad Ali',    '+923331234567', 'en', now())
on conflict do nothing;
