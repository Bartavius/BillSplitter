import { useEffect, useState } from "react";

// Dark is the default; the toggle only flips away from it.
export function useDarkMode(initial = true) {
  const [dark, setDark] = useState(initial);

  // Keep <html> in sync so the page background matches outside the React tree
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggle = () => setDark((d) => !d);

  return { dark, toggle };
}
