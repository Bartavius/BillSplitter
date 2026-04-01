import { useState } from "react";
import "./App.css";
import { useBillStore } from "./store/useBillStore";
import type { SplitMode } from "./types";

// ── Color palette ─────────────────────────────────────────────────────────────
// Muted, hand-picked hues — distinct without being garish

const PERSON_COLORS = [
  '#6272a0', // slate indigo
  '#b56d4a', // terracotta
  '#4d8b6a', // sage
  '#7a5f8a', // dusty plum
  '#4a7ea8', // steel blue
  '#9e7c40', // warm ochre
  '#3d8282', // deep teal
  '#8a5050', // muted burgundy
];

function personColor(index: number): string {
  return PERSON_COLORS[index % PERSON_COLORS.length];
}

// Hex color helpers
function colorBg(hex: string, opacity = 1): string {
  // Returns rgba from a 6-digit hex
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function fmt(n: number): string {
  return n.toFixed(2);
}

// ── SplitModeToggle ───────────────────────────────────────────────────────────

function SplitModeToggle({
  value,
  onChange,
}: {
  value: SplitMode;
  onChange: (m: SplitMode) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs font-medium">
      <button
        onClick={() => onChange("proportional")}
        className={`px-3 py-1.5 transition-colors ${
          value === "proportional"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-white text-zinc-500 hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        By share
      </button>
      <button
        onClick={() => onChange("even")}
        className={`px-3 py-1.5 border-l border-zinc-200 dark:border-zinc-700 transition-colors ${
          value === "even"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-white text-zinc-500 hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        Split even
      </button>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const store = useBillStore();
  const [dark, setDark] = useState(false);
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<number>>(new Set());

  const [personInput, setPersonInput] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQty, setItemQty] = useState("1");

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  // ── People handlers ───────────────────────────────────────────────────────

  const handleAddPerson = () => {
    if (!personInput.trim()) return;
    store.addPerson(personInput);
    setPersonInput("");
  };

  const handleRemovePerson = (id: number) => {
    store.removePerson(id);
    setSelectedPersonIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const togglePersonSelect = (id: number) => {
    setSelectedPersonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Item handlers ─────────────────────────────────────────────────────────

  const handleAddItem = () => {
    const unitPrice = parseFloat(itemPrice);
    const qty = Math.max(1, parseInt(itemQty, 10) || 1);
    if (!itemName.trim() || isNaN(unitPrice) || unitPrice <= 0) return;
    const assignTo = selectedPersonIds.size > 0 ? [...selectedPersonIds] : [];
    store.addItem(itemName.trim(), unitPrice, assignTo, qty);
    setItemName("");
    setItemPrice("");
    setItemQty("1");
  };

  const handleItemClick = (itemId: number) => {
    if (selectedPersonIds.size === 0) return;
    const assigneeIds = new Set(store.personsForItem(itemId).map((p) => p.id));
    const allOnItem = [...selectedPersonIds].every((id) => assigneeIds.has(id));
    for (const personId of selectedPersonIds) {
      store.setItemSplit(itemId, personId, !allOnItem);
    }
  };

  // ── Tax / tip handlers ────────────────────────────────────────────────────

  const handleTaxPercentChange = (val: string) => {
    const n = parseFloat(val);
    store.setTax(isNaN(n) ? 0 : n);
  };

  const handleTaxDollarChange = (val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n) && store.itemsTotal > 0) store.setTax((n / store.itemsTotal) * 100);
    else if (isNaN(n)) store.setTax(0);
  };

  const handleTipPercentChange = (val: string) => {
    const n = parseFloat(val);
    store.setTip(isNaN(n) ? 0 : n);
  };

  const handleTipDollarChange = (val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n) && store.allItemsCost > 0) store.setTip((n / store.allItemsCost) * 100);
    else if (isNaN(n)) store.setTip(0);
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (store.isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading…</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Bill Splitter
            </span>
            <div className="flex items-center gap-4">
              {(store.persons.length > 0 || store.items.length > 0) && (
                <button
                  onClick={() => {
                    if (confirm("Clear all data?")) {
                      store.clearAll();
                      setSelectedPersonIds(new Set());
                    }
                  }}
                  className="text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={toggleDark}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                {dark ? "Light" : "Dark"}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* ── People ─────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">People</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Add everyone at the table</p>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Add person */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={personInput}
                  onChange={(e) => setPersonInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPerson()}
                  placeholder="Name…"
                  className="flex-1 h-9 px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow"
                />
                <button
                  onClick={handleAddPerson}
                  disabled={!personInput.trim()}
                  className="h-9 px-4 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Person chips (for removal) */}
              {store.persons.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {store.persons.map((p, i) => {
                    const hex = personColor(i);
                    return (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: colorBg(hex, 0.1), color: hex }}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                          style={{ backgroundColor: hex }}
                        >
                          {initials(p.name)[0]}
                        </span>
                        {p.name}
                        <button
                          onClick={() => handleRemovePerson(p.id)}
                          className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                          title={`Remove ${p.name}`}
                        >
                          <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                            <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Person selectors for item assignment */}
              {store.persons.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                    Select people to assign items:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {store.persons.map((p, i) => {
                      const hex = personColor(i);
                      const selected = selectedPersonIds.has(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePersonSelect(p.id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-150"
                          style={
                            selected
                              ? {
                                  backgroundColor: colorBg(hex, 0.12),
                                  borderColor: hex,
                                  color: hex,
                                  boxShadow: `0 0 0 2px ${colorBg(hex, 0.25)}`,
                                }
                              : {
                                  backgroundColor: colorBg(hex, 0.05),
                                  borderColor: colorBg(hex, 0.3),
                                  color: "inherit",
                                }
                          }
                        >
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                            style={{ backgroundColor: hex }}
                          >
                            {initials(p.name)}
                          </span>
                          {p.name}
                          {selected && (
                            <svg className="w-3.5 h-3.5 ml-0.5 opacity-70" viewBox="0 0 14 11" fill="none">
                              <path d="M1 5.5l4 4L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedPersonIds.size > 0 && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                      Click items below to toggle assignment for{" "}
                      {selectedPersonIds.size === 1
                        ? store.persons.find((p) => selectedPersonIds.has(p.id))?.name
                        : `${selectedPersonIds.size} people`}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Bill Items ─────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Bill Items</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Enter each item, then tap who ordered it
              </p>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* Add item row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  placeholder="Item name…"
                  className="flex-1 h-9 px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow"
                />
                {/* Quantity stepper */}
                <div className="flex items-center h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setItemQty((v) => String(Math.max(1, (parseInt(v, 10) || 1) - 1)))}
                    className="w-7 h-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-base leading-none select-none"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                    min="1"
                    step="1"
                    className="w-8 h-full text-center text-sm bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setItemQty((v) => String((parseInt(v, 10) || 1) + 1))}
                    className="w-7 h-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-base leading-none select-none"
                  >
                    +
                  </button>
                </div>
                {/* Unit price */}
                <div className="relative flex-shrink-0">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-24 h-9 pl-6 pr-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow tabular-nums"
                  />
                </div>
                <button
                  onClick={handleAddItem}
                  disabled={!itemName.trim() || !itemPrice || parseFloat(itemPrice) <= 0}
                  className="h-9 px-4 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Items list */}
              {store.items.length > 0 && (
                <div className="space-y-1.5">
                  {store.items.map((item) => {
                    const assignees = store.personsForItem(item.id);
                    const assigneeIds = new Set(assignees.map((p) => p.id));
                    const clickable = selectedPersonIds.size > 0;
                    const allOnItem =
                      clickable && [...selectedPersonIds].every((id) => assigneeIds.has(id));
                    const someOnItem =
                      clickable && [...selectedPersonIds].some((id) => assigneeIds.has(id));

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 ${
                          clickable
                            ? allOnItem
                              ? "border-zinc-400 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-800 cursor-pointer"
                              : someOnItem
                              ? "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                              : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                            : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                        }`}
                      >
                        {/* Checkbox indicator */}
                        {clickable && (
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              allOnItem
                                ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100"
                                : someOnItem
                                ? "border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-900"
                                : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
                            }`}
                          >
                            {allOnItem && (
                              <svg
                                className="w-2.5 h-2.5 text-white dark:text-zinc-900"
                                viewBox="0 0 10 8"
                                fill="none"
                              >
                                <path
                                  d="M1 4l3 3 5-6"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                            {someOnItem && !allOnItem && (
                              <div className="w-1.5 h-0.5 bg-zinc-400 dark:bg-zinc-500 rounded-full" />
                            )}
                          </div>
                        )}

                        {/* Name + qty + tax badge */}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {item.name || "Item"}
                          </span>
                          {item.quantity > 1 && (
                            <span className="flex-shrink-0 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded-full tabular-nums">
                              ×{item.quantity} @ ${fmt(item.cost / item.quantity)}
                            </span>
                          )}
                          {item.taxExempt && (
                            <span className="flex-shrink-0 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
                              no tax
                            </span>
                          )}
                        </div>

                        {/* Assignee badges */}
                        <div
                          className="flex items-center gap-1 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {assignees.map((p) => {
                            const idx = store.persons.findIndex((x) => x.id === p.id);
                            const hex = personColor(idx);
                            return (
                              <button
                                key={p.id}
                                onClick={() => store.unlinkPerson(item.id, p.id)}
                                title={`Remove ${p.name}`}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold hover:opacity-60 transition-opacity"
                                style={{ backgroundColor: hex }}
                              >
                                {initials(p.name)}
                              </button>
                            );
                          })}
                          {assignees.length === 0 && (
                            <span className="text-xs text-zinc-300 dark:text-zinc-600 italic">
                              unassigned
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums flex-shrink-0">
                          ${fmt(item.cost)}
                        </span>

                        {/* Actions */}
                        <div
                          className="flex items-center gap-1 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => store.toggleTaxExempt(item.id)}
                            title={item.taxExempt ? "Mark as taxable" : "Mark as tax-exempt"}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                              item.taxExempt
                                ? "text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-700"
                                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                          >
                            %
                          </button>
                          <button
                            onClick={() => store.removeItem(item.id)}
                            className="w-6 h-6 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                              <path
                                d="M1 1l12 12M13 1L1 13"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Subtotal row */}
                  <div className="flex justify-between items-center px-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Subtotal
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                      ${fmt(store.allItemsCost)}
                    </span>
                  </div>
                </div>
              )}

              {store.items.length === 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6">
                  No items yet — add the first line from your bill
                </p>
              )}
            </div>
          </section>

          {/* ── Tax & Tip ──────────────────────────────────────────────────── */}
          {store.items.length > 0 && (
            <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tax & Tip</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Set amounts and choose how they're split
                </p>
              </div>

              <div className="px-5 py-4 space-y-5">
                {/* Tax */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Tax
                    </label>
                    <SplitModeToggle value={store.taxMode} onChange={store.setTaxMode} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={store.tax || ""}
                        onChange={(e) => handleTaxPercentChange(e.target.value)}
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full h-9 pl-3 pr-8 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow tabular-nums"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
                        %
                      </span>
                    </div>
                    <span className="text-zinc-300 dark:text-zinc-600 text-sm select-none">=</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
                        $
                      </span>
                      <input
                        type="number"
                        value={store.taxAmount ? fmt(store.taxAmount) : ""}
                        onChange={(e) => handleTaxDollarChange(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full h-9 pl-6 pr-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow tabular-nums"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {store.taxMode === "proportional"
                      ? "Each person pays tax proportional to their taxable items"
                      : "Tax divided equally among everyone"}
                  </p>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* Tip */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Tip / Charges
                    </label>
                    <SplitModeToggle value={store.tipMode} onChange={store.setTipMode} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={store.tip || ""}
                        onChange={(e) => handleTipPercentChange(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.1"
                        className="w-full h-9 pl-3 pr-8 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow tabular-nums"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
                        %
                      </span>
                    </div>
                    <span className="text-zinc-300 dark:text-zinc-600 text-sm select-none">=</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
                        $
                      </span>
                      <input
                        type="number"
                        value={store.tipAmount ? fmt(store.tipAmount) : ""}
                        onChange={(e) => handleTipDollarChange(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full h-9 pl-6 pr-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow tabular-nums"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {store.tipMode === "proportional"
                      ? "Each person tips proportional to their subtotal"
                      : "Tip divided equally among everyone"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ── Breakdown ──────────────────────────────────────────────────── */}
          {store.persons.length > 0 && store.items.length > 0 && (
            <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Breakdown</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">What everyone owes</p>
              </div>

              {/* Person cards grid */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {store.persons.map((person, i) => {
                  const hex = personColor(i);
                  const personItems = store.itemsForPerson(person.id);
                  const subtotal = store.personSubtotal(person.id);
                  const taxShare = store.personTaxShare(person.id);
                  const tipShare = store.personTipShare(person.id);
                  const total = store.personTotal(person.id);
                  const hasAddons = taxShare > 0 || tipShare > 0;

                  return (
                    <div
                      key={person.id}
                      className="rounded-xl border bg-white dark:bg-zinc-800/50 flex flex-col overflow-hidden"
                      style={{ borderColor: colorBg(hex, 0.35) }}
                    >
                      {/* Colored top accent strip */}
                      <div className="h-1 w-full" style={{ backgroundColor: hex }} />

                      {/* Header: avatar + name + total */}
                      <div className="flex items-center justify-between px-3.5 pt-3 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                            style={{ backgroundColor: hex }}
                          >
                            {initials(person.name)}
                          </span>
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {person.name}
                          </span>
                        </div>
                        <span
                          className="text-sm font-bold tabular-nums ml-2 flex-shrink-0"
                          style={{ color: hex }}
                        >
                          ${fmt(total)}
                        </span>
                      </div>

                      {/* Items list */}
                      {personItems.length > 0 && (
                        <div className="px-3.5 pb-2.5 space-y-1 border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
                          {personItems.map((item) => {
                            const n = store.splitsForItem(item.id).length;
                            const share = n > 0 ? item.cost / n : 0;
                            return (
                              <div key={item.id} className="flex justify-between items-baseline gap-2">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                  {item.name || "Item"}
                                  {n > 1 && (
                                    <span className="text-zinc-400 dark:text-zinc-500"> ÷{n}</span>
                                  )}
                                </span>
                                <span className="text-xs tabular-nums text-zinc-700 dark:text-zinc-300 flex-shrink-0">
                                  ${fmt(share)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {personItems.length === 0 && (
                        <p className="px-3.5 pb-3 text-xs text-zinc-400 dark:text-zinc-500 italic">
                          No items assigned
                        </p>
                      )}

                      {/* Tax / tip footer */}
                      {personItems.length > 0 && hasAddons && (
                        <div className="px-3.5 py-2 border-t border-zinc-100 dark:border-zinc-800 space-y-0.5 mt-auto">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">Subtotal</span>
                            <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">${fmt(subtotal)}</span>
                          </div>
                          {taxShare > 0 && (
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs text-zinc-400 dark:text-zinc-500">Tax</span>
                              <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">+${fmt(taxShare)}</span>
                            </div>
                          )}
                          {tipShare > 0 && (
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs text-zinc-400 dark:text-zinc-500">Tip</span>
                              <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">+${fmt(tipShare)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Grand total bar */}
              <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Grand Total</span>
                    {(store.taxAmount > 0 || store.tipAmount > 0) && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {store.allItemsCost > 0 && `$${fmt(store.allItemsCost)} items`}
                        {store.taxAmount > 0 && ` + $${fmt(store.taxAmount)} tax`}
                        {store.tipAmount > 0 && ` + $${fmt(store.tipAmount)} tip`}
                      </p>
                    )}
                  </div>
                  <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    ${fmt(store.grandTotal)}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Footer */}
          <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center pb-6">
            Maintained by{" "}
            <a
              href="https://github.com/anish-sahoo"
              className="hover:text-zinc-600 dark:hover:text-zinc-400 underline transition-colors"
            >
              Anish Sahoo
            </a>
          </p>
        </main>
      </div>
    </div>
  );
}

export default App;
