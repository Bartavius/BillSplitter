import type { Item, Person, Split } from "../types";

export interface ExportData {
  persons: Person[];
  items: Item[];
  tax: number;
  fees: number;
  grandTotal: number;
  itemsTotal: number;
  personTotal: (personId: number) => number;
  personTaxableSubtotal: (personId: number) => number;
  itemsForPerson: (personId: number) => Item[];
  splitsForItem: (itemId: number) => Split[];
}

export function buildTextLines(data: ExportData, detailed: boolean): string[] {
  const { persons, tax, fees, grandTotal, itemsTotal, personTotal, personTaxableSubtotal, itemsForPerson, splitsForItem } = data;
  const W = 32;
  const rpad = (label: string, value: string) =>
    label + " ".repeat(Math.max(1, W - label.length - value.length)) + value;

  const footer = (lines: string[]) => {
    lines.push("─".repeat(W));
    lines.push(rpad("Grand Total", `$${grandTotal.toFixed(2)}`));
    if (tax > 0) {
      const pct = tax % 1 === 0 ? tax.toFixed(0) : tax.toFixed(2);
      lines.push(rpad("Tax", `${pct}%  ($${(itemsTotal * tax / 100).toFixed(2)})`));
    }
    if (fees > 0) lines.push(rpad("Tip / Charges", `$${fees.toFixed(2)}`));
  };

  if (!detailed) {
    const lines = ["Bill Split Summary", "─".repeat(W), ""];
    persons.forEach((p) => lines.push(rpad(p.name, `$${personTotal(p.id).toFixed(2)}`)));
    lines.push("");
    footer(lines);
    return lines;
  }

  const lines = ["Bill Split Summary", "─".repeat(W), ""];
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
  lines.push("");
  footer(lines);
  return lines;
}

export function saveAsImage(data: ExportData, detailed: boolean): void {
  const { persons, tax, fees, grandTotal, itemsTotal, personTotal, personTaxableSubtotal, itemsForPerson, splitsForItem } = data;
  const W   = 440;
  const pad = 28;
  const ind = 16;

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

  const pushFooter = () => {
    rows.push({ k: "divider" });
    rows.push({ k: "grand-total", amount: grandTotal });
    if (tax > 0) {
      const pct = tax % 1 === 0 ? tax.toFixed(0) : tax.toFixed(2);
      rows.push({ k: "footnote", label: "Tax", value: `${pct}%  ($${(itemsTotal * tax / 100).toFixed(2)})` });
    }
    if (fees > 0) rows.push({ k: "footnote", label: "Tip / Charges", value: `$${fees.toFixed(2)}` });
  };

  if (!detailed) {
    persons.forEach((p) => {
      rows.push({ k: "person-name", name: p.name });
      rows.push({ k: "person-total", amount: personTotal(p.id) });
    });
    pushFooter();
  } else {
    persons.forEach((p, pi) => {
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
    pushFooter();
  }

  const totalH = rows.reduce((s, r) => s + rowHeight(r), 0) + pad * 2;

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
        font(false, 13);
        ctx.fillStyle = "#059669";
        ctx.fillText(priceStr, pad + ind + 52 - ctx.measureText(priceStr).width, baseline);
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
}
