create table if not exists public.telemetry_history (
  id bigserial primary key,
  device_id text not null references public.devices(id) on delete cascade,
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
  created_at timestamptz not null default now()
);

create index if not exists telemetry_history_device_timestamp_idx
  on public.telemetry_history (device_id, timestamp desc);

alter table public.telemetry_history enable row level security;

drop policy if exists "Allow prototype reads on telemetry history" on public.telemetry_history;
drop policy if exists "Allow prototype writes on telemetry history" on public.telemetry_history;

create policy "Allow prototype reads on telemetry history"
  on public.telemetry_history for select
  using (true);

create policy "Allow prototype writes on telemetry history"
  on public.telemetry_history for all
  using (true)
  with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'telemetry_history'
  ) then
    alter publication supabase_realtime add table public.telemetry_history;
  end if;
end $$;
