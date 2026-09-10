import "./App.css";
import { BreakdownSection } from "./components/breakdown/BreakdownSection";
import { ItemsSection } from "./components/items/ItemsSection";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { PeopleSection } from "./components/people/PeopleSection";
import { TaxTipSection } from "./components/taxtip/TaxTipSection";
import { useBillStore } from "./hooks/useBillStore";
import { useDarkMode } from "./hooks/useDarkMode";
import { useSelectedPersons } from "./hooks/useSelectedPersons";

function App() {
  const store = useBillStore();
  const { dark, toggle: toggleDark } = useDarkMode();
  const { selected, toggle, deselect, clear } = useSelectedPersons();

  const handleRemovePerson = (id: number) => {
    store.removePerson(id);
    deselect(id);
  };

  const handleClearAll = () => {
    if (!confirm("Clear all data?")) return;
    store.clearAll();
    clear();
  };

  if (store.isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
        <Header
          dark={dark}
          onToggleDark={toggleDark}
          showClear={store.persons.length > 0 || store.items.length > 0}
          onClear={handleClearAll}
        />

        <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
          <PeopleSection
            persons={store.persons}
            selectedIds={selected}
            onAdd={store.addPerson}
            onRemove={handleRemovePerson}
            onToggleSelect={toggle}
          />

          <ItemsSection store={store} selectedIds={selected} />

          {store.items.length > 0 && <TaxTipSection store={store} />}

          {store.persons.length > 0 && store.items.length > 0 && <BreakdownSection store={store} />}

          <Footer />
        </main>
      </div>
    </div>
  );
}

export default App;
