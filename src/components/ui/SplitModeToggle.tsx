import type { SplitMode } from "../../types";

const BASE = "px-3 py-2 sm:py-1.5 transition-colors";
const ON = "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900";
const OFF =
  "bg-white text-zinc-500 hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200";

export function SplitModeToggle({
  value,
  onChange,
}: {
  value: SplitMode;
  onChange: (m: SplitMode) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs font-medium flex-shrink-0">
      <button
        onClick={() => onChange("proportional")}
        className={`${BASE} ${value === "proportional" ? ON : OFF}`}
      >
        By share
      </button>
      <button
        onClick={() => onChange("even")}
        className={`${BASE} border-l border-zinc-200 dark:border-zinc-700 ${
          value === "even" ? ON : OFF
        }`}
      >
        Split even
      </button>
    </div>
  );
}
