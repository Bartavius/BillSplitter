import type { Item, Person, Split, SplitMode } from "../types";

export interface PersistedState {
  persons: Person[];
  items: Item[];
  splits: Split[];
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
