insert into public.devices (id, name, status, last_seen, firmware_version)
values ('vehicle_001', 'Test Vehicle', 'ONLINE', 1770000000, '1.0.0')
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  last_seen = excluded.last_seen,
  firmware_version = excluded.firmware_version,
  updated_at = now();

insert into public.live_telemetry (
  device_id,
  status,
  severity,
  ax,
  ay,
  az,
  gx,
  gy,
  gz,
  lat,
  lng,
  speed,
  satellites,
  impact_magnitude,
  timestamp
)
values (
  'vehicle_001',
  'SAFE',
  'NONE',
  0.32,
  0.15,
  9.81,
  0.02,
  -0.01,
  0.1,
  18.5204,
  73.8567,
  62,
  8,
  1.42,
  1770000000
)
on conflict (device_id) do update set
  status = excluded.status,
  severity = excluded.severity,
  ax = excluded.ax,
  ay = excluded.ay,
  az = excluded.az,
  gx = excluded.gx,
  gy = excluded.gy,
  gz = excluded.gz,
  lat = excluded.lat,
  lng = excluded.lng,
  speed = excluded.speed,
  satellites = excluded.satellites,
  impact_magnitude = excluded.impact_magnitude,
  timestamp = excluded.timestamp,
  updated_at = now();

insert into public.accident_events (
  id,
  type,
  severity,
  ax,
  ay,
  az,
  gx,
  gy,
  gz,
  impact_magnitude,
  lat,
  lng,
  speed,
  satellites,
  timestamp,
  device_id,
  storage
)
values (
  'event_1770001234',
  'CRASH',
  'HIGH',
  14.8,
  -2.1,
  21.3,
  3.2,
  0.4,
  1.8,
  25.9,
  18.5204,
  73.8567,
  72,
  8,
  1770001234,
  'vehicle_001',
  'cloud_and_sd'
)
on conflict (id) do nothing;
