export default function MetricCard({ label, value, unit, accent = 'slate' }) {
  const accentClasses = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="break-all text-2xl font-bold text-slate-950">{value}</p>
        {unit ? (
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
              accentClasses[accent] || accentClasses.slate
            }`}
          >
            {unit}
          </span>
        ) : null}
      </div>
    </section>
  );
}
