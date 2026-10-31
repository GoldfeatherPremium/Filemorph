import { describe, expect, it } from "vitest";
import { detectMime } from "./helpers";
import { assertAcceptedMime, assertMaxSize } from "../src/utils";
import { ProcessingError } from "../src/errors";
import { makeJpeg, makePdf, makePng, makeWebp } from "./helpers";

describe("validation", () => {
  it("detects magic bytes for every supported type", async () => {
    expect(detectMime(await makePdf([{ text: "x" }]))).toBe("application/pdf");
    expect(detectMime(await makeJpeg())).toBe("image/jpeg");
    expect(detectMime(await makePng())).toBe("image/png");
    expect(detectMime(await makeWebp())).toBe("image/webp");
    expect(detectMime(Buffer.from("garbage"))).toBeNull();
  });

  it("rejects wrong file types", async () => {
    const png = await makePng();
    expect(() => assertAcceptedMime("merge-pdf", png, "image/png")).toThrow(ProcessingError);
    const jpeg = await makeJpeg();
    expect(() => assertAcceptedMime("image-compressor", jpeg, "image/jpeg")).not.toThrow();
    expect(() => assertAcceptedMime("png-to-jpg", png, "image/png")).not.toThrow();
  });

  it("enforces size limits", () => {
    expect(() => assertMaxSize(10_000_000, 20_000_000)).not.toThrow();
    expect(() => assertMaxSize(30_000_000, 20_000_000)).toThrow(ProcessingError);
  });
});
