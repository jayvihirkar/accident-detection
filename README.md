# Smart Vehicle Blackbox Dashboard

A React 19 + Vite dashboard for an ESP32 Smart Vehicle Blackbox and Accident Detection System. The app now uses Supabase Postgres plus Supabase Realtime instead of Firebase.

## Features

- Supabase client setup with `.env` values
- Realtime subscriptions for live vehicle telemetry and accident events
- Built-in five-record demo dataset for classroom presentation
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
supabase-crash-sms-webhook.sql
supabase-seed.sql
supabase/
  functions/
    send-crash-sms/
      index.ts
esp32/
  blackbox_supabase.ino
  README.md
matlab/
  blackbox_live_simulation.m
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
- `telemetry_history`
- `accident_events`

It also enables Row Level Security with permissive prototype policies and adds `live_telemetry`, `telemetry_history`, and `accident_events` to the `supabase_realtime` publication.

If you already created the first version of the tables and only need history logging, run `supabase-add-telemetry-history.sql` in SQL Editor.

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

One row per vehicle. The ESP32 updates this every 1-2 seconds. This table is supposed to overwrite the same `device_id` row so the dashboard can quickly read the latest state.

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

### `telemetry_history`

One row per ESP32 upload. This is the table to use when you want a full log/history of normal readings.

```sql
id bigserial primary key
device_id text
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
created_at timestamptz
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
- Fetches the latest chart readings from `telemetry_history`
- Fetches `accident_events` sorted by `timestamp` descending
- Subscribes to Supabase Realtime `postgres_changes`
- Updates the chart sample buffer with the last 20 logged readings
- Falls back to mock data if `.env` is missing

The Supabase client lives in `src/supabase.js`.

## Classroom Demo Dataset

The website includes five prepared demo readings centered around:

```text
18.45968802450589, 73.88479778632185
```

Use the **Demo Dataset** selector on the dashboard to switch between:

- Normal drive
- Road shock
- Hard brake
- Medium crash
- Severe crash

Selecting a demo record updates the status card, metrics, charts, map, and accident event panel. Click **Live Supabase feed** to return to realtime data from the ESP32.

## MATLAB Live Simulation

A MATLAB simulation is included at `matlab/blackbox_live_simulation.m`. It animates a vehicle route around the demo location and displays live-style GPS, acceleration, gyroscope, speed, impact magnitude, and crash status.

Run it in MATLAB:

```matlab
blackbox_live_simulation
```

The simulation includes normal driving, hard braking, pothole/road shock, and crash sections so you can demonstrate the system safely without damaging a vehicle.

For real ESP32 values from Supabase, use `matlab/blackbox_supabase_live_monitor.m`. Copy `matlab/supabase_config_template.m` to `matlab/supabase_config.m`, fill your Supabase URL/key, then run:

```matlab
blackbox_supabase_live_monitor
```

## ESP32 Integration

The ESP32 should write through Supabase REST endpoints or a small secure API layer.

An Arduino sketch is included at `esp32/blackbox_supabase.ino`. It keeps the existing GPS + MPU6050 logic, registers the device, upserts `live_telemetry`, and inserts `accident_events` when a crash is detected.

Recommended behavior:

- Upsert `devices` on boot.
- Upsert `live_telemetry` every 1-2 seconds for latest state.
- Insert into `telemetry_history` every 1-2 seconds for full logging.
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

Telemetry history insert target:

```text
POST /rest/v1/telemetry_history
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

### Twilio Crash SMS

This repo includes a Supabase Edge Function at `supabase/functions/send-crash-sms/index.ts`.
It sends an SMS when a new row is inserted into `accident_events`.

The SMS includes:

- Vehicle/device ID
- Severity
- Impact magnitude
- Speed
- Timestamp
- Exact Google Maps link when GPS latitude and longitude are available

This keeps Twilio credentials out of the React app and out of the ESP32 firmware.

1. Install and log in to the Supabase CLI if needed.
2. Set these Supabase Function secrets:

```bash
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
supabase secrets set TWILIO_FROM_NUMBER=+1234567890
supabase secrets set ALERT_TO_NUMBERS=+919876543210
supabase secrets set CRASH_SMS_WEBHOOK_SECRET=replace_with_a_long_random_secret
```

Use comma-separated recipients for multiple phones:

```bash
supabase secrets set ALERT_TO_NUMBERS=+919876543210,+919123456789
```

3. Deploy the function without JWT verification, because the database trigger uses a shared secret header instead:

```bash
supabase functions deploy send-crash-sms --no-verify-jwt
```

4. Open `supabase-crash-sms-webhook.sql`, replace:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-crash-sms
REPLACE_WITH_CRASH_SMS_WEBHOOK_SECRET
```

Use the same `CRASH_SMS_WEBHOOK_SECRET` value you set above.

5. Run `supabase-crash-sms-webhook.sql` in the Supabase SQL Editor.

After that, every successful `accident_events` insert from the ESP32 triggers an SMS.

For Twilio trial accounts, the recipient phone number usually must be verified in Twilio first. Use E.164 phone format, for example `+91...` for India.

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
- Twilio secrets set in Supabase, if SMS alerts are needed
- `send-crash-sms` Edge Function deployed, if SMS alerts are needed
- `supabase-crash-sms-webhook.sql` executed, if SMS alerts are needed
- Realtime enabled for `live_telemetry` and `accident_events`
- React reads live telemetry
- ESP32 can upsert live telemetry and insert telemetry history
- Crash events are inserted into `accident_events`
