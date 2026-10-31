import { apiRoute } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { toSubscriptionDTO } from "@/lib/dto";

export const GET = apiRoute(async () => {
  const session = await requireUser();
  const store = await getDataStore();
  const sub = await store.getSubscription(session.userId);
  return sub ? toSubscriptionDTO(sub) : null;
});
