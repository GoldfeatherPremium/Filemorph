import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { PlanRow } from "@filemorph/shared";
import { GUEST_DAILY_JOBS } from "@filemorph/shared";
import type {
  AdminStats,
  DataStore,
  DemoSession,
  DemoUser,
  FileRow,
  JobFileRow,
  JobRow,
  PaymentEventRow,
  PlanPatch,
  PreferencesRow,
  ProfileRow,
  ReserveResult,
  SubscriptionRow,
  TicketRow,
  UsageCounts,
  UsageRow,
} from "@/lib/db/types";
import { demoDataDir } from "@/lib/storage";

const SEED_PLANS: PlanRow[] = [
  { id: "p-free", code: "free", name: "Free", description: "For occasional transformations, at no cost.", price_monthly_usd: 0, price_yearly_usd: 0, monthly_job_quota: null, daily_job_quota: 10, max_batch_size: 1, max_file_bytes: 20 * 1024 * 1024, batch_enabled: false, advanced_compression: false, priority: 0, retention_hours: 24, sort_order: 1, is_active: true },
  { id: "p-plus", code: "plus", name: "Plus", description: "For active creators who need batches and more headroom.", price_monthly_usd: 4.99, price_yearly_usd: 49.99, monthly_job_quota: 300, daily_job_quota: null, max_batch_size: 20, max_file_bytes: 100 * 1024 * 1024, batch_enabled: true, advanced_compression: false, priority: 1, retention_hours: 168, sort_order: 2, is_active: true },
  { id: "p-pro", code: "pro", name: "Pro", description: "For professionals who need speed, scale, and advanced control.", price_monthly_usd: 9.99, price_yearly_usd: 99.99, monthly_job_quota: 1500, daily_job_quota: null, max_batch_size: 50, max_file_bytes: 250 * 1024 * 1024, batch_enabled: true, advanced_compression: true, priority: 2, retention_hours: 720, sort_order: 3, is_active: true },
];

function uuid(): string {
  return crypto.randomUUID();
}
function nowIso(): string {
  return new Date().toISOString();
}
function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 32).toString("hex");
}

interface Snapshot {
  users: Record<string, DemoUser>;
  sessions: Record<string, DemoSession>;
  profiles: Record<string, ProfileRow>;
  plans: Record<string, PlanRow>;
  subscriptions: Record<string, SubscriptionRow>;
  files: Record<string, FileRow>;
  jobs: Record<string, JobRow>;
  jobFiles: Record<string, JobFileRow>;
  usage: UsageRow[];
  prefs: Record<string, PreferencesRow>;
  tickets: Record<string, TicketRow>;
  payments: Record<string, PaymentEventRow>;
  audit: Array<Record<string, unknown>>;
  seq: number;
}

const DEFAULT_SNAPSHOT = (): Snapshot => ({
  users: {},
  sessions: {},
  profiles: {},
  plans: Object.fromEntries(SEED_PLANS.map((p) => [p.id, structuredClone(p)])),
  subscriptions: {},
  files: {},
  jobs: {},
  jobFiles: {},
  usage: [],
  prefs: {},
  tickets: {},
  payments: {},
  audit: [],
  seq: 1,
});

export class DemoStore implements DataStore {
  mode = "demo" as const;
  private state: Snapshot;
  private file: string | null = null;

  constructor(persistFile?: string) {
    this.state = DEFAULT_SNAPSHOT();
    this.file = persistFile ?? null;
  }

  async init(): Promise<void> {
    if (this.file) {
      try {
        const raw = await fs.readFile(this.file, "utf8");
        this.state = { ...DEFAULT_SNAPSHOT(), ...JSON.parse(raw) };
      } catch {
        await this.persist();
      }
    }
  }

  private async persist(): Promise<void> {
    if (!this.file) return;
    try {
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      await fs.writeFile(this.file, JSON.stringify(this.state, null, 2), "utf8");
    } catch {
      /* non-fatal */
    }
  }

  private async mutate<T>(fn: () => T): Promise<T> {
    const out = fn();
    await this.persist();
    return out;
  }

