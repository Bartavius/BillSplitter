export function fmt(n: number): string {
  return n.toFixed(2);
}

// Drops trailing zeros so a percent reads "8.75" instead of "8.750"
export function trim(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
