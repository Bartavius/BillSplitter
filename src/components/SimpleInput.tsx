import { Button, Card, Input } from "@nextui-org/react";
import { useState } from "react";
import type { Person } from "../types";

interface Props {
  persons: Person[];
  addItem: (name: string, cost: number, assignTo: number[]) => void;
}

export function SimpleInput({ persons, addItem }: Props) {
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [cost, setCost] = useState("");

  const submit = () => {
    if (selectedPersonId == null) return;
    const parsed = parseFloat(cost);
    if (isNaN(parsed) || parsed <= 0) return;
    addItem("", parsed, [selectedPersonId]);
    setCost("");
  };

  return (
    <Card className="p-6 mb-6 w-full max-w-2xl dark:bg-zinc-800 dark:border dark:border-zinc-700">
      <div className="flex flex-wrap gap-3 justify-center items-end">
        <select
          className="border border-gray-200 dark:border-zinc-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-500"
          value={selectedPersonId ?? ""}
          onChange={(e) => setSelectedPersonId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Select person…</option>
          {persons.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Input
          placeholder="Price"
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
        <Button onClick={submit} isDisabled={selectedPersonId == null || !cost}>
          Add Price
        </Button>
      </div>
    </Card>
  );
}
