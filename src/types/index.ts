export type SplitMode = "proportional" | "even";

// A discount keeps the unit it was entered in, so "$10 off" stays $10 when
// items change and "20% off" stays 20%.
export type DiscountKind = "percent" | "amount";

// Receipts print a multi-quantity line either as the price of one unit or as
// the line total, so a price can be read either way.
export type PriceMode = "each" | "total";

export interface Person {
  id: number;
  name: string;
}

export interface Item {
  id: number;
  name: string; // empty string = no label
  cost: number; // total cost = unitPrice × quantity
  quantity: number; // always 1 for new items (multi-qty adds split into rows); >1 only on legacy saves
  taxExempt: boolean;
}

export interface Split {
  itemId: number;
  personId: number;
}
