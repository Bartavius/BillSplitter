// Legacy component — no longer used in the main UI

type Mode = "simple" | "per-person" | "by-item";

const MODE_LABELS: Record<Mode, string> = {
  simple: "Simple",
  "per-person": "Per Person",
  "by-item": "By Item",
};

interface Props {
  mode: Mode;
  setMode: (m: Mode) => void;
}

export function ModeToggle({ mode, setMode }: Props) {
  return (
    <div className="flex flex-row mb-6 border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm">
      {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
        <button
          key={m}
          className={`px-6 py-2 text-sm font-medium transition-colors ${
            mode === m
              ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-white text-gray-500 hover:bg-gray-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          }`}
          onClick={() => setMode(m)}
        >
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
}
