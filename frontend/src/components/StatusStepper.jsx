const STEPS = [
  { key: "received",    label: "Received" },
  { key: "dispatched",  label: "Dispatched" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved",    label: "Resolved" },
];

export default function StatusStepper({ status }) {
  const currentIdx = STEPS.findIndex(s => s.key === status);
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done    = i <= currentIdx;
        const current = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done
                  ? current
                    ? "bg-g-blue text-white ring-2 ring-g-blue ring-offset-2 ring-offset-g-900"
                    : "bg-emerald-600 text-white"
                  : "bg-g-800 text-slate-600 border border-g-600"
              }`}>
                {done && !current ? "✓" : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${done ? "text-slate-300" : "text-slate-600"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${
                i < currentIdx ? "bg-emerald-600" : "bg-g-700"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