  // ---- Demo auth ----
  async demoSignUp(email: string, password: string, fullName?: string) {
    const key = email.toLowerCase().trim();
    if (this.state.users[key]) return { error: "An account with this email already exists." };
    const salt = randomBytes(16).toString("hex");
    const id = uuid();
    const user: DemoUser = { id, email: key, passwordHash: hashPassword(password, salt), salt, createdAt: nowIso() };
    await this.mutate(() => {
      this.state.users[key] = user;
      const isFirst = Object.keys(this.state.profiles).length === 0;
      this.state.profiles[id] = {
        id,
        email: key,
        full_name: fullName ?? null,
        avatar_url: null,
        plan_code: "free",
        is_admin: isFirst,
        suspended: false,
        suspension_reason: null,
        last_login_at: nowIso(),
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      this.state.prefs[id] = {
        user_id: id,
        theme: "light",
        marketing_opt_in: false,
        notify_job_completion: true,
        notify_product_updates: false,
        locale: "en",
        created_at: nowIso(),
        updated_at: nowIso(),
      };
    });
    return { userId: id };
  }

  async demoSignIn(email: string, password: string) {
    const key = email.toLowerCase().trim();
    const user = this.state.users[key];
    if (!user) return { error: "No account found with this email." };
    const hash = hashPassword(password, user.salt);
    if (!timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(user.passwordHash, "hex"))) {
      return { error: "Incorrect password." };
    }
    await this.mutate(() => {
      const p = this.state.profiles[user.id];
      if (p) p.last_login_at = nowIso();
    });
    return { userId: user.id };
  }

  demoIssueToken(userId: string): string {
    const token = randomBytes(24).toString("hex");
    this.state.sessions[token] = { token, userId, createdAt: nowIso() };
    return token;
  }

  async demoVerifyToken(token: string | null | undefined) {
    if (!token) return null;
    const s = this.state.sessions[token];
    if (!s) return null;
    const ageMs = Date.now() - new Date(s.createdAt).getTime();
    if (ageMs > 1000 * 60 * 60 * 24 * 30) return null;
    return s.userId;
  }

  async demoSignOut(token: string | null | undefined) {
    if (!token) return;
    delete this.state.sessions[token];
    await this.persist();
  }

  async getUserById(id: string) {
    for (const u of Object.values(this.state.users)) {
      if (u.id === id) return { id: u.id, email: u.email };
    }
    return null;
  }

  // ---- Profiles ----
  private getPlanRow(code: string): PlanRow {
    return this.state.plans[code] ?? this.state.plans.free;
  }

  async getProfile(userId: string) {
    const p = this.state.profiles[userId];
    if (!p) return null;
    return { ...structuredClone(p), plan: structuredClone(this.getPlanRow(p.plan_code)) };
  }

  async getProfileByEmail(email: string) {
    const key = email.toLowerCase().trim();
    for (const p of Object.values(this.state.profiles)) {
      if (p.email === key) return structuredClone(p);
    }
    return null;
  }

  async updateProfile(userId: string, patch: { fullName?: string; avatarUrl?: string | null }) {
    const p = this.state.profiles[userId];
    if (!p) return null;
    await this.mutate(() => {
      if (patch.fullName !== undefined) p.full_name = patch.fullName || null;
      if (patch.avatarUrl !== undefined) p.avatar_url = patch.avatarUrl || null;
      p.updated_at = nowIso();
    });
    return structuredClone(p);
  }

  async isAdmin(userId: string) {
    return Boolean(this.state.profiles[userId]?.is_admin);
  }

  async suspendUser(userId: string, suspended: boolean, reason?: string) {
    await this.mutate(() => {
      const p = this.state.profiles[userId];
      if (p) {
        p.suspended = suspended;
        p.suspension_reason = suspended ? (reason ?? null) : null;
        p.updated_at = nowIso();
      }
    });
  }

  async listUsers(q?: string) {
    const all = Object.values(this.state.profiles).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const filtered = q
      ? all.filter((p) => p.email.includes(q.toLowerCase()) || p.full_name?.toLowerCase().includes(q.toLowerCase()))
      : all;
    return filtered.map((p) => ({ ...structuredClone(p), plan: structuredClone(this.getPlanRow(p.plan_code)) }));
  }

