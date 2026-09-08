import type { Person } from "../../types";
import { colorBg } from "../../utils/color";
import { Avatar } from "../ui/Avatar";

export function PersonChip({
  person,
  color,
  onRemove,
}: {
  person: Person;
  color: string;
  onRemove: () => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-full text-xs font-medium max-w-full"
      style={{ backgroundColor: colorBg(color, 0.1), color }}
    >
      <Avatar name={person.name} color={color} className="w-4 h-4 text-[9px]" single />
      <span className="truncate">{person.name}</span>
      <button
        onClick={onRemove}
        title={`Remove ${person.name}`}
        className="ml-0.5 w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
      >
        <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
          <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}
