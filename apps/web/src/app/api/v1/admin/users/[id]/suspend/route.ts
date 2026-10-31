import { apiRoute, parseBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ suspended: z.boolean(), reason: z.string().max(500).optional() }).strict();

export const POST = apiRoute(async (req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = await parseBody(req, schema);
  const store = await getDataStore();
  await store.suspendUser(id, body.suspended, body.reason);
  await store.logAudit({ action: body.suspended ? "user.suspend" : "user.unsuspend", resource: "profiles", resourceId: id });
  return { ok: true };
});
