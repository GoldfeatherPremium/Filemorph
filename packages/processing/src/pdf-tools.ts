import { PDFDocument, degrees, rgb } from "pdf-lib";
import sharp from "sharp";
import { ProcessingError } from "./errors";
import type { ProcessContext, ProcessOutputFile } from "./types";
import { openPdf, renderPdfPage, extractPdfText } from "./pdf-core";
import {
  baseNameWithExt,
  clampInt,
  parsePageRanges,
  safeBaseName,
  withProgress,
} from "./utils";
import { zipFromOutputs } from "./zip";

// ---------------------------------------------------------------------------
// Merge PDF
// ---------------------------------------------------------------------------
export async function mergePdf(ctx: ProcessContext): Promise<ProcessOutputFile[]> {
  if (ctx.files.length < 2) {
    throw new ProcessingError("need_at_least_two", "Upload at least two PDFs to merge.");
  }
  return withProgress(ctx, "Merging", 0, 100, async () => {
    const out = await PDFDocument.create();
    for (let i = 0; i < ctx.files.length; i++) {
      const src = await PDFDocument.load(ctx.files[i].data, { ignoreEncryption: true });
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
      ctx.onProgress?.(Math.round(((i + 1) / ctx.files.length) * 100), "Merging");
    }
    const bytes = await out.save({ useObjectStreams: true });
    return [{ name: "merged.pdf", contentType: "application/pdf", data: Buffer.from(bytes) }];
  });
}

// ---------------------------------------------------------------------------
// Split PDF
// ---------------------------------------------------------------------------
export async function splitPdf(ctx: ProcessContext): Promise<ProcessOutputFile[]> {
  const file = ctx.files[0];
  const src = await PDFDocument.load(file.data, { ignoreEncryption: true });
  const pageCount = src.getPageCount();
  const mode = ctx.settings.mode === "all" ? "all" : "ranges";
  const ranges = mode === "all" ? Array.from({ length: pageCount }, (_, i) => [i + 1]) : parsePageRanges(String(ctx.settings.ranges ?? ""), pageCount);
  if (!ranges.length) throw new ProcessingError("no_ranges", "Enter at least one page range.");

  const outputs: ProcessOutputFile[] = [];
  for (let r = 0; r < ranges.length; r++) {
    const pages = ranges[r];
    if (!pages.length) continue;
    const doc = await PDFDocument.create();
    const copied = await doc.copyPages(src, pages.map((p) => p - 1));
    copied.forEach((p) => doc.addPage(p));
    const bytes = await doc.save({ useObjectStreams: true });
    outputs.push({
      name: `part-${String(r + 1).padStart(2, "0")}.pdf`,
      contentType: "application/pdf",
      data: Buffer.from(bytes),
    });
    ctx.onProgress?.(Math.round(((r + 1) / ranges.length) * 100), "Splitting");
  }
  return outputs;
}

// ---------------------------------------------------------------------------
// Compress PDF (raster re-encode, honest before/after reporting)
// ---------------------------------------------------------------------------
const PRESETS: Record<string, { scale: number; quality: number }> = {
  low: { scale: 2.0, quality: 85 },
  balanced: { scale: 1.5, quality: 75 },
  high: { scale: 1.2, quality: 60 },
};

