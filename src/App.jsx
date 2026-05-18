import { useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard';
import StatusCard from './components/StatusCard';
import SensorCharts from './components/SensorCharts';
import LocationMap from './components/LocationMap';
import EventHistory from './components/EventHistory';
import DemoDatasetSelector from './components/DemoDatasetSelector';
import { useRealtimeData } from './hooks/useRealtimeData';
import { demoDatasets } from './utils/demoDataset';

function App() {
  const { live, events, sensorSamples, loading, error, usingMockData } = useRealtimeData();
  const [selectedDemoId, setSelectedDemoId] = useState(null);

  const selectedDemo = useMemo(
    () => demoDatasets.find((dataset) => dataset.id === selectedDemoId) || null,
    [selectedDemoId]
  );

  const displayLive = selectedDemo?.live || live;
  const displayEvents = selectedDemo ? (selectedDemo.event ? [selectedDemo.event] : []) : events;
  const displaySamples = selectedDemo?.samples || sensorSamples;
  const isCrash = displayLive?.status === 'CRASH';
  const latestEvent = displayEvents[0];

  const latitude = Number.isFinite(Number(displayLive?.lat))
    ? Number(displayLive.lat).toFixed(5)
    : 'Unavailable';
  const longitude = Number.isFinite(Number(displayLive?.lng))
    ? Number(displayLive.lng).toFixed(5)
    : 'Unavailable';

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
          <DemoDatasetSelector
            datasets={demoDatasets}
            liveModeActive={!selectedDemo}
            onClear={() => setSelectedDemoId(null)}
            onSelect={setSelectedDemoId}
            selectedId={selectedDemoId}
          />

          {selectedDemo ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm font-medium text-sky-800 shadow-sm">
              Showing prepared demo data: {selectedDemo.title}. Use "Live Supabase feed" to return to
              realtime ESP32 data.
            </div>
          ) : null}

          <StatusCard live={displayLive} latestEvent={latestEvent} />

          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Latitude" value={latitude} unit="GPS" accent="sky" />
            <MetricCard label="Longitude" value={longitude} unit="GPS" accent="sky" />
            <MetricCard
              label="Speed"
              value={displayLive?.speed ?? 'Unavailable'}
              unit="km/h"
              accent={isCrash ? 'red' : 'emerald'}
            />
            <MetricCard
              label="Accident Events"
              value={displayEvents.length}
              unit="total"
              accent={displayEvents.length > 0 ? 'red' : 'slate'}
            />
          </section>

          <SensorCharts samples={displaySamples} />

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <LocationMap live={displayLive} />
            <EventHistory events={displayEvents} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
