import { Button, Card, Input } from "@nextui-org/react";
import { useEffect, useState } from "react";
import type { BillStore } from "../store/BillStore";
import { buildTextLines, saveAsImage } from "../utils/export";

type Props = Pick<
  BillStore,
  | "persons"
  | "items"
  | "tax"
  | "setTax"
  | "personTotal"
  | "personTaxableSubtotal"
  | "grandTotal"
  | "itemsTotal"
  | "itemsForPerson"
  | "splitsForItem"
  | "isLoading"
>;

export function ResultsCard(props: Props) {
  const { persons, setTax, personTotal, grandTotal, itemsTotal } = props;

  const [taxPctStr, setTaxPctStr] = useState("");
  const [taxAmtStr, setTaxAmtStr] = useState("");
  const [exportDetailed, setExportDetailed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Populate display strings once persisted data finishes loading
  useEffect(() => {
    if (props.isLoading) return;
    if (props.tax > 0) {
      setTaxPctStr(props.tax % 1 === 0 ? props.tax.toFixed(0) : props.tax.toFixed(2));
      setTaxAmtStr(props.itemsTotal > 0 ? (props.itemsTotal * props.tax / 100).toFixed(2) : "");
    }
  }, [props.isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportData = {
    persons: props.persons,
    items: props.items,
    tax: props.tax,
    fees: 0,
    grandTotal: props.grandTotal,
    itemsTotal: props.itemsTotal,
    personTotal: props.personTotal,
    personTaxableSubtotal: props.personTaxableSubtotal,
    itemsForPerson: props.itemsForPerson,
    splitsForItem: props.splitsForItem,
  };

  const copyAsText = () => {
    const lines = buildTextLines(exportData, exportDetailed);
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSaveAsImage = () => saveAsImage(exportData, exportDetailed);

  return (
    <Card className="p-8 mb-8 w-full max-w-2xl dark:bg-zinc-800 dark:border dark:border-zinc-700">
      <div className="flex flex-col sm:flex-row gap-6 mb-6 justify-center">
        {/* Tax — % and $ linked */}
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">Tax</p>
          <div className="flex flex-row gap-2">
            <Input
              placeholder="%"
              className="w-24"
              classNames={{ inputWrapper: "dark:bg-zinc-700" }}
              type="number"
              min="0"
              step="0.1"
              value={taxPctStr}
              onChange={(e) => {
                const pct = parseFloat(e.target.value) || 0;
                setTaxPctStr(e.target.value);
                setTax(pct);
                setTaxAmtStr(itemsTotal > 0 ? (itemsTotal * pct / 100).toFixed(2) : "");
              }}
            />
            <Input
              placeholder="$"
              className="w-24"
              classNames={{ inputWrapper: "dark:bg-zinc-700" }}
              type="number"
              min="0"
              step="0.01"
              value={taxAmtStr}
              onChange={(e) => {
                const amt = parseFloat(e.target.value) || 0;
                setTaxAmtStr(e.target.value);
                const pct = itemsTotal > 0 ? (amt / itemsTotal) * 100 : 0;
                setTax(pct);
                setTaxPctStr(itemsTotal > 0 ? pct.toFixed(2) : "");
              }}
            />
          </div>
        </div>

      </div>

      {persons.length > 0 ? (
        <>
          <div className="flex flex-row flex-wrap justify-center gap-3 mb-4">
            {persons.map((p) => (
              <Card key={p.id} className="px-5 py-3 min-w-[120px] text-center dark:bg-zinc-700 dark:border dark:border-zinc-600">
                <p className="font-semibold text-sm text-gray-700 dark:text-zinc-200">{p.name}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  ${personTotal(p.id).toFixed(2)}
                </p>
              </Card>
            ))}
          </div>
          <p className="text-center text-gray-500 dark:text-zinc-400 text-sm mb-5">
            Grand Total:{" "}
            <span className="font-bold text-gray-900 dark:text-zinc-100">${grandTotal.toFixed(2)}</span>
          </p>
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-row border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden text-xs">
              <button
                className={`px-3 py-1 transition-colors ${!exportDetailed ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-white text-gray-500 hover:bg-gray-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"}`}
                onClick={() => setExportDetailed(false)}
              >
                Simple
              </button>
              <button
                className={`px-3 py-1 transition-colors ${exportDetailed ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-white text-gray-500 hover:bg-gray-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"}`}
                onClick={() => setExportDetailed(true)}
              >
                Detailed
              </button>
            </div>
            <div className="flex flex-row gap-3">
              <Button size="sm" variant="bordered" onClick={copyAsText}>
                {copied ? "✓ Copied!" : "Copy as Text"}
              </Button>
              <Button size="sm" variant="bordered" onClick={handleSaveAsImage}>
                Save as Image
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-400 text-sm">
          Add people above to get started.
        </p>
      )}
    </Card>
  );
}
