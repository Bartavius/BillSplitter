// Turns OCR text from a receipt photo into bill lines. OCR output is noisy, so
// this is deliberately forgiving: lines it can't place are dropped, and the
// user reviews the result before anything is added to the bill.

export interface ScannedItem {
  name: string;
  quantity: number;
  total: number; // line total, as receipts print it
}

export interface ScannedReceipt {
  items: ScannedItem[];
  subtotal: number | null;
  discount: number | null; // dollars off, summed across discount lines
  tax: number | null; // dollars, summed across tax lines
  tip: number | null; // dollars
  total: number | null;
}

// A price: an optional "-", "(" or "$", digits (with optional thousands
// commas), "." or "," before the cents (or ":", which OCR often reads a decimal
// point as), then an optional ")" or trailing "-"
const PRICE = /(?:^|\s)(-|\()?\s?\$?\s?(\d{1,3}(?:,\d{3})+|\d+)([.,:])(\d{2})(\))?(-)?(?=\s|$)/g;

// "7:42 PM" would otherwise read as $7.42
const AM_PM = /^\s*[ap]\.?m\b/i;

// "3 @ 0.59" or "3 x 0.59": a unit price, with the line total printed after it
const UNIT_PRICE = /(\d{1,3})\s*[@xX]\s*\$?\d+[.,]\d{2}/;

// "2 Iced Tea", "3 x Tacos", "2X Churros"
const LEADING_QTY = /^(\d{1,2})\s*(?:[xX]\s+|\s)\s*/;

// Store item codes / UPCs printed before the name, maybe after a tax flag
// ("E 1462402 HBO W/ALMNDS", "E. 1782177 KS CHKN FILL")
const ITEM_CODE = /^(?:\S{1,2}\s+){0,2}\d{4,}\s+/;

// Checked in this order, so "Total Savings" is a savings line, "Sub-Total"
// isn't a total and "Total Tax" is tax
const SAVINGS = /\b(you saved|savings|saved)\b/;
const PAYMENT =
  /\b(cash|change|tender(ed)?|visa|mastercard|amex|discover|debit|credit|payment|paid|points|auth|approval)\b/;
// Also as OCR misreads it: "subtot al", "btotal"
const SUBTOTAL = /\b(sub[\s-]?|s?u?b)tot\s?al\b/;
const TIP = /\b(tips?|gratuity|service charge|service fee)\b/;
const TAX = /\b(ta[xk]|hst|gst|pst|qst|vat)\b/; // "TAK": OCR confuses X and K
const DISCOUNT = /\b(discount|coupon|promo|off)\b/;
const TOTAL = /\b(total|balance|amount due|due)\b/;

const isSummary = (lower: string) =>
  [SAVINGS, PAYMENT, SUBTOTAL, TIP, TAX, DISCOUNT, TOTAL].some((re) => re.test(lower));

// A summary label alone on its line, with its amount on the next one
const BARE_SUMMARY =
  /^(sub[\s-]?tot\s?al|(bill )?total|(sales )?tax|tips?|gratuity|discount|balance( due)?|amount due)$/i;

const hasWords = (s: string) => /[a-z].*[a-z]/i.test(s);

const letterCount = (s: string) => s.match(/[a-z]/gi)?.length ?? 0;

// Trims OCR specks ("|.", "©", "~") off both ends, keeping a trailing "%" or ")"
function cleanName(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/^[^a-z0-9]+/i, "")
    .replace(/[^a-z0-9%)]+$/i, "");
}

// The table or tray around a receipt reads as specks, set apart from the real
// text by wide gaps ("\ 3   1 nojito"); the run with the most letters is the
// receipt's own
function mainText(label: string): string {
  const runs = label.trim().split(/\s{3,}/);
  return runs.reduce((best, run) => (letterCount(run) > letterCount(best) ? run : best));
}

