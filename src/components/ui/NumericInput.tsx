import { useState } from "react";
import { parseAmount, sanitizeDecimal } from "../../utils/numeric";
import { trim } from "../../utils/format";

// Text input over a numeric store value. While focused it shows exactly what
// was typed (the draft); once blurred it falls back to the formatted value, so
// re-formatting never yanks the caret around mid-keystroke.
export function NumericInput({
  value,
  onCommit,
  format = trim,
  placeholder,
  prefix,
  suffix,
  ariaLabel,
  className = "",
}: {
  value: number;
  onCommit: (n: number) => void;
  /** How the committed value renders when the field isn't being edited */
  format?: (n: number) => string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value ? format(value) : "");

  const handleChange = (raw: string) => {
    const clean = sanitizeDecimal(raw);
    setDraft(clean);
    onCommit(parseAmount(clean));
  };

  return (
    <div className={`relative ${className}`}>
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-base sm:text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={ariaLabel}
        value={shown}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={(e) => {
          setDraft(e.target.value);
          e.target.select();
        }}
        onBlur={() => setDraft(null)}
        placeholder={placeholder}
        className={`w-full h-11 sm:h-9 text-base sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow tabular-nums ${
          prefix ? "pl-7" : "pl-3"
        } ${suffix ? "pr-8" : "pr-3"}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-base sm:text-sm pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
