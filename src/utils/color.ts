import { PERSON_COLORS } from "../constants/colors";

export function personColor(index: number): string {
  return PERSON_COLORS[index % PERSON_COLORS.length];
}

// Returns rgba from a 6-digit hex
export function colorBg(hex: string, opacity = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
