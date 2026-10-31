import type { PlanRow } from "@filemorph/shared";

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan_code: string;
  is_admin: boolean;
  suspended: boolean;
  suspension_reason: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  provider: string;
  provider_subscription_id: string | null;
  provider_customer_id: string | null;
  plan_code: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  next_billed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileRow {
  id: string;
  user_id: string | null;
  owner_token: string | null;
  bucket: string;
  storage_path: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  sha256: string | null;
  width: number | null;
  height: number | null;
  page_count: number | null;
  status: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobRow {
  id: string;
  user_id: string | null;
  owner_token: string | null;
  tool_code: string;
  status: string;
  queue_name: string;
  priority: number;
  input_total_bytes: number;
  output_total_bytes: number;
  settings: Record<string, unknown>;
  result: { outputs: Array<Record<string, unknown>> } | null;
  error_code: string | null;
  error_message: string | null;
  attempts: number;
  max_attempts: number;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobFileRow {
  id: string;
  job_id: string;
  file_id: string | null;
  kind: "input" | "output";
  sequence: number;
  label: string | null;
  bucket: string;
  storage_path: string | null;
  content_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  page: number | null;
  created_at: string;
}

export interface UsageRow {
  user_id: string | null;
  owner_token: string | null;
  job_id: string;
  tool_code: string;
  bytes_processed: number;
  credits_used: number;
  created_at: string;
}

export interface PaymentEventRow {
  provider: string;
  provider_event_id: string;
  event_type: string;
  payload: unknown;
  status: string;
  received_at: string;
  processed_at: string | null;
}

export interface PreferencesRow {
  user_id: string;
  theme: string;
  marketing_opt_in: boolean;
  notify_job_completion: boolean;
  notify_product_updates: boolean;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface TicketRow {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalUsers: number;
  newRegistrations7d: number;
  activeSubscriptions: number;
  monthlyRevenueUsd: number;
  totalJobs: number;
  failedJobs24h: number;
  queuedJobs: number;
  processingJobs: number;
  storageBytes: number;
  totalFiles: number;
  openTickets: number;
}

export interface UsageCounts {
  usedMonthly: number;
  usedDaily: number;
}

export interface ReserveResult {
  ok: boolean;
  reason?: string;
}

export interface DemoUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface DemoSession {
  token: string;
  userId: string;
  createdAt: string;
}

export type PlanPatch = Partial<
  Pick<
    PlanRow,
    | "price_monthly_usd"
    | "price_yearly_usd"
    | "monthly_job_quota"
    | "daily_job_quota"
    | "max_batch_size"
    | "max_file_bytes"
    | "batch_enabled"
    | "advanced_compression"
    | "priority"
    | "retention_hours"
    | "is_active"
  >
>;

export interface DataStore {
  mode: "prod" | "demo";

  // Demo-only auth (prod uses Supabase Auth)
  demoSignUp(email: string, password: string, fullName?: string): Promise<{ userId?: string; error?: string }>;
  demoSignIn(email: string, password: string): Promise<{ userId?: string; error?: string }>;
  demoIssueToken(userId: string): string;
  demoVerifyToken(token: string | undefined | null): Promise<string | null>;
  demoSignOut(token: string | undefined | null): Promise<void>;

  getUserById(id: string): Promise<{ id: string; email: string } | null>;

  getProfile(userId: string): Promise<(ProfileRow & { plan: PlanRow }) | null>;
  getProfileByEmail(email: string): Promise<ProfileRow | null>;
  updateProfile(userId: string, patch: { fullName?: string; avatarUrl?: string | null }): Promise<ProfileRow | null>;
  isAdmin(userId: string): Promise<boolean>;
  suspendUser(userId: string, suspended: boolean, reason?: string): Promise<void>;
  listUsers(q?: string): Promise<Array<ProfileRow & { plan: PlanRow }>>;
  stats(): Promise<AdminStats>;

  getPlan(code: string): Promise<PlanRow | null>;
  listPlans(): Promise<PlanRow[]>;
  updatePlan(planId: string, patch: PlanPatch): Promise<PlanRow>;

  getPreferences(userId: string): Promise<PreferencesRow | null>;
  updatePreferences(userId: string, patch: Partial<PreferencesRow>): Promise<PreferencesRow | null>;

  getSubscription(userId: string): Promise<SubscriptionRow | null>;
  upsertSubscription(userId: string, s: Partial<SubscriptionRow>): Promise<SubscriptionRow>;

  insertFile(row: Partial<FileRow>): Promise<FileRow>;
  getFile(id: string): Promise<FileRow | null>;
  getFileByStoragePath(path: string): Promise<FileRow | null>;
  listFiles(userId?: string | null, ownerToken?: string | null): Promise<FileRow[]>;
  deleteFile(id: string): Promise<void>;

  createJob(j: Partial<JobRow>): Promise<JobRow>;
  getJob(id: string): Promise<JobRow | null>;
  listJobs(userId?: string | null, ownerToken?: string | null, opts?: { status?: string; limit?: number }): Promise<JobRow[]>;
  updateJob(id: string, patch: Partial<JobRow>): Promise<JobRow | null>;
  deleteJob(id: string): Promise<void>;
  insertJobFiles(rows: Array<Partial<JobFileRow>>): Promise<void>;
  listJobFiles(jobId: string): Promise<JobFileRow[]>;

  usageCounts(userId?: string | null, ownerToken?: string | null): Promise<UsageCounts>;
  recordUsage(row: UsageRow): Promise<void>;
  reserveJob(userId: string | null, ownerToken: string | null, jobId: string, toolCode: string, bytes: number): Promise<ReserveResult>;

  createTicket(t: Partial<TicketRow>): Promise<TicketRow>;
  listTickets(status?: string): Promise<TicketRow[]>;
  updateTicket(id: string, status: string): Promise<void>;

  insertPaymentEvent(ev: PaymentEventRow): Promise<boolean>;
  listPaymentEvents(): Promise<PaymentEventRow[]>;

  logAudit(a: { actorId?: string; action: string; resource?: string; resourceId?: string; ip?: string; metadata?: unknown }): Promise<void>;
}
