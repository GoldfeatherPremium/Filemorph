import { apiRoute } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { getQueueDepth } from "@/lib/queue";

export const GET = apiRoute(async () => {
  await requireAdmin();
  const store = await getDataStore();
  const stats = await store.stats();
  const queueDepth = await getQueueDepth();
  return { ...stats, queueDepth };
});
