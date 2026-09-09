import { Button, Card, Checkbox, Input } from "@nextui-org/react";
import { useState } from "react";
import type { Item, Person } from "../types";

interface Props {
  persons: Person[];
  items: Item[];
  addItem: (name: string, cost: number, assignTo: number[]) => void;
  removeItem: (itemId: number) => void;
  toggleTaxExempt: (itemId: number) => void;
  setItemSplit: (itemId: number, personId: number, included: boolean) => void;
  personsForItem: (itemId: number) => Person[];
}

export function ByItemInput({
  persons,
  items,
  addItem,
  removeItem,
  toggleTaxExempt,
  setItemSplit,
  personsForItem,
}: Props) {
  const [itemName, setItemName] = useState("");
  const [cost, setCost] = useState("");
  const [checkedPersonIds, setCheckedPersonIds] = useState<number[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

  const submit = () => {
    const parsed = parseFloat(cost);
    if (isNaN(parsed) || parsed <= 0 || checkedPersonIds.length === 0) return;
    addItem(itemName, parsed, checkedPersonIds);
    setItemName("");
    setCost("");
    setCheckedPersonIds([]);
  };

  return (
    <Card className="p-6 mb-6 w-full max-w-2xl dark:bg-zinc-800 dark:border dark:border-zinc-700">
      <p className="text-sm text-gray-500 mb-4 text-center">
        Enter an item and select who shares it
      </p>
      <div className="flex flex-wrap gap-3 justify-center items-end mb-5">
        <Input
          placeholder="Label (optional)"
          className="w-44"
          classNames={{ inputWrapper: "dark:bg-zinc-700" }}
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <Input
          placeholder="Cost"
          className="w-28"
          classNames={{ inputWrapper: "dark:bg-zinc-700" }}
          type="number"
          min="0"
          step="0.01"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </div>
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2 text-center">Split among:</p>
        <div className="flex flex-row flex-wrap gap-4 justify-center">
          {persons.map((p) => (
            <Checkbox
              key={p.id}
              isSelected={checkedPersonIds.includes(p.id)}
              onValueChange={(checked) =>
                setCheckedPersonIds((prev) =>
                  checked ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                )
              }
            >
              {p.name}
            </Checkbox>
          ))}
        </div>
        <div className="flex gap-3 justify-center mt-3">
          <button
            className="text-xs text-blue-500 hover:underline"
            onClick={() => setCheckedPersonIds(persons.map((p) => p.id))}
          >
            Select All
          </button>
          <span className="text-gray-300 text-xs">|</span>
          <button
            className="text-xs text-blue-500 hover:underline"
            onClick={() => setCheckedPersonIds([])}
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex justify-center mb-2">
        <Button onClick={submit} isDisabled={!cost || checkedPersonIds.length === 0}>
          Add Item
        </Button>
      </div>

      {items.length > 0 && (
        <div className="mt-5 border-t pt-4">
          <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-zinc-300">Added Items</p>
          <div className="flex flex-col gap-1">
            {items.map((item) => {
              const whoSplits = personsForItem(item.id);
              const isExpanded = expandedItemId === item.id;
              return (
                <div key={item.id}>
                  <div
                    className="flex flex-row items-center text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg px-2 py-1 group cursor-pointer"
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  >
                    <span className="flex-1 text-left text-gray-800 dark:text-zinc-200">
                      {item.name || (
                        <span className="text-gray-400 dark:text-zinc-500 italic">unlabeled</span>
                      )}
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-semibold mr-3">
                      ${item.cost.toFixed(2)}
                    </span>
                    <span className="text-gray-400 dark:text-zinc-500 text-xs mr-2 hidden sm:inline">
                      ÷ {whoSplits.map((p) => p.name).join(", ")}
                    </span>
                    <span className="text-gray-400 dark:text-zinc-500 text-xs mr-2 sm:hidden">
                      ÷ {whoSplits.length}
                    </span>
                    <button
                      title={
                        item.taxExempt ? "Tax exempt — click to remove" : "Click to mark tax exempt"
                      }
                      className={`text-xs mr-2 rounded px-1 transition-opacity ${
                        item.taxExempt
                          ? "text-blue-400 opacity-100"
                          : "text-gray-300 opacity-0 group-hover:opacity-100"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaxExempt(item.id);
                      }}
                    >
                      no tax
                    </button>
                    <button
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 text-base ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="ml-2 mb-2 pl-3 border-l-2 border-gray-100 flex flex-wrap gap-3 py-1">
                      {persons.map((p) => {
                        const inSplit = whoSplits.some((w) => w.id === p.id);
                        return (
                          <Checkbox
                            key={p.id}
                            isSelected={inSplit}
                            onValueChange={(checked) => setItemSplit(item.id, p.id, checked)}
                          >
                            {p.name}
                          </Checkbox>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
