import { formatDate } from '../utils/formatDate';

export default function DemoDatasetSelector({
  datasets,
  selectedId,
  onSelect,
  onClear,
  liveModeActive,
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Demo Dataset</h2>
          <p className="text-sm text-slate-500">
            Select one of the last five prepared readings for the classroom demonstration.
          </p>
        </div>
        <button
          className={`w-fit rounded-md px-3 py-2 text-sm font-semibold shadow-sm ${
            liveModeActive
              ? 'bg-slate-950 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          onClick={onClear}
          type="button"
        >
          Live Supabase feed
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {datasets.map((record, index) => {
          const selected = selectedId === record.id;
          const isCrash = record.live.status === 'CRASH';

          return (
            <button
              className={`rounded-lg border p-3 text-left transition ${
                selected
                  ? isCrash
                    ? 'border-red-300 bg-red-50 ring-2 ring-red-200'
                    : 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
              key={record.id}
              onClick={() => onSelect(record.id)}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Data {index + 1}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isCrash ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {record.live.status}
                </span>
              </div>
              <p className="mt-2 font-bold text-slate-950">{record.title}</p>
              <p className="mt-1 min-h-10 text-sm text-slate-500">{record.note}</p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {formatDate(record.live.timestamp)}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
