"use client";

import { useState } from "react";
import { Download, RotateCcw, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { JobDTO } from "@filemorph/shared";
import { TOOL_BY_CODE } from "@filemorph/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/status-badge";
import { apiFetch } from "@/lib/client-api";
import { formatBytes, formatDateTime } from "@/lib/utils";

export function JobDetail({ job: initial }: { job: JobDTO }) {
  const router = useRouter();
  const [job, setJob] = useState<JobDTO>(initial);
  const [busy, setBusy] = useState(false);
  const tool = TOOL_BY_CODE[job.toolCode];

  async function act(action: "cancel" | "retry" | "delete") {
    setBusy(true);
    try {
      if (action === "delete") {
        await apiFetch(`/api/v1/jobs/${job.id}`, { method: "DELETE" });
        toast.success("Job deleted");
        router.push("/app/history");
        return;
      }
      const data = await apiFetch<{ job: JobDTO }>(`/api/v1/jobs/${job.id}/${action}`, { method: "POST", body: "{}" });
      setJob(data.job);
      toast.success(action === "cancel" ? "Job cancelled" : "Job requeued");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={job.status} />
            <span className="text-sm text-muted-foreground">{tool?.name ?? job.toolCode}</span>
            <span className="text-xs text-muted-foreground">created {formatDateTime(job.createdAt)}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Input size</p>
              <p className="text-lg font-semibold">{formatBytes(job.inputTotalBytes)}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Output size</p>
              <p className="text-lg font-semibold">{formatBytes(job.outputTotalBytes)}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-lg font-semibold capitalize">{job.status}</p>
            </div>
          </div>
          {job.errorMessage ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <p className="font-medium">Error: {job.errorCode}</p>
              <p className="mt-1">{job.errorMessage}</p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {job.status === "queued" || job.status === "processing" ? (
              <Button variant="outline" onClick={() => void act("cancel")} disabled={busy}>
                <XCircle /> Cancel
              </Button>
            ) : null}
            {["failed", "cancelled", "expired"].includes(job.status) ? (
              <Button variant="outline" onClick={() => void act("retry")} disabled={busy}>
                <RotateCcw /> Retry
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => void act("delete")} disabled={busy}>
              <Trash2 /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {job.result?.outputs && job.result.outputs.length > 0 ? (
        <Card>
          <CardContent className="space-y-3 pt-5">
            <p className="text-sm font-medium">Outputs</p>
            {job.result.outputs.map((o, i) => (
              <a
                key={i}
                href={`/api/v1/files/${String(o.fileId)}/download`}
                className="flex items-center gap-3 rounded-xl border bg-background px-4 py-2.5 text-sm transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4 text-fm-accent" />
                <span className="min-w-0 flex-1 truncate">{o.fileName}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(Number(o.sizeBytes))}</span>
              </a>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-2 pt-5">
          <p className="text-sm font-medium">Files</p>
          {job.files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-xl border px-4 py-2 text-sm">
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium uppercase text-muted-foreground">{f.kind}</span>
              <span className="min-w-0 flex-1 truncate">{f.label}</span>
              <span className="text-xs text-muted-foreground">{f.sizeBytes != null ? formatBytes(f.sizeBytes) : "—"}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
