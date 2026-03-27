export type Mode = "simple" | "per-person" | "by-item";

export interface Person {
  id: number;
  name: string;
}

export interface Item {
  id: number;
  name: string;       // empty string = no label
  cost: number;
  taxExempt: boolean;
}

export interface Split {
  itemId: number;
  personId: number;
}
