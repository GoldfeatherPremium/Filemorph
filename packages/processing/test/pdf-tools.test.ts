import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import {
  compressPdf,
  jpgToPdf,
  mergePdf,
  organizePdf,
  pdfToJpg,
  pdfToText,
  rotatePdf,
  splitPdf,
} from "../src/pdf-tools";
import { ProcessingError } from "../src/errors";
import { extractPdfText } from "../src/pdf-core";
import { makeJpeg, makePdf, pdfPageCount } from "./helpers";
import type { ProcessInputFile } from "../src/types";

const asInput = (data: Buffer, name: string, contentType = "application/pdf"): ProcessInputFile => ({
  id: name,
  name,
  contentType,
  data,
});

describe("merge-pdf", () => {
  it("combines PDFs and preserves page counts", async () => {
    const a = await makePdf([{ text: "A1" }, { text: "A2" }]);
    const b = await makePdf([{ text: "B1" }]);
    const outputs = await mergePdf({ toolCode: "merge-pdf", settings: {}, files: [asInput(a, "a.pdf"), asInput(b, "b.pdf")] });
    expect(outputs).toHaveLength(1);
    expect(outputs[0].contentType).toBe("application/pdf");
    expect(await pdfPageCount(outputs[0].data)).toBe(3);
  });

  it("requires at least two files", async () => {
    const a = await makePdf([{ text: "A" }]);
    await expect(
      mergePdf({ toolCode: "merge-pdf", settings: {}, files: [asInput(a, "a.pdf")] }),
    ).rejects.toThrow(ProcessingError);
  });
});

describe("split-pdf", () => {
  it("splits by ranges", async () => {
    const pdf = await makePdf([{ text: "1" }, { text: "2" }, { text: "3" }, { text: "4" }]);
    const outputs = await splitPdf({
      toolCode: "split-pdf",
      settings: { mode: "ranges", ranges: "1-2,4" },
      files: [asInput(pdf, "doc.pdf")],
    });
    expect(outputs).toHaveLength(2);
    expect(await pdfPageCount(outputs[0].data)).toBe(2);
    expect(await pdfPageCount(outputs[1].data)).toBe(1);
  });

  it("splits every page when mode=all", async () => {
    const pdf = await makePdf([{ text: "1" }, { text: "2" }]);
    const outputs = await splitPdf({
      toolCode: "split-pdf",
      settings: { mode: "all" },
      files: [asInput(pdf, "doc.pdf")],
    });
    expect(outputs).toHaveLength(2);
    expect(await pdfPageCount(outputs[0].data)).toBe(1);
  });

  it("rejects empty ranges", async () => {
    const pdf = await makePdf([{ text: "1" }]);
    await expect(
      splitPdf({ toolCode: "split-pdf", settings: { mode: "ranges", ranges: "" }, files: [asInput(pdf, "doc.pdf")] }),
    ).rejects.toThrow(ProcessingError);
  });
});

describe("compress-pdf", () => {
  it("reduces size of an image-heavy PDF and keeps page count", async () => {
    const big = await makeJpeg(1800, 1350, 92, "#4a6d8c");
    const pdf = await makePdf([{ text: "Photo", image: big }, { text: "Photo2", image: big }]);
    const outputs = await compressPdf({
      toolCode: "compress-pdf",
      settings: { preset: "high" },
      files: [asInput(pdf, "photos.pdf")],
    });
    expect(outputs).toHaveLength(1);
    const out = outputs[0].data;
    expect(out.length).toBeLessThan(pdf.length);
    expect(await pdfPageCount(out)).toBe(2);
  });
});

describe("pdf-to-jpg", () => {
  it("renders each page as a JPEG", async () => {
    const pdf = await makePdf([{ text: "P1" }, { text: "P2" }]);
    const outputs = await pdfToJpg({
      toolCode: "pdf-to-jpg",
      settings: { quality: 80, output: "individual" },
      files: [asInput(pdf, "doc.pdf")],
    });
    expect(outputs).toHaveLength(2);
    for (const o of outputs) {
      expect(o.contentType).toBe("image/jpeg");
      const img = sharp(o.data);
      const meta = await img.metadata();
      expect(meta.format).toBe("jpeg");
      expect(meta.width).toBeGreaterThan(100);
    }
  });

  it("returns a ZIP when output=zip and multiple pages", async () => {
    const pdf = await makePdf([{ text: "P1" }, { text: "P2" }]);
    const outputs = await pdfToJpg({
      toolCode: "pdf-to-jpg",
      settings: { quality: 75, output: "zip" },
      files: [asInput(pdf, "doc.pdf")],
    });
    expect(outputs).toHaveLength(1);
    expect(outputs[0].contentType).toBe("application/zip");
  });
});

describe("jpg-to-pdf", () => {
  it("builds a PDF from mixed image formats", async () => {
    const jpeg = await makeJpeg(800, 600);
    const png = await sharp(await makeJpeg(500, 700)).png().toBuffer();
    const outputs = await jpgToPdf({
      toolCode: "jpg-to-pdf",
      settings: { pageSize: "letter", orientation: "portrait", margin: 0 },
      files: [
        asInput(jpeg, "one.jpg", "image/jpeg"),
        asInput(png, "two.png", "image/png"),
      ],
    });
    expect(outputs).toHaveLength(1);
    expect(await pdfPageCount(outputs[0].data)).toBe(2);
    const doc = await PDFDocument.load(outputs[0].data);
    const page = doc.getPage(0);
    const { width, height } = page.getSize();
    expect(Math.round(width)).toBe(612);
    expect(Math.round(height)).toBe(792);
  });
});

describe("rotate-pdf", () => {
  it("rotates selected pages", async () => {
    const pdf = await makePdf([{ text: "1" }, { text: "2" }]);
    const outputs = await rotatePdf({
      toolCode: "rotate-pdf",
      settings: { rotation: 90, pages: "range", pageRange: "1" },
      files: [asInput(pdf, "doc.pdf")],
    });
    const doc = await PDFDocument.load(outputs[0].data);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(0);
  });
});

describe("organize-pdf", () => {
  it("reorders and deletes pages", async () => {
    const pdf = await makePdf([
      { text: "AAA first" },
      { text: "BBB second" },
      { text: "CCC third" },
    ]);
    const outputs = await organizePdf({
      toolCode: "organize-pdf",
      settings: { order: [3, 1] },
      files: [asInput(pdf, "doc.pdf")],
    });
    expect(await pdfPageCount(outputs[0].data)).toBe(2);
    const text = await extractPdfText(await (await import("../src/pdf-core")).openPdf(outputs[0].data));
    expect(text.indexOf("CCC")).toBeGreaterThan(-1);
    expect(text.indexOf("BBB")).toBe(-1);
  });

  it("rejects deleting every page", async () => {
    const pdf = await makePdf([{ text: "1" }]);
    await expect(
      organizePdf({ toolCode: "organize-pdf", settings: { deletePages: [1] }, files: [asInput(pdf, "doc.pdf")] }),
    ).rejects.toThrow(ProcessingError);
  });
});

describe("pdf-to-text", () => {
  it("extracts text", async () => {
    const pdf = await makePdf([{ text: "Hello FileMorph extraction" }]);
    const outputs = await pdfToText({
      toolCode: "pdf-to-text",
      settings: {},
      files: [asInput(pdf, "doc.pdf")],
    });
    expect(outputs[0].contentType).toBe("text/plain");
    expect(outputs[0].data.toString("utf8")).toContain("Hello FileMorph extraction");
  });
});
