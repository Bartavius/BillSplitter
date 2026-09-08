import { useState } from "react";

// Which people the next item assignment applies to. Purely UI state — the
// store never sees it.
export function useSelectedPersons() {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const deselect = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const clear = () => setSelected(new Set());

  return { selected, toggle, deselect, clear };
}
