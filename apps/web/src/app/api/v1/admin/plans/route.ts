import { apiRoute, parseBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { adminPlanUpdateSchema } from "@filemorph/shared";

export const GET = apiRoute(async () => {
  await requireAdmin();
  const store = await getDataStore();
  return store.listPlans();
});

export const PATCH = apiRoute(async (req) => {
  await requireAdmin();
  const body = await parseBody(req, adminPlanUpdateSchema);
  const store = await getDataStore();
  const plan = await store.updatePlan(body.planId, body.fields);
  await store.logAudit({ action: "plan.update", resource: "plans", resourceId: plan.id });
  return plan;
});
