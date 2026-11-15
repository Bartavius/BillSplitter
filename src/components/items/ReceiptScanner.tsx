import { useRef, useState } from "react";
import type { PriceMode } from "../../types";
import { fmt } from "../../utils/format";
import { rowPrices } from "../../utils/numeric";
import { recognizeText, type OcrProgress } from "../../utils/ocr";
import { parseReceipt, type ScannedReceipt } from "../../utils/receipt";
import { NumericInput } from "../ui/NumericInput";
import { HINT_CLASS, INPUT_CLASS, PRIMARY_BUTTON_CLASS } from "../ui/styles";
import { PriceModeSwitch } from "./PriceModeToggle";
import { QuantityStepper } from "./QuantityStepper";

const SECONDARY_BUTTON_CLASS =
  "h-11 sm:h-9 px-4 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex-shrink-0";

interface DraftRow {
  key: number;
  name: string;
  qty: string; // raw stepper text
  price: number;
  mode: PriceMode; // how price reads when qty > 1
}

const quantityOf = (row: DraftRow) => Math.max(1, parseInt(row.qty, 10) || 1);
const pricesOf = (row: DraftRow) => rowPrices(row.price, quantityOf(row), row.mode);

interface Draft {
  rows: DraftRow[];
  subtotal: number | null;
  discount: number;
  tax: number;
  tip: number;
}

type ScanState =
  | { step: "idle" }
  | { step: "reading"; progress: OcrProgress }
  | { step: "review"; draft: Draft }
  | { step: "error"; message: string };

function toDraft(r: ScannedReceipt): Draft {
  return {
    rows: r.items.map((item, i) => ({
      key: i,
      name: item.name,
      qty: String(item.quantity),
      // The parser reads the price a line ends with, which is usually its total
      price: item.total,
      mode: "total",
    })),
    subtotal: r.subtotal,
    discount: r.discount ?? 0,
    tax: r.tax ?? 0,
    tip: r.tip ?? 0,
  };
}

function fromDraft(d: Draft): ScannedReceipt {
  return {
    items: d.rows
      .filter((row) => row.name.trim() && row.price > 0)
      .map((row) => ({
        name: row.name.trim(),
        quantity: quantityOf(row),
        total: Math.round(pricesOf(row).reduce((s, p) => s + p, 0) * 100) / 100,
      })),
    subtotal: d.subtotal,
    discount: d.discount || null,
    tax: d.tax || null,
    tip: d.tip || null,
    total: null,
  };
}

