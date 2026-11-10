import type { DiscountKind, Item, Person, Split, SplitMode } from "../types";

// ── BillStore interface ───────────────────────────────────────────────────────
//
//   Three tables (SQL-style):
//     persons  { id, name }
//     items    { id, name, cost, taxExempt }
//     splits   { itemId, personId }   ← many-to-many join
//
//   Mutations enforce referential integrity:
//     removePerson  → cascades splits, removes orphaned items (that had splits)
//     removeItem    → cascades splits
//     unlinkPerson  → removes one split row only (item kept)
// ─────────────────────────────────────────────────────────────────────────────

export interface BillStore {
  // Tables
  persons: Person[];
  items: Item[];
  splits: Split[];

  // Settings
  discount: number; // percent or dollars, depending on discountKind
  discountKind: DiscountKind;
  setDiscount: (v: number, kind: DiscountKind) => void;
  tax: number;
  setTax: (v: number) => void;
  taxMode: SplitMode;
  setTaxMode: (m: SplitMode) => void;
  tip: number;
  setTip: (v: number) => void;
  tipMode: SplitMode;
  setTipMode: (m: SplitMode) => void;

  // People mutations
  addPerson: (name: string) => void;
  removePerson: (personId: number) => void;

  // Item mutations
  addItem: (name: string, rowPrices: number[], assignTo: number[]) => void; // one row per price
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
  personDiscountShare: (personId: number) => number;
  personTaxShare: (personId: number) => number;
  personTipShare: (personId: number) => number;
  personTotal: (personId: number) => number;
  grandTotal: number;
  itemsTotal: number; // taxable items total, before the discount
  allItemsCost: number; // all items total, before the discount — for discount $ ↔ % conversion
  discountAmount: number; // computed discount in dollars, never more than allItemsCost
  taxBase: number; // taxable items after the discount — for tax $ ↔ % conversion
  tipBase: number; // all items after the discount — for tip $ ↔ % conversion
  taxAmount: number; // computed tax in dollars
  tipAmount: number; // computed tip in dollars

  // Reset
  clearAll: () => void;

  // Async state
  isLoading: boolean;
}
