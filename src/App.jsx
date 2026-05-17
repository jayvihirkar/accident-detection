import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard';
import StatusCard from './components/StatusCard';
import SensorCharts from './components/SensorCharts';
import LocationMap from './components/LocationMap';
import EventHistory from './components/EventHistory';
import { useRealtimeData } from './hooks/useRealtimeData';

function App() {
  const { live, events, sensorSamples, loading, error, usingMockData } = useRealtimeData();
  const isCrash = live?.status === 'CRASH';
  const latestEvent = events[0];

  const latitude = Number.isFinite(Number(live?.lat)) ? Number(live.lat).toFixed(5) : 'Unavailable';
  const longitude = Number.isFinite(Number(live?.lng)) ? Number(live.lng).toFixed(5) : 'Unavailable';

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-600 shadow-sm">
            Loading vehicle telemetry...
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
            Supabase error: {error}
          </div>
        ) : null}

        {usingMockData ? (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 shadow-sm">
            Supabase is not configured. Rendering live mock telemetry until environment values are added.
          </div>
        ) : null}

        <div className="grid gap-5">
          <StatusCard live={live} latestEvent={latestEvent} />

          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Latitude" value={latitude} unit="GPS" accent="sky" />
            <MetricCard label="Longitude" value={longitude} unit="GPS" accent="sky" />
            <MetricCard
              label="Speed"
              value={live?.speed ?? 'Unavailable'}
              unit="km/h"
              accent={isCrash ? 'red' : 'emerald'}
            />
            <MetricCard
              label="Accident Events"
              value={events.length}
              unit="total"
              accent={events.length > 0 ? 'red' : 'slate'}
            />
          </section>

          <SensorCharts samples={sensorSamples} />

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <LocationMap live={live} />
            <EventHistory events={events} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
