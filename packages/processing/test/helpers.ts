import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";
import { detectMime } from "../src/utils";

export async function makeJpeg(width = 800, height = 600, quality = 90, color = "#7D9BBF"): Promise<Buffer> {
  const svg = `<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="${color}"/><circle cx="${Math.floor(width / 2)}" cy="${Math.floor(height / 2)}" r="${Math.floor(Math.min(width, height) / 4)}" fill="#B8B6D9"/></svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality }).toBuffer();
}

export async function makePng(width = 400, height = 300, alpha = false): Promise<Buffer> {
  const svg = `<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="rgba(23,25,28,0.8)"/><rect x="40" y="40" width="120" height="80" fill="#D97757"/></svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

export async function makeWebp(width = 500, height = 400): Promise<Buffer> {
  const svg = `<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="#F0F1F2"/><text x="20" y="60" font-size="40">WebP</text></svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 90 }).toBuffer();
}

export async function makePdf(
  pages: Array<{ text?: string; color?: string; image?: Buffer }>,
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const p of pages) {
    const page = doc.addPage([400, 300]);
    if (p.image) {
      const img = await doc.embedJpeg(p.image);
      page.drawImage(img, { x: 20, y: 40, width: 360, height: 220 });
    }
    page.drawText(p.text ?? "Page", { x: 40, y: 260, size: 20, font });
    page.drawRectangle({
      x: 40,
      y: 30,
      width: 120,
      height: 18,
      color: p.color ? rgb(0.49, 0.61, 0.75) : rgb(0.72, 0.71, 0.85),
    });
  }
  return Buffer.from(await doc.save());
}

export async function pdfPageCount(data: Buffer): Promise<number> {
  const doc = await PDFDocument.load(data);
  return doc.getPageCount();
}

export { detectMime };
