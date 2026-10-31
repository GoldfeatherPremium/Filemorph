import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TOOL_BY_CODE, type JobStatus } from "@filemorph/shared";
import type { JobRow } from "@/lib/db/types";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/status-badge";
import { formatBytes, timeAgo } from "@/lib/utils";

export function JobCard({ job }: { job: JobRow }) {
  const tool = TOOL_BY_CODE[job.tool_code];
  return (
    <Link href={`/app/jobs/${job.id}`} className="block">
      <Card className="p-4 transition-all hover:shadow-lift hover:-translate-y-0.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{tool?.name ?? job.tool_code}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {timeAgo(job.created_at)} · {formatBytes(job.input_total_bytes)} in · {formatBytes(job.output_total_bytes)} out
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={job.status as JobStatus} />
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
