import sharp from "sharp";
import { ProcessingError } from "./errors";
import type { ProcessContext, ProcessOutputFile } from "./types";
import { baseNameWithExt, clampInt, parseHexColor } from "./utils";

const PRESETS: Record<string, { width: number; height: number }> = {
  "ig-square": { width: 1080, height: 1080 },
  "ig-portrait": { width: 1080, height: 1350 },
  "tw-card": { width: 1200, height: 675 },
  og: { width: 1200, height: 630 },
  hd: { width: 1920, height: 1080 },
};

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

// ---------------------------------------------------------------------------
// Image Compressor
// ---------------------------------------------------------------------------
export async function imageCompressor(ctx: ProcessContext): Promise<ProcessOutputFile[]> {
  const quality = clampInt(ctx.settings.quality, 10, 100, 75);
  const keepFormat = ctx.settings.keepFormat !== false;
  const outputs: ProcessOutputFile[] = [];

  for (let i = 0; i < ctx.files.length; i++) {
    const f = ctx.files[i];
    const meta = await sharp(f.data).metadata();
    const mime = (meta.format === "png" ? "image/png" : meta.format === "webp" ? "image/webp" : "image/jpeg");
    let pipeline = sharp(f.data).rotate();
    if (!keepFormat || mime === "image/jpeg") {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (mime === "image/png") {
      pipeline = pipeline.png({ quality, palette: true, effort: 6 });
    } else if (mime === "image/webp") {
      pipeline = pipeline.webp({ quality });
    }
    const data = await pipeline.toBuffer();
    outputs.push({
      name: mime === "image/jpeg" || !keepFormat ? baseNameWithExt(f.name, "jpg") : baseNameWithExt(f.name, extForMime(mime)),
      contentType: mime === "image/jpeg" || !keepFormat ? "image/jpeg" : mime,
      data,
      width: meta.width,
      height: meta.height,
    });
    ctx.onProgress?.(Math.round(((i + 1) / ctx.files.length) * 100), "Compressing images");
  }
  return outputs;
}

// ---------------------------------------------------------------------------
// Image Resizer
// ---------------------------------------------------------------------------
function fitWithin(w: number, h: number, targetW: number, targetH: number, lock: boolean): { width: number; height: number } {
  if (lock) {
    const scale = Math.min(targetW / w, targetH / h);
    return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
  }
  return { width: Math.max(1, Math.round(targetW)), height: Math.max(1, Math.round(targetH)) };
}

export async function imageResizer(ctx: ProcessContext): Promise<ProcessOutputFile[]> {
  const mode = String(ctx.settings.mode ?? "percent");
  const outputs: ProcessOutputFile[] = [];

  for (let i = 0; i < ctx.files.length; i++) {
    const f = ctx.files[i];
    const meta = await sharp(f.data).metadata();
    const w = meta.width ?? 1;
    const h = meta.height ?? 1;
    let targetW: number;
    let targetH: number;

    if (mode === "pixels") {
      const lock = ctx.settings.aspectLock !== false;
      const tw = clampInt(ctx.settings.width, 1, 12000, 0);
      const th = clampInt(ctx.settings.height, 1, 12000, 0);
      if (!tw && !th) throw new ProcessingError("no_dimensions", "Enter a width or height to resize by.");
      if (tw && th && lock) {
        const r = fitWithin(w, h, tw, th, true);
        targetW = r.width;
        targetH = r.height;
      } else {
        const scale = tw && th ? Math.min(tw / w, th / h) : tw ? tw / w : th / h;
        targetW = Math.max(1, Math.round(w * scale));
        targetH = Math.max(1, Math.round(h * scale));
      }
    } else if (mode === "preset") {
      const preset = PRESETS[String(ctx.settings.preset)];
      if (!preset) throw new ProcessingError("no_preset", "Choose a size preset.");
      const r = fitWithin(w, h, preset.width, preset.height, true);
      targetW = r.width;
      targetH = r.height;
    } else {
      const pct = clampInt(ctx.settings.percent, 1, 200, 50);
      targetW = Math.max(1, Math.round((w * pct) / 100));
      targetH = Math.max(1, Math.round((h * pct) / 100));
    }

    const mime = meta.format === "png" ? "image/png" : meta.format === "webp" ? "image/webp" : "image/jpeg";
    let pipeline = sharp(f.data).rotate().resize(targetW, targetH, { fit: "fill" });
    if (mime === "image/png") pipeline = pipeline.png();
    else if (mime === "image/webp") pipeline = pipeline.webp();
    else pipeline = pipeline.jpeg({ quality: 90 });
    const data = await pipeline.toBuffer();
    outputs.push({
      name: baseNameWithExt(f.name, extForMime(mime)),
      contentType: mime,
      data,
      width: targetW,
      height: targetH,
    });
    ctx.onProgress?.(Math.round(((i + 1) / ctx.files.length) * 100), "Resizing images");
  }
  return outputs;
}

// ---------------------------------------------------------------------------
// PNG -> JPG
// ---------------------------------------------------------------------------
export async function pngToJpg(ctx: ProcessContext): Promise<ProcessOutputFile[]> {
  const quality = clampInt(ctx.settings.quality, 20, 100, 85);
  const background = parseHexColor(ctx.settings.background);
  const outputs: ProcessOutputFile[] = [];

  for (let i = 0; i < ctx.files.length; i++) {
    const f = ctx.files[i];
    const meta = await sharp(f.data).metadata();
    const data = await sharp(f.data)
      .rotate()
      .flatten({ background })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    outputs.push({
      name: baseNameWithExt(f.name, "jpg"),
      contentType: "image/jpeg",
      data,
      width: meta.width,
      height: meta.height,
    });
    ctx.onProgress?.(Math.round(((i + 1) / ctx.files.length) * 100), "Converting");
  }
  return outputs;
}

// ---------------------------------------------------------------------------
// Image Cropper (client supplies pixel coords from its live preview)
// ---------------------------------------------------------------------------
export async function imageCropper(ctx: ProcessContext): Promise<ProcessOutputFile[]> {
  const f = ctx.files[0];
  const crop = ctx.settings.crop as { x?: number; y?: number; width?: number; height?: number } | undefined;
  if (!crop || !crop.width || !crop.height) {
    throw new ProcessingError("no_crop", "Drag a crop area before downloading.");
  }
  const x = clampInt(crop.x, 0, 100_000, 0);
  const y = clampInt(crop.y, 0, 100_000, 0);
  const width = clampInt(crop.width, 1, 100_000, 1);
  const height = clampInt(crop.height, 1, 100_000, 1);

  const meta = await sharp(f.data).metadata();
  const mime = meta.format === "png" ? "image/png" : meta.format === "webp" ? "image/webp" : "image/jpeg";
  let pipeline = sharp(f.data)
    .autoOrient()
    .extract({ left: x, top: y, width, height });
  if (mime === "image/png") pipeline = pipeline.png();
  else if (mime === "image/webp") pipeline = pipeline.webp();
  else pipeline = pipeline.jpeg({ quality: 92 });
  const data = await pipeline.toBuffer();
  return [
    {
      name: baseNameWithExt(f.name, extForMime(mime)),
      contentType: mime,
      data,
      width,
      height,
    },
  ];
}
