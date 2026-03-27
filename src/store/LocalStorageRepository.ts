import type { BillRepository, PersistedState } from "./BillRepository";

const KEY = "bill-splitter-data";

export class LocalStorageRepository implements BillRepository {
  async load(): Promise<PersistedState | null> {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as PersistedState) : null;
    } catch {
      return null;
    }
  }

  async save(state: PersistedState): Promise<void> {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  async clear(): Promise<void> {
    localStorage.removeItem(KEY);
  }
}
