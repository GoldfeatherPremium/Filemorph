import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import { ProcessingError } from "./errors";

export interface RenderedPage {
  png: Buffer;
  width: number;
  height: number;
}

type AnyCanvas = { canvas: unknown; context: unknown };
type NapiCanvas = ReturnType<typeof createCanvas>;

/**
 * CanvasFactory class consumed by pdf.js (Node path). Backed by the pure
 * napi canvas implementation so no native `canvas` npm package is required.
 * Types are intentionally loose — pdf.js's DOM-oriented typings don't match
 * the napi canvas surface.
 */
export class NapiCanvasFactory {
  constructor(_opts?: { ownerDocument?: unknown; enableHWA?: boolean }) {}

  create(width: number, height: number): AnyCanvas {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    const canvas = createCanvas(w, h) as unknown as NapiCanvas;
    return { canvas, context: canvas.getContext("2d") };
  }

  reset(pair: AnyCanvas, width: number, height: number): void {
    const canvas = pair.canvas as NapiCanvas;
    canvas.width = Math.max(1, Math.floor(width));
    canvas.height = Math.max(1, Math.floor(height));
  }

  destroy(pair: AnyCanvas): void {
    try {
      const canvas = pair.canvas as NapiCanvas;
      canvas.width = 0;
      canvas.height = 0;
    } catch {
      /* ignore */
    }
    pair.canvas = null;
    pair.context = null;
  }
}

const sharedCanvasFactory = new NapiCanvasFactory();

export async function openPdf(data: Buffer): Promise<Awaited<ReturnType<typeof getDocument>["promise"]>> {
  try {
    const task = getDocument({
      data: new Uint8Array(data),
      useWorkerFetch: false,
      isEvalSupported: false,
      verbosity: 0,
      CanvasFactory: NapiCanvasFactory,
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
  const canvas = createCanvas(width, height) as unknown as NapiCanvas;
  const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
  await page.render({
    canvasContext: ctx,
    viewport,
    canvasFactory: sharedCanvasFactory,
  }).promise;
  const png = (canvas as unknown as { toBuffer: (fmt: string) => Buffer }).toBuffer("image/png");
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
