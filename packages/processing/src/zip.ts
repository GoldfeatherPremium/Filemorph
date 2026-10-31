import { ZipFile } from "yazl";
import type { ProcessOutputFile } from "./types";

export function buildZip(files: Array<{ name: string; data: Buffer }>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const zip = new ZipFile();
    const chunks: Buffer[] = [];
    zip.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    zip.outputStream.on("end", () => resolve(Buffer.concat(chunks)));
    zip.outputStream.on("error", reject);
    for (const f of files) {
      zip.addBuffer(f.data, f.name);
    }
    zip.end();
  });
}

export function zipFromOutputs(outputs: ProcessOutputFile[], prefix = ""): Promise<Buffer> {
  return buildZip(
    outputs.map((o, i) => ({
      name: `${prefix}${String(i + 1).padStart(3, "0")}-${o.name}`,
      data: o.data,
    })),
  );
}
