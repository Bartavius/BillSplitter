import type { Item, Person, Split } from "../types";

export interface PersistedState {
  persons: Person[];
  items: Item[];
  splits: Split[];
  tax: number;
  fees: number;
  nextId: number;
}

export interface BillRepository {
  load(): Promise<PersistedState | null>;
  save(state: PersistedState): Promise<void>;
  clear(): Promise<void>;
}
