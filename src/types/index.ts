export type SplitMode = "proportional" | "even";

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
