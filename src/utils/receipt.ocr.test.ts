import { createWorker, type Worker } from "tesseract.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OCR_PARAMS } from "./ocr";
import { parseReceipt } from "./receipt";

const fixture = (name: string) => new URL(`./fixtures/${name}`, import.meta.url).pathname;

// The same English model the app downloads from jsDelivr, from node_modules so
// this runs offline
const LANG_PATH = new URL(
  "../../node_modules/@tesseract.js-data/eng/4.0.0_best_int",
  import.meta.url,
).pathname;

let worker: Worker;

beforeAll(async () => {
  worker = await createWorker("eng", undefined, {
    langPath: LANG_PATH,
    cacheMethod: "none",
    gzip: true,
  });
  await worker.setParameters(OCR_PARAMS);
}, 60_000);

afterAll(() => worker?.terminate());

const scan = async (name: string) =>
  parseReceipt((await worker.recognize(fixture(name))).data.text);

// Real receipt photos through tesseract with the app's settings. The app also
// upscales and boosts contrast first, which needs a browser canvas, so these
// read the photos as-is and check only lines that read reliably even then.
describe("scanning receipt photos", () => {
  it("reads both ramen and the subtotal off a restaurant ticket", async () => {
    const r = await scan("santouka.jpeg");
    expect(r.items.map((i) => i.total)).toEqual([22.25, 23]);
    for (const item of r.items) expect(item.name).toMatch(/ramen/i);
    expect(r.subtotal).toBe(45.25);
  });

  it("reads items and tax off a long receipt photographed at an angle", async () => {
    const r = await scan("bartaco.jpeg");
    expect(r.items).toContainEqual({ name: "chicken tinga taco", quantity: 1, total: 16.5 });
    expect(r.items.map((i) => i.total)).toEqual(expect.arrayContaining([14.8, 4.5]));
    expect(r.tax).toBe(10.4);
  });
});
