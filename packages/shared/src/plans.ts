import type { PlanCode } from "./constants";
import type { ToolDef } from "./tools";

export interface PlanRow {
  id: string;
  code: PlanCode;
  name: string;
  description: string | null;
  price_monthly_usd: number | string;
  price_yearly_usd: number | string;
  monthly_job_quota: number | null;
  daily_job_quota: number | null;
  max_batch_size: number;
  max_file_bytes: number;
  batch_enabled: boolean;
  advanced_compression: boolean;
  priority: number;
  retention_hours: number;
  sort_order: number;
  is_active: boolean;
}

export interface Entitlements {
  planCode: PlanCode;
  planName: string;
  monthlyJobQuota: number | null;
  dailyJobQuota: number | null;
  maxBatchSize: number;
  maxFileBytes: number;
  batchEnabled: boolean;
  advancedCompression: boolean;
  priority: number;
  retentionHours: number;
}

export function toEntitlements(plan: Pick<PlanRow, "code" | "name" | "monthly_job_quota" | "daily_job_quota" | "max_batch_size" | "max_file_bytes" | "batch_enabled" | "advanced_compression" | "priority" | "retention_hours">): Entitlements {
  return {
    planCode: plan.code,
    planName: plan.name,
    monthlyJobQuota: plan.monthly_job_quota,
    dailyJobQuota: plan.daily_job_quota,
    maxBatchSize: plan.max_batch_size,
    maxFileBytes: plan.max_file_bytes,
    batchEnabled: plan.batch_enabled,
    advancedCompression: plan.advanced_compression,
    priority: plan.priority,
    retentionHours: plan.retention_hours,
  };
}

export const FREE_ENTITLEMENTS: Entitlements = {
  planCode: "free",
  planName: "Free",
  monthlyJobQuota: null,
  dailyJobQuota: 10,
  maxBatchSize: 1,
  maxFileBytes: 20 * 1024 * 1024,
  batchEnabled: false,
  advancedCompression: false,
  priority: 0,
  retentionHours: 24,
};

export interface CheckResult {
  ok: boolean;
  reason?: string;
}

export function checkToolEligibility(ent: Entitlements, tool: ToolDef): CheckResult {
  if (tool.supportsBatch && !ent.batchEnabled) {
    return { ok: false, reason: "batch_requires_plus" };
  }
  if (tool.code === "compress-pdf" && tool.settings.some((s) => s.key === "preset") && !ent.advancedCompression) {
    // Basic compression allowed on all plans; advanced presets restricted at runtime.
  }
  return { ok: true };
}

export function checkBatch(ent: Entitlements, fileCount: number, totalBytes: number): CheckResult {
  if (fileCount < 1) {
    return { ok: false, reason: "no_files" };
  }
  if (fileCount > ent.maxBatchSize) {
    return { ok: false, reason: "batch_too_large" };
  }
  if (!ent.batchEnabled && fileCount > 1) {
    return { ok: false, reason: "batch_requires_plus" };
  }
  if (totalBytes > ent.maxFileBytes * Math.max(1, fileCount)) {
    return { ok: false, reason: "size_limit" };
  }
  if (totalBytes > 2_000_000_000) {
    return { ok: false, reason: "size_limit" };
  }
  return { ok: true };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function humanizeCheckReason(reason: string | undefined, planName?: string): string {
  switch (reason) {
    case "batch_too_large":
      return `This batch exceeds your plan's limit. Upgrade to Plus or Pro for larger batches.`;
    case "batch_requires_plus":
      return `Batch processing is a Plus feature. Upgrade to unlock multi-file jobs.`;
    case "size_limit":
      return `The total file size exceeds your plan's limit. Upgrade or use smaller files.`;
    case "monthly_limit":
      return `You've reached your monthly job limit. It resets next month — or upgrade for more.`;
    case "daily_limit":
      return `You've reached today's free job limit. It resets tomorrow — or upgrade for more.`;
    case "suspended":
      return `This account is temporarily suspended. Contact support.`;
    case "no_plan":
      return `No active plan found. Contact support.`;
    default:
      return planName ? `Your ${planName} plan doesn't allow this. Upgrade for more.` : "Not allowed on your current plan.";
  }
}
