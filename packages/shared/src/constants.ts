export const APP_NAME = "FileMorph";
export const APP_TAGLINE = "Every file. Every format. One beautiful workspace.";

export const SITE_URL = "https://filemorph.com";
export const APP_URL = "https://app.filemorph.com";

export const GUEST_DAILY_JOBS = 3;
export const GUEST_DEFAULT_RETENTION_HOURS = 1; // guest files: 1 hour

export const STORAGE_BUCKET = "user-files";
export const MAX_FILE_BYTES_ABSOLUTE = 262_144_000; // 250 MB hard cap

export const JOB_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "expired",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_TERMINAL = new Set<JobStatus>(["completed", "failed", "cancelled", "expired"]);

export const PLAN_CODES = ["free", "plus", "pro"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const DOWNLOAD_URL_TTL_SECONDS = 120;
export const UPLOAD_URL_TTL_SECONDS = 600;

export const PADDLE_WEBHOOK_URL = "/api/v1/webhooks/paddle";

export const SUPPORT_EMAIL = "support@filemorph.com";

export const THROTTLE = {
  rateLimitWindowMs: 60_000,
  maxRequestsPerMinute: 90,
  maxUploadsPerMinute: 20,
  maxJobsPerMinute: 20,
};
