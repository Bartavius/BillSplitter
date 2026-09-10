import type { Person } from "../../types";
import { colorBg } from "../../utils/color";
import { Avatar } from "../ui/Avatar";

export function PersonSelector({
  person,
  color,
  selected,
  onToggle,
}: {
  person: Person;
  color: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 max-w-full min-h-[44px] px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-150"
      style={
        selected
          ? {
              backgroundColor: colorBg(color, 0.12),
              borderColor: color,
              color,
              boxShadow: `0 0 0 2px ${colorBg(color, 0.25)}`,
            }
          : {
              backgroundColor: colorBg(color, 0.05),
              borderColor: colorBg(color, 0.3),
              color: "inherit",
            }
      }
    >
      <Avatar name={person.name} color={color} />
      <span className="truncate">{person.name}</span>
      {selected && (
        <svg
          className="w-3.5 h-3.5 ml-0.5 opacity-70 flex-shrink-0"
          viewBox="0 0 14 11"
          fill="none"
        >
          <path
            d="M1 5.5l4 4L13 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
