// Reads the text off a receipt photo in the browser — the image never leaves
// the device. tesseract.js is imported on first use so it stays out of the main
// bundle; it fetches its engine and English data from jsDelivr on the first
// scan and caches them for later ones.

import type { PSM, WorkerParams } from "tesseract.js";

// One block of text keeps each row's name and price on the same line;
// automatic layout can split a receipt's price column off on its own. Wide
// gaps are kept so the parser can tell specks around the receipt from its text.
// Exported for the OCR tests. "6" is PSM.SINGLE_BLOCK, written out so the enum
// doesn't pull tesseract.js into the main bundle.
export const OCR_PARAMS: Partial<WorkerParams> = {
  tessedit_pageseg_mode: "6" as PSM,
  preserve_interword_spaces: "1",
};

// tesseract reads best when letters are ~30px tall. Full-size phone photos
// (12MP+) are slow to OCR and gain nothing past this, while small or
// compressed ones (a shared 768×1024 photo) read far better scaled up.
const MAX_SIDE = 3000;
const MIN_SIDE = 2560;
const MAX_UPSCALE = 2.5;

function scaleFor(width: number, height: number): number {
  const side = Math.max(width, height);
  if (side > MAX_SIDE) return MAX_SIDE / side;
  if (side < MIN_SIDE) return Math.min(MAX_UPSCALE, MIN_SIDE / side);
  return 1;
}

// Grayscale, then stretch the levels so the darkest 1% of pixels go black and
// the lightest 1% white — washed-out thermal print gets real contrast
function stretchContrast(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const image = ctx.getImageData(0, 0, width, height);
  const px = image.data;
  const gray = new Uint8Array(px.length / 4);
  const histogram = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) {
    const g = Math.round(0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]);
    gray[i] = g;
    histogram[g]++;
  }
  const cutoff = gray.length * 0.01;
  let lo = 0;
  let darker = histogram[0];
  while (lo < 255 && darker < cutoff) darker += histogram[++lo];
  let hi = 255;
  let lighter = histogram[255];
  while (hi > 0 && lighter < cutoff) lighter += histogram[--hi];
  const range = Math.max(1, hi - lo);
  for (let i = 0; i < gray.length; i++) {
    const v = Math.max(0, Math.min(255, ((gray[i] - lo) * 255) / range));
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v;
  }
  ctx.putImageData(image, 0, 0);
}

async function prepare(file: File): Promise<File | HTMLCanvasElement> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = scaleFor(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    }
    bitmap.close();
    if (!ctx) return file;
    stretchContrast(ctx, canvas.width, canvas.height);
    return canvas;
  } catch {
    // Format the browser can't decode here — let tesseract try the file as-is
    return file;
  }
}

export interface OcrProgress {
  stage: "loading" | "reading";
  fraction: number; // 0–1 within the stage
}

export async function recognizeText(
  file: File,
  onProgress: (p: OcrProgress) => void,
  signal: AbortSignal,
): Promise<string> {
  const [{ createWorker }, image] = await Promise.all([import("tesseract.js"), prepare(file)]);
  signal.throwIfAborted();

  const worker = await createWorker("eng", undefined, {
    logger: (m) =>
      onProgress({
        stage: m.status === "recognizing text" ? "reading" : "loading",
        fraction: m.progress,
      }),
  });
  // Terminating the worker leaves its pending job unsettled, so a cancel has
  // to reject on its own
  const aborted = new Promise<never>((_, reject) =>
    signal.addEventListener("abort", () => reject(signal.reason), { once: true }),
  );
  try {
    signal.throwIfAborted(); // cancelled while the worker was loading
    await Promise.race([worker.setParameters(OCR_PARAMS), aborted]);
    const { data } = await Promise.race([worker.recognize(image), aborted]);
    return data.text;
  } finally {
    worker.terminate().catch(() => {});
  }
}
