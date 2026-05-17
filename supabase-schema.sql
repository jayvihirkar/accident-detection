create table if not exists public.devices (
  id text primary key,
  name text not null,
  status text not null default 'OFFLINE',
  last_seen bigint,
  firmware_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.live_telemetry (
  device_id text primary key references public.devices(id) on delete cascade,
  status text not null default 'SAFE',
  severity text not null default 'NONE',
  ax double precision not null default 0,
  ay double precision not null default 0,
  az double precision not null default 0,
  gx double precision not null default 0,
  gy double precision not null default 0,
  gz double precision not null default 0,
  lat double precision,
  lng double precision,
  speed double precision not null default 0,
  satellites integer not null default 0,
  impact_magnitude double precision not null default 0,
  timestamp bigint not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.accident_events (
  id text primary key,
  type text not null default 'CRASH',
  severity text not null default 'HIGH',
  ax double precision not null default 0,
  ay double precision not null default 0,
  az double precision not null default 0,
  gx double precision not null default 0,
  gy double precision not null default 0,
  gz double precision not null default 0,
  impact_magnitude double precision not null default 0,
  lat double precision,
  lng double precision,
  speed double precision not null default 0,
  satellites integer not null default 0,
  timestamp bigint not null,
  device_id text not null references public.devices(id) on delete cascade,
  storage text not null default 'cloud',
  created_at timestamptz not null default now()
);

create index if not exists accident_events_device_timestamp_idx
  on public.accident_events (device_id, timestamp desc);

alter table public.devices enable row level security;
alter table public.live_telemetry enable row level security;
alter table public.accident_events enable row level security;

drop policy if exists "Allow prototype reads on devices" on public.devices;
drop policy if exists "Allow prototype writes on devices" on public.devices;
drop policy if exists "Allow prototype reads on live telemetry" on public.live_telemetry;
drop policy if exists "Allow prototype writes on live telemetry" on public.live_telemetry;
drop policy if exists "Allow prototype reads on accident events" on public.accident_events;
drop policy if exists "Allow prototype writes on accident events" on public.accident_events;

create policy "Allow prototype reads on devices"
  on public.devices for select
  using (true);

create policy "Allow prototype writes on devices"
  on public.devices for all
  using (true)
  with check (true);

create policy "Allow prototype reads on live telemetry"
  on public.live_telemetry for select
  using (true);

create policy "Allow prototype writes on live telemetry"
  on public.live_telemetry for all
  using (true)
  with check (true);

create policy "Allow prototype reads on accident events"
  on public.accident_events for select
  using (true);

create policy "Allow prototype writes on accident events"
  on public.accident_events for all
  using (true)
  with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'live_telemetry'
  ) then
    alter publication supabase_realtime add table public.live_telemetry;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'accident_events'
  ) then
    alter publication supabase_realtime add table public.accident_events;
  end if;
end $$;
