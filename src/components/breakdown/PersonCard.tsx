import type { BillStore } from "../../store/BillStore";
import type { Person } from "../../types";
import { colorBg } from "../../utils/color";
import { fmt } from "../../utils/format";
import { Avatar } from "../ui/Avatar";

export function PersonCard({
  person,
  color,
  store,
}: {
  person: Person;
  color: string;
  store: BillStore;
}) {
  const items = store.itemsForPerson(person.id);
  const subtotal = store.personSubtotal(person.id);
  const taxShare = store.personTaxShare(person.id);
  const tipShare = store.personTipShare(person.id);
  const total = store.personTotal(person.id);
  const hasAddons = taxShare > 0 || tipShare > 0;

  return (
    <div
      className="rounded-xl border bg-white dark:bg-zinc-800/50 flex flex-col overflow-hidden min-w-0"
      style={{ borderColor: colorBg(color, 0.35) }}
    >
      {/* Colored top accent strip */}
      <div className="h-1 w-full" style={{ backgroundColor: color }} />

      {/* Header: avatar + name + total */}
      <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={person.name} color={color} className="w-7 h-7 text-[11px]" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {person.name}
          </span>
        </div>
        <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color }}>
          ${fmt(total)}
        </span>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="px-3.5 pb-2.5 space-y-1 border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
          {items.map((item) => {
            const n = store.splitsForItem(item.id).length;
            const share = n > 0 ? item.cost / n : 0;
            return (
              <div key={item.id} className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {item.name || "Item"}
                  {n > 1 && <span className="text-zinc-400 dark:text-zinc-500"> ÷{n}</span>}
                </span>
                <span className="text-xs tabular-nums text-zinc-700 dark:text-zinc-300 flex-shrink-0">
                  ${fmt(share)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {items.length === 0 && (
        <p className="px-3.5 pb-3 text-xs text-zinc-400 dark:text-zinc-500 italic">
          No items assigned
        </p>
      )}

      {/* Tax / tip footer */}
      {items.length > 0 && hasAddons && (
        <div className="px-3.5 py-2 border-t border-zinc-100 dark:border-zinc-800 space-y-0.5 mt-auto">
          <AddonRow label="Subtotal" value={`$${fmt(subtotal)}`} />
          {taxShare > 0 && <AddonRow label="Tax" value={`+$${fmt(taxShare)}`} />}
          {tipShare > 0 && <AddonRow label="Tip" value={`+$${fmt(tipShare)}`} />}
        </div>
      )}
    </div>
  );
}

function AddonRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-zinc-400 dark:text-zinc-500">{label}</span>
      <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">{value}</span>
    </div>
  );
}
