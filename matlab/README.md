# MATLAB Live Simulation

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

To connect real ESP32 serial data later, replace `generateDemoData(...)` with a loop that reads comma-separated values from `serialport`.
