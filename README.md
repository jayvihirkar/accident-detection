# Smart Vehicle Blackbox Dashboard

A React 19 + Vite dashboard for an ESP32 Smart Vehicle Blackbox and Accident Detection System. The app now uses Supabase Postgres plus Supabase Realtime instead of Firebase.

## Features

- Supabase client setup with `.env` values
- Realtime subscriptions for live vehicle telemetry and accident events
- Mock telemetry fallback until Supabase is configured
- SAFE and CRASH status styling
- Rolling 20-sample Chart.js line charts for acceleration and gyroscope data
- Leaflet map with current GPS marker
- Reverse chronological accident history with Google Maps links
- SQL schema and seed files for Supabase

## Project Structure

```text
src/
  components/
    Navbar.jsx
    StatusCard.jsx
    SensorCharts.jsx
    LocationMap.jsx
    EventHistory.jsx
    MetricCard.jsx
  hooks/
    useRealtimeData.js
  utils/
    formatDate.js
  supabase.js
  App.jsx
  main.jsx
  index.css
.env.example
supabase-schema.sql
supabase-seed.sql
esp32/
  blackbox_supabase.ino
  README.md
```

## Local Setup

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Create A Supabase Project

1. Go to [Supabase](https://supabase.com/).
2. Sign in and click **New project**.
3. Choose your organization.
4. Enter a project name, for example `smart-vehicle-blackbox`.
5. Set a database password and save it somewhere safe.
6. Choose a region close to your vehicle/dashboard users.
7. Click **Create new project** and wait for it to finish provisioning.

## Get Supabase API Values

1. Open your Supabase project.
2. Go to **Project Settings > API**.
3. Copy:
   - **Project URL**
   - **publishable key**
4. Create a `.env` file in the project root:

```bash
copy .env.example .env
```

5. Paste your values:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
VITE_DEVICE_ID=vehicle_001
```

Restart `npm run dev` after changing `.env`.

## Create Tables

1. In Supabase, open **SQL Editor**.
2. Create a new query.
3. Paste the contents of `supabase-schema.sql`.
4. Click **Run**.

This creates:

- `devices`
- `live_telemetry`
- `accident_events`

It also enables Row Level Security with permissive prototype policies and adds `live_telemetry` and `accident_events` to the `supabase_realtime` publication.

## Add Sample Data

1. Open **SQL Editor** again.
2. Paste the contents of `supabase-seed.sql`.
3. Click **Run**.

After this, the dashboard should read real Supabase rows instead of mock data.

## Database Shape

### `devices`

```sql
id text primary key
name text
status text
last_seen bigint
firmware_version text
```

### `live_telemetry`

One row per vehicle. The ESP32 updates this every 1-2 seconds.

```sql
device_id text primary key
status text
severity text
ax double precision
ay double precision
az double precision
gx double precision
gy double precision
gz double precision
lat double precision
lng double precision
speed double precision
satellites integer
impact_magnitude double precision
timestamp bigint
```

### `accident_events`

One row per crash/impact event.

```sql
id text primary key
type text
severity text
ax double precision
ay double precision
az double precision
gx double precision
gy double precision
gz double precision
impact_magnitude double precision
lat double precision
lng double precision
speed double precision
satellites integer
timestamp bigint
device_id text
storage text
```

## React Integration

The hook at `src/hooks/useRealtimeData.js`:

- Fetches the current row from `live_telemetry`
- Fetches `accident_events` sorted by `timestamp` descending
- Subscribes to Supabase Realtime `postgres_changes`
- Updates the chart sample buffer with the last 20 live readings
- Falls back to mock data if `.env` is missing

The Supabase client lives in `src/supabase.js`.

## ESP32 Integration

The ESP32 should write through Supabase REST endpoints or a small secure API layer.

An Arduino sketch is included at `esp32/blackbox_supabase.ino`. It keeps the existing GPS + MPU6050 logic, registers the device, upserts `live_telemetry`, and inserts `accident_events` when a crash is detected.

Recommended behavior:

- Upsert `devices` on boot.
- Upsert `live_telemetry` every 1-2 seconds.
- Insert into `accident_events` when a crash is detected.
- Retry when Wi-Fi or upload fails.
- Store the same payload on MicroSD when cloud upload fails.
- Use `storage = 'cloud'`, `storage = 'sd_only'`, or `storage = 'cloud_and_sd'`.

Example REST base:

```text
https://YOUR_PROJECT_REF.supabase.co/rest/v1/
```

Required headers for prototype REST writes:

```text
apikey: YOUR_SUPABASE_PUBLISHABLE_KEY
Authorization: Bearer YOUR_SUPABASE_PUBLISHABLE_KEY
Content-Type: application/json
Prefer: resolution=merge-duplicates,return=minimal
```

Live telemetry upsert target:

```text
POST /rest/v1/live_telemetry?on_conflict=device_id
```

Crash event insert target:

```text
POST /rest/v1/accident_events
```

For production, avoid placing powerful keys in firmware. Use a device-scoped API key, Supabase Edge Function, or your own server endpoint.

## Notifications

When `live_telemetry.status` changes to `CRASH`, the app can:

- Show the red emergency state in the dashboard.
- Use a browser notification after the user grants permission.
- Call a Supabase Edge Function to send SMS, email, push, or webhook alerts.

Supabase itself does not replace Firebase Cloud Messaging directly. The usual Supabase path is Edge Functions plus a notification provider.

## Hosting

Supabase does not host Vite frontends directly. Deploy the built app to Vercel, Netlify, GitHub Pages, Cloudflare Pages, or any static hosting provider:

```bash
npm run build
```

Deploy the generated `dist/` folder and configure these environment variables on your hosting provider:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_DEVICE_ID
```

## Done Checklist

- Supabase project created
- `.env` filled with project URL and anon key
- `supabase-schema.sql` executed
- `supabase-seed.sql` executed
- Realtime enabled for `live_telemetry` and `accident_events`
- React reads live telemetry
- ESP32 can upsert live telemetry
- Crash events are inserted into `accident_events`