export async function compressPdf(ctx: ProcessContext): Promise<ProcessOutputFile[]> {
  const file = ctx.files[0];
  const preset = PRESETS[String(ctx.settings.preset)] ?? PRESETS.balanced;
  const pdf = await openPdf(file.data);
  const out = await PDFDocument.create();
  let lastSize = { width: 0, height: 0 };

  for (let i = 1; i <= pdf.numPages; i++) {
    const rendered = await renderPdfPage(pdf, i, preset.scale);
    const jpeg = await sharp(rendered.png).jpeg({ quality: preset.quality, mozjpeg: true }).toBuffer();
    const img = await out.embedJpg(jpeg);
    const page = out.addPage([rendered.width / preset.scale, rendered.height / preset.scale]);
    page.drawImage(img, {
      x: 0,
      y: 0,
      width: rendered.width / preset.scale,
      height: rendered.height / preset.scale,
    });
    lastSize = { width: rendered.width, height: rendered.height };
    ctx.onProgress?.(Math.round((i / pdf.numPages) * 100), "Compressing");
  }
  await pdf.destroy();
  const bytes = await out.save({ useObjectStreams: true });
  return [
    {
      name: baseNameWithExt(file.name, "pdf"),
      contentType: "application/pdf",
      data: Buffer.from(bytes),
      width: lastSize.width,
      height: lastSize.height,
    },
  ];
}

// ---------------------------------------------------------------------------
// PDF -> JPG
// ---------------------------------------------------------------------------
export async function pdfToJpg(ctx: ProcessContext): Promise<ProcessOutputFile[]> {
  const file = ctx.files[0];
  const quality = clampInt(ctx.settings.quality, 20, 100, 85);
  const pdf = await openPdf(file.data);
  const outputs: ProcessOutputFile[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const rendered = await renderPdfPage(pdf, i, 2);
    const jpeg = await sharp(rendered.png).jpeg({ quality, mozjpeg: true }).toBuffer();
    outputs.push({
      name: `page-${String(i).padStart(3, "0")}.jpg`,
      contentType: "image/jpeg",
      data: jpeg,
      width: rendered.width,
      height: rendered.height,
      page: i,
    });
    ctx.onProgress?.(Math.round((i / pdf.numPages) * 100), "Rendering pages");
  }
  await pdf.destroy();
  if (outputs.length === 1) return outputs;
  const wantZip = ctx.settings.output !== "individual";
  if (wantZip) {
    const zip = await zipFromOutputs(outputs, "page-");
    return [{ name: baseNameWithExt(file.name, "zip"), contentType: "application/zip", data: zip }];
  }
  return outputs;
}

// ---------------------------------------------------------------------------
// JPG -> PDF
// ---------------------------------------------------------------------------
const PAGE_SIZE: Record<string, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

export async function jpgToPdf(ctx: ProcessContext): Promise<ProcessOutputFile[]> {
  const pageSizeKey = String(ctx.settings.pageSize ?? "a4");
  const orientation = String(ctx.settings.orientation ?? "portrait");
  const marginPx = clampInt(ctx.settings.margin, 0, 120, 0);
  const marginPt = (marginPx * 72) / 96;

  const out = await PDFDocument.create();
  for (let i = 0; i < ctx.files.length; i++) {
    const f = ctx.files[i];
    const img = sharp(f.data).rotate();
    const meta = await img.metadata();
    const w = meta.width ?? 1;
    const h = meta.height ?? 1;
    const jpeg = await img.jpeg({ quality: 92 }).toBuffer();

    let pageW: number;
    let pageH: number;
    if (pageSizeKey === "fit") {
      pageW = (w * 72) / 96 + marginPt * 2;
      pageH = (h * 72) / 96 + marginPt * 2;
    } else {
      const base = PAGE_SIZE[pageSizeKey] ?? PAGE_SIZE.a4;
      pageW = base.width;
      pageH = base.height;
      if (orientation === "landscape" && pageW < pageH) {
        [pageW, pageH] = [pageH, pageW];
      }
    }

    const page = out.addPage([pageW, pageH]);
    const availW = pageW - marginPt * 2;
    const availH = pageH - marginPt * 2;
    const scale = Math.min(availW / w, availH / h);
    const drawW = w * scale;
    const drawH = h * scale;
    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;
    const imgObj = await out.embedJpg(jpeg);
    page.drawImage(imgObj, { x, y, width: drawW, height: drawH });
    ctx.onProgress?.(Math.round(((i + 1) / ctx.files.length) * 100), "Building PDF");
  }
  const bytes = await out.save({ useObjectStreams: true });
  return [
    {
      name: "images.pdf",
      contentType: "application/pdf",
      data: Buffer.from(bytes),
    },
  ];
}

