import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { verifyPaddleWebhook, parsePaddleNotification, type PaddleNotification } from "@/lib/paddle";
import { getDataStore } from "@/lib/db";
import type { DataStore } from "@/lib/db/types";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email";
import { APP_URL } from "@filemorph/shared";

type Notif = PaddleNotification & { data: Record<string, unknown> };

function planFromPriceId(priceId: string | undefined): "plus" | "pro" | null {
  if (!priceId) return null;
  const env = serverEnv();
  const map: Record<string, "plus" | "pro"> = {
    [env.paddlePricePlusMonthly ?? ""]: "plus",
    [env.paddlePricePlusYearly ?? ""]: "plus",
    [env.paddlePriceProMonthly ?? ""]: "pro",
    [env.paddlePriceProYearly ?? ""]: "pro",
  };
  return map[priceId] ?? null;
}

/** Update payment event processing status (prod only; demo stays in-memory). */
async function markEventStatus(eventId: string, status: "processed" | "failed") {
  const store = await getDataStore();
  if (store.mode !== "prod") return;
  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
  await getSupabaseAdmin()
    .from("payment_events")
    .update({ status, processed_at: status === "processed" ? new Date().toISOString() : null })
    .eq("provider_event_id", eventId);
}

async function handleEvent(store: DataStore, event: Notif): Promise<void> {
  const data = event.data as {
    id?: string;
    subscription_id?: string;
    customer_id?: string;
    status?: string;
    scheduled_change?: { action?: string } | null;
    items?: Array<{ price?: { id?: string } }>;
    customer?: { email?: string; id?: string };
    price?: { id?: string };
    next_billed_at?: string | null;
  };

  const email = (data.customer?.email ?? "").toLowerCase();
  const profile = email ? await store.getProfileByEmail(email) : null;
  const userId = profile?.id ?? null;

  const priceId = data.items?.[0]?.price?.id ?? data.price?.id;
  const plan = planFromPriceId(priceId);
  const subscriptionId = data.subscription_id ?? data.id ?? null;

  switch (event.event_type) {
    case "subscription.created":
    case "subscription.activated": {
      if (!userId || !plan) break;
      await store.upsertSubscription(userId, {
        provider: "paddle",
        provider_subscription_id: subscriptionId,
        provider_customer_id: data.customer_id ?? data.customer?.id ?? null,
        plan_code: plan,
        status: "active",
        current_period_start: new Date().toISOString(),
      });
      if (email) void sendEmail("subscription_activated", { email, plan, features: "batch processing, larger files, and longer history", url: `${APP_URL}/app/billing` });
      break;
    }
    case "subscription.updated": {
      if (!userId || !subscriptionId) break;
      const cancelAtEnd = data.scheduled_change?.action === "cancel";
      await store.upsertSubscription(userId, {
        provider: "paddle",
        provider_subscription_id: subscriptionId,
        provider_customer_id: data.customer_id ?? data.customer?.id ?? null,
        status: data.status === "canceled" ? "canceled" : data.status === "past_due" ? "past_due" : data.status === "paused" ? "paused" : "active",
        cancel_at_period_end: cancelAtEnd,
        next_billed_at: data.next_billed_at ?? null,
      });
      if (data.status === "past_due" && email) {
        void sendEmail("payment_failed", { email, plan: plan ?? profile?.plan_code ?? "paid", url: `${APP_URL}/app/billing` });
      }
      break;
    }
    case "subscription.canceled": {
      if (userId && subscriptionId) {
        await store.upsertSubscription(userId, {
          provider: "paddle",
          provider_subscription_id: subscriptionId,
          status: "canceled",
          cancel_at_period_end: false,
        });
        if (email) void sendEmail("subscription_cancelled", { email, plan: plan ?? "paid", url: `${APP_URL}/app/billing` });
      }
      break;
    }
    case "transaction.completed": {
      if (userId && data.subscription_id) {
        await store.upsertSubscription(userId, {
          provider: "paddle",
          provider_subscription_id: data.subscription_id,
          next_billed_at: data.next_billed_at ?? null,
        });
      }
      break;
    }
    default:
      break;
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("paddle-signature") ?? req.headers.get("Paddle-Signature");
  const env = serverEnv();
  const verified = verifyPaddleWebhook(raw, signature);

  if (!verified) {
    const allowDev = !env.paddleWebhookSecret && process.env.ALLOW_UNVERIFIED_WEBHOOKS === "true";
    if (!allowDev) {
      logger.warn("paddle.webhook_signature_invalid", { hasHeader: Boolean(signature) });
      return NextResponse.json({ error: { code: "invalid_signature", message: "Invalid webhook signature." } }, { status: 401 });
    }
  }

  let event: Notif;
  try {
    event = parsePaddleNotification(raw) as Notif;
  } catch {
    return NextResponse.json({ error: { code: "invalid_json", message: "Invalid payload." } }, { status: 400 });
  }

  const store = await getDataStore();
  const inserted = await store.insertPaymentEvent({
    provider: "paddle",
    provider_event_id: event.event_id,
    event_type: event.event_type,
    payload: event.data,
    status: "received",
    received_at: new Date().toISOString(),
    processed_at: null,
  });

  if (inserted) {
    try {
      await handleEvent(store, event);
      await markEventStatus(event.event_id, "processed").catch(() => {});
    } catch (e) {
      logger.error("paddle.event_processing_failed", { event: event.event_type, error: e instanceof Error ? e.message : String(e) });
      await markEventStatus(event.event_id, "failed").catch(() => {});
    }
  }

  return NextResponse.json({ data: { received: true } });
}
