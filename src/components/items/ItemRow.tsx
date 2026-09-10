import type { Item, Person } from "../../types";
import { fmt } from "../../utils/format";
import { Avatar } from "../ui/Avatar";

const ACTION_BUTTON =
  "w-8 h-8 sm:w-6 sm:h-6 rounded-md flex items-center justify-center transition-colors";

function rowBorder(clickable: boolean, all: boolean, some: boolean): string {
  if (!clickable) return "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900";
  if (all) return "border-zinc-400 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-800 cursor-pointer";
  const hover =
    "bg-white dark:bg-zinc-900 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60";
  return some
    ? `border-zinc-300 dark:border-zinc-600 ${hover}`
    : `border-zinc-200 dark:border-zinc-700 ${hover}`;
}

export function ItemRow({
  item,
  assignees,
  colorFor,
  clickable,
  allSelectedOn,
  someSelectedOn,
  onToggleAssignment,
  onUnlink,
  onToggleTaxExempt,
  onRemove,
}: {
  item: Item;
  assignees: Person[];
  colorFor: (personId: number) => string;
  /** True when at least one person is selected, so the row acts as a checkbox */
  clickable: boolean;
  allSelectedOn: boolean;
  someSelectedOn: boolean;
  onToggleAssignment: () => void;
  onUnlink: (personId: number) => void;
  onToggleTaxExempt: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      onClick={onToggleAssignment}
      className={`group flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 rounded-xl border transition-all duration-150 ${rowBorder(
        clickable,
        allSelectedOn,
        someSelectedOn,
      )}`}
    >
      {/* Checkbox + name: full width on mobile, shares the row from sm up */}
      <div className="flex items-center gap-3 min-w-0 basis-full sm:basis-0 sm:flex-1">
        {clickable && (
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              allSelectedOn
                ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100"
                : someSelectedOn
                  ? "border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-900"
                  : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
            }`}
          >
            {allSelectedOn && (
              <svg
                className="w-2.5 h-2.5 text-white dark:text-zinc-900"
                viewBox="0 0 10 8"
                fill="none"
              >
                <path
                  d="M1 4l3 3 5-6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {someSelectedOn && !allSelectedOn && (
              <div className="w-1.5 h-0.5 bg-zinc-400 dark:bg-zinc-500 rounded-full" />
            )}
          </div>
        )}

        {/* Name + qty + tax badge */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {item.name || "Item"}
          </span>
          {item.quantity > 1 && (
            <span className="flex-shrink-0 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded-full tabular-nums">
              ×{item.quantity} @ ${fmt(item.cost / item.quantity)}
            </span>
          )}
          {item.taxExempt && (
            <span className="flex-shrink-0 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
              no tax
            </span>
          )}
        </div>
      </div>

      {/* Assignee badges */}
      <div
        className="flex items-center gap-1 flex-wrap min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        {assignees.map((p) => (
          <button
            key={p.id}
            onClick={() => onUnlink(p.id)}
            title={`Remove ${p.name}`}
            className="hover:opacity-60 transition-opacity"
          >
            <Avatar
              name={p.name}
              color={colorFor(p.id)}
              className="w-7 h-7 sm:w-6 sm:h-6 text-[10px]"
            />
          </button>
        ))}
        {assignees.length === 0 && (
          <span className="text-xs text-zinc-300 dark:text-zinc-600 italic">unassigned</span>
        )}
      </div>

      {/* Price */}
      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums flex-shrink-0 ml-auto sm:ml-0">
        ${fmt(item.cost)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onToggleTaxExempt}
          title={item.taxExempt ? "Mark as taxable" : "Mark as tax-exempt"}
          className={`${ACTION_BUTTON} text-xs font-bold ${
            item.taxExempt
              ? "text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-700"
              : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          %
        </button>
        <button
          onClick={onRemove}
          title={`Remove ${item.name || "item"}`}
          className={`${ACTION_BUTTON} text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
