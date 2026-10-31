import { apiRoute } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { createBillingPortalUrl } from "@/lib/paddle";

export const POST = apiRoute(async () => {
  const session = await requireUser();
  const store = await getDataStore();
  const sub = await store.getSubscription(session.userId);
  if (!sub?.provider_customer_id) {
    return { url: "", configured: false, reason: "no_subscription" };
  }
  const { url, configured } = await createBillingPortalUrl(sub.provider_customer_id);
  return { url, configured };
});
