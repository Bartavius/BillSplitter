import { TAX_PRESETS, TIP_PRESETS } from "../../constants/presets";
import type { BillStore } from "../../store/BillStore";
import { Section } from "../ui/Section";
import { TaxTipRow } from "./TaxTipRow";

export function TaxTipSection({ store }: { store: BillStore }) {
  return (
    <Section
      title="Tax & Tip"
      subtitle="Type a percent or a dollar amount — whichever the receipt shows"
    >
      <div className="px-4 sm:px-5 py-4 space-y-5">
        <TaxTipRow
          label="Tax"
          percent={store.tax}
          amount={store.taxAmount}
          base={store.itemsTotal}
          presets={TAX_PRESETS}
          mode={store.taxMode}
          onPercentChange={store.setTax}
          onModeChange={store.setTaxMode}
          hint={
            store.taxMode === "proportional"
              ? "Each person pays tax proportional to their taxable items"
              : "Tax divided equally among everyone"
          }
        />

        <div className="border-t border-zinc-100 dark:border-zinc-800" />

        <TaxTipRow
          label="Tip / Charges"
          percent={store.tip}
          amount={store.tipAmount}
          base={store.allItemsCost}
          presets={TIP_PRESETS}
          mode={store.tipMode}
          onPercentChange={store.setTip}
          onModeChange={store.setTipMode}
          hint={
            store.tipMode === "proportional"
              ? "Each person tips proportional to their subtotal"
              : "Tip divided equally among everyone"
          }
        />
      </div>
    </Section>
  );
}
