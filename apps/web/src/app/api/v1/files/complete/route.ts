import { NextResponse } from "next/server";
import { apiRoute, parseBody } from "@/lib/api";
import { getOwnerContext, GUEST_TOKEN_COOKIE, guestCookieOptions } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { uploadCompleteSchema, THROTTLE } from "@filemorph/shared";
import { BadRequestError } from "@filemorph/shared";
import { detectMime } from "@filemorph/processing";

function normalizeMime(m: string): string {
  return m.toLowerCase().split(";")[0].trim();
}

export const POST = apiRoute(async (req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  checkRateLimit(rateLimitKey("upload-complete", ip), THROTTLE.maxUploadsPerMinute, THROTTLE.rateLimitWindowMs);

  const body = await parseBody(req, uploadCompleteSchema);
  const storage = getStorage();
  const store = await getDataStore();
  const ctx = await getOwnerContext();

  const buf = await storage.download(body.path);
  if (buf.length !== body.size) {
    throw new BadRequestError("size_mismatch", "Uploaded size does not match the declared size.");
  }
  const detected = detectMime(buf);
  const normalizedClaim = normalizeMime(body.contentType);
  if (!detected || detected !== normalizedClaim) {
    throw new BadRequestError("invalid_file_type", "File content does not match its declared type.");
  }

  const fileRow = await store.insertFile({
    user_id: ctx.userId,
    owner_token: ctx.ownerToken,
    bucket: storage.bucket,
    storage_path: body.path,
    filename: body.filename,
    content_type: normalizedClaim,
    size_bytes: body.size,
    status: "ready",
  });

  const res = NextResponse.json({ data: { id: fileRow.id } });
  if (ctx.needGuestCookie && ctx.guestToken) {
    res.cookies.set(GUEST_TOKEN_COOKIE, ctx.guestToken, guestCookieOptions as never);
  }
  return res;
});
