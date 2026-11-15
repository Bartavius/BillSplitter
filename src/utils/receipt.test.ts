import { describe, expect, it } from "vitest";
import { parseReceipt } from "./receipt";

describe("parseReceipt", () => {
  it("reads items, subtotal, tax and total from a restaurant receipt", () => {
    const r = parseReceipt(`
      THE CORNER BISTRO
      123 Main St, Boston MA
      Table 4        Server: Dana
      11/15/2026 7:42 PM

      Margherita Pizza      14.50
      Caesar Salad          9.25
      2 Iced Tea            7.00
      Tiramisu              8.00

      Subtotal             38.75
      Tax                   2.42
      Total                41.17
      VISA ****1234        41.17
    `);
    expect(r.items).toEqual([
      { name: "Margherita Pizza", quantity: 1, total: 14.5 },
      { name: "Caesar Salad", quantity: 1, total: 9.25 },
      { name: "Iced Tea", quantity: 2, total: 7 },
      { name: "Tiramisu", quantity: 1, total: 8 },
    ]);
    expect(r.subtotal).toBe(38.75);
    expect(r.tax).toBe(2.42);
    expect(r.total).toBe(41.17);
    expect(r.discount).toBeNull();
    expect(r.tip).toBeNull();
  });

  it("reads amounts printed on the line after their label", () => {
    const r = parseReceipt(`
      Ticket: T 3
      ORDER
      (R) Ramen..
      Shio / CHA                     $22.25
      (R) Ramen..
      Tan-Tan / CHA                  $23.00
      Subtotal
      Massachusetts state and local  $45.25
      Sales Tax                       $3.17
      Total
                                     $48.42
    `);
    expect(r.items).toEqual([
      { name: "Shio / CHA", quantity: 1, total: 22.25 },
      { name: "Tan-Tan / CHA", quantity: 1, total: 23 },
    ]);
    expect(r.subtotal).toBe(45.25);
    expect(r.tax).toBe(3.17);
    expect(r.total).toBe(48.42);
  });

  it("reads a warehouse receipt with item codes, tax flags and instant savings", () => {
    const r = parseReceipt(`
      2E Member 111973345946
         2031150 KS 13GL SNTD /     19.99 A
         6262016 **KS BATH**        20.99 A
      E  1462402 HBO W/ALMNDS        7.89
      TOTAL NUMBER OF ITEMS SOLD = 11
      E  9820887 KS CHS PIZZA       10.99
      E 0000394736 /1777524          2.20-
                 SUBTOTAL          269.54
                 TAX                 9.79
           **** TOTAL              279.33
      AMOUNT: $279.33
           Visa                    279.33
           CHANGE                    0.00
      A 6.25% Tax                    9.79
      TOTAL TAX                      9.79
      INSTANT SAVINGS              $ 2.20
    `);
    expect(r.items).toEqual([
      { name: "KS 13GL SNTD", quantity: 1, total: 19.99 },
      { name: "KS BATH", quantity: 1, total: 20.99 },
      { name: "HBO W/ALMNDS", quantity: 1, total: 7.89 },
      { name: "KS CHS PIZZA", quantity: 1, total: 10.99 },
    ]);
    expect(r.discount).toBe(2.2);
    expect(r.subtotal).toBe(269.54);
    expect(r.tax).toBe(9.79);
    expect(r.total).toBe(279.33);
  });

  it("reads a tip printed after the bill total", () => {
    const r = parseReceipt(`
      Oct 18,2026 07:32:41 PM
      Table: D5 - Guests: 4
      Subtotal          $67.50
      Tax                $4.73
      Bill Total        $72.23
      Tips              $12.15
      Payment Total     $84.38
      Mastercard Credit:****4199
      Trans#:b69e1279981f  $84.38
    `);
    expect(r.items).toEqual([]);
    expect(r.subtotal).toBe(67.5);
    expect(r.tax).toBe(4.73);
    expect(r.total).toBe(72.23);
    expect(r.tip).toBe(12.15);
  });

  it("handles $ signs, quantity markers and trailing tax flags", () => {
    const r = parseReceipt(`
      3 x Tacos           $12.00
      2X Churros          $6.50
      Horchata            $3.99 T
      Chips & Salsa       $4.25 F
    `);
    expect(r.items).toEqual([
      { name: "Tacos", quantity: 3, total: 12 },
      { name: "Churros", quantity: 2, total: 6.5 },
      { name: "Horchata", quantity: 1, total: 3.99 },
      { name: "Chips & Salsa", quantity: 1, total: 4.25 },
    ]);
  });

  it("joins a name-only line with an 'N @ price' line under it", () => {
    const r = parseReceipt(`
      BANANAS
      3 @ 0.59            1.77
      MILK 2%             4.29
    `);
    expect(r.items).toEqual([
      { name: "BANANAS", quantity: 3, total: 1.77 },
      { name: "MILK 2%", quantity: 1, total: 4.29 },
    ]);
  });

  it("reads an inline 'N @ price' quantity", () => {
    const r = parseReceipt("LIMES 4 @ 0.25 1.00");
    expect(r.items).toEqual([{ name: "LIMES", quantity: 4, total: 1 }]);
  });

  it("strips leading item codes", () => {
    const r = parseReceipt("0041220576463 EGGS LARGE 12CT  3.49");
    expect(r.items).toEqual([{ name: "EGGS LARGE 12CT", quantity: 1, total: 3.49 }]);
  });

  it("adds up discount lines, including negative amounts, as dollars off", () => {
    const r = parseReceipt(`
      Burger              15.00
      Fries                5.00
      Happy Hour Discount -3.00
      COUPON               2.00
      SC                   1.00-
      Subtotal            14.00
    `);
    expect(r.items.map((i) => i.name)).toEqual(["Burger", "Fries"]);
    expect(r.discount).toBe(6);
    expect(r.subtotal).toBe(14);
  });

  it("ignores savings summaries so discounts aren't counted twice", () => {
    const r = parseReceipt(`
      Soda                 2.00
      Coupon              -0.50
      Total Savings        0.50
      You saved            0.50
      Total                1.50
    `);
    expect(r.discount).toBe(0.5);
    expect(r.total).toBe(1.5);
  });

  it("sums several tax lines", () => {
    const r = parseReceipt(`
      Coffee               4.00
      State Tax            0.25
      City Tax             0.10
    `);
    expect(r.tax).toBe(0.35);
  });

  it("reads tip, gratuity and service charges", () => {
    expect(parseReceipt("Gratuity 18%   9.00").tip).toBe(9);
    expect(parseReceipt("Service Charge  4.50").tip).toBe(4.5);
    expect(parseReceipt("Tip  5.00").tip).toBe(5);
  });

  it("tells a subtotal from a total and keeps the first total", () => {
    const r = parseReceipt(`
      Pasta               20.00
      Sub-Total           20.00
      Total Tax            1.25
      TOTAL               21.25
      Balance Due         21.25
    `);
    expect(r.subtotal).toBe(20);
    expect(r.tax).toBe(1.25);
    expect(r.total).toBe(21.25);
    expect(r.items).toHaveLength(1);
  });

  it("stops reading items after the total", () => {
    const r = parseReceipt(`
      Salad               10.00
      Total               10.00
      Cash                20.00
      Change              10.00
      Loyalty Points Earned 10.00
    `);
    expect(r.items).toEqual([{ name: "Salad", quantity: 1, total: 10 }]);
  });

  it("skips payment lines that appear before the total", () => {
    const r = parseReceipt(`
      Wings               12.00
      Mastercard          12.00
      Change Due           0.00
    `);
    expect(r.items).toEqual([{ name: "Wings", quantity: 1, total: 12 }]);
  });

  it("accepts comma decimals and thousands separators", () => {
    const r = parseReceipt(`
      Wine Bottle        1,250.00
      Bread                 4,50
    `);
    expect(r.items).toEqual([
      { name: "Wine Bottle", quantity: 1, total: 1250 },
      { name: "Bread", quantity: 1, total: 4.5 },
    ]);
  });

  // Lines as tesseract actually read a photographed receipt
  it("copes with OCR noise around prices and names", () => {
    const r = parseReceipt(`
      © 123 Main St, Boston MA    1
      11/15/2026      7:42 PM
      Caesar Salad      9:25
      2 Iced Tea    7.00 |
      |. Tiramisu 8.00 ~
      Tax: 0       2.35
    `);
    expect(r.items).toEqual([
      { name: "Caesar Salad", quantity: 1, total: 9.25 },
      { name: "Iced Tea", quantity: 2, total: 7 },
      { name: "Tiramisu", quantity: 1, total: 8 },
    ]);
    expect(r.tax).toBe(2.35);
  });

  // Excerpts of tesseract's output for real receipt photos, with the table
  // and other background read as specks around the receipt
  it("skips specks left and right of the receipt", () => {
    const r = parseReceipt(`
      \\ 3   1 nojito                     A        wi
      .          \\\\ A   4 destinat ict taco - pork arabes   $17.00        LA
      i&     1 bala fish taco                 $9.15      0)
      7,          WN   1 red chorizo taco            $2.95   ACN
      subtot al                                       $148.55               \\           ¥ \\            p
      Tax                         $10.40         VARS
    `);
    expect(r.items).toEqual([
      { name: "destinat ict taco - pork arabes", quantity: 4, total: 17 },
      { name: "bala fish taco", quantity: 1, total: 9.15 },
      { name: "red chorizo taco", quantity: 1, total: 2.95 },
    ]);
    expect(r.subtotal).toBe(148.55);
    expect(r.tax).toBe(10.4);
  });

  it("reads a misread tax line and ignores the payment block after an unreadable total", () => {
    const r = parseReceipt(`
      E = 1777524 VEGGIE ROLLS     9.49
      E. 1782177 KS CHKN FILL     13.49
      E 0000394736 /1777524        2.20-
      SUBTOTAL           269.54
      :                    TAK                9.79
      &                      sex TOTAL
               Visa              279.33
      N    wn          CHANGE              0.00
      ;            A 6.254 Tax               3:19
    `);
    expect(r.items).toEqual([
      { name: "VEGGIE ROLLS", quantity: 1, total: 9.49 },
      { name: "KS CHKN FILL", quantity: 1, total: 13.49 },
    ]);
    expect(r.subtotal).toBe(269.54);
    expect(r.tax).toBe(9.79);
    expect(r.total).toBeNull();
  });

  it("reads no items after the subtotal", () => {
    const r = parseReceipt(`
      Ramen                  $22.25
      Subtotal     i       ig              $45.25
      | ie        Massachusetts state and local                 $3.17
    `);
    expect(r.items).toEqual([{ name: "Ramen", quantity: 1, total: 22.25 }]);
    expect(r.subtotal).toBe(45.25);
  });

  it("doesn't read a time of day as a price", () => {
    expect(parseReceipt("Pickup time 7:42 PM").items).toEqual([]);
  });

  it("ignores lines with no price or no words", () => {
    const r = parseReceipt(`
      Thank you for dining with us!
      Order #4821
      12.50
      ** 3.00
      Nachos               9.00
    `);
    expect(r.items).toEqual([{ name: "Nachos", quantity: 1, total: 9 }]);
  });

  it("drops zero-priced items such as free modifiers", () => {
    const r = parseReceipt(`
      Burger              12.00
      No Onions            0.00
    `);
    expect(r.items).toEqual([{ name: "Burger", quantity: 1, total: 12 }]);
  });

  it("returns an empty receipt for empty text", () => {
    expect(parseReceipt("")).toEqual({
      items: [],
      subtotal: null,
      discount: null,
      tax: null,
      tip: null,
      total: null,
    });
  });
});
