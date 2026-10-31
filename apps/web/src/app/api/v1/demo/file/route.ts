import { NextResponse, type NextRequest } from "next/server";
import { getStorage, demoVerifyToken, isDemoStorage } from "@/lib/storage";
import { getDataStore } from "@/lib/db";
import { BadRequestError } from "@filemorph/shared";

export async function GET(req: NextRequest) {
  if (!isDemoStorage()) {
    return NextResponse.json({ error: { code: "not_available", message: "Demo file endpoint is only available in demo mode." } }, { status: 404 });
  }
  const p = req.nextUrl.searchParams.get("p");
  const t = req.nextUrl.searchParams.get("t");
  if (!p || !demoVerifyToken("download", p, t)) {
    throw new BadRequestError("invalid_token", "Download link is invalid or expired.");
  }
  const storage = getStorage();
  const data = await storage.download(p);

  let contentType = "application/octet-stream";
  try {
    const store = await getDataStore();
    const file = await store.getFileByStoragePath(p);
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
