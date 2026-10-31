import { apiRoute, queryParam } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getDataStore } from "@/lib/db";

export const GET = apiRoute(async (req) => {
  await requireAdmin();
  const store = await getDataStore();
  const q = queryParam(new URL(req.url), "q");
  const users = await store.listUsers(q);
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    planCode: u.plan_code,
    isAdmin: u.is_admin,
    suspended: u.suspended,
    suspensionReason: u.suspension_reason,
    createdAt: u.created_at,
    lastLoginAt: u.last_login_at,
  }));
});
