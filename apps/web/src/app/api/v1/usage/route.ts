import { apiRoute } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { toUsageSummaryDTO } from "@/lib/dto";

export const GET = apiRoute(async () => {
  const session = await requireUser();
  const store = await getDataStore();
  const profile = await store.getProfile(session.userId);
  if (!profile) throw new Error("Profile not found.");
  const counts = await store.usageCounts(session.userId, null);
  const summary = toUsageSummaryDTO({
    profile,
    plan: profile.plan,
    counts,
    totalBytesProcessedMonth: counts.totalBytesProcessedMonth,
    jobsLast7Days: counts.jobsLast7Days,
  });
  return summary;
});
