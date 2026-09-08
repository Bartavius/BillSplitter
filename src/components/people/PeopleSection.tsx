import { useState } from "react";
import type { Person } from "../../types";
import { personColor } from "../../utils/color";
import { Section } from "../ui/Section";
import { HINT_CLASS, INPUT_CLASS, PRIMARY_BUTTON_CLASS } from "../ui/styles";
import { PersonChip } from "./PersonChip";
import { PersonSelector } from "./PersonSelector";

export function PeopleSection({
  persons,
  selectedIds,
  onAdd,
  onRemove,
  onToggleSelect,
}: {
  persons: Person[];
  selectedIds: Set<number>;
  onAdd: (name: string) => void;
  onRemove: (id: number) => void;
  onToggleSelect: (id: number) => void;
}) {
  const [name, setName] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name);
    setName("");
  };

  return (
    <Section title="People" subtitle="Add everyone at the table">
      <div className="px-4 sm:px-5 py-4 space-y-4">
        {/* Add person */}
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Name…"
            autoComplete="off"
            className={`flex-1 min-w-0 px-3 ${INPUT_CLASS}`}
          />
          <button onClick={submit} disabled={!name.trim()} className={PRIMARY_BUTTON_CLASS}>
            Add
          </button>
        </div>

        {/* Person chips (for removal) */}
        {persons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {persons.map((p, i) => (
              <PersonChip
                key={p.id}
                person={p}
                color={personColor(i)}
                onRemove={() => onRemove(p.id)}
              />
            ))}
          </div>
        )}

        {/* Person selectors for item assignment */}
        {persons.length > 0 && (
          <div className="pt-1">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Select people to assign items:
            </p>
            <div className="flex flex-wrap gap-2">
              {persons.map((p, i) => (
                <PersonSelector
                  key={p.id}
                  person={p}
                  color={personColor(i)}
                  selected={selectedIds.has(p.id)}
                  onToggle={() => onToggleSelect(p.id)}
                />
              ))}
            </div>
            {selectedIds.size > 0 && (
              <p className={`${HINT_CLASS} mt-2`}>
                Tap items below to toggle assignment for{" "}
                {selectedIds.size === 1
                  ? persons.find((p) => selectedIds.has(p.id))?.name
                  : `${selectedIds.size} people`}
              </p>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}
