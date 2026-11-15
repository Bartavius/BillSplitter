import { useState } from "react";
import type { PriceMode } from "../../types";
import { rowPrices, sanitizeDecimal } from "../../utils/numeric";
import { INPUT_CLASS, PRIMARY_BUTTON_CLASS } from "../ui/styles";
import { PriceModeToggle } from "./PriceModeToggle";
import { QuantityStepper } from "./QuantityStepper";

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

export function AddItemForm({ onAdd }: { onAdd: (name: string, rowPrices: number[]) => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [priceMode, setPriceMode] = useState<PriceMode>(loadPriceMode);

  const quantity = Math.max(1, parseInt(qty, 10) || 1);
  const amount = parseFloat(price);
  const multi = quantity > 1;
  const isTotal = multi && priceMode === "total";

  const prices = rowPrices(amount, quantity, priceMode);
  const canAdd = !!name.trim() && prices.length > 0 && prices.every((p) => p > 0);

  const changePriceMode = (mode: PriceMode) => {
    setPriceMode(mode);
    savePriceMode(mode);
  };

  const submit = () => {
    if (!canAdd) return;
    onAdd(name.trim(), prices);
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

      {multi && <PriceModeToggle mode={priceMode} onChange={changePriceMode} prices={prices} />}
    </div>
  );
}
