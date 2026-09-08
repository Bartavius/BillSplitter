import { sanitizeDigits } from "../../utils/numeric";

const STEP_BUTTON =
  "w-9 sm:w-7 h-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-lg sm:text-base leading-none select-none";

export function QuantityStepper({
  value,
  onChange,
  onEnter,
}: {
  /** Raw text so a half-typed value survives; empty is allowed while editing */
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
}) {
  const current = () => parseInt(value, 10) || 1;

  return (
    <div className="flex items-center h-11 sm:h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden flex-shrink-0">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(String(Math.max(1, current() - 1)))}
        className={STEP_BUTTON}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Quantity"
        value={value}
        onChange={(e) => onChange(sanitizeDigits(e.target.value))}
        onBlur={() => onChange(String(Math.max(1, current())))}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        className="w-9 sm:w-8 h-full text-center text-base sm:text-sm bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none tabular-nums"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(String(current() + 1))}
        className={STEP_BUTTON}
      >
        +
      </button>
    </div>
  );
}