function parseLine(raw: string): { label: string; cents: number } | null {
  // The last price on the line; anything after it is a tax flag ("A", "T") or
  // specks off the receipt's right edge
  const matches = [...raw.matchAll(PRICE)];
  const m = matches[matches.length - 1];
  if (!m) return null;
  const [, lead, whole, separator, fraction, closeParen, trailingMinus] = m;
  if (separator === ":" && AM_PM.test(raw.slice(m.index + m[0].length))) return null;
  const negative = lead === "-" || trailingMinus === "-" || (lead === "(" && !!closeParen);
  const cents = parseInt(whole.replace(/,/g, ""), 10) * 100 + parseInt(fraction, 10);
  return { label: raw.slice(0, m.index), cents: negative ? -cents : cents };
}

export function parseReceipt(text: string): ScannedReceipt {
  const items: ScannedItem[] = [];
  let subtotal: number | null = null;
  let discount: number | null = null;
  let tax: number | null = null;
  let tip: number | null = null;
  let total: number | null = null;
  // The last line with words but no price: a name waiting for an "N @ price"
  // line, or a summary label waiting for its amount
  let pendingName = "";
  // A total whose amount OCR couldn't read still ends the bill
  let unpricedTotal = false;

  for (const raw of text.split("\n")) {
    const parsed = parseLine(raw);
    if (!parsed) {
      const name = cleanName(mainText(raw));
      if (hasWords(name)) pendingName = name;
      const lowerLine = raw.toLowerCase();
      if (subtotal !== null && TOTAL.test(lowerLine) && !SUBTOTAL.test(lowerLine)) {
        unpricedTotal = true;
      }
      continue;
    }

    const { label, cents } = parsed;
    const namedBefore = pendingName;
    pendingName = "";
    // "Subtotal" on the line above labels this amount even when this line has
    // words of its own ("Massachusetts state and local  $45.25")
    const own = label.replace(/\s+/g, " ").trim().toLowerCase();
    const usesPending = BARE_SUMMARY.test(namedBefore) && !isSummary(own);
    const lower = usesPending ? namedBefore.toLowerCase() : own;

    // Past the total it's payment details, except a tip written in afterwards
    if (total !== null || (unpricedTotal && !usesPending)) {
      if (TIP.test(lower)) tip = (tip ?? 0) + cents;
      continue;
    }

    if (SAVINGS.test(lower) || PAYMENT.test(lower)) continue;
    if (SUBTOTAL.test(lower)) {
      subtotal = cents;
    } else if (TIP.test(lower)) {
      tip = (tip ?? 0) + cents;
    } else if (TAX.test(lower)) {
      tax = (tax ?? 0) + cents;
    } else if (cents < 0 || DISCOUNT.test(lower)) {
      discount = (discount ?? 0) + Math.abs(cents);
    } else if (TOTAL.test(lower)) {
      total = cents;
    } else if (subtotal === null) {
      // Items come before the subtotal; unknown lines after it are fees,
      // payment details or noise
      let rest = mainText(label).replace(ITEM_CODE, "");
      let quantity = 1;

      const unit = UNIT_PRICE.exec(rest);
      if (unit) {
        quantity = parseInt(unit[1], 10);
        rest = rest.replace(unit[0], "");
      } else {
        const lead = LEADING_QTY.exec(rest);
        if (lead) {
          quantity = parseInt(lead[1], 10);
          rest = rest.slice(lead[0].length);
        }
      }

      let name = cleanName(rest);
      if (!hasWords(name) && unit) name = namedBefore;
      if (!hasWords(name) || cents <= 0) continue;
      items.push({ name, quantity: Math.max(1, quantity), total: cents / 100 });
    }
  }

  const dollars = (cents: number | null) => (cents === null ? null : cents / 100);
  return {
    items,
    subtotal: dollars(subtotal),
    discount: dollars(discount),
    tax: dollars(tax),
    tip: dollars(tip),
    total: dollars(total),
  };
}
