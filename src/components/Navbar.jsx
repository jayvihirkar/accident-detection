export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          ESP32 Supabase Telemetry
        </p>
        <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">
          Smart Vehicle Blackbox Dashboard
        </h1>
      </div>
    </header>
  );
}
