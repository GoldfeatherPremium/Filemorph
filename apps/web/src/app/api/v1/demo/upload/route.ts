import { NextResponse, type NextRequest } from "next/server";
import { getStorage, demoVerifyToken, isDemoStorage } from "@/lib/storage";
import { BadRequestError } from "@filemorph/shared";

export async function PUT(req: NextRequest) {
  if (!isDemoStorage()) {
    return NextResponse.json({ error: { code: "not_available", message: "Demo upload endpoint is only available in demo mode." } }, { status: 404 });
  }
  const p = req.nextUrl.searchParams.get("p");
  const t = req.nextUrl.searchParams.get("t");
  if (!p || !demoVerifyToken("upload", p, t)) {
    throw new BadRequestError("invalid_token", "Upload link is invalid or expired.");
  }
  const bytes = Buffer.from(await req.arrayBuffer());
  const storage = getStorage();
  await storage.putObject(p, bytes, req.headers.get("content-type") ?? "application/octet-stream");
  return NextResponse.json({ data: { ok: true, size: bytes.length } });
}
