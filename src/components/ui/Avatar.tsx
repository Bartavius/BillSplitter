import { initials } from "../../utils/format";

export function Avatar({
  name,
  color,
  className = "w-6 h-6 text-[11px]",
  single = false,
}: {
  name: string;
  color: string;
  /** Size + text-size utilities */
  className?: string;
  /** Show only the first initial (for tight spots like chips) */
  single?: boolean;
}) {
  const label = initials(name);
  return (
    <span
      className={`rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
      style={{ backgroundColor: color }}
    >
      {single ? label[0] : label}
    </span>
  );
}
