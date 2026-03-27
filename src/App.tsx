import { useState } from "react";
import "./App.css";
import { AddPerson } from "./components/AddPerson";
import { ByItemInput } from "./components/ByItemInput";
import { ModeToggle } from "./components/ModeToggle";
import { PerPersonInput } from "./components/PerPersonInput";
import { PersonCards } from "./components/PersonCards";
import { ResultsCard } from "./components/ResultsCard";
import { SimpleInput } from "./components/SimpleInput";
import { useBillStore } from "./store/useBillStore";
import type { Mode } from "./types";

function App() {
  const [mode, setMode] = useState<Mode>("simple");
  const [dark, setDark] = useState(false);

  const store = useBillStore();

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-zinc-900 transition-colors">
        <div className="flex justify-between items-center px-6 pt-4">
          {store.persons.length > 0 || store.items.length > 0 ? (
            <button
              onClick={() => { if (confirm("Clear all data?")) store.clearAll(); }}
              className="text-sm text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400"
            >
              Clear All
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={toggleDark}
            className="text-sm text-gray-400 hover:text-gray-600 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {dark ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
        <h1 className="text-center font-mono text-4xl mt-2 dark:text-white">Bill Splitter</h1>
        {store.isLoading ? (
          <p className="text-center text-gray-400 dark:text-zinc-500 mt-16 text-sm">Loading...</p>
        ) : (
        <div className="mx-6 md:mx-24 lg:mx-48 mt-8 flex flex-col items-center">

          <AddPerson addPerson={store.addPerson} />

          <PersonCards
            persons={store.persons}
            itemsForPerson={store.itemsForPerson}
            splitsForItem={store.splitsForItem}
            personSubtotal={store.personSubtotal}
            unlinkPerson={store.unlinkPerson}
            removePerson={store.removePerson}
          />

          {store.persons.length > 0 && (
            <ModeToggle mode={mode} setMode={setMode} />
          )}

          {mode === "simple" && store.persons.length > 0 && (
            <SimpleInput persons={store.persons} addItem={store.addItem} />
          )}

          {mode === "per-person" && store.persons.length > 0 && (
            <PerPersonInput persons={store.persons} addItem={store.addItem} />
          )}

          {mode === "by-item" && store.persons.length > 0 && (
            <ByItemInput
              persons={store.persons}
              items={store.items}
              addItem={store.addItem}
              removeItem={store.removeItem}
              toggleTaxExempt={store.toggleTaxExempt}
              setItemSplit={store.setItemSplit}
              personsForItem={store.personsForItem}
            />
          )}

          <ResultsCard
            persons={store.persons}
            items={store.items}
            tax={store.tax}
            setTax={store.setTax}
            fees={store.fees}
            setFees={store.setFees}
            personTotal={store.personTotal}
            personTaxableSubtotal={store.personTaxableSubtotal}
            grandTotal={store.grandTotal}
            itemsTotal={store.itemsTotal}
            itemsForPerson={store.itemsForPerson}
            splitsForItem={store.splitsForItem}
            isLoading={store.isLoading}
          />

          <p className="text-gray-400 text-xs text-center mb-8">
            Maintained by <a href="https://github.com/anish-sahoo">Anish Sahoo</a>
          </p>
        </div>
        )}
      </div>
    </div>
  );
}

export default App;
