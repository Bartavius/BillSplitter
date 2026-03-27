import { Button, Input } from "@nextui-org/react";
import { useState } from "react";

interface Props {
  addPerson: (name: string) => void;
}

export function AddPerson({ addPerson }: Props) {
  const [name, setName] = useState("");

  const submit = () => {
    addPerson(name);
    setName("");
  };

  return (
    <div className="flex flex-row gap-2 mb-6">
      <Input
        placeholder="Add a person..."
        className="w-56"
        classNames={{ inputWrapper: "dark:bg-zinc-800" }}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
      />
      <Button onClick={submit}>Add Person</Button>
    </div>
  );
}
