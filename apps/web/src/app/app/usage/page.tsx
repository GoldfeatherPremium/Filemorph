import type { Metadata } from "next";
import { getDataStore } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UsageMeter } from "@/components/app/usage-meter";
import { formatBytes } from "@/lib/utils";

export const metadata: Metadata = { title: "Usage" };

export default async function UsagePage() {
  const session = await requireUser();
  const store = await getDataStore();
  const profile = await store.getProfile(session.userId);
  const counts = await store.usageCounts(session.userId, null);
  if (!profile) return null;
  const plan = profile.plan;

  return (
    <>
      <PageHeader title="Usage" description={`How you're using your ${plan.name} plan.`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quota</CardTitle>
            <CardDescription>Resets automatically at the start of each period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <UsageMeter label="Jobs this month" used={counts.usedMonthly} quota={plan.monthly_job_quota} />
            <UsageMeter label="Jobs today" used={counts.usedDaily} quota={plan.daily_job_quota} />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Processed</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">This month</span><span className="font-medium">{formatBytes(counts.totalBytesProcessedMonth)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Jobs (7 days)</span><span className="font-medium">{counts.jobsLast7Days}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Plan limits</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Max file size</span><span className="font-medium">{formatBytes(plan.max_file_bytes)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Batch size</span><span className="font-medium">{plan.batch_enabled ? `up to ${plan.max_batch_size}` : "single files"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">File retention</span><span className="font-medium">{plan.retention_hours >= 24 ? `${Math.round(plan.retention_hours / 24)} days` : `${plan.retention_hours}h`}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Advanced compression</span><span className="font-medium">{plan.advanced_compression ? "included" : "Pro only"}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