  async stats(): Promise<AdminStats> {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;
    const profiles = Object.values(this.state.profiles);
    const subs = Object.values(this.state.subscriptions).filter((s) => s.status === "active");
    const jobs = Object.values(this.state.jobs);
    const failed24h = jobs.filter((j) => j.status === "failed" && j.updated_at && now - new Date(j.updated_at).getTime() < day).length;
    const storageBytes = Object.values(this.state.files).reduce((s, f) => s + (f.size_bytes || 0), 0);
    const revenue = subs.reduce((s, sub) => s + Number(this.getPlanRow(sub.plan_code).price_monthly_usd || 0), 0);
    return {
      totalUsers: profiles.length,
      newRegistrations7d: profiles.filter((p) => now - new Date(p.created_at).getTime() < week).length,
      activeSubscriptions: subs.length,
      monthlyRevenueUsd: Math.round(revenue * 100) / 100,
      totalJobs: jobs.length,
      failedJobs24h: failed24h,
      queuedJobs: jobs.filter((j) => j.status === "queued").length,
      processingJobs: jobs.filter((j) => j.status === "processing").length,
      storageBytes,
      totalFiles: Object.keys(this.state.files).length,
      openTickets: Object.values(this.state.tickets).filter((t) => t.status === "open" || t.status === "in_progress").length,
    };
  }

  // ---- Plans ----
  async getPlan(code: string) {
    const p = this.state.plans[code];
    return p ? structuredClone(p) : null;
  }

