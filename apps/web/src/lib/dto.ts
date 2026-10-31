import type { FileRow, JobFileRow, JobRow, ProfileRow, SubscriptionRow, UsageCounts } from "@/lib/db/types";
import type { PlanRow } from "@filemorph/shared";
import type { FileDTO, JobDTO, JobFileDTO, ProfileDTO, SubscriptionDTO, UsageSummaryDTO } from "@filemorph/shared";
import { toEntitlements } from "@filemorph/shared";

export function toProfileDTO(p: ProfileRow): ProfileDTO {
  return {
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    avatarUrl: p.avatar_url,
    planCode: p.plan_code,
    isAdmin: p.is_admin,
    suspended: p.suspended,
    createdAt: p.created_at,
  };
}

export function toFileDTO(f: FileRow): FileDTO {
  return {
    id: f.id,
    filename: f.filename,
    contentType: f.content_type,
    sizeBytes: Number(f.size_bytes),
    width: f.width,
    height: f.height,
    pageCount: f.page_count,
    status: f.status,
    createdAt: f.created_at,
    expiresAt: f.expires_at,
  };
}

export function toJobFileDTO(f: JobFileRow): JobFileDTO {
  return {
    id: f.id,
    fileId: f.file_id,
    kind: f.kind,
    sequence: f.sequence,
    label: f.label,
    fileName: f.label,
    contentType: f.content_type,
    sizeBytes: f.size_bytes != null ? Number(f.size_bytes) : null,
    width: f.width,
    height: f.height,
    page: f.page,
    createdAt: f.created_at,
  };
}

export function toJobDTO(j: JobRow, files: JobFileRow[]): JobDTO {
  return {
    id: j.id,
    toolCode: j.tool_code,
    status: j.status as JobDTO["status"],
    inputTotalBytes: Number(j.input_total_bytes),
    outputTotalBytes: Number(j.output_total_bytes),
    settings: j.settings,
    result: j.result,
    errorCode: j.error_code,
    errorMessage: j.error_message,
    attempts: j.attempts,
    maxAttempts: j.max_attempts,
    createdAt: j.created_at,
    startedAt: j.started_at,
    completedAt: j.completed_at,
    cancelledAt: j.cancelled_at,
    expiresAt: j.expires_at,
    files: files.map(toJobFileDTO),
  };
}

export function toSubscriptionDTO(s: SubscriptionRow): SubscriptionDTO {
  return {
    provider: s.provider,
    providerSubscriptionId: s.provider_subscription_id,
    planCode: s.plan_code,
    status: s.status,
    currentPeriodStart: s.current_period_start,
    currentPeriodEnd: s.current_period_end,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    createdAt: s.created_at,
  };
}

export function toUsageSummaryDTO(opts: {
  profile: ProfileRow;
  plan: PlanRow;
  counts: UsageCounts;
  totalBytesProcessedMonth: number;
  jobsLast7Days: number;
}): UsageSummaryDTO {
  const ent = toEntitlements(opts.plan);
  return {
    planCode: opts.profile.plan_code,
    planName: ent.planName,
    monthlyQuota: ent.monthlyJobQuota,
    dailyQuota: ent.dailyJobQuota,
    usedMonthly: opts.counts.usedMonthly,
    usedDaily: opts.counts.usedDaily,
    totalBytesProcessedMonth: opts.totalBytesProcessedMonth,
    jobsLast7Days: opts.jobsLast7Days,
  };
}
