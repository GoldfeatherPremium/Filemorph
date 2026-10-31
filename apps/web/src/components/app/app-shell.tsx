import { getDataStore } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";
import { UnauthorizedError } from "@filemorph/shared";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const store = await getDataStore();
  const profile = await store.getProfile(session.userId);
  if (!profile) throw new UnauthorizedError("Profile not found.");

  const counts = await store.usageCounts(session.userId, null);

  const user = {
    name: profile.full_name,
    email: profile.email,
    planCode: profile.plan_code,
    isAdmin: profile.is_admin,
  };
  const usage = {
    usedMonthly: counts.usedMonthly,
    monthlyQuota: profile.plan.monthly_job_quota,
    usedDaily: counts.usedDaily,
    dailyQuota: profile.plan.daily_job_quota,
  };

  return (
    <div className="min-h-screen bg-fm-bg">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-background/70 backdrop-blur lg:block">
          <Sidebar user={user} usage={usage} />
        </aside>
        <div className="flex-1 lg:pl-72">
          <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
