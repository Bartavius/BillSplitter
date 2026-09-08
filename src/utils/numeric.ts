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

// Parses a partially-typed amount; "" and "." both read as 0
export function parseAmount(raw: string): number {
  if (raw === "" || raw === ".") return 0;
  const n = parseFloat(raw);
  return isNaN(n) ? 0 : n;
}
