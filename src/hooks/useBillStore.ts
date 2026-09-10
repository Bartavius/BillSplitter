import { useEffect, useRef, useState } from "react";
import type { Item, Person, Split, SplitMode } from "../types";
import type { BillStore } from "../store/BillStore";
import type { BillRepository } from "../store/BillRepository";
import { LocalStorageRepository } from "../store/LocalStorageRepository";

const defaultRepo = new LocalStorageRepository();

export function useBillStore(repo: BillRepository = defaultRepo): BillStore {
  const [persons, setPersons] = useState<Person[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [nameSet, setNameSet] = useState<Set<string>>(new Set());
  const [tax, setTax] = useState(0);
  const [taxMode, setTaxMode] = useState<SplitMode>("proportional");
  const [tip, setTip] = useState(0);
  const [tipMode, setTipMode] = useState<SplitMode>("even");
  const [isLoading, setIsLoading] = useState(true);
  const nextId = useRef(0);
  const initialized = useRef(false);
  const newId = () => nextId.current++;

  // ── Persistence ───────────────────────────────────────────────────────────

  // Load once on mount
  useEffect(() => {
    repo.load().then((saved) => {
      if (saved) {
        setPersons(saved.persons);
        // Backfill quantity for items persisted before this field existed
        setItems(saved.items.map((i) => ({ ...i, quantity: i.quantity ?? 1 })));
        setSplits(saved.splits);
        setNameSet(new Set(saved.persons.map((p) => p.name.toLowerCase())));
        setTax(saved.tax ?? 0);
        setTaxMode(saved.taxMode ?? "proportional");
        setTip(saved.tip ?? 0);
        setTipMode(saved.tipMode ?? "even");
        nextId.current = saved.nextId;
      }
      initialized.current = true;
      setIsLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on every change after the initial load has settled
  useEffect(() => {
    if (!initialized.current) return;
    repo
      .save({ persons, items, splits, tax, taxMode, tip, tipMode, nextId: nextId.current })
      .catch(console.error);
  }, [persons, items, splits, tax, taxMode, tip, tipMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Queries ──────────────────────────────────────────────────────────────

  const splitsForItem = (itemId: number) => splits.filter((s) => s.itemId === itemId);
  const splitsForPerson = (personId: number) => splits.filter((s) => s.personId === personId);

  const personsForItem = (itemId: number): Person[] =>
    splitsForItem(itemId)
      .map((s) => persons.find((p) => p.id === s.personId))
      .filter(Boolean) as Person[];

  const itemsForPerson = (personId: number): Item[] =>
    splitsForPerson(personId)
      .map((s) => items.find((i) => i.id === s.itemId))
      .filter(Boolean) as Item[];

  // ── People ────────────────────────────────────────────────────────────────

  const addPerson = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || nameSet.has(trimmed.toLowerCase())) return;
    setPersons((prev) => [...prev, { id: newId(), name: trimmed }]);
    setNameSet((prev) => new Set([...prev, trimmed.toLowerCase()]));
  };

  const removePerson = (personId: number) => {
    const person = persons.find((p) => p.id === personId);
    if (!person) return;

    const remainingSplits = splits.filter((s) => s.personId !== personId);
    const usedItemIds = new Set(remainingSplits.map((s) => s.itemId));

    setPersons((prev) => prev.filter((p) => p.id !== personId));
    setNameSet((prev) => {
      const s = new Set(prev);
      s.delete(person.name.toLowerCase());
      return s;
    });
    setSplits(remainingSplits);
    // Only remove items that had splits and now have none left (keep unassigned items)
    setItems((prev) =>
      prev.filter((i) => {
        const hadSplits = splits.some((s) => s.itemId === i.id);
        return !hadSplits || usedItemIds.has(i.id);
      }),
    );
  };

  // ── Items ─────────────────────────────────────────────────────────────────

  // assignTo may be empty — items can exist without any assignment
  const addItem = (name: string, unitPrice: number, assignTo: number[], quantity = 1) => {
    if (isNaN(unitPrice) || unitPrice <= 0) return;
    const qty = Math.max(1, Math.round(quantity));
    const cost = unitPrice * qty;
    const itemId = newId();
    setItems((prev) => [
      ...prev,
      { id: itemId, name: name.trim(), cost, quantity: qty, taxExempt: false },
    ]);
    if (assignTo.length > 0) {
      setSplits((prev) => [...prev, ...assignTo.map((personId) => ({ itemId, personId }))]);
    }
  };

  const removeItem = (itemId: number) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setSplits((prev) => prev.filter((s) => s.itemId !== itemId));
  };

  const unlinkPerson = (itemId: number, personId: number) =>
    setSplits((prev) => prev.filter((s) => !(s.itemId === itemId && s.personId === personId)));

  const setItemSplit = (itemId: number, personId: number, included: boolean) => {
    if (included) {
      // Avoid duplicate splits
      const exists = splits.some((s) => s.itemId === itemId && s.personId === personId);
      if (!exists) setSplits((prev) => [...prev, { itemId, personId }]);
    } else {
      unlinkPerson(itemId, personId);
    }
  };

  const toggleTaxExempt = (itemId: number) =>
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, taxExempt: !i.taxExempt } : i)));

  // ── Calculations ──────────────────────────────────────────────────────────

  const personSubtotal = (personId: number): number =>
    itemsForPerson(personId).reduce((sum, item) => {
      const n = splitsForItem(item.id).length;
      return sum + (n > 0 ? item.cost / n : 0);
    }, 0);

  const personTaxableSubtotal = (personId: number): number =>
    itemsForPerson(personId).reduce((sum, item) => {
      if (item.taxExempt) return sum;
      const n = splitsForItem(item.id).length;
      return sum + (n > 0 ? item.cost / n : 0);
    }, 0);

  const itemsTotal = items.filter((i) => !i.taxExempt).reduce((sum, i) => sum + i.cost, 0);
  const allItemsCost = items.reduce((sum, i) => sum + i.cost, 0);
  const taxAmount = itemsTotal * (tax / 100);
  const tipAmount = allItemsCost * (tip / 100);

  const personTaxShare = (personId: number): number => {
    if (taxMode === "proportional") {
      return personTaxableSubtotal(personId) * (tax / 100);
    }
    // even split
    return persons.length > 0 ? taxAmount / persons.length : 0;
  };

  const personTipShare = (personId: number): number => {
    if (tipMode === "proportional") {
      if (allItemsCost <= 0) return persons.length > 0 ? tipAmount / persons.length : 0;
      return (personSubtotal(personId) / allItemsCost) * tipAmount;
    }
    // even split
    return persons.length > 0 ? tipAmount / persons.length : 0;
  };

  const personTotal = (personId: number): number =>
    personSubtotal(personId) + personTaxShare(personId) + personTipShare(personId);

  const grandTotal = persons.reduce((sum, p) => sum + personTotal(p.id), 0);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const clearAll = () => {
    setPersons([]);
    setItems([]);
    setSplits([]);
    setNameSet(new Set());
    setTax(0);
    setTaxMode("proportional");
    setTip(0);
    setTipMode("even");
    nextId.current = 0;
    repo.clear().catch(console.error);
  };

  return {
    persons,
    items,
    splits,
    tax,
    setTax,
    taxMode,
    setTaxMode,
    tip,
    setTip,
    tipMode,
    setTipMode,
    addPerson,
    removePerson,
    addItem,
    removeItem,
    unlinkPerson,
    setItemSplit,
    toggleTaxExempt,
    splitsForItem,
    splitsForPerson,
    personsForItem,
    itemsForPerson,
    personSubtotal,
    personTaxableSubtotal,
    personTaxShare,
    personTipShare,
    personTotal,
    grandTotal,
    itemsTotal,
    allItemsCost,
    taxAmount,
    tipAmount,
    clearAll,
    isLoading,
  };
}
