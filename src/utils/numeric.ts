// Amount fields are plain text with a decimal keypad — `type="number"` fights the
// user on mobile (rejected keystrokes, spinners, locale quirks). We only strip
// characters that could never belong in an amount, and leave partial entries
// like "" or "12." intact while typing.

export function sanitizeDecimal(raw: string): string {
  let s = raw.replace(/[^\d.]/g, "");
  const dot = s.indexOf(".");
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
  return s;
}

export function sanitizeDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

// Splits a total into n prices that add back up to the exact cent total; the
// leftover cents go to the first rows ($10.00 / 3 → 3.34, 3.33, 3.33)
export function splitEvenly(total: number, n: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const extra = cents - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i < extra ? 1 : 0)) / 100);
}

// Parses a partially-typed amount; "" and "." both read as 0
export function parseAmount(raw: string): number {
  if (raw === "" || raw === ".") return 0;
  const n = parseFloat(raw);
  return isNaN(n) ? 0 : n;
}