// ---------------------------------------------------------------------------
// Rotate PDF
// ---------------------------------------------------------------------------
export async function rotatePdf(ctx: ProcessContext): Promise<ProcessOutputFile[]> {
  const file = ctx.files[0];
  const rotation = Number(ctx.settings.rotation ?? 90);
  if (![90, 180, 270].includes(rotation)) throw new ProcessingError("invalid_rotation", "Rotation must be 90, 180 or 270 degrees.");
  const src = await PDFDocument.load(file.data, { ignoreEncryption: true });
  const pageCount = src.getPageCount();
  const pagesSetting = String(ctx.settings.pages ?? "all");
  let targets: number[] = [];
  if (pagesSetting === "range") {
    targets = parsePageRanges(String(ctx.settings.pageRange ?? ""), pageCount).flat();
  } else {
    targets = Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  if (!targets.length) throw new ProcessingError("no_pages", "No pages selected to rotate.");
  for (const p of targets) {
    src.getPage(p - 1).setRotation(degrees(rotation));
  }
  const bytes = await src.save({ useObjectStreams: true });
  return [
    {
      name: baseNameWithExt(file.name, "pdf"),
      contentType: "application/pdf",
      data: Buffer.from(bytes),
    },
  ];
}

// ---------------------------------------------------------------------------
// Organize PDF (reorder / delete from thumbnails)
// ---------------------------------------------------------------------------
export async function organizePdf(ctx: ProcessContext): Promise<ProcessOutputFile[]> {
  const file = ctx.files[0];
  const src = await PDFDocument.load(file.data, { ignoreEncryption: true });
  const pageCount = src.getPageCount();

  let order: number[] = [];
  const orderSetting = ctx.settings.order;
  if (Array.isArray(orderSetting) && orderSetting.length) {
    order = orderSetting
      .map((p) => Number(p))
      .filter((p) => Number.isInteger(p) && p >= 1 && p <= pageCount);
  } else {
    const deleteSetting = ctx.settings.deletePages;
    const toDelete = new Set(
      Array.isArray(deleteSetting) ? deleteSetting.map((p) => Number(p)).filter((p) => Number.isInteger(p)) : [],
    );
    order = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => !toDelete.has(p));
  }
  if (!order.length) throw new ProcessingError("all_pages_deleted", "Every page was deleted — nothing left to save.");

  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, order.map((p) => p - 1));
  copied.forEach((p) => out.addPage(p));
  const bytes = await out.save({ useObjectStreams: true });
  return [
    {
      name: baseNameWithExt(file.name, "pdf"),
      contentType: "application/pdf",
      data: Buffer.from(bytes),
    },
  ];
}

// ---------------------------------------------------------------------------
// PDF -> Text
// ---------------------------------------------------------------------------
export async function pdfToText(ctx: ProcessContext): Promise<ProcessOutputFile[]> {
  const file = ctx.files[0];
  const pdf = await openPdf(file.data);
  const text = await extractPdfText(pdf);
  await pdf.destroy();
  return [
    {
      name: baseNameWithExt(file.name, "txt"),
      contentType: "text/plain",
      data: Buffer.from(text, "utf8"),
    },
  ];
}

// ---------------------------------------------------------------------------
// Showcase helper for page thumbnail generation (used by app previews)
// ---------------------------------------------------------------------------
export async function renderPdfThumbnail(data: Buffer, pageNumber = 1, width = 640): Promise<Buffer> {
  const pdf = await openPdf(data);
  const page = await pdf.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const scale = width / base.width;
  const rendered = await renderPdfPage(pdf, pageNumber, scale);
  await pdf.destroy();
  return rendered.png;
}

export { rgb as _pdfRgb };
