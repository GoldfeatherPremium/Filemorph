import path from "node:path";
import { ProcessingError } from "./errors";
import { TOOL_BY_CODE } from "@filemorph/shared";

/** Strip extension and dangerous chars from a client-supplied filename. */
export function safeBaseName(filename: string): string {
  const base = path.basename(filename).replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/[^\w\- ]+/g, "").trim().slice(0, 80);
  return cleaned || "file";
}

export function extensionOf(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(".", "");
  return ext || "bin";
}

export function detectMime(data: Buffer): string | null {
  if (!data || data.length === 0) return null;
  if (data.length >= 5 && data.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff)
    return "image/jpeg";
  if (
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a
  )
    return "image/png";
  if (
    data.length >= 12 &&
    data.subarray(0, 4).toString("latin1") === "RIFF" &&
    data.subarray(8, 12).toString("latin1") === "WEBP"
  )
    return "image/webp";
  if (data.length >= 12 && data.subarray(4, 8).toString("latin1") === "ftyp") {
    const brand = data.subarray(8, 12).toString("latin1");
    if (brand.startsWith("heic") || brand.startsWith("heix") || brand.startsWith("hevc") || brand.startsWith("mif1"))
      return "image/heic";
  }
  return null;
}

export function assertAcceptedMime(toolCode: string, data: Buffer, claimedType: string): void {
  const tool = TOOL_BY_CODE[toolCode];
  const detected = detectMime(data);
  const candidates = [detected, claimedType.toLowerCase()].filter(Boolean) as string[];
  const accepts = tool.accepts;
  const ok = candidates.some((m) => accepts.some((a) => a === m || (a.endsWith("/*") && m.startsWith(a.slice(0, -1)))));
  if (!ok || !detected) {
    throw new ProcessingError("invalid_file_type", `File type not accepted by ${tool.name}. Accepted: ${accepts.join(", ")}`);
  }
}

export function assertMaxSize(sizeBytes: number, maxBytes: number): void {
  if (sizeBytes > maxBytes) {
    throw new ProcessingError("file_too_large", `File exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit for this plan.`);
  }
}

export function parsePageRanges(input: string, pageCount: number): number[][] {
  const ranges: number[][] = [];
  if (!input || !input.trim()) return [];
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new ProcessingError("invalid_page_range", `Invalid page range: "${part}"`);
    const start = Number(m[1]);
    const end = m[2] ? Number(m[2]) : start;
    if (start < 1 || end < start) throw new ProcessingError("invalid_page_range", `Invalid page range: "${part}"`);
    const pages: number[] = [];
    for (let p = start; p <= Math.min(end, pageCount); p++) pages.push(p);
    if (pages.length) ranges.push(pages);
  }
  return ranges;
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function parseHexColor(value: unknown): string {
  if (typeof value !== "string") return "#ffffff";
  const v = value.replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(v)) return `#${v.split("").map((c) => c + c).join("")}`;
  if (/^[0-9a-f]{6}$/.test(v)) return `#${v}`;
  return "#ffffff";
}

export async function withProgress<P>(ctx: ProcessContext, stage: string, startPct: number, endPct: number, fn: () => Promise<P>): Promise<P> {
  ctx.onProgress?.(startPct, stage);
  try {
    const out = await fn();
    ctx.onProgress?.(endPct, stage);
    return out;
  } catch (e) {
    ctx.onProgress?.(endPct, stage);
    throw e;
  }
}

export function baseNameWithExt(filename: string, newExt: string): string {
  return `${safeBaseName(filename)}.${newExt.replace(/^\./, "")}`;
}
