import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, UploadCloud, Zap, Clock } from "lucide-react";
import { getDataStore } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { JobCard } from "@/components/app/job-card";
import { UsageMeter } from "@/components/app/usage-meter";
import { ToolCard } from "@/components/app/tool-card";
import { IMAGE_TOOLS, PDF_TOOLS } from "@filemorph/shared";
import { formatBytes } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireUser();
  const store = await getDataStore();
  const profile = await store.getProfile(session.userId);
  const counts = await store.usageCounts(session.userId, null);
  const jobs = await store.listJobs(session.userId, null, { limit: 6 });
  const subscription = await store.getSubscription(session.userId);

  if (!profile) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  const popular = [...PDF_TOOLS.slice(0, 4), ...IMAGE_TOOLS.slice(0, 3)];

  return (
    <>
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description="Your files, your workspace — pick up right where you left off."
        actions={
          <Button asChild>
            <Link href="/app/upload"><UploadCloud /> Upload files</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4 text-fm-accent" /> Popular tools</CardTitle>
            <CardDescription>Start a conversion in one click.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {popular.map((tool) => (
                <ToolCard key={tool.code} tool={tool} />
              ))}
            </div>
            <Button asChild variant="outline" className="mt-5 w-full">
              <Link href="/tools">Explore all tools <ArrowUpRight /></Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>This month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <UsageMeter label="Jobs used" used={counts.usedMonthly} quota={profile.plan.monthly_job_quota} />
              <UsageMeter label="Today" used={counts.usedDaily} quota={profile.plan.daily_job_quota} />
              <div className="flex items-center justify-between border-t pt-4 text-sm">
                <span className="text-muted-foreground">Processed</span>
                <span className="font-medium">{formatBytes(counts.totalBytesProcessedMonth)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan</CardTitle>
              <CardDescription className="capitalize">{profile.plan_code} plan</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.plan_code === "free" ? (
                <>
                  <p className="text-sm text-muted-foreground">Unlock batches, bigger files, and longer history.</p>
                  <Button asChild className="mt-4 w-full" size="sm">
                    <Link href="/pricing">Upgrade</Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {subscription?.cancel_at_period_end ? "Your plan will not renew." : "Your plan is active."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Clock className="h-4 w-4 text-fm-accent" /> Recent jobs</h2>
          {jobs.length > 0 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/history">View all</Link>
            </Button>
          ) : null}
        </div>
        {jobs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No jobs yet — upload a file to get started.</p>
            <Button asChild className="mt-4">
              <Link href="/app/upload">Upload your first file</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
