import { useState } from "react";
import { fmt } from "../../utils/format";
import { sanitizeDecimal, splitEvenly } from "../../utils/numeric";
import { HINT_CLASS, INPUT_CLASS, PRIMARY_BUTTON_CLASS } from "../ui/styles";
import { QuantityStepper } from "./QuantityStepper";

// Receipts print a multi-quantity line either as the price of one unit or as
// the line total, so the price field can be read either way.
type PriceMode = "each" | "total";

const PRICE_MODE_KEY = "billsplit.priceMode";

function loadPriceMode(): PriceMode {
  try {
    return localStorage.getItem(PRICE_MODE_KEY) === "total" ? "total" : "each";
  } catch {
    return "each";
  }
}

function savePriceMode(mode: PriceMode) {
  try {
    localStorage.setItem(PRICE_MODE_KEY, mode);
  } catch {
    // Storage blocked (private mode etc.) — the choice just won't be remembered
  }
}

const TOGGLE_BASE = "px-3 py-1.5 sm:py-1 transition-colors";
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

export function AddItemForm({ onAdd }: { onAdd: (name: string, rowPrices: number[]) => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [priceMode, setPriceMode] = useState<PriceMode>(loadPriceMode);

  const quantity = Math.max(1, parseInt(qty, 10) || 1);
  const amount = parseFloat(price);
  const multi = quantity > 1;
  const isTotal = multi && priceMode === "total";

  const rowPrices =
    amount > 0
      ? isTotal
        ? splitEvenly(amount, quantity)
        : Array.from({ length: quantity }, () => amount)
      : [];
  const canAdd = !!name.trim() && rowPrices.length > 0 && rowPrices.every((p) => p > 0);

  const changePriceMode = (mode: PriceMode) => {
    setPriceMode(mode);
    savePriceMode(mode);
  };

  const submit = () => {
    if (!canAdd) return;
    onAdd(name.trim(), rowPrices);
    setName("");
    setPrice("");
    setQty("1");
  };

  return (
    // Item names are the longest thing typed here, so they get a full-width row
    // of their own at every breakpoint; qty/price/Add sit underneath.
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Item name…"
        autoComplete="off"
        className={`w-full px-3 ${INPUT_CLASS}`}
      />
      <div className="flex gap-2">
        <QuantityStepper value={qty} onChange={setQty} onEnter={submit} />
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-base sm:text-sm pointer-events-none">
            $
          </span>
          <input
            type="text"
            inputMode="decimal"
            aria-label={isTotal ? "Total price" : "Price per item"}
            autoComplete="off"
            value={price}
            onChange={(e) => setPrice(sanitizeDecimal(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            // Short enough to fit beside the stepper on a 360px phone
            placeholder={isTotal ? "Total" : "Per item"}
            className={`w-full pl-7 pr-3 tabular-nums ${INPUT_CLASS}`}
          />
        </div>
        <button onClick={submit} disabled={!canAdd} className={PRIMARY_BUTTON_CLASS}>
          Add<span className="hidden sm:inline"> item</span>
        </button>
      </div>

      {/* Only meaningful with more than one unit — both readings agree at qty 1 */}
      {multi && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex items-center gap-2">
            <span className={HINT_CLASS}>Price is</span>
            <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs font-medium">
              <button
                type="button"
                onClick={() => changePriceMode("each")}
                className={`${TOGGLE_BASE} ${priceMode === "each" ? TOGGLE_ON : TOGGLE_OFF}`}
              >
                Each
              </button>
              <button
                type="button"
                onClick={() => changePriceMode("total")}
                className={`${TOGGLE_BASE} border-l border-zinc-200 dark:border-zinc-700 ${
                  priceMode === "total" ? TOGGLE_ON : TOGGLE_OFF
                }`}
              >
                Total
              </button>
            </div>
          </div>
          {rowPrices.length > 0 && (
            <span className={`${HINT_CLASS} tabular-nums`}>
              {isTotal
                ? `= ${describeRows(rowPrices)}`
                : `= $${fmt(rowPrices.reduce((s, p) => s + p, 0))} total`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
