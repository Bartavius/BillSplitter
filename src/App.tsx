import { Button, Card, Checkbox, Input } from "@nextui-org/react";
import { useRef, useState } from "react";
import "./App.css";

type Mode = "simple" | "per-person" | "by-item";

const MODE_LABELS: Record<Mode, string> = {
  simple: "Simple",
  "per-person": "Per Person",
  "by-item": "By Item",
};

// ── Relational data model (SQL-style) ────────────────────────────────────────
//
//   persons   { id, name }
//   items     { id, name, cost }
//   splits    { itemId, personId }   ← many-to-many join table
//
// Query helpers mirror SQL joins:
//   splitsForItem(itemId)   → Split[]
//   splitsForPerson(personId) → Split[]
//   personsForItem(itemId)  → Person[]
//   itemsForPerson(personId) → Item[]
// ─────────────────────────────────────────────────────────────────────────────

interface Person {
  id: number;
  name: string;
}

interface Item {
  id: number;
  name: string;  // optional label — empty string = no label
  cost: number;
  taxExempt: boolean;
}

interface Split {
  itemId: number;
  personId: number;
}

function App() {
  const [mode, setMode] = useState<Mode>("simple");

  // ── Tables ────────────────────────────────────────────────────────────────
  const [persons, setPersons] = useState<Person[]>([]);
  const [items, setItems]     = useState<Item[]>([]);
  const [splits, setSplits]   = useState<Split[]>([]);

  // Duplicate-name guard
  const [nameSet, setNameSet] = useState<Set<string>>(new Set());

  // ── Form state ────────────────────────────────────────────────────────────
  const [addName, setAddName]       = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCost, setNewItemCost] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [checkedPersonIds, setCheckedPersonIds]  = useState<number[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

  // ── Shared settings ───────────────────────────────────────────────────────
  const [tax, setTax]   = useState(0);
  const [fees, setFees] = useState(0);
  // Display strings for linked tax inputs
  const [taxPctStr, setTaxPctStr] = useState("");
  const [taxAmtStr, setTaxAmtStr] = useState("");
  const [copied, setCopied] = useState(false);
  const [exportDetailed, setExportDetailed] = useState(false);
  const [dark, setDark] = useState(false);

  const nextId = useRef(0);
  const newId  = () => nextId.current++;

  // ── Query helpers (JOIN equivalents) ─────────────────────────────────────

  const splitsForItem   = (itemId: number)   => splits.filter((s) => s.itemId   === itemId);
  const splitsForPerson = (personId: number) => splits.filter((s) => s.personId === personId);

  const personsForItem = (itemId: number): Person[] =>
    splitsForItem(itemId)
      .map((s) => persons.find((p) => p.id === s.personId))
      .filter(Boolean) as Person[];

  const itemsForPerson = (personId: number): Item[] =>
    splitsForPerson(personId)
      .map((s) => items.find((i) => i.id === s.itemId))
      .filter(Boolean) as Item[];

  // ── People ────────────────────────────────────────────────────────────────

  const addPerson = () => {
    const name = addName.trim();
    if (!name || nameSet.has(name.toLowerCase())) return;
    setPersons([...persons, { id: newId(), name }]);
    setNameSet(new Set([...nameSet, name.toLowerCase()]));
    setAddName("");
  };

  const removePerson = (personId: number) => {
    const person = persons.find((p) => p.id === personId)!;
    setPersons(persons.filter((p) => p.id !== personId));
    const s = new Set(nameSet);
    s.delete(person.name.toLowerCase());
    setNameSet(s);

    // DELETE FROM splits WHERE personId = ?
    const remainingSplits = splits.filter((s) => s.personId !== personId);
    setSplits(remainingSplits);

    // DELETE orphaned items (no splits left)
    const usedItemIds = new Set(remainingSplits.map((s) => s.itemId));
    setItems(items.filter((i) => usedItemIds.has(i.id)));

    if (selectedPersonId === personId) setSelectedPersonId(null);
    setCheckedPersonIds((prev) => prev.filter((id) => id !== personId));
  };

  // ── Items ─────────────────────────────────────────────────────────────────

  const addItem = (assignTo: number[]) => {
    const cost = parseFloat(newItemCost);
    if (isNaN(cost) || cost <= 0 || assignTo.length === 0) return;

    const itemId = newId();
    // INSERT INTO items
    setItems([...items, { id: itemId, name: newItemName.trim(), cost, taxExempt: false }]);
    // INSERT INTO splits (one row per person)
    setSplits([...splits, ...assignTo.map((personId) => ({ itemId, personId }))]);

    setNewItemName("");
    setNewItemCost("");
    setCheckedPersonIds([]);
  };

  // Remove one person's link to an item (DELETE FROM splits WHERE itemId=? AND personId=?)
  const unlinkPerson = (itemId: number, personId: number) =>
    setSplits(splits.filter((s) => !(s.itemId === itemId && s.personId === personId)));

  const removeItem = (itemId: number) => {
    // DELETE FROM items WHERE id = ?
    setItems(items.filter((i) => i.id !== itemId));
    // DELETE FROM splits WHERE itemId = ?
    setSplits(splits.filter((s) => s.itemId !== itemId));
  };

  // ── Calculations ──────────────────────────────────────────────────────────

  // SUM(cost / split_count) for all items a person shares
  const personSubtotal = (personId: number): number =>
    itemsForPerson(personId).reduce((sum, item) => {
      const shareCount = splitsForItem(item.id).length;
      return sum + (shareCount > 0 ? item.cost / shareCount : 0);
    }, 0);

  const personTaxableSubtotal = (personId: number): number =>
    itemsForPerson(personId).reduce((sum, item) => {
      if (item.taxExempt) return sum;
      const shareCount = splitsForItem(item.id).length;
      return sum + (shareCount > 0 ? item.cost / shareCount : 0);
    }, 0);

  const personTotal = (personId: number): number =>
    personSubtotal(personId) +
    personTaxableSubtotal(personId) * (tax / 100) +
    (persons.length > 0 ? fees / persons.length : 0);

  const toggleTaxExempt = (itemId: number) =>
    setItems(items.map((i) => i.id === itemId ? { ...i, taxExempt: !i.taxExempt } : i));

  // Only taxable items count toward the tax $ ↔ % cross-computation
  const itemsTotal = items.filter((i) => !i.taxExempt).reduce((sum, i) => sum + i.cost, 0);

  const grandTotal = persons.reduce((sum, p) => sum + personTotal(p.id), 0);

  // ── Export ────────────────────────────────────────────────────────────────

  const copyAsText = () => {
    const W = 32;
    const rpad = (label: string, value: string) =>
      label + " ".repeat(Math.max(1, W - label.length - value.length)) + value;

    let lines: string[];

    if (!exportDetailed) {
      lines = ["Bill Split Summary", "─".repeat(W), ""];
      persons.forEach((p) => lines.push(rpad(p.name, `$${personTotal(p.id).toFixed(2)}`)));
      lines.push("─".repeat(W));
      lines.push(rpad("Grand Total", `$${grandTotal.toFixed(2)}`));
      if (tax > 0) {
        const pct = tax % 1 === 0 ? tax.toFixed(0) : tax.toFixed(2);
        lines.push(rpad("Tax", `${pct}%  ($${(itemsTotal * tax / 100).toFixed(2)})`));
      }
      if (fees > 0) lines.push(rpad("Tip / Charges", `$${fees.toFixed(2)}`));
    } else {
      lines = ["Bill Split Summary", "─".repeat(W), ""];
      persons.forEach((p, pi) => {
        if (pi > 0) lines.push("");
        lines.push(p.name);
        itemsForPerson(p.id).forEach((item) => {
          const shareCount = splitsForItem(item.id).length;
          const share = shareCount > 0 ? item.cost / shareCount : 0;
          const tags = [item.name, shareCount > 1 ? "shared" : "", item.taxExempt ? "no tax" : ""]
            .filter(Boolean).join("  ·  ");
          lines.push(`  $${share.toFixed(2)}${tags ? "  " + tags : ""}`);
        });
        const taxAmt = personTaxableSubtotal(p.id) * (tax / 100);
        if (tax > 0 && taxAmt > 0) {
          const pct = tax % 1 === 0 ? tax.toFixed(0) : tax.toFixed(1);
          lines.push(rpad(`  tax (${pct}%)`, `+$${taxAmt.toFixed(2)}`));
        }
        const feeAmt = persons.length > 0 ? fees / persons.length : 0;
        if (fees > 0) lines.push(rpad("  tip / charges", `+$${feeAmt.toFixed(2)}`));
        lines.push("  " + "─".repeat(W - 2));
        lines.push(rpad("  Total", `$${personTotal(p.id).toFixed(2)}`));
      });
      lines.push("", "─".repeat(W));
      lines.push(rpad("Grand Total", `$${grandTotal.toFixed(2)}`));
      if (tax > 0) {
        const pct = tax % 1 === 0 ? tax.toFixed(0) : tax.toFixed(2);
        lines.push(rpad("Tax", `${pct}%  ($${(itemsTotal * tax / 100).toFixed(2)})`));
      }
      if (fees > 0) lines.push(rpad("Tip / Charges", `$${fees.toFixed(2)}`));
    }

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const saveAsImage = () => {
    const W   = 440;
    const pad = 28;
    const ind = 16; // item indent

    // ── Build a virtual row list first so we can measure total height ─────
    type RowSpec =
      | { k: "title" }
      | { k: "divider" }
      | { k: "spacer" }
      | { k: "person-name"; name: string }
      | { k: "item"; price: number; label: string; shared: boolean; exempt: boolean }
      | { k: "addon"; label: string; amount: number }
      | { k: "person-total"; amount: number }
      | { k: "grand-total"; amount: number }
      | { k: "footnote"; label: string; value: string };

    const rowHeight = (r: RowSpec): number => {
      switch (r.k) {
        case "title":        return 38;
        case "divider":      return 16;
        case "spacer":       return 8;
        case "person-name":  return 26;
        case "item":         return 20;
        case "addon":        return 18;
        case "person-total": return 24;
        case "grand-total":  return 32;
        case "footnote":     return 20;
      }
    };

    const rows: RowSpec[] = [{ k: "title" }, { k: "divider" }];

    if (!exportDetailed) {
      persons.forEach((p) => {
        rows.push({ k: "person-name", name: p.name });
        rows.push({ k: "person-total", amount: personTotal(p.id) });
      });
      rows.push({ k: "divider" });
      rows.push({ k: "grand-total", amount: grandTotal });
      if (tax > 0) {
        const pct = tax % 1 === 0 ? tax.toFixed(0) : tax.toFixed(2);
        rows.push({ k: "footnote", label: "Tax", value: `${pct}%  ($${(itemsTotal * tax / 100).toFixed(2)})` });
      }
      if (fees > 0) rows.push({ k: "footnote", label: "Tip / Charges", value: `$${fees.toFixed(2)}` });
    } else persons.forEach((p, pi) => {
      if (pi > 0) rows.push({ k: "spacer" });
      rows.push({ k: "person-name", name: p.name });

      itemsForPerson(p.id).forEach((item) => {
        const shareCount = splitsForItem(item.id).length;
        const share = shareCount > 0 ? item.cost / shareCount : 0;
        rows.push({ k: "item", price: share, label: item.name, shared: shareCount > 1, exempt: item.taxExempt });
      });

      const taxAmt = personTaxableSubtotal(p.id) * (tax / 100);
      if (tax > 0 && taxAmt > 0)
        rows.push({ k: "addon", label: `tax (${tax % 1 === 0 ? tax.toFixed(0) : tax.toFixed(1)}%)`, amount: taxAmt });

      const feeAmt = persons.length > 0 ? fees / persons.length : 0;
      if (fees > 0)
        rows.push({ k: "addon", label: "tip / charges", amount: feeAmt });

      rows.push({ k: "person-total", amount: personTotal(p.id) });
    });
    rows.push({ k: "divider" });
    rows.push({ k: "grand-total", amount: grandTotal });
    if (tax > 0) {
      const pct = tax % 1 === 0 ? tax.toFixed(0) : tax.toFixed(2);
      rows.push({ k: "footnote", label: "Tax", value: `${pct}%  ($${(itemsTotal * tax / 100).toFixed(2)})` });
    }
    if (fees > 0)
      rows.push({ k: "footnote", label: "Tip / Charges", value: `$${fees.toFixed(2)}` });

    const totalH = rows.reduce((s, r) => s + rowHeight(r), 0) + pad * 2;

    // ── Draw ──────────────────────────────────────────────────────────────
    const canvas = document.createElement("canvas");
    canvas.width  = W;
    canvas.height = totalH;
    const ctx = canvas.getContext("2d")!;

    const font = (bold: boolean, size: number) => {
      ctx.font = `${bold ? "600 " : ""}${size}px -apple-system, BlinkMacSystemFont, sans-serif`;
    };
    const right = (text: string, y: number, bold: boolean, size: number, color: string) => {
      font(bold, size);
      ctx.fillStyle = color;
      ctx.fillText(text, W - pad - ctx.measureText(text).width, y);
    };

    // Background + border
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, totalH);
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, totalH - 2);

    let y = pad;
    rows.forEach((row) => {
      const h = rowHeight(row);
      const baseline = y + h - 4;

      switch (row.k) {
        case "title":
          font(true, 20);
          ctx.fillStyle = "#111827";
          ctx.fillText("Bill Split Summary", pad, baseline);
          break;

        case "divider":
          ctx.strokeStyle = "#E5E7EB";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pad, y + h / 2);
          ctx.lineTo(W - pad, y + h / 2);
          ctx.stroke();
          break;

        case "spacer":
          break;

        case "person-name":
          font(true, 15);
          ctx.fillStyle = "#111827";
          ctx.fillText(row.name, pad, baseline);
          break;

        case "item": {
          const priceStr = `$${row.price.toFixed(2)}`;
          // price — fixed 52px column, right-aligned within it
          font(false, 13);
          ctx.fillStyle = "#059669";
          ctx.fillText(priceStr, pad + ind + 52 - ctx.measureText(priceStr).width, baseline);
          // label
          const parts: string[] = [];
          if (row.label) parts.push(row.label);
          if (row.shared) parts.push("shared");
          if (row.exempt) parts.push("no tax");
          if (parts.length) {
            ctx.fillStyle = "#6B7280";
            ctx.fillText(parts.join("  ·  "), pad + ind + 52 + 8, baseline);
          }
          break;
        }

        case "addon":
          font(false, 12);
          ctx.fillStyle = "#9CA3AF";
          ctx.fillText(row.label, pad + ind, baseline);
          right(`+$${row.amount.toFixed(2)}`, baseline, false, 12, "#9CA3AF");
          break;

        case "person-total":
          // thin line above
          ctx.strokeStyle = "#E5E7EB";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pad + ind, y + 2);
          ctx.lineTo(W - pad, y + 2);
          ctx.stroke();
          font(true, 14);
          ctx.fillStyle = "#374151";
          ctx.fillText("Total", pad + ind, baseline);
          right(`$${row.amount.toFixed(2)}`, baseline, true, 14, "#111827");
          break;

        case "grand-total":
          font(true, 18);
          ctx.fillStyle = "#111827";
          ctx.fillText("Grand Total", pad, baseline);
          right(`$${row.amount.toFixed(2)}`, baseline, true, 18, "#111827");
          break;

        case "footnote":
          font(false, 12);
          ctx.fillStyle = "#9CA3AF";
          ctx.fillText(row.label, pad, baseline);
          right(row.value, baseline, false, 12, "#9CA3AF");
          break;
      }

      y += h;
    });

    const link = document.createElement("a");
    link.download = "bill-split.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // Toggle dark class on <html> so NextUI + Tailwind both pick it up
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-zinc-900 transition-colors">
      <div className="flex justify-end px-6 pt-4">
        <button
          onClick={toggleDark}
          className="text-sm text-gray-400 hover:text-gray-600 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {dark ? "☀ Light" : "☾ Dark"}
        </button>
      </div>
      <h1 className="text-center font-mono text-4xl mt-2 dark:text-white">Bill Splitter</h1>
      <div className="mx-6 md:mx-24 lg:mx-48 mt-8 flex flex-col items-center">

        {/* Add Person */}
        <div className="flex flex-row gap-2 mb-6">
          <Input
            placeholder="Add a person..."
            className="w-56"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addPerson(); }}
          />
          <Button onClick={addPerson}>Add Person</Button>
        </div>

        {/* Person cards */}
        {persons.length > 0 && (
          <div className="flex flex-row flex-wrap gap-3 mb-6 justify-center w-full">
            {persons.map((person) => {
              const myItems = itemsForPerson(person.id);
              return (
                <Card key={person.id} className="px-4 py-3 min-w-[140px]">
                  <div className="flex flex-row justify-between items-center mb-1">
                    <h2 className="text-base font-bold mr-3">{person.name}</h2>
                    <button
                      className="text-red-400 hover:text-red-600 text-lg leading-none"
                      onClick={() => removePerson(person.id)}
                    >
                      ×
                    </button>
                  </div>
                  {myItems.map((item) => {
                    const shareCount = splitsForItem(item.id).length;
                    const share      = shareCount > 0 ? item.cost / shareCount : 0;
                    const isShared   = shareCount > 1;
                    return (
                      <div
                        key={item.id}
                        className="grid w-full items-center gap-x-1.5 hover:bg-red-50 rounded group"
                        style={{ gridTemplateColumns: "3.5rem 1fr auto 1rem" }}
                      >
                        <span className="text-xs font-semibold text-green-600 tabular-nums text-right">
                          ${share.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400 truncate">
                          {item.name}
                        </span>
                        <span className={`text-xs text-gray-300 ${isShared ? "" : "invisible"}`}>
                          shared
                        </span>
                        <button
                          className="text-red-400 text-xs opacity-0 group-hover:opacity-100 text-center"
                          onClick={() => unlinkPerson(item.id, person.id)}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  {myItems.length > 0 && (
                    <div className="mt-1 pt-1 border-t text-xs text-gray-500 text-right">
                      subtotal: ${personSubtotal(person.id).toFixed(2)}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Mode toggle */}
        {persons.length > 0 && (
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
        )}

        {/* ── Simple input ── */}
        {mode === "simple" && persons.length > 0 && (
          <Card className="p-6 mb-6 w-full max-w-2xl">
            <div className="flex flex-wrap gap-3 justify-center items-end">
              <select
                className="border border-gray-200 dark:border-zinc-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-500"
                value={selectedPersonId ?? ""}
                onChange={(e) =>
                  setSelectedPersonId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Select person…</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <Input
                placeholder="Price"
                className="w-28"
                type="number"
                min="0"
                step="0.01"
                value={newItemCost}
                onChange={(e) => setNewItemCost(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedPersonId != null)
                    addItem([selectedPersonId]);
                }}
              />
              <Button
                onClick={() => selectedPersonId != null && addItem([selectedPersonId])}
                isDisabled={selectedPersonId == null || !newItemCost}
              >
                Add Price
              </Button>
            </div>
          </Card>
        )}

        {/* ── Per-person input ── */}
        {mode === "per-person" && persons.length > 0 && (
          <Card className="p-6 mb-6 w-full max-w-2xl">
            <p className="text-sm text-gray-500 mb-4 text-center">
              Select a person and add their items
            </p>
            <div className="flex flex-wrap gap-3 justify-center items-end">
              <select
                className="border border-gray-200 dark:border-zinc-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-500"
                value={selectedPersonId ?? ""}
                onChange={(e) =>
                  setSelectedPersonId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Select person…</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <Input
                placeholder="Label (optional)"
                className="w-40"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedPersonId != null)
                    addItem([selectedPersonId]);
                }}
              />
              <Input
                placeholder="Cost"
                className="w-28"
                type="number"
                min="0"
                step="0.01"
                value={newItemCost}
                onChange={(e) => setNewItemCost(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedPersonId != null)
                    addItem([selectedPersonId]);
                }}
              />
              <Button
                onClick={() => selectedPersonId != null && addItem([selectedPersonId])}
                isDisabled={selectedPersonId == null || !newItemCost}
              >
                Add Item
              </Button>
            </div>
          </Card>
        )}

        {/* ── By-item input ── */}
        {mode === "by-item" && persons.length > 0 && (
          <Card className="p-6 mb-6 w-full max-w-2xl">
            <p className="text-sm text-gray-500 mb-4 text-center">
              Enter an item and select who shares it
            </p>
            <div className="flex flex-wrap gap-3 justify-center items-end mb-5">
              <Input
                placeholder="Label (optional)"
                className="w-44"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addItem(checkedPersonIds); }}
              />
              <Input
                placeholder="Cost"
                className="w-28"
                type="number"
                min="0"
                step="0.01"
                value={newItemCost}
                onChange={(e) => setNewItemCost(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addItem(checkedPersonIds); }}
              />
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2 text-center">Split among:</p>
              <div className="flex flex-row flex-wrap gap-4 justify-center">
                {persons.map((p) => (
                  <Checkbox
                    key={p.id}
                    isSelected={checkedPersonIds.includes(p.id)}
                    onValueChange={(checked) =>
                      setCheckedPersonIds((prev) =>
                        checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                      )
                    }
                  >
                    {p.name}
                  </Checkbox>
                ))}
              </div>
              <div className="flex gap-3 justify-center mt-3">
                <button
                  className="text-xs text-blue-500 hover:underline"
                  onClick={() => setCheckedPersonIds(persons.map((p) => p.id))}
                >
                  Select All
                </button>
                <span className="text-gray-300 text-xs">|</span>
                <button
                  className="text-xs text-blue-500 hover:underline"
                  onClick={() => setCheckedPersonIds([])}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex justify-center mb-2">
              <Button
                onClick={() => addItem(checkedPersonIds)}
                isDisabled={!newItemCost || checkedPersonIds.length === 0}
              >
                Add Item
              </Button>
            </div>

            {/* Items list */}
            {items.length > 0 && (
              <div className="mt-5 border-t pt-4">
                <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-zinc-300">Added Items</p>
                <div className="flex flex-col gap-1">
                  {items.map((item) => {
                    const whoSplits = personsForItem(item.id);
                    const isExpanded = expandedItemId === item.id;
                    return (
                      <div key={item.id}>
                        <div
                          className="flex flex-row items-center text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg px-2 py-1 group cursor-pointer"
                          onClick={() =>
                            setExpandedItemId(isExpanded ? null : item.id)
                          }
                        >
                          <span className="flex-1 text-left text-gray-800 dark:text-zinc-200">
                            {item.name || (
                              <span className="text-gray-400 dark:text-zinc-500 italic">unlabeled</span>
                            )}
                          </span>
                          <span className="text-green-600 dark:text-green-400 font-semibold mr-3">
                            ${item.cost.toFixed(2)}
                          </span>
                          <span className="text-gray-400 dark:text-zinc-500 text-xs mr-2 hidden sm:inline">
                            ÷ {whoSplits.map((p) => p.name).join(", ")}
                          </span>
                          <span className="text-gray-400 dark:text-zinc-500 text-xs mr-2 sm:hidden">
                            ÷ {whoSplits.length}
                          </span>
                          <button
                            title={item.taxExempt ? "Tax exempt — click to remove" : "Click to mark tax exempt"}
                            className={`text-xs mr-2 rounded px-1 transition-opacity ${
                              item.taxExempt
                                ? "text-blue-400 opacity-100"
                                : "text-gray-300 opacity-0 group-hover:opacity-100"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaxExempt(item.id);
                            }}
                          >
                            no tax
                          </button>
                          <button
                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 text-base ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.id);
                            }}
                          >
                            ×
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="ml-2 mb-2 pl-3 border-l-2 border-gray-100 flex flex-wrap gap-3 py-1">
                            {persons.map((p) => {
                              const inSplit = whoSplits.some((w) => w.id === p.id);
                              return (
                                <Checkbox
                                  key={p.id}
                                  isSelected={inSplit}
                                  onValueChange={(checked) => {
                                    if (checked) {
                                      setSplits((prev) => [
                                        ...prev,
                                        { itemId: item.id, personId: p.id },
                                      ]);
                                    } else {
                                      setSplits((prev) =>
                                        prev.filter(
                                          (s) =>
                                            !(s.itemId === item.id && s.personId === p.id)
                                        )
                                      );
                                    }
                                  }}
                                >
                                  {p.name}
                                </Checkbox>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── Tax / Fees + Results ── */}
        <Card className="p-8 mb-8 w-full max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-6 mb-6 justify-center">
            {/* Tax — % and $ are linked */}
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">Tax</p>
              <div className="flex flex-row gap-2">
                <Input
                  placeholder="%"
                  className="w-24"
                  type="number"
                  min="0"
                  step="0.1"
                  value={taxPctStr}
                  onChange={(e) => {
                    const pct = parseFloat(e.target.value) || 0;
                    setTaxPctStr(e.target.value);
                    setTax(pct);
                    setTaxAmtStr(itemsTotal > 0 ? (itemsTotal * pct / 100).toFixed(2) : "");
                  }}
                />
                <Input
                  placeholder="$"
                  className="w-24"
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxAmtStr}
                  onChange={(e) => {
                    const amt = parseFloat(e.target.value) || 0;
                    setTaxAmtStr(e.target.value);
                    const pct = itemsTotal > 0 ? (amt / itemsTotal) * 100 : 0;
                    setTax(pct);
                    setTaxPctStr(itemsTotal > 0 ? pct.toFixed(2) : "");
                  }}
                />
              </div>
            </div>

            {/* Tip + charges — flat dollar amount split evenly */}
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">Tip / Charges ($)</p>
              <Input
                placeholder="$"
                className="w-24"
                type="number"
                min="0"
                step="0.01"
                onChange={(e) => setFees(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {persons.length > 0 ? (
            <>
              <div className="flex flex-row flex-wrap justify-center gap-3 mb-4">
                {persons.map((p) => (
                  <Card key={p.id} className="px-5 py-3 min-w-[120px] text-center">
                    <p className="font-semibold text-sm text-gray-700 dark:text-zinc-200">{p.name}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      ${personTotal(p.id).toFixed(2)}
                    </p>
                  </Card>
                ))}
              </div>
              <p className="text-center text-gray-500 dark:text-zinc-400 text-sm mb-5">
                Grand Total:{" "}
                <span className="font-bold text-gray-900 dark:text-zinc-100">${grandTotal.toFixed(2)}</span>
              </p>
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-row border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden text-xs">
                  <button
                    className={`px-3 py-1 transition-colors ${!exportDetailed ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-white text-gray-500 hover:bg-gray-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"}`}
                    onClick={() => setExportDetailed(false)}
                  >
                    Simple
                  </button>
                  <button
                    className={`px-3 py-1 transition-colors ${exportDetailed ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-white text-gray-500 hover:bg-gray-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"}`}
                    onClick={() => setExportDetailed(true)}
                  >
                    Detailed
                  </button>
                </div>
                <div className="flex flex-row gap-3">
                  <Button size="sm" variant="bordered" onClick={copyAsText}>
                    {copied ? "✓ Copied!" : "Copy as Text"}
                  </Button>
                  <Button size="sm" variant="bordered" onClick={saveAsImage}>
                    Save as Image
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400 text-sm">
              Add people above to get started.
            </p>
          )}
        </Card>

        <p className="text-gray-400 text-xs text-center mb-8">
          Made by Anish Sahoo, Zaydaan Jahangir, William Riser, Rohan Parikh
        </p>
      </div>
      </div>
    </div>
  );
}

export default App;
