import { formatDate } from '../utils/formatDate';

function mapsUrl(event) {
  if (!Number.isFinite(Number(event?.lat)) || !Number.isFinite(Number(event?.lng))) {
    return null;
  }

  return `https://www.google.com/maps?q=${event.lat},${event.lng}`;
}

export default function EventHistory({ events }) {
  const sortedEvents = [...(events || [])].sort(
    (a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0)
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Accident Events</h2>
          <p className="text-sm text-slate-500">Reverse chronological crash log</p>
        </div>
        <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 ring-1 ring-red-200">
          {sortedEvents.length}
        </span>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No accident events recorded.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event) => {
            const url = mapsUrl(event);

            return (
              <article
                className="rounded-lg border border-slate-200 p-4"
                key={event.id || `${event.type}-${event.timestamp}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-950">{event.type || 'CRASH'}</h3>
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                        {event.severity || 'UNKNOWN'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(event.timestamp)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold text-slate-700">
                      {event.speed ?? 'Unavailable'} km/h
                    </p>
                    {url ? (
                      <a
                        className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Map
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">No GPS</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
