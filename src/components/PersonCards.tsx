import { Card } from "@nextui-org/react";
import type { Item, Person, Split } from "../types";

interface Props {
  persons: Person[];
  itemsForPerson: (personId: number) => Item[];
  splitsForItem: (itemId: number) => Split[];
  personSubtotal: (personId: number) => number;
  unlinkPerson: (itemId: number, personId: number) => void;
  removePerson: (personId: number) => void;
}

export function PersonCards({
  persons,
  itemsForPerson,
  splitsForItem,
  personSubtotal,
  unlinkPerson,
  removePerson,
}: Props) {
  if (persons.length === 0) return null;

  return (
    <div className="flex flex-row flex-wrap gap-3 mb-6 justify-center w-full">
      {persons.map((person) => {
        const myItems = itemsForPerson(person.id);
        return (
          <Card
            key={person.id}
            className="px-4 py-3 min-w-[140px] dark:bg-zinc-800 dark:border dark:border-zinc-700"
          >
            <div className="flex flex-row justify-between items-center mb-1">
              <h2 className="text-base font-bold mr-3">{person.name}</h2>
              <button
                className="text-red-400 hover:text-red-600 text-lg leading-none"
                onClick={() => removePerson(person.id)}
              >
                ×
              </button>
            </div>
            {myItems.map((item) => {
              const shareCount = splitsForItem(item.id).length;
              const share = shareCount > 0 ? item.cost / shareCount : 0;
              const isShared = shareCount > 1;
              return (
                <div
                  key={item.id}
                  className="grid w-full items-center gap-x-1.5 hover:bg-red-50 rounded group"
                  style={{ gridTemplateColumns: "3.5rem 1fr auto 1rem" }}
                >
                  <span className="text-xs font-semibold text-green-600 tabular-nums text-right">
                    ${share.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400 truncate">{item.name}</span>
                  <span className={`text-xs text-gray-300 ${isShared ? "" : "invisible"}`}>
                    shared
                  </span>
                  <button
                    className="text-red-400 text-xs opacity-0 group-hover:opacity-100 text-center"
                    onClick={() => unlinkPerson(item.id, person.id)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {myItems.length > 0 && (
              <div className="mt-1 pt-1 border-t text-xs text-gray-500 text-right">
                subtotal: ${personSubtotal(person.id).toFixed(2)}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
