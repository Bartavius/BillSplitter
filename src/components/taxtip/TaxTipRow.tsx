import type { SplitMode } from "../../types";
import { fmt } from "../../utils/format";
import { NumericInput } from "../ui/NumericInput";
import { PercentPresets } from "../ui/PercentPresets";
import { SplitModeToggle } from "../ui/SplitModeToggle";
import { HINT_CLASS } from "../ui/styles";

// Percent and dollar amount are two views of one value — editing either updates
// the other. `base` is the total the percentage applies to.
export function TaxTipRow({
  label,
  percent,
  amount,
  base,
  presets,
  mode,
  onPercentChange,
  onModeChange,
  hint,
}: {
  label: string;
  percent: number;
  amount: number;
  base: number;
  presets: number[];
  mode: SplitMode;
  onPercentChange: (n: number) => void;
  onModeChange: (m: SplitMode) => void;
  hint: string;
}) {
  const commitDollars = (n: number) => {
    if (base > 0) onPercentChange((n / base) * 100);
    else if (n === 0) onPercentChange(0);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
        <SplitModeToggle value={mode} onChange={onModeChange} />
      </div>
      <div className="flex items-center gap-2">
        <NumericInput
          className="flex-1 min-w-0"
          ariaLabel={`${label} percent`}
          value={percent}
          onCommit={onPercentChange}
          placeholder="0"
          suffix="%"
        />
        <span className="text-zinc-300 dark:text-zinc-600 text-sm select-none flex-shrink-0">=</span>
        <NumericInput
          className="flex-1 min-w-0"
          ariaLabel={`${label} amount`}
          value={amount}
          onCommit={commitDollars}
          format={fmt}
          placeholder="0.00"
          prefix="$"
        />
      </div>
      <PercentPresets options={presets} value={percent} onSelect={onPercentChange} />
      <p className={HINT_CLASS}>{hint}</p>
    </div>
  );
}
