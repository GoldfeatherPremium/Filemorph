"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/client-api";
import { formatBytes, formatDate } from "@/lib/utils";

interface Stats {
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
  queueDepth: number;
}

interface UserRow {
  id: string;
  email: string;
  fullName: string | null;
  planCode: string;
  isAdmin: boolean;
  suspended: boolean;
  suspensionReason: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

interface PlanRow {
  id: string;
  code: string;
  name: string;
  price_monthly_usd: number;
  price_yearly_usd: number;
  monthly_job_quota: number | null;
  daily_job_quota: number | null;
  max_batch_size: number;
  max_file_bytes: number;
  batch_enabled: boolean;
  advanced_compression: boolean;
  priority: number;
  retention_hours: number;
  is_active: boolean;
}

interface TicketRow {
  id: string;
  email: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
}

export function AdminPanel() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [q, setQ] = useState("");

  const loadStats = useCallback(async () => {
    try {
      const s = await apiFetch<Stats>("/api/v1/admin/overview");
      setStats(s);
    } catch {
      /* ignore */
    }
  }, []);

  const loadUsers = useCallback(async (query = "") => {
    try {
      const rows = await apiFetch<UserRow[]>(`/api/v1/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      setUsers(rows);
    } catch {
      /* ignore */
    }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      setPlans(await apiFetch<PlanRow[]>("/api/v1/admin/plans"));
    } catch {
      /* ignore */
    }
  }, []);

  const loadTickets = useCallback(async () => {
    try {
      setTickets(await apiFetch<TicketRow[]>("/api/v1/admin/tickets"));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (tab === "users") void loadUsers(q);
    if (tab === "plans") void loadPlans();
    if (tab === "tickets") void loadTickets();
  }, [tab, q, loadUsers, loadPlans, loadTickets]);

  async function toggleSuspend(user: UserRow) {
    try {
      await apiFetch(`/api/v1/admin/users/${user.id}/suspend`, {
        method: "POST",
        body: JSON.stringify({ suspended: !user.suspended, reason: !user.suspended ? "Suspended by admin" : undefined }),
      });
      toast.success(!user.suspended ? "User suspended" : "User reinstated");
      void loadUsers(q);
    } catch {
      toast.error("Action failed");
    }
  }

  async function savePlan(plan: PlanRow, patch: Partial<PlanRow>) {
    try {
      await apiFetch("/api/v1/admin/plans", { method: "PATCH", body: JSON.stringify({ planId: plan.id, fields: patch }) });
      toast.success("Plan updated");
      void loadPlans();
    } catch {
      toast.error("Update failed");
    }
  }

  async function setTicketStatus(ticket: TicketRow, status: string) {
    try {
      await apiFetch("/api/v1/admin/tickets", { method: "PATCH", body: JSON.stringify({ ticketId: ticket.id, status }) });
      void loadTickets();
    } catch {
      toast.error("Update failed");
    }
  }

  const metricCards = stats
    ? [
        { label: "Total users", value: String(stats.totalUsers) },
        { label: "New this week", value: String(stats.newRegistrations7d) },
        { label: "Active subscriptions", value: String(stats.activeSubscriptions) },
        { label: "MRR (est.)", value: `$${stats.monthlyRevenueUsd.toFixed(2)}` },
        { label: "Jobs", value: String(stats.totalJobs) },
        { label: "Failed (24h)", value: String(stats.failedJobs24h) },
        { label: "Queued / processing", value: `${stats.queuedJobs} / ${stats.processingJobs}` },
        { label: "Storage", value: formatBytes(stats.storageBytes) },
        { label: "Open tickets", value: String(stats.openTickets) },
      ]
    : [];

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="plans">Plans</TabsTrigger>
        <TabsTrigger value="tickets">Tickets</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metricCards.map((m) => (
            <Card key={m.label}>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="mt-1 text-2xl font-semibold">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="users">
        <div className="mb-4 flex gap-2">
          <Input placeholder="Search by email or name…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Button variant="outline" onClick={() => void loadUsers(q)}><Search /></Button>
        </div>
        <Card>
          <CardContent className="divide-y p-0">
            {users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.fullName || u.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email} · joined {formatDate(u.createdAt)}</p>
                </div>
                <Badge variant="outline" className="capitalize">{u.planCode}</Badge>
                {u.isAdmin ? <Badge variant="info">Admin</Badge> : null}
                {u.suspended ? <Badge variant="destructive">Suspended</Badge> : null}
                <Button variant={u.suspended ? "outline" : "ghost"} size="sm" onClick={() => void toggleSuspend(u)}>
                  {u.suspended ? <CheckCircle2 /> : <Ban />} {u.suspended ? "Reinstate" : "Suspend"}
                </Button>
              </div>
            ))}
            {users.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No users found.</p> : null}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="plans">
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle className="capitalize">{plan.code} — {plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <LabeledInput label="Monthly price ($)" value={plan.price_monthly_usd} onChange={(v) => void savePlan(plan, { price_monthly_usd: v })} type="number" />
                <LabeledInput label="Yearly price ($)" value={plan.price_yearly_usd} onChange={(v) => void savePlan(plan, { price_yearly_usd: v })} type="number" />
                <LabeledInput label="Monthly quota" value={plan.monthly_job_quota ?? ""} onChange={(v) => void savePlan(plan, { monthly_job_quota: v ? v : null })} type="number" />
                <LabeledInput label="Daily quota" value={plan.daily_job_quota ?? ""} onChange={(v) => void savePlan(plan, { daily_job_quota: v ? v : null })} type="number" />
                <LabeledInput label="Max batch size" value={plan.max_batch_size} onChange={(v) => void savePlan(plan, { max_batch_size: Number(v) })} type="number" />
                <LabeledInput label="Max file bytes" value={plan.max_file_bytes} onChange={(v) => void savePlan(plan, { max_file_bytes: Number(v) })} type="number" />
                <LabeledInput label="Retention (hours)" value={plan.retention_hours} onChange={(v) => void savePlan(plan, { retention_hours: Number(v) })} type="number" />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">Batch enabled</span>
                  <Button size="sm" variant={plan.batch_enabled ? "default" : "outline"} onClick={() => void savePlan(plan, { batch_enabled: !plan.batch_enabled })}>
                    {plan.batch_enabled ? "On" : "Off"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Advanced compression</span>
                  <Button size="sm" variant={plan.advanced_compression ? "default" : "outline"} onClick={() => void savePlan(plan, { advanced_compression: !plan.advanced_compression })}>
                    {plan.advanced_compression ? "On" : "Off"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="tickets">
        <Card>
          <CardContent className="divide-y p-0">
            {tickets.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">{t.email} · {t.category} · {formatDate(t.created_at)}</p>
                </div>
                <Badge variant={t.status === "open" ? "warning" : t.status === "resolved" ? "success" : "outline"}>{t.status}</Badge>
                <Button size="sm" variant="outline" onClick={() => void setTicketStatus(t, t.status === "open" ? "in_progress" : t.status === "in_progress" ? "resolved" : "closed")}>
                  Advance
                </Button>
              </div>
            ))}
            {tickets.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No tickets.</p> : null}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function LabeledInput({ label, value, onChange, type }: { label: string; value: number | string; onChange: (v: number) => void; type: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <Input
        type={type}
        className="h-8 w-28 text-right"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={(e) => {
          if (Number(e.target.value) !== Number(value)) onChange(Number(e.target.value));
        }}
      />
    </div>
  );
}