// Last on wide screens, beside the name on phones
function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Remove ${label || "item"}`}
      className="sm:order-last w-11 sm:w-9 h-11 sm:h-9 flex-shrink-0 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
        <path
          d="M3 3l8 8M11 3l-8 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

const near = (a: number, b: number) => Math.abs(a - b) < 0.005;

function progressLabel({ stage, fraction }: OcrProgress): string {
  return stage === "loading"
    ? "Getting the reader ready…"
    : `Reading receipt… ${Math.round(fraction * 100)}%`;
}

// Photo → OCR → an editable list. OCR misreads often enough that nothing
// reaches the bill until the user has looked it over and tapped Add.
export function ReceiptScanner({ onApply }: { onApply: (receipt: ScannedReceipt) => void }) {
  const [state, setState] = useState<ScanState>({ step: "idle" });
  const fileInput = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  const scan = async (file: File) => {
    const controller = new AbortController();
    abort.current = controller;
    setState({ step: "reading", progress: { stage: "loading", fraction: 0 } });
    try {
      const text = await recognizeText(
        file,
        (progress) => {
          if (!controller.signal.aborted) setState({ step: "reading", progress });
        },
        controller.signal,
      );
      const receipt = parseReceipt(text);
      const foundAnything =
        receipt.items.length > 0 ||
        [receipt.subtotal, receipt.discount, receipt.tax, receipt.tip].some((n) => n !== null);
      setState(
        foundAnything
          ? { step: "review", draft: toDraft(receipt) }
          : {
              step: "error",
              message: "Couldn't find any prices. Try a sharper photo, flat and well lit.",
            },
      );
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error(err);
      setState({
        step: "error",
        message: navigator.onLine
          ? "Couldn't read that photo. Try again, or add items by hand."
          : "The receipt reader needs a connection the first time it runs.",
      });
    }
  };

  const cancel = () => {
    abort.current?.abort();
    setState({ step: "idle" });
  };

  const pickPhoto = () => fileInput.current?.click();

  const input = (
    <input
      ref={fileInput}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // so picking the same photo again still fires
        if (file) scan(file);
      }}
    />
  );

  if (state.step === "idle" || state.step === "error") {
    return (
      <div className="space-y-1.5">
        {input}
        <button
          type="button"
          onClick={pickPhoto}
          className={`${SECONDARY_BUTTON_CLASS} w-full flex items-center justify-center gap-2 border-dashed`}
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 5.5A1.5 1.5 0 0 1 3.5 4h1.6l1-1.5h3.8l1 1.5h1.6A1.5 1.5 0 0 1 14 5.5v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5v-6Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="8.5" r="2.3" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          Scan a receipt
        </button>
        {state.step === "error" ? (
          <p className="text-xs text-red-500 text-center">{state.message}</p>
        ) : (
          <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
            Scans can be inaccurate. You'll review every line.
          </p>
        )}
      </div>
    );
  }

  if (state.step === "reading") {
    const { progress } = state;
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-300 tabular-nums">
            {progressLabel(progress)}
          </span>
          <button
            type="button"
            onClick={cancel}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            Cancel
          </button>
        </div>
        <div className="h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-zinc-900 dark:bg-zinc-100 transition-[width] duration-200"
            style={{ width: `${progress.stage === "reading" ? progress.fraction * 100 : 0}%` }}
          />
        </div>
      </div>
    );
  }

  const { draft } = state;
  const update = (patch: Partial<Draft>) =>
    setState({ step: "review", draft: { ...draft, ...patch } });
  const updateRow = (key: number, patch: Partial<DraftRow>) =>
    update({ rows: draft.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) });

  const result = fromDraft(draft);
  const itemsSum = result.items.reduce((s, i) => s + i.total, 0);
  // Receipts print the subtotal either before or after discounts
  const matchesSubtotal =
    draft.subtotal === null ||
    near(itemsSum, draft.subtotal) ||
    near(itemsSum - draft.discount, draft.subtotal);
  const canApply = result.items.length > 0 || draft.discount > 0 || draft.tax > 0 || draft.tip > 0;
  const count = result.items.length;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-3 space-y-3">
      <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {draft.rows.length > 0
          ? "Check what was read"
          : "No items found — you can still use the totals"}
      </span>

      <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg px-3 py-2">
        Scans can be inaccurate: items get missed and prices misread. Check every line against the
        receipt before adding.
      </p>

      {draft.rows.length > 0 && (
        <div className="space-y-2">
          {draft.rows.map((row) => (
            <div
              key={row.key}
              // Phones: name + remove, then Each-Total / qty / price. Wider: one row.
              className="flex flex-wrap sm:flex-nowrap gap-2 pb-2 sm:pb-0 border-b sm:border-0 border-zinc-100 dark:border-zinc-800"
            >
              <input
                type="text"
                value={row.name}
                onChange={(e) => updateRow(row.key, { name: e.target.value })}
                aria-label="Item name"
                placeholder="Item name…"
                autoComplete="off"
                className={`flex-1 min-w-0 px-3 ${INPUT_CLASS}`}
              />
              <RemoveButton
                label={row.name}
                onClick={() => update({ rows: draft.rows.filter((r) => r.key !== row.key) })}
              />
              <div className="basis-full sm:hidden" />
              {/* Left of the stepper, so qty / price / remove line up across rows */}
              {quantityOf(row) > 1 && (
                <PriceModeSwitch
                  mode={row.mode}
                  onChange={(mode) => updateRow(row.key, { mode })}
                  className="h-11 sm:h-9"
                  dense
                />
              )}
              <QuantityStepper value={row.qty} onChange={(qty) => updateRow(row.key, { qty })} />
              <NumericInput
                value={row.price}
                onCommit={(price) => updateRow(row.key, { price })}
                format={fmt}
                prefix="$"
                ariaLabel={
                  quantityOf(row) > 1 && row.mode === "each" ? "Price per item" : "Total price"
                }
                // Wraps to its own line on the narrowest phones rather than shrink
                // to nothing beside the switch
                className="flex-1 min-w-[5rem] sm:flex-none sm:w-28"
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {(["discount", "tax", "tip"] as const).map((field) => (
          <label key={field} className="space-y-1">
            <span className={`${HINT_CLASS} capitalize`}>{field}</span>
            <NumericInput
              value={draft[field]}
              onCommit={(n) => update({ [field]: n })}
              format={fmt}
              prefix="$"
              placeholder="0.00"
              ariaLabel={field}
            />
          </label>
        ))}
      </div>

      {count > 0 && (
        <p className={`text-xs tabular-nums ${matchesSubtotal ? HINT_CLASS : "text-amber-600"}`}>
          Items add up to ${fmt(itemsSum)}
          {draft.subtotal !== null &&
            (matchesSubtotal
              ? ", matching the receipt's subtotal"
              : ` but the receipt's subtotal is $${fmt(draft.subtotal)}. Check for missed or misread lines.`)}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            onApply(result);
            setState({ step: "idle" });
          }}
          disabled={!canApply}
          className={`${PRIMARY_BUTTON_CLASS} flex-1`}
        >
          {count > 0 ? `Add ${count} item${count === 1 ? "" : "s"}` : "Apply totals"}
        </button>
        <button type="button" onClick={pickPhoto} className={SECONDARY_BUTTON_CLASS}>
          Rescan
        </button>
        <button type="button" onClick={cancel} className={SECONDARY_BUTTON_CLASS}>
          Discard
        </button>
      </div>
      {input}
    </div>
  );
}
