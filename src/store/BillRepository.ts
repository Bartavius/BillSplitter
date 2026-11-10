import type { DiscountKind, Item, Person, Split, SplitMode } from "../types";

export interface PersistedState {
  persons: Person[];
  items: Item[];
  splits: Split[];
  discount?: number; // missing in saves from before discounts existed
  discountKind?: DiscountKind;
  tax: number;
  taxMode: SplitMode;
  tip: number;
  tipMode: SplitMode;
  nextId: number;
}

export interface BillRepository {
  load(): Promise<PersistedState | null>;
  save(state: PersistedState): Promise<void>;
  clear(): Promise<void>;
}
