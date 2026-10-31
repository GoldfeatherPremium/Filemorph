import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { apiRoute, parseBody } from "@/lib/api";
import { getOwnerContext, GUEST_TOKEN_COOKIE, guestCookieOptions } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { uploadUrlSchema, MAX_FILE_BYTES_ABSOLUTE, THROTTLE } from "@filemorph/shared";
import { BadRequestError } from "@filemorph/shared";

function safeUploadName(filename: string): string {
  const base = filename.replace(/[^\w.\- ]+/g, "").trim().slice(0, 80);
  return base || "file";
}

export const POST = apiRoute(async (req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  checkRateLimit(rateLimitKey("upload-url", ip), THROTTLE.maxUploadsPerMinute, THROTTLE.rateLimitWindowMs);

  const body = await parseBody(req, uploadUrlSchema);
  if (body.size > MAX_FILE_BYTES_ABSOLUTE) {
    throw new BadRequestError("file_too_large", "File exceeds the 250 MB absolute limit.");
  }

  const ctx = await getOwnerContext();
  const storage = getStorage();
  const owner = ctx.userId ?? ctx.ownerToken ?? "anon";
  const storagePath = `uploads/${owner}/${randomUUID()}/${safeUploadName(body.filename)}`;
  const signed = await storage.createSignedUploadUrl(storagePath, body.contentType, body.size);

  const res = NextResponse.json({ data: { uploadUrl: signed.uploadUrl, path: signed.path, token: signed.token, expiresAt: signed.expiresAt } });
  if (ctx.needGuestCookie && ctx.guestToken) {
    res.cookies.set(GUEST_TOKEN_COOKIE, ctx.guestToken, guestCookieOptions as never);
  }
  return res;
});
