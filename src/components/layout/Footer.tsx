export function Footer() {
  return (
    <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center pb-6">
      Maintained by{" "}
      <a
        href="https://github.com/Bartavius"
        className="hover:text-zinc-600 dark:hover:text-zinc-400 underline transition-colors"
      >
        Bartavius
      </a>
      {" · "}
      Forked from{" "}
      <a
        href="https://github.com/anish-sahoo/BillSplitter"
        className="hover:text-zinc-600 dark:hover:text-zinc-400 underline transition-colors"
      >
        Anish Sahoo
      </a>
      's original
    </p>
  );
}
