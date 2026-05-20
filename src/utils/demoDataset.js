const DEMO_LAT = 18.45968802450589;
const DEMO_LNG = 73.88479778632185;
const BASE_TIMESTAMP = Math.floor(Date.now() / 1000);

function sample(labelIndex, timestamp, values) {
  return {
    label: `${labelIndex + 1}`,
    timestamp,
    ax: values.ax,
    ay: values.ay,
    az: values.az,
    gx: values.gx,
    gy: values.gy,
    gz: values.gz,
  };
}

function buildSamples(baseTimestamp, variant) {
  const normal = [
    { ax: 0.03, ay: 0.05, az: 1.01, gx: 0.4, gy: 0.2, gz: 0.1 },
    { ax: 0.04, ay: 0.02, az: 0.99, gx: 0.5, gy: 0.1, gz: 0.2 },
    { ax: 0.02, ay: 0.04, az: 1.02, gx: 0.3, gy: 0.2, gz: 0.1 },
    { ax: 0.05, ay: 0.03, az: 1.0, gx: 0.6, gy: 0.3, gz: 0.2 },
  ];

  const pothole = [
    { ax: 0.08, ay: 0.04, az: 1.03, gx: 0.7, gy: 0.2, gz: 0.1 },
    { ax: 0.1, ay: 0.05, az: 1.08, gx: 0.8, gy: 0.3, gz: 0.2 },
    { ax: 0.18, ay: -0.09, az: 1.92, gx: 1.8, gy: 0.6, gz: 0.4 },
    { ax: 0.07, ay: 0.05, az: 1.04, gx: 0.7, gy: 0.2, gz: 0.2 },
  ];

  const hardBrake = [
    { ax: -0.1, ay: 0.03, az: 1.01, gx: 0.5, gy: 0.2, gz: 0.1 },
    { ax: -0.42, ay: 0.08, az: 1.04, gx: 1.2, gy: 0.4, gz: 0.2 },
    { ax: -0.78, ay: 0.11, az: 1.09, gx: 1.8, gy: 0.5, gz: 0.3 },
    { ax: -0.32, ay: 0.06, az: 1.02, gx: 0.9, gy: 0.3, gz: 0.2 },
  ];

  const crashMedium = [
    { ax: 0.06, ay: 0.03, az: 1.02, gx: 0.4, gy: 0.2, gz: 0.1 },
    { ax: 0.28, ay: -0.16, az: 1.22, gx: 1.2, gy: 0.5, gz: 0.4 },
    { ax: 1.55, ay: -0.72, az: 2.58, gx: 3.8, gy: 1.4, gz: 2.1 },
    { ax: 0.84, ay: -0.36, az: 1.74, gx: 2.4, gy: 0.9, gz: 1.3 },
    { ax: 0.18, ay: -0.08, az: 1.1, gx: 0.9, gy: 0.4, gz: 0.3 },
  ];

  const crashHigh = [
    { ax: 0.08, ay: 0.04, az: 1.03, gx: 0.5, gy: 0.2, gz: 0.1 },
    { ax: 0.62, ay: -0.34, az: 1.58, gx: 2.6, gy: 1.1, gz: 0.9 },
    { ax: 3.7, ay: -1.78, az: 4.42, gx: 8.4, gy: 3.6, gz: 5.7 },
    { ax: -1.9, ay: 1.22, az: 3.16, gx: -6.8, gy: -2.8, gz: -4.6 },
    { ax: 1.24, ay: -0.88, az: 2.36, gx: 4.9, gy: 2.1, gz: 3.2 },
  ];

  const lookup = { normal, pothole, hardBrake, crashMedium, crashHigh };
  const pattern = lookup[variant] || normal;

  return Array.from({ length: 20 }, (_, index) => {
    const values = pattern[index % pattern.length];
    const drift = index * 0.01;

    return sample(index, baseTimestamp - (19 - index) * 2, {
      ax: Number((values.ax + drift).toFixed(3)),
      ay: Number((values.ay - drift / 2).toFixed(3)),
      az: Number(values.az.toFixed(3)),
      gx: Number((values.gx + drift * 4).toFixed(3)),
      gy: Number((values.gy + drift * 2).toFixed(3)),
      gz: Number((values.gz + drift * 3).toFixed(3)),
    });
  });
}

