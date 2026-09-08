export function Header({
  dark,
  onToggleDark,
  showClear,
  onClear,
}: {
  dark: boolean;
  onToggleDark: () => void;
  showClear: boolean;
  onClear: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-3">
        <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
          Bill Splitter
        </span>
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          {showClear && (
            <button
              onClick={onClear}
              className="text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors px-1 py-2"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onToggleDark}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors px-1 py-2"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </div>
    </header>
  );
}
