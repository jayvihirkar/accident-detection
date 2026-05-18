# MATLAB Live Simulation

## Option 1: Offline Simulation

Run this file in MATLAB:

```matlab
blackbox_live_simulation
```

It simulates the same values used by the ESP32 and dashboard:

- `ax`, `ay`, `az`
- `gx`, `gy`, `gz`
- `lat`, `lng`
- `speed`
- `satellites`
- `impactMagnitude`

The route is centered on the demonstration location:

```text
18.45968802450589, 73.88479778632185
```

The simulation includes:

- Normal driving
- Hard braking / tilt
- Pothole or road shock
- Crash event with severity

No Mapping Toolbox is required. The GPS view is a latitude/longitude plot so it should run on ordinary MATLAB installations.

## Option 2: Live Supabase Monitor

This reads the actual `live_telemetry` row that the ESP32 uploads to Supabase.

1. Copy the config template:

```matlab
copyfile("supabase_config_template.m", "supabase_config.m")
```

2. Open `supabase_config.m` and fill:

```matlab
config.url = "https://YOUR_PROJECT_REF.supabase.co";
config.key = "YOUR_SUPABASE_PUBLISHABLE_KEY";
config.deviceId = "vehicle_001";
```

3. Run:

```matlab
blackbox_supabase_live_monitor
```

The live monitor polls Supabase every 1.5 seconds and updates:

- GPS track
- Acceleration chart
- Gyroscope chart
- Speed, satellites, status, severity, and impact magnitude

Keep `supabase_config.m` private. It is ignored by Git.
