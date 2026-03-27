import type { Item, Person, Split } from "../types";

// ── BillStore interface ───────────────────────────────────────────────────────
//
//   Three tables (SQL-style):
//     persons  { id, name }
//     items    { id, name, cost, taxExempt }
//     splits   { itemId, personId }   ← many-to-many join
//
//   Mutations enforce referential integrity:
//     removePerson  → cascades splits, removes orphaned items
//     removeItem    → cascades splits
//     unlinkPerson  → removes one split row only (item kept)
// ─────────────────────────────────────────────────────────────────────────────

export interface BillStore {
  // Tables
  persons: Person[];
  items: Item[];
  splits: Split[];

  // Settings
  tax: number;
  setTax: (v: number) => void;
  fees: number;
  setFees: (v: number) => void;

  // People mutations
  addPerson: (name: string) => void;
  removePerson: (personId: number) => void;

  // Item mutations
  addItem: (name: string, cost: number, assignTo: number[]) => void;
  removeItem: (itemId: number) => void;
  unlinkPerson: (itemId: number, personId: number) => void;
  setItemSplit: (itemId: number, personId: number, included: boolean) => void;
  toggleTaxExempt: (itemId: number) => void;

  // Query helpers (JOIN equivalents)
  splitsForItem: (itemId: number) => Split[];
  splitsForPerson: (personId: number) => Split[];
  personsForItem: (itemId: number) => Person[];
  itemsForPerson: (personId: number) => Item[];

  // Calculations
  personSubtotal: (personId: number) => number;
  personTaxableSubtotal: (personId: number) => number;
  personTotal: (personId: number) => number;
  grandTotal: number;
  itemsTotal: number; // taxable only — used for tax $ ↔ % cross-computation

  // Reset
  clearAll: () => void;

  // Async state
  isLoading: boolean;
}
