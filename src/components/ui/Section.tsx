import type { ReactNode } from "react";
import { CARD_CLASS } from "./styles";

// Card with a titled header. Children supply their own padding so sections can
// run edge-to-edge content (grids, footers) when they need to.
export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className={CARD_CLASS}>
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
