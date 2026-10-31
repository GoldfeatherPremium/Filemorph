import type { JobStatus } from "./constants";

export interface ProfileDTO {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  planCode: string;
  isAdmin: boolean;
  suspended: boolean;
  createdAt: string;
}

export interface FileDTO {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  pageCount: number | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface JobFileDTO {
  id: string;
  fileId: string | null;
  kind: "input" | "output";
  sequence: number;
  label: string | null;
  fileName?: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  page: number | null;
  createdAt: string;
}

export interface JobDTO {
  id: string;
  toolCode: string;
  status: JobStatus;
  inputTotalBytes: number;
  outputTotalBytes: number;
  settings: Record<string, unknown>;
  result: { outputs: Array<{ storagePath: string; filename: string; contentType: string; sizeBytes: number; width?: number | null; height?: number | null; page?: number | null }> } | null;
  errorCode: string | null;
  errorMessage: string | null;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  expiresAt: string | null;
  progressPct: number;
  stage: string | null;
  files: JobFileDTO[];
}

export interface UsageSummaryDTO {
  planCode: string;
  planName: string;
  monthlyQuota: number | null;
  dailyQuota: number | null;
  usedMonthly: number;
  usedDaily: number;
  totalBytesProcessedMonth: number;
  jobsLast7Days: number;
}

export interface SubscriptionDTO {
  provider: string;
  providerSubscriptionId: string | null;
  planCode: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface CheckoutDTO {
  url: string;
  configured: boolean;
}

export interface UploadUrlDTO {
  uploadUrl: string;
  path: string;
  token: string;
  expiresAt: string;
}

export interface ToolDTO {
  code: string;
  slug: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  icon: string;
  supportsBatch: boolean;
  batchMax: number;
  settings: Array<Record<string, unknown>>;
}
