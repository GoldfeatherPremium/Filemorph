import type { Metadata } from "next";
import Link from "next/link";
import { getDataStore } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/app/job-card";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const session = await requireUser();
  const store = await getDataStore();
  const jobs = await store.listJobs(session.userId, null, { limit: 200 });

  return (
    <>
      <PageHeader title="History" description="Every transformation you've run, in one place." />
      {jobs.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">No jobs yet.</p>
          <Button asChild className="mt-4">
            <Link href="/app/tools">Start transforming</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </>
  );
}
