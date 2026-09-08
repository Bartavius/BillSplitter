// Shared control styling. Touch targets are 44px tall on mobile and shrink to
// the denser 36px from `sm` up; 16px text keeps iOS Safari from zooming on focus.

export const INPUT_CLASS =
  "h-11 sm:h-9 text-base sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow";

export const PRIMARY_BUTTON_CLASS =
  "h-11 sm:h-9 px-4 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0";

export const CARD_CLASS =
  "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm";

export const HINT_CLASS = "text-xs text-zinc-400 dark:text-zinc-500";
