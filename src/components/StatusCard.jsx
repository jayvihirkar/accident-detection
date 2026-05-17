import { formatDate } from '../utils/formatDate';

export default function StatusCard({ live, latestEvent }) {
  const status = live?.status || 'UNKNOWN';
  const isCrash = status === 'CRASH';
  const severity = live?.severity || (isCrash ? latestEvent?.severity : null) || 'None';

  return (
    <section
      className={`rounded-lg border bg-white p-5 shadow-sm ${
        isCrash ? 'border-red-200' : 'border-emerald-200'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Vehicle Status</p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`h-3 w-3 rounded-full ${
                isCrash ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              aria-hidden="true"
            />
            <h2
              className={`text-3xl font-bold ${
                isCrash ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {status}
            </h2>
          </div>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
            isCrash
              ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          }`}
        >
          {isCrash ? 'Immediate Review' : 'Normal Operation'}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Severity
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{severity}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Speed
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {live?.speed ?? 'Unavailable'} km/h
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Last Updated
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {formatDate(live?.timestamp)}
          </p>
        </div>
      </div>
    </section>
  );
}