  async listPlans() {
    return Object.values(this.state.plans)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => structuredClone(p));
  }

  async updatePlan(planId: string, patch: PlanPatch) {
    const plan = this.state.plans[planId];
    if (!plan) throw new Error("Plan not found");
    await this.mutate(() => {
      Object.assign(plan, patch);
    });
    return structuredClone(plan);
  }

  // ---- Preferences ----
  async getPreferences(userId: string) {
    const p = this.state.prefs[userId];
    return p ? structuredClone(p) : null;
  }

  async updatePreferences(userId: string, patch: Partial<PreferencesRow>) {
    const p = this.state.prefs[userId];
    if (!p) return null;
    await this.mutate(() => {
      Object.assign(p, patch, { updated_at: nowIso() });
    });
    return structuredClone(p);
  }

  // ---- Subscriptions ----
  async getSubscription(userId: string) {
    const subs = Object.values(this.state.subscriptions).filter((s) => s.user_id === userId);
    const active = subs.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    return active ? structuredClone(active) : null;
  }

  async upsertSubscription(userId: string, s: Partial<SubscriptionRow>) {
    const existing = Object.values(this.state.subscriptions).find(
      (x) => x.user_id === userId && (!s.provider_subscription_id || x.provider_subscription_id === s.provider_subscription_id),
    );
    let rowId = existing?.id;
    await this.mutate(() => {
      if (existing) {
        Object.assign(existing, s, { updated_at: nowIso() });
        rowId = existing.id;
      } else {
        const row: SubscriptionRow = {
          id: uuid(),
          user_id: userId,
          provider: s.provider ?? "paddle",
          provider_subscription_id: s.provider_subscription_id ?? null,
          provider_customer_id: s.provider_customer_id ?? null,
          plan_code: s.plan_code ?? "free",
          status: s.status ?? "active",
          current_period_start: s.current_period_start ?? null,
          current_period_end: s.current_period_end ?? null,
          cancel_at_period_end: s.cancel_at_period_end ?? false,
          next_billed_at: s.next_billed_at ?? null,
          created_at: nowIso(),
          updated_at: nowIso(),
        };
        this.state.subscriptions[row.id] = row;
        rowId = row.id;
        if (s.plan_code) {
          const p = this.state.profiles[userId];
          if (p) {
            p.plan_code = s.plan_code;
            p.updated_at = nowIso();
          }
        }
      }
    });
    const row = this.state.subscriptions[rowId!];
    return structuredClone(row);
  }

  // ---- Files ----
  async insertFile(row: Partial<FileRow>) {
    const full: FileRow = {
      id: uuid(),
      user_id: row.user_id ?? null,
      owner_token: row.owner_token ?? null,
      bucket: row.bucket ?? "user-files",
      storage_path: row.storage_path!,
      filename: row.filename!,
      content_type: row.content_type!,
      size_bytes: row.size_bytes ?? 0,
      sha256: row.sha256 ?? null,
      width: row.width ?? null,
      height: row.height ?? null,
      page_count: row.page_count ?? null,
      status: row.status ?? "ready",
      expires_at: row.expires_at ?? null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    await this.mutate(() => {
      this.state.files[full.id] = full;
    });
    return structuredClone(full);
  }

  async getFile(id: string) {
    const f = this.state.files[id];
    return f ? structuredClone(f) : null;
  }

  async getFileByStoragePath(p: string) {
    for (const f of Object.values(this.state.files)) {
      if (f.storage_path === p) return structuredClone(f);
    }
    return null;
  }

  async listFiles(userId?: string | null, ownerToken?: string | null) {
    const list = Object.values(this.state.files)
      .filter((f) => (userId ? f.user_id === userId : f.owner_token === ownerToken))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return list.map((f) => structuredClone(f));
  }

  async deleteFile(id: string) {
    await this.mutate(() => {
      delete this.state.files[id];
    });
  }

  // ---- Jobs ----
  async createJob(j: Partial<JobRow>) {
    const full: JobRow = {
      id: uuid(),
      user_id: j.user_id ?? null,
      owner_token: j.owner_token ?? null,
      tool_code: j.tool_code!,
      status: j.status ?? "queued",
      queue_name: j.queue_name ?? "processing",
      priority: j.priority ?? 0,
      input_total_bytes: j.input_total_bytes ?? 0,
      output_total_bytes: j.output_total_bytes ?? 0,
      settings: j.settings ?? {},
      result: j.result ?? null,
      error_code: j.error_code ?? null,
      error_message: j.error_message ?? null,
      attempts: j.attempts ?? 0,
      max_attempts: j.max_attempts ?? 3,
      started_at: j.started_at ?? null,
      completed_at: j.completed_at ?? null,
      cancelled_at: j.cancelled_at ?? null,
      expires_at: j.expires_at ?? null,
      progress_pct: j.progress_pct ?? 0,
      stage: j.stage ?? null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    await this.mutate(() => {
      this.state.jobs[full.id] = full;
    });
    return structuredClone(full);
  }

  async getJob(id: string) {
    const j = this.state.jobs[id];
    return j ? structuredClone(j) : null;
  }

  async listJobs(userId?: string | null, ownerToken?: string | null, opts?: { status?: string; limit?: number }) {
    let list = Object.values(this.state.jobs)
      .filter((j) => (userId ? j.user_id === userId : j.owner_token === ownerToken))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (opts?.status) list = list.filter((j) => j.status === opts.status);
    if (opts?.limit) list = list.slice(0, opts.limit);
    return list.map((j) => structuredClone(j));
  }

  async updateJob(id: string, patch: Partial<JobRow>) {
    const j = this.state.jobs[id];
    if (!j) return null;
    await this.mutate(() => {
      Object.assign(j, patch, { updated_at: nowIso() });
    });
    return structuredClone(j);
  }

  async deleteJob(id: string) {
    await this.mutate(() => {
      delete this.state.jobs[id];
      for (const k of Object.keys(this.state.jobFiles)) {
        if (this.state.jobFiles[k].job_id === id) delete this.state.jobFiles[k];
      }
    });
  }

  async insertJobFiles(rows: Array<Partial<JobFileRow>>) {
    await this.mutate(() => {
      for (const r of rows) {
        const row: JobFileRow = {
          id: uuid(),
          job_id: r.job_id!,
          file_id: r.file_id ?? null,
          kind: r.kind ?? "input",
          sequence: r.sequence ?? 0,
          label: r.label ?? null,
          bucket: r.bucket ?? "user-files",
          storage_path: r.storage_path ?? null,
          content_type: r.content_type ?? null,
          size_bytes: r.size_bytes ?? null,
          width: r.width ?? null,
          height: r.height ?? null,
          page: r.page ?? null,
          created_at: nowIso(),
        };
        this.state.jobFiles[row.id] = row;
      }
    });
  }

  async listJobFiles(jobId: string) {
    return Object.values(this.state.jobFiles)
      .filter((f) => f.job_id === jobId)
      .sort((a, b) => a.sequence - b.sequence)
      .map((f) => structuredClone(f));
  }

  // ---- Usage ----
  async usageCounts(userId?: string | null, ownerToken?: string | null): Promise<UsageCounts> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
    let usedMonthly = 0;
    let usedDaily = 0;
    let bytesMonth = 0;
    let jobs7d = 0;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const u of this.state.usage) {
      const match = userId ? u.user_id === userId : u.owner_token === ownerToken;
      if (!match) continue;
      const t = new Date(u.created_at).getTime();
      if (t >= startOfMonth.getTime()) usedMonthly++;
      if (t >= startOfDay.getTime()) usedDaily++;
      if (t >= startOfMonth.getTime()) bytesMonth += Number(u.bytes_processed ?? 0);
      if (t >= weekAgo) jobs7d++;
    }
    return { usedMonthly, usedDaily, totalBytesProcessedMonth: bytesMonth, jobsLast7Days: jobs7d };
  }

  async recordUsage(row: UsageRow) {
    await this.mutate(() => {
      this.state.usage.push({ ...row, created_at: row.created_at ?? nowIso() });
    });
  }

  async reserveJob(userId: string | null, ownerToken: string | null, jobId: string, toolCode: string, bytes: number): Promise<ReserveResult> {
    if (!userId) {
      const { usedDaily } = await this.usageCounts(null, ownerToken);
      if (usedDaily >= GUEST_DAILY_JOBS) return { ok: false, reason: "daily_limit" };
      await this.recordUsage({ user_id: null, owner_token: ownerToken, job_id: jobId, tool_code: toolCode, bytes_processed: bytes, credits_used: 1, created_at: nowIso() });
      return { ok: true };
    }
    const profile = this.state.profiles[userId];
    if (!profile) return { ok: false, reason: "no_plan" };
    if (profile.suspended) return { ok: false, reason: "suspended" };
    const plan = this.getPlanRow(profile.plan_code);
    if (!plan.is_active) return { ok: false, reason: "no_plan" };
    const { usedMonthly, usedDaily } = await this.usageCounts(userId, null);
    if (plan.monthly_job_quota !== null && usedMonthly >= plan.monthly_job_quota) return { ok: false, reason: "monthly_limit" };
    if (plan.daily_job_quota !== null && usedDaily >= plan.daily_job_quota) return { ok: false, reason: "daily_limit" };
    await this.recordUsage({ user_id: userId, owner_token: null, job_id: jobId, tool_code: toolCode, bytes_processed: bytes, credits_used: 1, created_at: nowIso() });
    return { ok: true };
  }

  // ---- Tickets ----
  async createTicket(t: Partial<TicketRow>) {
    const row: TicketRow = {
      id: uuid(),
      user_id: t.user_id ?? null,
      email: t.email!,
      subject: t.subject!,
      message: t.message!,
      category: t.category ?? "general",
      status: "open",
      priority: t.priority ?? "normal",
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    await this.mutate(() => {
      this.state.tickets[row.id] = row;
    });
    return structuredClone(row);
  }

  async listTickets(status?: string) {
    let list = Object.values(this.state.tickets).sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (status) list = list.filter((t) => t.status === status);
    return list.map((t) => structuredClone(t));
  }

  async updateTicket(id: string, status: string) {
    await this.mutate(() => {
      const t = this.state.tickets[id];
      if (t) {
        t.status = status;
        t.updated_at = nowIso();
      }
    });
  }

  // ---- Payments ----
  async insertPaymentEvent(ev: PaymentEventRow): Promise<boolean> {
    let inserted = true;
    await this.mutate(() => {
      if (this.state.payments[ev.provider_event_id]) {
        inserted = false;
        return;
      }
      this.state.payments[ev.provider_event_id] = { ...ev, received_at: ev.received_at ?? nowIso() };
    });
    return inserted;
  }

  async listPaymentEvents() {
    return Object.values(this.state.payments).sort((a, b) => b.received_at.localeCompare(a.received_at));
  }

  async logAudit(a: { actorId?: string; action: string; resource?: string; resourceId?: string; ip?: string; metadata?: unknown }) {
    await this.mutate(() => {
      this.state.audit.push({
        id: uuid(),
        actor_id: a.actorId ?? null,
        action: a.action,
        resource: a.resource ?? null,
        resource_id: a.resourceId ?? null,
        ip: a.ip ?? null,
        metadata: a.metadata ?? null,
        created_at: nowIso(),
      });
    });
  }
}

const g = globalThis as unknown as { __fmDemoStore?: DemoStore };

export function getDemoStore(): DemoStore {
  if (!g.__fmDemoStore) {
    g.__fmDemoStore = new DemoStore(path.join(demoDataDir(), "demo-store.json"));
  }
  return g.__fmDemoStore;
}
