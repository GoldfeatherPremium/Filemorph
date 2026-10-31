import { TOOL_BY_CODE, TOOLS } from "@filemorph/shared";
import { ProcessingError } from "./errors";
import type { ProcessContext, ProcessOutputFile, ProcessResult, ToolHandler } from "./types";
import { assertAcceptedMime, assertMaxSize } from "./utils";

import {
  compressPdf,
  jpgToPdf,
  mergePdf,
  organizePdf,
  pdfToJpg,
  pdfToText,
  rotatePdf,
  splitPdf,
} from "./pdf-tools";
import {
  imageCompressor,
  imageCropper,
  imageResizer,
  pngToJpg,
} from "./image-tools";

const HANDLERS: Record<string, ToolHandler> = {
  "merge-pdf": mergePdf,
  "split-pdf": splitPdf,
  "compress-pdf": compressPdf,
  "pdf-to-jpg": pdfToJpg,
  "jpg-to-pdf": jpgToPdf,
  "rotate-pdf": rotatePdf,
  "organize-pdf": organizePdf,
  "pdf-to-text": pdfToText,
  "image-compressor": imageCompressor,
  "image-resizer": imageResizer,
  "png-to-jpg": pngToJpg,
  "image-cropper": imageCropper,
};

export async function processTool(ctx: ProcessContext): Promise<ProcessResult> {
  const tool = TOOL_BY_CODE[ctx.toolCode];
  if (!tool) throw new ProcessingError("unknown_tool", `Unknown tool: ${ctx.toolCode}`);
  const handler = HANDLERS[ctx.toolCode];
  if (!handler) throw new ProcessingError("tool_not_implemented", `${tool.name} is not implemented yet.`);

  const { batchMin, batchMax, accepts } = tool;
  if (ctx.files.length < batchMin || ctx.files.length > batchMax) {
    throw new ProcessingError(
      "bad_file_count",
      `${tool.name} accepts ${batchMin}–${batchMax} file${batchMax > 1 ? "s" : ""}.`,
    );
  }
  for (const f of ctx.files) {
    assertAcceptedMime(ctx.toolCode, f.data, f.contentType);
    assertMaxSize(f.data.length, 524_288_000);
  }

  const startedAt = Date.now();
  const outputs = await handler(ctx);
  const meta = { durationMs: Date.now() - startedAt, inputBytes: ctx.files.reduce((s, f) => s + f.data.length, 0) };
  return { outputs, meta };
}

export * from "./types";
export * from "./errors";
export * from "./utils";
export { renderPdfThumbnail, extractPdfText, openPdf } from "./pdf-core";
export { buildZip, zipFromOutputs } from "./zip";
export const PROCESSABLE_TOOLS = TOOLS.map((t) => t.code);