function eventFor(record) {
  if (record.live.status !== 'CRASH') {
    return null;
  }

  return {
    id: `event_${record.live.timestamp}`,
    type: 'CRASH',
    severity: record.live.severity,
    ax: record.live.ax,
    ay: record.live.ay,
    az: record.live.az,
    gx: record.live.gx,
    gy: record.live.gy,
    gz: record.live.gz,
    impactMagnitude: record.live.impactMagnitude,
    lat: record.live.lat,
    lng: record.live.lng,
    speed: record.live.speed,
    satellites: record.live.satellites,
    timestamp: record.live.timestamp,
    deviceId: record.live.deviceId,
    storage: 'cloud_and_sd',
  };
}

function potholeFor(record) {
  if (record.id !== 'demo-pothole') {
    return null;
  }

  return {
    id: `pothole_${record.live.timestamp}`,
    type: 'POTHOLE',
    severity: 'LOW',
    ax: record.live.ax,
    ay: record.live.ay,
    az: record.live.az,
    gx: record.live.gx,
    gy: record.live.gy,
    gz: record.live.gz,
    impactMagnitude: record.live.impactMagnitude,
    lat: record.live.lat,
    lng: record.live.lng,
    speed: record.live.speed,
    satellites: record.live.satellites,
    timestamp: record.live.timestamp,
    deviceId: record.live.deviceId,
    storage: 'cloud',
  };
}

function makeRecord({ id, title, note, timestampOffset, status, severity, speed, impactMagnitude, variant, latOffset, lngOffset }) {
  const timestamp = BASE_TIMESTAMP - timestampOffset;
  const samples = buildSamples(timestamp, variant);
  const lastSample = samples.at(-1);
  const live = {
    status,
    severity,
    ax: lastSample.ax,
    ay: lastSample.ay,
    az: lastSample.az,
    gx: lastSample.gx,
    gy: lastSample.gy,
    gz: lastSample.gz,
    lat: DEMO_LAT + latOffset,
    lng: DEMO_LNG + lngOffset,
    speed,
    satellites: 9,
    impactMagnitude,
    timestamp,
    deviceId: 'vehicle_001',
  };

  const record = { id, title, note, live, samples };

  return {
    ...record,
    event: eventFor(record),
    pothole: potholeFor(record),
  };
}

export const demoDatasets = [
  makeRecord({
    id: 'demo-normal-1',
    title: 'Normal drive',
    note: 'Smooth movement near demo location',
    timestampOffset: 60,
    status: 'SAFE',
    severity: 'NONE',
    speed: 32,
    impactMagnitude: 1.04,
    variant: 'normal',
    latOffset: 0,
    lngOffset: 0,
  }),
  makeRecord({
    id: 'demo-pothole',
    title: 'Road shock',
    note: 'Pothole-like Z-axis spike',
    timestampOffset: 180,
    status: 'SAFE',
    severity: 'LOW',
    speed: 26,
    impactMagnitude: 1.92,
    variant: 'pothole',
    latOffset: 0.00018,
    lngOffset: -0.00011,
  }),
  makeRecord({
    id: 'demo-hard-brake',
    title: 'Hard brake',
    note: 'Strong forward deceleration, no crash',
    timestampOffset: 300,
    status: 'SAFE',
    severity: 'NONE',
    speed: 18,
    impactMagnitude: 1.36,
    variant: 'hardBrake',
    latOffset: -0.00014,
    lngOffset: 0.00016,
  }),
  makeRecord({
    id: 'demo-crash-medium',
    title: 'Crash event',
    note: 'Medium severity impact',
    timestampOffset: 480,
    status: 'CRASH',
    severity: 'MEDIUM',
    speed: 44,
    impactMagnitude: 2.58,
    variant: 'crashMedium',
    latOffset: 0.00026,
    lngOffset: 0.00019,
  }),
  makeRecord({
    id: 'demo-crash-high',
    title: 'Severe crash',
    note: 'High impact event for alert demo',
    timestampOffset: 720,
    status: 'CRASH',
    severity: 'HIGH',
    speed: 61,
    impactMagnitude: 4.42,
    variant: 'crashHigh',
    latOffset: -0.00023,
    lngOffset: -0.00017,
  }),
];

export const demoCrashEvents = demoDatasets
  .map((record) => record.event)
  .filter(Boolean)
  .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
