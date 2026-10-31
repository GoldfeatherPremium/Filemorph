import type { PlanRow } from "@filemorph/shared";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { getDemoStore } from "@/lib/demo/store";
import type {
  AdminStats,
  DataStore,
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

type SB = ReturnType<typeof getSupabaseAdmin>;

class ProdStore implements DataStore {
  mode = "prod" as const;
  private sb: SB;
  constructor() {
    this.sb = getSupabaseAdmin();
  }

  async demoSignUp(): Promise<{ error: string }> {
    return { error: "Sign up with Supabase Auth." };
  }
  async demoSignIn(): Promise<{ error: string }> {
    return { error: "Sign in with Supabase Auth." };
  }
  demoIssueToken(): string {
    throw new Error("demo sessions unavailable in production mode");
  }
  async demoVerifyToken(): Promise<string | null> {
    return null;
  }
  async demoSignOut(): Promise<void> {
    return;
  }

  async getUserById(id: string) {
    const { data } = await this.sb.from("profiles").select("id,email").eq("id", id).maybeSingle();
    return (data as { id: string; email: string } | null) ?? null;
  }

  async getProfile(userId: string) {
    const { data } = await this.sb
      .from("profiles")
      .select("*, plan:plans(*)")
      .eq("id", userId)
      .maybeSingle();
    if (!data) return null;
    return data as unknown as ProfileRow & { plan: PlanRow };
  }

  async getProfileByEmail(email: string) {
    const { data } = await this.sb.from("profiles").select("*").eq("email", email.toLowerCase()).maybeSingle();
    return (data as ProfileRow | null) ?? null;
  }

  async updateProfile(userId: string, patch: { fullName?: string; avatarUrl?: string | null }) {
    const updates: Record<string, unknown> = {};
    if (patch.fullName !== undefined) updates.full_name = patch.fullName || null;
    if (patch.avatarUrl !== undefined) updates.avatar_url = patch.avatarUrl || null;
    const { data } = await this.sb.from("profiles").update(updates).eq("id", userId).select("*").maybeSingle();
    return (data as ProfileRow | null) ?? null;
  }

  async isAdmin(userId: string) {
    const { data } = await this.sb.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
    return Boolean(data?.is_admin);
  }

  async suspendUser(userId: string, suspended: boolean, reason?: string) {
    await this.sb.from("profiles").update({ suspended, suspension_reason: suspended ? reason ?? null : null }).eq("id", userId);
  }

  async listUsers(q?: string) {
    let query = this.sb.from("profiles").select("*, plan:plans(*)").order("created_at", { ascending: false }).limit(200);
    if (q) {
      const safe = q.replace(/[%_]/g, "");
      query = query.or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%`);
    }
    const { data } = await query;
    return (data ?? []) as unknown as Array<ProfileRow & { plan: PlanRow }>;
  }

  async stats(): Promise<AdminStats> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [profiles, subs, jobs, files, tickets] = await Promise.all([
      this.sb.from("profiles").select("created_at", { count: "exact", head: true }),
      this.sb.from("subscriptions").select("plan_code", { count: "exact", head: true }).eq("status", "active"),
      this.sb.from("processing_jobs").select("status,updated_at"),
      this.sb.from("files").select("size_bytes"),
      this.sb.from("support_tickets").select("status", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
    ]);

    const newRegistrations7d = (await this.sb.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo)).count ?? 0;
    const failed24h = (jobs.data ?? []).filter((j) => j.status === "failed" && j.updated_at && j.updated_at >= dayAgo).length;

    const activePlanCodes = (subs.data ?? []).map((s) => s.plan_code as string);
    const plans = await this.listPlans();
    const revenue = activePlanCodes.reduce((sum, code) => {
      const plan = plans.find((p) => p.code === code);
      return sum + Number(plan?.price_monthly_usd ?? 0);
    }, 0);

    return {
      totalUsers: profiles.count ?? 0,
      newRegistrations7d,
      activeSubscriptions: subs.count ?? 0,
      monthlyRevenueUsd: Math.round(revenue * 100) / 100,
      totalJobs: jobs.data?.length ?? 0,
      failedJobs24h: failed24h,
      queuedJobs: (jobs.data ?? []).filter((j) => j.status === "queued").length,
      processingJobs: (jobs.data ?? []).filter((j) => j.status === "processing").length,
      storageBytes: (files.data ?? []).reduce((s, f) => s + Number(f.size_bytes ?? 0), 0),
      totalFiles: files.data?.length ?? 0,
      openTickets: tickets.count ?? 0,
    };
  }

  async getPlan(code: string) {
    const { data } = await this.sb.from("plans").select("*").eq("code", code).maybeSingle();
    return (data as PlanRow | null) ?? null;
  }

  async listPlans() {
    const { data } = await this.sb.from("plans").select("*").order("sort_order").limit(10);
    return (data ?? []) as PlanRow[];
  }

  async updatePlan(planId: string, patch: PlanPatch) {
    const { data } = await this.sb.from("plans").update(patch).eq("id", planId).select("*").maybeSingle();
    if (!data) throw new Error("Plan not found");
    return data as PlanRow;
  }

  async getPreferences(userId: string) {
    const { data } = await this.sb.from("user_preferences").select("*").eq("user_id", userId).maybeSingle();
    return (data as PreferencesRow | null) ?? null;
  }

  async updatePreferences(userId: string, patch: Partial<PreferencesRow>) {
    const { data } = await this.sb.from("user_preferences").update(patch).eq("user_id", userId).select("*").maybeSingle();
    return (data as PreferencesRow | null) ?? null;
  }

  async getSubscription(userId: string) {
    const { data } = await this.sb.from("subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    return (data as SubscriptionRow | null) ?? null;
  }

  async upsertSubscription(userId: string, s: Partial<SubscriptionRow>) {
    const payload = {
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
    };
    let res: { data: SubscriptionRow | null } = { data: null };
    const { data } = await this.sb
      .from("subscriptions")
      .upsert(payload, { onConflict: "provider_subscription_id" })
      .select("*")
      .maybeSingle();
    res = { data: data as SubscriptionRow | null };
    if (s.plan_code) {
      await this.sb.from("profiles").update({ plan_code: s.plan_code }).eq("id", userId);
    }
    return (res.data as SubscriptionRow) ?? (payload as unknown as SubscriptionRow);
  }

  async insertFile(row: Partial<FileRow>) {
    const { data } = await this.sb.from("files").insert(row).select("*").maybeSingle();
    if (!data) throw new Error("Failed to create file record");
    return data as FileRow;
  }

  async getFile(id: string) {
    const { data } = await this.sb.from("files").select("*").eq("id", id).maybeSingle();
    return (data as FileRow | null) ?? null;
  }

  async getFileByStoragePath(p: string) {
    const { data } = await this.sb.from("files").select("*").eq("storage_path", p).maybeSingle();
    return (data as FileRow | null) ?? null;
  }

  async listFiles(userId?: string | null, ownerToken?: string | null) {
    let query = this.sb.from("files").select("*").order("created_at", { ascending: false }).limit(200);
    if (userId) query = query.eq("user_id", userId);
    else query = query.eq("owner_token", ownerToken ?? "");
    const { data } = await query;
    return (data ?? []) as FileRow[];
  }

  async deleteFile(id: string) {
    await this.sb.from("files").delete().eq("id", id);
  }

  async createJob(j: Partial<JobRow>) {
    const { data } = await this.sb.from("processing_jobs").insert(j).select("*").maybeSingle();
    if (!data) throw new Error("Failed to create job");
    return data as JobRow;
  }

  async getJob(id: string) {
    const { data } = await this.sb.from("processing_jobs").select("*").eq("id", id).maybeSingle();
    return (data as JobRow | null) ?? null;
  }

  async listJobs(userId?: string | null, ownerToken?: string | null, opts?: { status?: string; limit?: number }) {
    let query = this.sb.from("processing_jobs").select("*").order("created_at", { ascending: false });
    if (userId) query = query.eq("user_id", userId);
    else query = query.eq("owner_token", ownerToken ?? "");
    if (opts?.status) query = query.eq("status", opts.status);
    if (opts?.limit) query = query.limit(opts.limit);
    const { data } = await query;
    return (data ?? []) as JobRow[];
  }

  async updateJob(id: string, patch: Partial<JobRow>) {
    const { data } = await this.sb.from("processing_jobs").update(patch).eq("id", id).select("*").maybeSingle();
    return (data as JobRow | null) ?? null;
  }

  async deleteJob(id: string) {
    await this.sb.from("processing_jobs").delete().eq("id", id);
  }

  async insertJobFiles(rows: Array<Partial<JobFileRow>>) {
    await this.sb.from("job_files").insert(rows);
  }

  async listJobFiles(jobId: string) {
    const { data } = await this.sb.from("job_files").select("*").eq("job_id", jobId).order("sequence").limit(200);
    return (data ?? []) as JobFileRow[];
  }

  async usageCounts(userId?: string | null, ownerToken?: string | null): Promise<UsageCounts> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const base = this.sb.from("usage_records").select("bytes_processed,created_at");
    let q = base;
    if (userId) q = q.eq("user_id", userId);
    else q = q.eq("owner_token", ownerToken ?? "");
    const { data } = await q;
    const rows = data ?? [];
    const monthStart = startOfMonth.toISOString();
    const dayStart = startOfDay.toISOString();
    let usedMonthly = 0;
    let usedDaily = 0;
    let totalBytesProcessedMonth = 0;
    let jobsLast7Days = 0;
    for (const r of rows) {
      const t = r.created_at as string;
      if (t >= monthStart) {
        usedMonthly++;
        totalBytesProcessedMonth += Number((r as { bytes_processed: number }).bytes_processed ?? 0);
      }
      if (t >= dayStart) usedDaily++;
      if (t >= weekAgo) jobsLast7Days++;
    }
    return { usedMonthly, usedDaily, totalBytesProcessedMonth, jobsLast7Days };
  }

  async recordUsage(row: UsageRow) {
    await this.sb.from("usage_records").insert({ ...row });
  }

  async reserveJob(userId: string | null, ownerToken: string | null, jobId: string, toolCode: string, bytes: number): Promise<ReserveResult> {
    const { data } = await this.sb.rpc("reserve_job", {
      p_user_id: userId,
      p_owner_token: ownerToken,
      p_job_id: jobId,
      p_tool_code: toolCode,
      p_bytes: bytes,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.ok) {
      return { ok: false, reason: row?.reason ?? "plan_limit" };
    }
    return { ok: true };
  }

  async createTicket(t: Partial<TicketRow>) {
    const { data } = await this.sb.from("support_tickets").insert(t).select("*").maybeSingle();
    if (!data) throw new Error("Failed to create ticket");
    return data as unknown as TicketRow;
  }

  async listTickets(status?: string) {
    let query = this.sb.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(200);
    if (status) query = query.eq("status", status);
    const { data } = await query;
    return (data ?? []) as unknown as TicketRow[];
  }

  async updateTicket(id: string, status: string) {
    await this.sb.from("support_tickets").update({ status }).eq("id", id);
  }

  async insertPaymentEvent(ev: PaymentEventRow): Promise<boolean> {
    const { error } = await this.sb.from("payment_events").upsert({ ...ev }, { onConflict: "provider_event_id" });
    if (error && String(error.message).includes("duplicate")) return false;
    return !error;
  }

  async listPaymentEvents() {
    const { data } = await this.sb.from("payment_events").select("*").order("received_at", { ascending: false }).limit(200);
    return (data ?? []) as unknown as PaymentEventRow[];
  }

  async logAudit(a: { actorId?: string; action: string; resource?: string; resourceId?: string; ip?: string; metadata?: unknown }) {
    await this.sb.from("audit_logs").insert({
      actor_id: a.actorId ?? null,
      action: a.action,
      resource: a.resource ?? null,
      resource_id: a.resourceId ?? null,
      ip: a.ip ?? null,
      metadata: a.metadata ?? null,
    });
  }
}

const g = globalThis as unknown as { __fmDataStore?: DataStore };

export async function getDataStore(): Promise<DataStore> {
  if (g.__fmDataStore) return g.__fmDataStore;
  const env = serverEnv();
  let store: DataStore;
  if (env.supabaseUrl && env.supabaseServiceRoleKey) {
    store = new ProdStore();
  } else {
    const demo = getDemoStore();
    await demo.init();
    store = demo;
  }
  g.__fmDataStore = store;
  return store;
}

export type { DataStore, AdminStats, ProfileRow, PlanRow, FileRow, JobRow, JobFileRow, SubscriptionRow, UsageCounts, TicketRow, PreferencesRow };
