import { apiRoute, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { toProfileDTO } from "@/lib/dto";
import { updateMeSchema } from "@filemorph/shared";

export const GET = apiRoute(async () => {
  const session = await requireUser();
  const store = await getDataStore();
  const profile = await store.getProfile(session.userId);
  if (!profile) throw new Error("Profile not found.");
  const prefs = await store.getPreferences(session.userId);
  return {
    ...toProfileDTO(profile),
    plan: {
      code: profile.plan.code,
      name: profile.plan.name,
      monthlyJobQuota: profile.plan.monthly_job_quota,
      dailyJobQuota: profile.plan.daily_job_quota,
      maxBatchSize: profile.plan.max_batch_size,
      maxFileBytes: profile.plan.max_file_bytes,
      batchEnabled: profile.plan.batch_enabled,
      advancedCompression: profile.plan.advanced_compression,
      retentionHours: profile.plan.retention_hours,
    },
    preferences: prefs
      ? {
          theme: prefs.theme,
          marketingOptIn: prefs.marketing_opt_in,
          notifyJobCompletion: prefs.notify_job_completion,
          notifyProductUpdates: prefs.notify_product_updates,
        }
      : null,
  };
});

export const PATCH = apiRoute(async (req) => {
  const session = await requireUser();
  const body = await parseBody(req, updateMeSchema);
  const store = await getDataStore();
  if (body.fullName !== undefined || body.avatarUrl !== undefined) {
    await store.updateProfile(session.userId, { fullName: body.fullName, avatarUrl: body.avatarUrl });
  }
  if (body.preferences) {
    const p = body.preferences;
    await store.updatePreferences(session.userId, {
      theme: p.theme,
      marketing_opt_in: p.marketingOptIn,
      notify_job_completion: p.notifyJobCompletion,
      notify_product_updates: p.notifyProductUpdates,
    });
  }
  const profile = await store.getProfile(session.userId);
  return { profile: profile ? toProfileDTO(profile) : null };
});
