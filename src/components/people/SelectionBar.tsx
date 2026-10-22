import type { Person } from "../../types";
import { useTypingOnTouch } from "../../hooks/useTypingOnTouch";
import { personColor } from "../../utils/color";
import { HINT_CLASS } from "../ui/styles";
import { PersonSelector } from "./PersonSelector";

// Who the next row taps assign to. Sticks to the bottom of the screen while the
// items list is in view (thumb reach, and it doesn't stack under the sticky
// header), then settles at the end of the list once you scroll past it.
export function SelectionBar({
  persons,
  selectedIds,
  onToggle,
  onClear,
}: {
  persons: Person[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onClear: () => void;
}) {
  // Android shrinks the viewport for the keyboard, which would leave the bar
  // sitting on top of it and eating what little room is left.
  const typing = useTypingOnTouch();
  if (persons.length === 0 || typing) return null;

  const status =
    selectedIds.size === 0
      ? "Pick who to assign, then tap their items"
      : `Tapping rows assigns to ${
          selectedIds.size === 1
            ? persons.find((p) => selectedIds.has(p.id))?.name
            : `${selectedIds.size} people`
        }`;

  return (
    // Offset with `bottom` rather than padding so that once the bar settles under
    // the list, the gap to the next card is the usual space-y-4, not 16px + padding.
    <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 mt-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-lg">
      {/* One line however many people there are — scrolls sideways instead of
          wrapping. The edges fade so a half-visible person reads as "scroll for
          more" rather than as content cut off by the border. */}
      <div className="flex gap-2 overflow-x-auto px-3 pt-3 pb-2 [scrollbar-width:thin] [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-32px),transparent)]">
        {persons.map((p, i) => (
          <PersonSelector
            key={p.id}
            person={p}
            color={personColor(i)}
            selected={selectedIds.has(p.id)}
            onToggle={() => onToggle(p.id)}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 px-4 pb-2.5 min-h-[28px]">
        <p className={`${HINT_CLASS} truncate`}>{status}</p>
        {selectedIds.size > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 flex-shrink-0 px-2 py-1 -my-1 -mr-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
