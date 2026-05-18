#include <TinyGPSPlus.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <time.h>
#include <math.h>

// ---------------- Wi-Fi + Supabase Configuration ----------------
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Example: https://rqxxxxxxxxxxxxxxxxxx.supabase.co
const char* SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const char* SUPABASE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";
const char* DEVICE_ID = "vehicle_001";

const unsigned long LIVE_UPLOAD_INTERVAL_MS = 2000;
const unsigned long CRASH_EVENT_COOLDOWN_MS = 10000;
const unsigned long CRASH_STATUS_HOLD_MS = 5000;

unsigned long lastLiveUploadMs = 0;
unsigned long lastCrashEventUploadMs = 0;
unsigned long lastCrashDetectedMs = 0;
float lastCrashImpactG = 0.0;

// ---------------- GPS Configuration ----------------
#define RX2 16
#define TX2 17
#define DE_RE 18

HardwareSerial GPSSerial(2);
TinyGPSPlus gps;

// ---------------- MPU6050 Configuration ----------------
#define MPU_ADDR 0x68
#define SDA_PIN 21
#define SCL_PIN 22

int16_t AcX, AcY, AcZ;
int16_t GyX, GyY, GyZ;
int16_t TempRaw;

float ax_g, ay_g, az_g;
float gx_dps, gy_dps, gz_dps;
float temperatureC;
float totalAcceleration;

// ---------------- GPS Start Point ----------------
double startLat = 0.0;
double startLng = 0.0;
bool hasStart = false;

// ---------------- Thresholds ----------------
float crashThresholdG = 2.0;
float potholeThresholdG = 1.8;

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);

  Serial.println("ESP32 CARS SYSTEM");
  Serial.println("GPS + MPU6050 + Supabase");
  Serial.println("--------------------------------");

  pinMode(DE_RE, OUTPUT);
  digitalWrite(DE_RE, LOW);

  GPSSerial.begin(38400, SERIAL_8N1, RX2, TX2);

  Wire.begin(SDA_PIN, SCL_PIN);

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission(true);

  connectWiFi();
  registerDevice();

  Serial.println("GPS Initialized");
  Serial.println("MPU6050 Initialized");
}

// ---------------- MAIN LOOP ----------------
void loop() {
  readGPS();
  readMPU6050();
  convertMPUValues();

  printGPSData();
  printMPUData();

  bool crashDetected = detectEvents();

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (millis() - lastLiveUploadMs >= LIVE_UPLOAD_INTERVAL_MS) {
    uploadLiveTelemetry();
    lastLiveUploadMs = millis();
  }

  if (crashDetected && millis() - lastCrashEventUploadMs >= CRASH_EVENT_COOLDOWN_MS) {
    uploadCrashEvent();
    lastCrashEventUploadMs = millis();
  }

  Serial.println("============================\n");

  delay(500);
}

// ---------------- Wi-Fi ----------------
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.print("Connecting to Wi-Fi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttemptMs = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptMs < 15000) {
    Serial.print(".");
    delay(500);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWi-Fi connection failed. Will retry.");
  }
}

// ---------------- READ GPS ----------------
void readGPS() {
  while (GPSSerial.available() > 0) {
    gps.encode(GPSSerial.read());
  }
}

// ---------------- READ MPU6050 ----------------
void readMPU6050() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);

  Wire.requestFrom(MPU_ADDR, 14, true);

  AcX = Wire.read() << 8 | Wire.read();
  AcY = Wire.read() << 8 | Wire.read();
  AcZ = Wire.read() << 8 | Wire.read();

  TempRaw = Wire.read() << 8 | Wire.read();

  GyX = Wire.read() << 8 | Wire.read();
  GyY = Wire.read() << 8 | Wire.read();
  GyZ = Wire.read() << 8 | Wire.read();
}

// ---------------- CONVERT MPU VALUES ----------------
void convertMPUValues() {
  ax_g = AcX / 16384.0;
  ay_g = AcY / 16384.0;
  az_g = AcZ / 16384.0;

  gx_dps = GyX / 131.0;
  gy_dps = GyY / 131.0;
  gz_dps = GyZ / 131.0;

  temperatureC = TempRaw / 340.0 + 36.53;
  totalAcceleration = sqrt(ax_g * ax_g + ay_g * ay_g + az_g * az_g);
}

