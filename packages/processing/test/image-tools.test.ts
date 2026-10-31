import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  imageCompressor,
  imageCropper,
  imageResizer,
  pngToJpg,
} from "../src/image-tools";
import { ProcessingError } from "../src/errors";
import { makeJpeg, makePng, makeWebp } from "./helpers";
import type { ProcessInputFile } from "../src/types";

const input = (data: Buffer, name: string, contentType: string): ProcessInputFile => ({
  id: name,
  name,
  contentType,
  data,
});

describe("image-compressor", () => {
  it("compresses a large JPEG", async () => {
    const jpeg = await makeJpeg(2000, 1500, 95);
    const outputs = await imageCompressor({
      toolCode: "image-compressor",
      settings: { quality: 30, keepFormat: true },
      files: [input(jpeg, "photo.jpg", "image/jpeg")],
    });
    expect(outputs).toHaveLength(1);
    expect(outputs[0].data.length).toBeLessThan(jpeg.length);
    expect(outputs[0].contentType).toBe("image/jpeg");
  });

  it("compresses PNG with palette", async () => {
    const png = await makePng();
    const outputs = await imageCompressor({
      toolCode: "image-compressor",
      settings: { quality: 60, keepFormat: true },
      files: [input(png, "drawing.png", "image/png")],
    });
    expect(outputs[0].contentType).toBe("image/png");
    const meta = await sharp(outputs[0].data).metadata();
    expect(meta.format).toBe("png");
  });
});

describe("image-resizer", () => {
  it("resizes by percent", async () => {
    const jpeg = await makeJpeg(1000, 800);
    const outputs = await imageResizer({
      toolCode: "image-resizer",
      settings: { mode: "percent", percent: 50 },
      files: [input(jpeg, "photo.jpg", "image/jpeg")],
    });
    const meta = await sharp(outputs[0].data).metadata();
    expect(meta.width).toBe(500);
    expect(meta.height).toBe(400);
  });

  it("honors aspect-ratio lock for pixel targets", async () => {
    const jpeg = await makeJpeg(1000, 400);
    const outputs = await imageResizer({
      toolCode: "image-resizer",
      settings: { mode: "pixels", width: 100, height: 100, aspectLock: true },
      files: [input(jpeg, "wide.jpg", "image/jpeg")],
    });
    const meta = await sharp(outputs[0].data).metadata();
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(40);
  });

  it("applies presets", async () => {
    const jpeg = await makeJpeg(3000, 3000);
    const outputs = await imageResizer({
      toolCode: "image-resizer",
      settings: { mode: "preset", preset: "ig-square" },
      files: [input(jpeg, "square.jpg", "image/jpeg")],
    });
    const meta = await sharp(outputs[0].data).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1080);
  });
});

describe("png-to-jpg", () => {
  it("flattens transparency onto the chosen background", async () => {
    const png = await makePng(200, 200, true);
    const outputs = await pngToJpg({
      toolCode: "png-to-jpg",
      settings: { quality: 85, background: "ffffff" },
      files: [input(png, "icon.png", "image/png")],
    });
    expect(outputs[0].contentType).toBe("image/jpeg");
    const meta = await sharp(outputs[0].data).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.channels).toBe(3); // no alpha
  });
});

describe("image-cropper", () => {
  it("extracts the requested region", async () => {
    const jpeg = await makeJpeg(800, 600);
    const outputs = await imageCropper({
      toolCode: "image-cropper",
      settings: { crop: { x: 100, y: 100, width: 200, height: 150 } },
      files: [input(jpeg, "photo.jpg", "image/jpeg")],
    });
    const meta = await sharp(outputs[0].data).metadata();
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(150);
  });

  it("requires a crop region", async () => {
    const jpeg = await makeJpeg(800, 600);
    await expect(
      imageCropper({
        toolCode: "image-cropper",
        settings: {},
        files: [input(jpeg, "photo.jpg", "image/jpeg")],
      }),
    ).rejects.toThrow(ProcessingError);
  });
});
