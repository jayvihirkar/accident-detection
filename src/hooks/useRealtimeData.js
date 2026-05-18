import { useEffect, useState } from 'react';
import { defaultDeviceId, isSupabaseConfigured, supabase } from '../supabase';

const initialMockLive = {
  status: 'SAFE',
  severity: 'NONE',
  ax: 0.32,
  ay: 0.15,
  az: 9.81,
  gx: 0.02,
  gy: -0.01,
  gz: 0.1,
  lat: 18.5204,
  lng: 73.8567,
  speed: 62,
  satellites: 8,
  impactMagnitude: 1.42,
  timestamp: Math.floor(Date.now() / 1000),
  deviceId: 'vehicle_001',
};

const mockEvents = [
  {
    id: 'event1',
    type: 'CRASH',
    severity: 'HIGH',
    ax: 14.8,
    ay: -2.1,
    az: 21.3,
    gx: 3.2,
    gy: 0.4,
    gz: 1.8,
    impactMagnitude: 25.9,
    lat: 18.5204,
    lng: 73.8567,
    speed: 72,
    satellites: 8,
    timestamp: Math.floor(Date.now() / 1000) - 3600,
    deviceId: 'vehicle_001',
    storage: 'cloud_and_sd',
  },
  {
    id: 'event2',
    type: 'CRASH',
    severity: 'MEDIUM',
    ax: 10.4,
    ay: 1.7,
    az: 17.2,
    gx: 2.1,
    gy: 0.3,
    gz: 1.2,
    impactMagnitude: 19.1,
    lat: 18.531,
    lng: 73.8446,
    speed: 58,
    satellites: 7,
    timestamp: Math.floor(Date.now() / 1000) - 86400,
    deviceId: 'vehicle_001',
    storage: 'cloud_and_sd',
  },
];

function normalizeLive(row) {
  if (!row) {
    return null;
  }

  return {
    status: row.status,
    severity: row.severity,
    ax: row.ax,
    ay: row.ay,
    az: row.az,
    gx: row.gx,
    gy: row.gy,
    gz: row.gz,
    lat: row.lat,
    lng: row.lng,
    speed: row.speed,
    satellites: row.satellites,
    impactMagnitude: row.impact_magnitude,
    timestamp: row.timestamp,
    deviceId: row.device_id,
  };
}

function normalizeEvent(row) {
  return {
    id: row.id,
    type: row.type,
    severity: row.severity,
    ax: row.ax,
    ay: row.ay,
    az: row.az,
    gx: row.gx,
    gy: row.gy,
    gz: row.gz,
    impactMagnitude: row.impact_magnitude,
    lat: row.lat,
    lng: row.lng,
    speed: row.speed,
    satellites: row.satellites,
    timestamp: row.timestamp,
    deviceId: row.device_id,
    storage: row.storage,
  };
}

function rowToSensorSample(row) {
  return {
    label: new Date(Number(row.timestamp || 0) * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    timestamp: row.timestamp,
    ax: Number(row.ax ?? 0),
    ay: Number(row.ay ?? 0),
    az: Number(row.az ?? 0),
    gx: Number(row.gx ?? 0),
    gy: Number(row.gy ?? 0),
    gz: Number(row.gz ?? 0),
  };
}

function normalizeEvents(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map(normalizeEvent)
    .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
}

function normalizeHistorySamples(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .slice()
    .sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0))
    .map(rowToSensorSample)
    .slice(-20);
}

function jitter(value, spread) {
  return Number((value + (Math.random() - 0.5) * spread).toFixed(3));
}

function toSensorSample(liveData) {
  return {
    label: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    timestamp: liveData?.timestamp || Date.now(),
    ax: Number(liveData?.ax ?? 0),
    ay: Number(liveData?.ay ?? 0),
    az: Number(liveData?.az ?? 0),
    gx: Number(liveData?.gx ?? 0),
    gy: Number(liveData?.gy ?? 0),
    gz: Number(liveData?.gz ?? 0),
  };
}

function appendSensorSample(setSensorSamples, liveData) {
  setSensorSamples((currentSamples) =>
    [...currentSamples, toSensorSample(liveData)].slice(-20)
  );
}

export function useRealtimeData() {
  const [live, setLive] = useState(initialMockLive);
  const [events, setEvents] = useState(mockEvents);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(null);
  const [sensorSamples, setSensorSamples] = useState([toSensorSample(initialMockLive)]);

  const usingMockData = !isSupabaseConfigured || !supabase;

  useEffect(() => {
    if (usingMockData) {
      const intervalId = window.setInterval(() => {
        setLive((current) => {
          const nextLive = {
            ...current,
            ax: jitter(0.32, 0.22),
            ay: jitter(0.15, 0.18),
            az: jitter(9.81, 0.28),
            gx: jitter(0.02, 0.08),
            gy: jitter(-0.01, 0.08),
            gz: jitter(0.1, 0.12),
            lat: jitter(current.lat, 0.0004),
            lng: jitter(current.lng, 0.0004),
            speed: Math.max(0, Math.round(jitter(current.speed, 4))),
            satellites: current.satellites,
            impactMagnitude: jitter(1.42, 0.35),
            timestamp: Math.floor(Date.now() / 1000),
          };

          appendSensorSample(setSensorSamples, nextLive);
          return nextLive;
        });
      }, 1800);

      return () => window.clearInterval(intervalId);
    }

    let isMounted = true;

    async function loadLive() {
      const { data, error: liveError } = await supabase
        .from('live_telemetry')
        .select('*')
        .eq('device_id', defaultDeviceId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (liveError) {
        setError(liveError.message);
        return;
      }

      const nextLive = normalizeLive(data);

      if (nextLive) {
        setLive(nextLive);
      }
    }

    async function loadEvents() {
      const { data, error: eventsError } = await supabase
        .from('accident_events')
        .select('*')
        .eq('device_id', defaultDeviceId)
        .order('timestamp', { ascending: false });

      if (!isMounted) {
        return;
      }

      if (eventsError) {
        setError(eventsError.message);
        return;
      }

      setEvents(normalizeEvents(data));
    }

    async function loadSensorHistory() {
      const { data, error: historyError } = await supabase
        .from('telemetry_history')
        .select('timestamp, ax, ay, az, gx, gy, gz')
        .eq('device_id', defaultDeviceId)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (!isMounted) {
        return;
      }

      if (historyError) {
        setError(historyError.message);
        return;
      }

      const samples = normalizeHistorySamples(data);
      if (samples.length > 0) {
        setSensorSamples(samples);
      }
    }

    async function loadInitialData() {
      setLoading(true);
      setError(null);
      await Promise.all([loadLive(), loadEvents(), loadSensorHistory()]);

      if (isMounted) {
        setLoading(false);
      }
    }

    loadInitialData();

    const channel = supabase
      .channel(`vehicle-blackbox-${defaultDeviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_telemetry',
          filter: `device_id=eq.${defaultDeviceId}`,
        },
        (payload) => {
          const nextLive = normalizeLive(payload.new);
          if (!nextLive) {
            return;
          }

          setLive(nextLive);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accident_events',
          filter: `device_id=eq.${defaultDeviceId}`,
        },
        () => {
          loadEvents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_history',
          filter: `device_id=eq.${defaultDeviceId}`,
        },
        (payload) => {
          setSensorSamples((currentSamples) =>
            [...currentSamples, rowToSensorSample(payload.new)].slice(-20)
          );
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError(`Supabase realtime connection status: ${status}`);
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [usingMockData]);

  return { live, events, sensorSamples, loading, error, usingMockData };
}