// ---------------- PRINT GPS DATA ----------------
void printGPSData() {
  Serial.println("===== GPS DATA =====");

  if (gps.location.isValid()) {
    double lat = gps.location.lat();
    double lng = gps.location.lng();

    if (!hasStart && gps.satellites.value() > 0) {
      startLat = lat;
      startLng = lng;
      hasStart = true;
      Serial.println("Start Point Fixed!");
    }

    Serial.printf("Latitude: %.6f\n", lat);
    Serial.printf("Longitude: %.6f\n", lng);
    Serial.printf("Satellites: %d\n", gps.satellites.value());
    Serial.printf("Speed: %.2f km/h\n", gps.speed.kmph());

    if (gps.time.isValid()) {
      Serial.printf("UTC Time: %02d:%02d:%02d\n",
                    gps.time.hour(),
                    gps.time.minute(),
                    gps.time.second());
    } else {
      Serial.println("UTC Time: Invalid");
    }

    if (hasStart) {
      double distance = TinyGPSPlus::distanceBetween(lat, lng, startLat, startLng);
      Serial.printf("Distance From Start: %.2f m\n", distance);
    }

    Serial.print("Google Maps: ");
    Serial.print("http://maps.google.com/maps?q=");
    Serial.print(lat, 6);
    Serial.print(",");
    Serial.println(lng, 6);

  } else {
    Serial.println("GPS: Waiting for fix...");
  }
}

// ---------------- PRINT MPU DATA ----------------
void printMPUData() {
  Serial.println("\n===== MPU6050 DATA =====");

  Serial.print("Raw Accel X: ");
  Serial.print(AcX);
  Serial.print(" | Y: ");
  Serial.print(AcY);
  Serial.print(" | Z: ");
  Serial.println(AcZ);

  Serial.print("Accel X: ");
  Serial.print(ax_g);
  Serial.print(" g | Y: ");
  Serial.print(ay_g);
  Serial.print(" g | Z: ");
  Serial.print(az_g);
  Serial.println(" g");

  Serial.print("Total Acceleration: ");
  Serial.print(totalAcceleration);
  Serial.println(" g");

  Serial.print("Gyro X: ");
  Serial.print(gx_dps);
  Serial.print(" deg/s | Y: ");
  Serial.print(gy_dps);
  Serial.print(" deg/s | Z: ");
  Serial.print(gz_dps);
  Serial.println(" deg/s");

  Serial.print("Temperature: ");
  Serial.print(temperatureC);
  Serial.println(" C");
}

// ---------------- EVENT DETECTION ----------------
bool detectEvents() {
  Serial.println("\n===== EVENT STATUS =====");

  bool crashDetected = totalAcceleration > crashThresholdG;

  if (crashDetected) {
    lastCrashDetectedMs = millis();
    lastCrashImpactG = totalAcceleration;
    Serial.println("CRASH DETECTED");

    if (gps.location.isValid()) {
      Serial.print("Crash Location: ");
      Serial.print(gps.location.lat(), 6);
      Serial.print(", ");
      Serial.println(gps.location.lng(), 6);
    }
  } else {
    Serial.println("Crash: Normal");
  }

  if (abs(az_g) > potholeThresholdG) {
    Serial.println("POTHOLE / ROAD SHOCK DETECTED");

    if (gps.location.isValid()) {
      Serial.print("Pothole Location: ");
      Serial.print(gps.location.lat(), 6);
      Serial.print(", ");
      Serial.println(gps.location.lng(), 6);
    }
  } else {
    Serial.println("Pothole: Not Detected");
  }

  if (abs(ax_g) > 0.8 || abs(ay_g) > 0.8) {
    Serial.println("VEHICLE TILT DETECTED");
  } else {
    Serial.println("Tilt: Normal");
  }

  return crashDetected;
}

// ---------------- Supabase Helpers ----------------
String restUrl(const String& pathAndQuery) {
  return String(SUPABASE_URL) + "/rest/v1/" + pathAndQuery;
}

String severityFromImpact() {
  float impact = totalAcceleration;
  if (millis() - lastCrashDetectedMs < CRASH_STATUS_HOLD_MS && lastCrashImpactG > impact) {
    impact = lastCrashImpactG;
  }

  if (impact >= 3.0) {
    return "HIGH";
  }

  if (impact >= crashThresholdG) {
    return "MEDIUM";
  }

  return "NONE";
}

String currentStatus() {
  if (millis() - lastCrashDetectedMs < CRASH_STATUS_HOLD_MS) {
    return "CRASH";
  }

  return "SAFE";
}

