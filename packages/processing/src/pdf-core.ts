import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import { ProcessingError } from "./errors";

export interface RenderedPage {
  png: Buffer;
  width: number;
  height: number;
}

type CanvasLike = { width: number; height: number; getContext: (kind: string) => unknown };
type CanvasPair = { canvas: CanvasLike & { remove?: () => void; destroy?: () => void }; context: unknown };

const canvasFactory = {
  create: (w: number, h: number): CanvasPair => {
    const c = createCanvas(w, h) as CanvasLike & { remove?: () => void; destroy?: () => void };
    // Node-canvas style hooks that pdfjs calls during cleanup.
    c.remove = () => undefined;
    c.destroy = () => undefined;
    return { canvas: c, context: c.getContext("2d") };
  },
  reset: (pair: CanvasPair, w: number, h: number) => {
    pair.canvas.width = w;
    pair.canvas.height = h;
  },
  destroy: (pair: CanvasPair) => {
    try {
      pair.canvas.remove?.();
      pair.canvas.destroy?.();
    } catch {
      /* ignore cleanup errors */
    }
  },
};

export async function openPdf(data: Buffer): Promise<Awaited<ReturnType<typeof getDocument>["promise"]>> {
  try {
    const task = getDocument({
      data: new Uint8Array(data),
      useWorkerFetch: false,
      isEvalSupported: false,
      verbosity: 0,
    });
    return await task.promise;
  } catch (e) {
    throw new ProcessingError("invalid_pdf", e instanceof Error ? e.message : "Could not open PDF");
  }
}

export async function renderPdfPage(
  pdf: Awaited<ReturnType<typeof getDocument>["promise"]>,
  pageNumber: number,
  scale = 2,
): Promise<RenderedPage> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const width = Math.max(1, Math.ceil(viewport.width));
  const height = Math.max(1, Math.ceil(viewport.height));
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport, canvasFactory }).promise;
  const png = canvas.toBuffer("image/png");
  return { png, width, height };
}

export async function extractPdfText(
  pdf: Awaited<ReturnType<typeof getDocument>["promise"]>,
): Promise<string> {
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lines: string[] = [];
    let line = "";
    let lastY: number | null = null;
    let lastX = -1000;
    for (const rawItem of content.items) {
      const item = rawItem as { str?: string; hasEOL?: boolean; transform?: number[]; width?: number };
      if (typeof item.str !== "string" || item.str.length === 0) continue;
      const x = item.transform?.[4] ?? 0;
      const y = item.transform?.[5] ?? 0;
      const gapX = x - lastX;
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        if (line.trim()) lines.push(line.trim());
        line = "";
      } else if (line && gapX > 4) {
        line += " ";
      }
      line += item.str;
      lastX = x + (item.width ?? 0);
      lastY = y;
      if (item.hasEOL) {
        if (line.trim()) lines.push(line.trim());
        line = "";
      }
    }
    if (line.trim()) lines.push(line.trim());
    pages.push(lines.join("\n"));
  }
  return pages.join("\n\n");
}
