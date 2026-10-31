"use client";

import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/client-api";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_monthly_usd: number;
  price_yearly_usd: number;
  max_batch_size: number;
  max_file_bytes: number;
  batch_enabled: boolean;
  advanced_compression: boolean;
  retention_hours: number;
}

interface BillingClientProps {
  currentPlanCode: string;
  plans: Plan[];
  subscription: { planCode: string; status: string; cancelAtPeriodEnd: boolean; providerSubscriptionId: string | null } | null;
}

const FEATURES: Record<string, string[]> = {
  free: ["10 jobs / day", "20 MB max file size", "Single-file processing", "Standard queue"],
  plus: ["300 jobs / month", "100 MB max file size", "Batch processing (up to 20 files)", "Priority queue", "7-day file history"],
  pro: ["1,500 jobs / month", "250 MB max file size", "Batch processing (up to 50 files)", "Faster queue", "30-day history", "Advanced compression presets"],
};

export function BillingClient({ currentPlanCode, plans, subscription }: BillingClientProps) {
  const [cadence, setCadence] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState<string | null>(null);

  const paid = plans.filter((p) => p.code !== "free");

  async function checkout(plan: string) {
    setBusy(plan);
    try {
      const res = await apiFetch<{ url: string; configured: boolean }>("/api/v1/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan, cadence, returnUrl: "/app/billing?checkout=success" }),
      });
      if (res.configured && res.url) {
        window.location.href = res.url;
        return;
      }
      toast.info("Billing isn't configured yet on this deployment. Check back soon — nothing has been charged.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout could not be started.");
    } finally {
      setBusy(null);
    }
  }

  async function portal() {
    setBusy("portal");
    try {
      const res = await apiFetch<{ url: string; configured: boolean; reason?: string }>("/api/v1/billing/portal", { method: "POST", body: "{}" });
      if (res.configured && res.url) {
        window.location.href = res.url;
        return;
      }
      toast.info(res.reason === "no_subscription" ? "You don't have an active paid subscription yet." : "Billing portal isn't configured yet.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Portal could not be opened.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {subscription ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="capitalize">{subscription.planCode}</Badge>
              <span className="text-sm text-muted-foreground capitalize">
                {subscription.status} · {subscription.cancelAtPeriodEnd ? "cancels at period end" : "renews automatically"}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => void portal()} disabled={busy === "portal"}>
              <ExternalLink /> Manage billing
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Tabs value={cadence} onValueChange={(v) => setCadence(v as never)}>
        <TabsList>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly <span className="text-xs text-muted-foreground">(save ~17%)</span></TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-5 lg:grid-cols-3">
        {paid.map((plan) => {
          const current = plan.code === currentPlanCode;
          const price = cadence === "monthly" ? plan.price_monthly_usd : plan.price_yearly_usd;
          return (
            <Card key={plan.code} className={cn("relative flex flex-col p-6", current && "ring-2 ring-fm-accent")}>
              {current ? <Badge className="absolute right-4 top-4">Current plan</Badge> : null}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">${price.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">/{cadence === "monthly" ? "month" : "year"}</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                {(FEATURES[plan.code] ?? []).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-fm-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full" variant={current ? "outline" : "default"} disabled={current} onClick={() => void checkout(plan.code)}>
                {busy === plan.code ? "Redirecting…" : current ? "Current plan" : `Choose ${plan.name}`}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
