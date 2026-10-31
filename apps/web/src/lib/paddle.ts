import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";
import { BadRequestError } from "@filemorph/shared";
import { logger } from "@/lib/logger";

export interface PaddleNotification<T = Record<string, unknown>> {
  event_id: string;
  event_type: string;
  occurred_at: string;
  data: T;
}

/**
 * Verify a Paddle Billing webhook signature (Paddle-Signature header).
 * Format: `ts=<unix>;h1=<hex hmac>` over `ts:body` with the webhook secret.
 */
export function verifyPaddleWebhook(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const params = new Map<string, string>();
  for (const part of signatureHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    params.set(part.slice(0, idx), part.slice(idx + 1));
  }
  const ts = params.get("ts");
  const h1 = params.get("h1");
  if (!ts || !h1) return false;

  const secret = serverEnv().paddleWebhookSecret;
  if (!secret) {
    logger.warn("paddle.webhook_secret_missing");
    return false;
  }
  const expected = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(h1, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function parsePaddleNotification(rawBody: string): PaddleNotification {
  try {
    return JSON.parse(rawBody) as PaddleNotification;
  } catch {
    throw new BadRequestError("invalid_json", "Invalid Paddle webhook payload.");
  }
}

/**
 * Build a Paddle Billing checkout URL when API credentials are configured.
 * Falls back to a descriptive placeholder otherwise (never a fake success).
 */
export async function createCheckoutUrl(opts: {
  plan: "plus" | "pro";
  cadence: "monthly" | "yearly";
  customerEmail?: string;
  customerId?: string;
  successUrl: string;
}): Promise<{ url: string; configured: boolean }> {
  const env = serverEnv();
  const priceKey = (opts.cadence === "yearly" ? "paddlePrice" : "paddlePrice").concat(
    opts.plan === "plus" ? "Plus" : "Pro",
    opts.cadence === "yearly" ? "Yearly" : "Monthly",
  );
  const priceId = env[priceKey as keyof typeof env] as string | null;

  if (env.paddleApiKey && env.paddleClientToken && priceId) {
    try {
      const res = await fetch("https://api.paddle.com/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.paddleApiKey}`,
        },
        body: JSON.stringify({
          items: [{ price_id: priceId, quantity: 1 }],
          customer: opts.customerEmail ? { email: opts.customerEmail } : undefined,
          success_url: opts.successUrl,
        }),
      });
      const json = (await res.json()) as { data?: { url?: string }; error?: { message?: string } };
      if (!res.ok || !json.data?.url) {
        logger.error("paddle.checkout_create_failed", { status: res.status, message: json.error?.message });
        return { url: "", configured: false };
      }
      return { url: json.data.url, configured: true };
    } catch (e) {
      logger.error("paddle.checkout_exception", { error: e instanceof Error ? e.message : String(e) });
      return { url: "", configured: false };
    }
  }

  return { url: "", configured: false };
}

export async function createBillingPortalUrl(customerId: string): Promise<{ url: string; configured: boolean }> {
  const env = serverEnv();
  if (!env.paddleApiKey || !customerId) return { url: "", configured: false };
  try {
    const res = await fetch(`https://api.paddle.com/customers/${customerId}/portal`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.paddleApiKey}` },
      body: JSON.stringify({}),
    });
    const json = (await res.json()) as { data?: { url?: string }; error?: { message?: string } };
    if (!res.ok || !json.data?.url) {
      logger.error("paddle.portal_create_failed", { status: res.status, message: json.error?.message });
      return { url: "", configured: false };
    }
    return { url: json.data.url, configured: true };
  } catch (e) {
    logger.error("paddle.portal_exception", { error: e instanceof Error ? e.message : String(e) });
    return { url: "", configured: false };
  }
}
