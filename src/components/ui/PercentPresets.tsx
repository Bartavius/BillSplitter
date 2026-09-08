import { trim } from "../../utils/format";

export function PercentPresets({
  options,
  value,
  onSelect,
}: {
  options: number[];
  value: number;
  onSelect: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = Math.abs(value - opt) < 0.005;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className={`px-3 h-8 rounded-lg text-xs font-medium tabular-nums transition-colors ${
              active
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {trim(opt)}%
          </button>
        );
      })}
    </div>
  );
}
