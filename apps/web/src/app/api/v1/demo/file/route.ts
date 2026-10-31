import { NextResponse, type NextRequest } from "next/server";
import { getStorage, demoVerifyToken, isDemoStorage, isSafeDemoPath } from "@/lib/storage";
import { getDataStore } from "@/lib/db";
import { logger } from "@/lib/logger";
import { BadRequestError, NotFoundError } from "@filemorph/shared";

export async function GET(req: NextRequest) {
  if (!isDemoStorage()) {
    return NextResponse.json({ error: { code: "not_available", message: "Demo file endpoint is only available in demo mode." } }, { status: 404 });
  }
  const p = req.nextUrl.searchParams.get("p");
  const t = req.nextUrl.searchParams.get("t");

  // Token check is preferred; fall back to strict structural validation so
  // downloads keep working across serverless instances. Object keys contain
  // random UUID segments and path traversal is blocked by isSafeDemoPath.
  const tokenOk = Boolean(p) && demoVerifyToken("download", p!, t);
  const structuralOk = p !== null && isSafeDemoPath(p);
  if (!tokenOk && !structuralOk) {
    throw new BadRequestError("invalid_token", "Download link is invalid or expired.");
  }
  if (!tokenOk) {
    logger.warn("demo.file.structural_auth", { path: p });
  }

  const storage = getStorage();
  let data: Buffer;
  try {
    data = await storage.download(p!);
  } catch {
    throw new NotFoundError("Requested file was not found.");
  }

  let contentType = "application/octet-stream";
  try {
    const store = await getDataStore();
    const file = await store.getFileByStoragePath(p!);
    if (file?.content_type) contentType = file.content_type;
  } catch {
    /* ignore */
  }

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(data.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
