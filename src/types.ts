export type SplitMode = "proportional" | "even";

export interface Person {
  id: number;
  name: string;
}

export interface Item {
  id: number;
  name: string; // empty string = no label
  cost: number; // total cost = unitPrice × quantity
  quantity: number; // default 1
  taxExempt: boolean;
}

export interface Split {
  itemId: number;
  personId: number;
}
