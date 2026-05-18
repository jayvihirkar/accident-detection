# ESP32 Supabase Firmware Notes

Open `blackbox_supabase.ino` in Arduino IDE.

Install these Arduino libraries:

- TinyGPSPlus
- ESP32 board support package

Built-in ESP32 libraries used:

- WiFi
- HTTPClient
- WiFiClientSecure
- Wire

Before uploading, replace:

```cpp
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const char* SUPABASE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";
const char* DEVICE_ID = "vehicle_001";
```

The sketch writes:

- `devices` on boot
- `live_telemetry` every 2 seconds
- `accident_events` when a crash is detected

For production firmware, replace `client.setInsecure()` with Supabase TLS root certificate validation, and do not ship broad write permissions if the device will be public.
