import { NextResponse, type NextRequest } from "next/server";
import { getStorage, demoVerifyToken, isDemoStorage, isSafeDemoPath } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { BadRequestError } from "@filemorph/shared";

export async function PUT(req: NextRequest) {
  if (!isDemoStorage()) {
    return NextResponse.json({ error: { code: "not_available", message: "Demo upload endpoint is only available in demo mode." } }, { status: 404 });
  }
  const p = req.nextUrl.searchParams.get("p");
  const t = req.nextUrl.searchParams.get("t");

  // Token check is preferred; fall back to strict structural validation so
  // uploads keep working when this serverless instance did not issue the token.
  const tokenOk = Boolean(p) && demoVerifyToken("upload", p!, t);
  const structuralOk = p !== null && isSafeDemoPath(p);
  if (!tokenOk && !structuralOk) {
    throw new BadRequestError("invalid_token", "Upload link is invalid or expired.");
  }
  if (!tokenOk) {
    logger.warn("demo.upload.structural_auth", { path: p });
  }

  const bytes = Buffer.from(await req.arrayBuffer());
  const storage = getStorage();
  await storage.putObject(p!, bytes, req.headers.get("content-type") ?? "application/octet-stream");
  return NextResponse.json({ data: { ok: true, size: bytes.length } });
}