unsigned long currentTimestamp() {
  if (gps.date.isValid() && gps.time.isValid()) {
    struct tm timeinfo;
    memset(&timeinfo, 0, sizeof(timeinfo));
    timeinfo.tm_year = gps.date.year() - 1900;
    timeinfo.tm_mon = gps.date.month() - 1;
    timeinfo.tm_mday = gps.date.day();
    timeinfo.tm_hour = gps.time.hour();
    timeinfo.tm_min = gps.time.minute();
    timeinfo.tm_sec = gps.time.second();
    timeinfo.tm_isdst = 0;

    time_t epoch = mktime(&timeinfo);
    if (epoch > 0) {
      return (unsigned long)epoch;
    }
  }

  return millis() / 1000;
}

String gpsNumberOrNull(double value, bool valid, int decimals) {
  if (!valid) {
    return "null";
  }

  return String(value, decimals);
}

String telemetryJson() {
  bool hasLocation = gps.location.isValid();
  bool hasSpeed = gps.speed.isValid();
  unsigned long timestamp = currentTimestamp();

  String json = "{";
  json += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  json += "\"status\":\"" + currentStatus() + "\",";
  json += "\"severity\":\"" + severityFromImpact() + "\",";
  json += "\"ax\":" + String(ax_g, 4) + ",";
  json += "\"ay\":" + String(ay_g, 4) + ",";
  json += "\"az\":" + String(az_g, 4) + ",";
  json += "\"gx\":" + String(gx_dps, 4) + ",";
  json += "\"gy\":" + String(gy_dps, 4) + ",";
  json += "\"gz\":" + String(gz_dps, 4) + ",";
  json += "\"lat\":" + gpsNumberOrNull(gps.location.lat(), hasLocation, 6) + ",";
  json += "\"lng\":" + gpsNumberOrNull(gps.location.lng(), hasLocation, 6) + ",";
  json += "\"speed\":" + String(hasSpeed ? gps.speed.kmph() : 0.0, 2) + ",";
  json += "\"satellites\":" + String(gps.satellites.isValid() ? gps.satellites.value() : 0) + ",";
  json += "\"impact_magnitude\":" + String(totalAcceleration, 4) + ",";
  json += "\"timestamp\":" + String(timestamp);
  json += "}";

  return json;
}

String crashEventJson() {
  String json = telemetryJson();
  json.remove(json.length() - 1);
  json += ",\"id\":\"event_" + String(currentTimestamp()) + "\",";
  json += "\"type\":\"CRASH\",";
  json += "\"storage\":\"cloud\"";
  json += "}";
  return json;
}

bool sendSupabaseRequest(const String& method, const String& url, const String& payload, const String& preferHeader) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Supabase upload skipped: Wi-Fi disconnected");
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure(); // Prototype only. Use the Supabase root CA for production firmware.

  HTTPClient http;
  if (!http.begin(client, url)) {
    Serial.println("Supabase HTTP begin failed");
    return false;
  }

  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", preferHeader);

  int httpCode = method == "POST" ? http.POST(payload) : http.sendRequest(method.c_str(), payload);
  String response = http.getString();
  http.end();

  Serial.print("Supabase HTTP ");
  Serial.print(httpCode);
  Serial.print(" -> ");
  Serial.println(url);

  if (httpCode >= 200 && httpCode < 300) {
    return true;
  }

  Serial.print("Supabase response: ");
  Serial.println(response);
  return false;
}

void registerDevice() {
  String payload = "{";
  payload += "\"id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"name\":\"Test Vehicle\",";
  payload += "\"status\":\"ONLINE\",";
  payload += "\"last_seen\":" + String(currentTimestamp()) + ",";
  payload += "\"firmware_version\":\"1.0.0\"";
  payload += "}";

  sendSupabaseRequest(
    "POST",
    restUrl("devices?on_conflict=id"),
    payload,
    "resolution=merge-duplicates,return=minimal"
  );
}

void uploadLiveTelemetry() {
  String payload = telemetryJson();

  bool liveOk = sendSupabaseRequest(
    "POST",
    restUrl("live_telemetry?on_conflict=device_id"),
    payload,
    "resolution=merge-duplicates,return=minimal"
  );

  bool historyOk = sendSupabaseRequest(
    "POST",
    restUrl("telemetry_history"),
    payload,
    "return=minimal"
  );

  if (!liveOk || !historyOk) {
    Serial.println("Live telemetry cloud upload failed. Store this payload on SD card if available.");
  }
}

void uploadCrashEvent() {
  String payload = crashEventJson();

  bool ok = sendSupabaseRequest(
    "POST",
    restUrl("accident_events"),
    payload,
    "return=minimal"
  );

  if (!ok) {
    Serial.println("Crash event cloud upload failed. Store this payload on SD card if available.");
  }
}
