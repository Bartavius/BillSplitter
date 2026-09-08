import type { BillStore } from "../../store/BillStore";
import { personColor } from "../../utils/color";
import { fmt } from "../../utils/format";
import { Section } from "../ui/Section";
import { AddItemForm } from "./AddItemForm";
import { ItemRow } from "./ItemRow";

export function ItemsSection({
  store,
  selectedIds,
}: {
  store: BillStore;
  selectedIds: Set<number>;
}) {
  const colorFor = (personId: number) =>
    personColor(store.persons.findIndex((p) => p.id === personId));

  const handleAdd = (name: string, unitPrice: number, quantity: number) =>
    store.addItem(name, unitPrice, [...selectedIds], quantity);

  // Clicking a row assigns every selected person, or clears them all if they're
  // already on the item.
  const handleToggleAssignment = (itemId: number) => {
    if (selectedIds.size === 0) return;
    const assigned = new Set(store.personsForItem(itemId).map((p) => p.id));
    const allOn = [...selectedIds].every((id) => assigned.has(id));
    for (const personId of selectedIds) store.setItemSplit(itemId, personId, !allOn);
  };

  return (
    <Section title="Bill Items" subtitle="Enter each item, then tap who ordered it">
      <div className="px-4 sm:px-5 py-4 space-y-3">
        <AddItemForm onAdd={handleAdd} />

        {store.items.length > 0 && (
          <div className="space-y-1.5">
            {store.items.map((item) => {
              const assignees = store.personsForItem(item.id);
              const assigned = new Set(assignees.map((p) => p.id));
              const clickable = selectedIds.size > 0;
              return (
                <ItemRow
                  key={item.id}
                  item={item}
                  assignees={assignees}
                  colorFor={colorFor}
                  clickable={clickable}
                  allSelectedOn={clickable && [...selectedIds].every((id) => assigned.has(id))}
                  someSelectedOn={clickable && [...selectedIds].some((id) => assigned.has(id))}
                  onToggleAssignment={() => handleToggleAssignment(item.id)}
                  onUnlink={(personId) => store.unlinkPerson(item.id, personId)}
                  onToggleTaxExempt={() => store.toggleTaxExempt(item.id)}
                  onRemove={() => store.removeItem(item.id)}
                />
              );
            })}

            {/* Subtotal row */}
            <div className="flex justify-between items-center px-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Subtotal</span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                ${fmt(store.allItemsCost)}
              </span>
            </div>
          </div>
        )}

        {store.items.length === 0 && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6">
            No items yet — add the first line from your bill
          </p>
        )}
      </div>
    </Section>
  );
}
