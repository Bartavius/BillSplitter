import { useEffect, useRef, useState } from "react";
import type { DiscountKind, Item, Person, Split, SplitMode } from "../types";
import type { BillStore } from "../store/BillStore";
import type { BillRepository } from "../store/BillRepository";
import { LocalStorageRepository } from "../store/LocalStorageRepository";

const defaultRepo = new LocalStorageRepository();

export function useBillStore(repo: BillRepository = defaultRepo): BillStore {
  const [persons, setPersons] = useState<Person[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [nameSet, setNameSet] = useState<Set<string>>(new Set());
  const [discount, setDiscountValue] = useState(0);
  const [discountKind, setDiscountKind] = useState<DiscountKind>("percent");
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
        setDiscountValue(saved.discount ?? 0);
        setDiscountKind(saved.discountKind ?? "percent");
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
      .save({
        persons,
        items,
        splits,
        discount,
        discountKind,
        tax,
        taxMode,
        tip,
        tipMode,
        nextId: nextId.current,
      })
      .catch(console.error);
  }, [persons, items, splits, discount, discountKind, tax, taxMode, tip, tipMode]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // assignTo may be empty — items can exist without any assignment.
  // Each price becomes its own single-unit row so units can be assigned to
  // different people (e.g. 5 tacos: 2 for one person, 3 for another).
  const addItem = (name: string, rowPrices: number[], assignTo: number[]) => {
    if (rowPrices.length === 0 || rowPrices.some((p) => isNaN(p) || p <= 0)) return;
    const newItems: Item[] = rowPrices.map((cost) => ({
      id: newId(),
      name: name.trim(),
      cost,
      quantity: 1,
      taxExempt: false,
    }));
    setItems((prev) => [...prev, ...newItems]);
    if (assignTo.length > 0) {
      setSplits((prev) => [
        ...prev,
        ...newItems.flatMap((item) => assignTo.map((personId) => ({ itemId: item.id, personId }))),
      ]);
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

  // The discount takes the same fraction off every item, before tax and tip,
  // so everyone saves in proportion to what they ordered and nobody goes negative.
  const discountAmount = Math.min(
    discountKind === "percent" ? allItemsCost * (discount / 100) : discount,
    allItemsCost,
  );
  const keptFraction = allItemsCost > 0 ? 1 - discountAmount / allItemsCost : 1;

  const taxBase = itemsTotal * keptFraction;
  const tipBase = allItemsCost - discountAmount;
  const taxAmount = taxBase * (tax / 100);
  const tipAmount = tipBase * (tip / 100);

  const setDiscount = (value: number, kind: DiscountKind) => {
    setDiscountValue(kind === "percent" ? Math.min(value, 100) : value);
    setDiscountKind(kind);
  };

  const personDiscountShare = (personId: number): number =>
    personSubtotal(personId) * (1 - keptFraction);

  const personTaxShare = (personId: number): number => {
    if (taxMode === "proportional") {
      return personTaxableSubtotal(personId) * keptFraction * (tax / 100);
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
    personSubtotal(personId) -
    personDiscountShare(personId) +
    personTaxShare(personId) +
    personTipShare(personId);

  const grandTotal = persons.reduce((sum, p) => sum + personTotal(p.id), 0);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const clearAll = () => {
    setPersons([]);
    setItems([]);
    setSplits([]);
    setNameSet(new Set());
    setDiscountValue(0);
    setDiscountKind("percent");
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
    discount,
    discountKind,
    setDiscount,
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
    personDiscountShare,
    personTaxShare,
    personTipShare,
    personTotal,
    grandTotal,
    itemsTotal,
    allItemsCost,
    discountAmount,
    taxBase,
    tipBase,
    taxAmount,
    tipAmount,
    clearAll,
    isLoading,
  };
}
