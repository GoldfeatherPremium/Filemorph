import { apiRoute, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { createCheckoutUrl } from "@/lib/paddle";
import { checkoutSchema, APP_URL } from "@filemorph/shared";

export const POST = apiRoute(async (req) => {
  const session = await requireUser();
  const body = await parseBody(req, checkoutSchema);
  const store = await getDataStore();
  const profile = await store.getProfile(session.userId);

  const successUrl = body.returnUrl && body.returnUrl.startsWith("/") ? `${APP_URL}${body.returnUrl}` : `${APP_URL}/app/billing?checkout=success`;

  const { url, configured } = await createCheckoutUrl({
    plan: body.plan,
    cadence: body.cadence,
    customerEmail: profile?.email,
    successUrl,
  });

  return { url, configured, plan: body.plan, cadence: body.cadence };
});
