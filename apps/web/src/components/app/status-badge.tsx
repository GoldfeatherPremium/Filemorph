import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { JobStatus } from "@filemorph/shared";

const MAP: Record<JobStatus, { variant: BadgeProps["variant"]; label: string }> = {
  queued: { variant: "secondary", label: "Queued" },
  processing: { variant: "info", label: "Processing" },
  completed: { variant: "success", label: "Completed" },
  failed: { variant: "destructive", label: "Failed" },
  cancelled: { variant: "warning", label: "Cancelled" },
  expired: { variant: "outline", label: "Expired" },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const s = MAP[status] ?? { variant: "secondary" as const, label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
