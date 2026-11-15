import type { PriceMode } from "../../types";
import { fmt } from "../../utils/format";
import { HINT_CLASS } from "../ui/styles";

const TOGGLE_BASE = "py-1.5 sm:py-1 transition-colors";
const TOGGLE_ON = "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900";
const TOGGLE_OFF =
  "bg-white text-zinc-500 hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200";

// "= $3.34 × 1 + $3.33 × 2" — groups equal prices so uneven cents are visible
function describeRows(prices: number[]): string {
  const groups: { price: number; count: number }[] = [];
  for (const price of prices) {
    const last = groups[groups.length - 1];
    if (last && last.price === price) last.count++;
    else groups.push({ price, count: 1 });
  }
  if (groups.length === 1) return `$${fmt(groups[0].price)} each × ${groups[0].count}`;
  return groups.map((g) => `$${fmt(g.price)} × ${g.count}`).join(" + ");
}

// Just the Each | Total buttons; className sizes the control (e.g. to sit
// inline with inputs), and dense trims padding to fit a phone-width row
export function PriceModeSwitch({
  mode,
  onChange,
  className = "",
  dense = false,
}: {
  mode: PriceMode;
  onChange: (mode: PriceMode) => void;
  className?: string;
  dense?: boolean;
}) {
  const pad = dense ? "px-2 sm:px-3" : "px-3";
  return (
    <div
      role="group"
      aria-label="Price is"
      className={`inline-flex flex-shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs font-medium ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange("each")}
        className={`${TOGGLE_BASE} ${pad} ${mode === "each" ? TOGGLE_ON : TOGGLE_OFF}`}
      >
        Each
      </button>
      <button
        type="button"
        onClick={() => onChange("total")}
        className={`${TOGGLE_BASE} ${pad} border-l border-zinc-200 dark:border-zinc-700 ${
          mode === "total" ? TOGGLE_ON : TOGGLE_OFF
        }`}
      >
        Total
      </button>
    </div>
  );
}

// Each / Total switch for a multi-quantity price, with what it works out to.
// Only meaningful with more than one unit — both readings agree at qty 1.
export function PriceModeToggle({
  mode,
  onChange,
  prices,
}: {
  mode: PriceMode;
  onChange: (mode: PriceMode) => void;
  /** The per-unit prices the current reading gives */
  prices: number[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <div className="flex items-center gap-2">
        <span className={HINT_CLASS}>Price is</span>
        <PriceModeSwitch mode={mode} onChange={onChange} />
      </div>
      {prices.length > 0 && (
        <span className={`${HINT_CLASS} tabular-nums`}>
          {mode === "total"
            ? `= ${describeRows(prices)}`
            : `= $${fmt(prices.reduce((s, p) => s + p, 0))} total`}
        </span>
      )}
    </div>
  );
}
