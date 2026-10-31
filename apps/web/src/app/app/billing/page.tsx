import type { Metadata } from "next";
import { getDataStore } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { BillingClient } from "@/components/app/billing-client";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const session = await requireUser();
  const store = await getDataStore();
  const [profile, plans, subscription] = await Promise.all([
    store.getProfile(session.userId),
    store.listPlans(),
    store.getSubscription(session.userId),
  ]);

  return (
    <>
      <PageHeader title="Billing" description="Manage your plan and payment method." />
      <BillingClient
        currentPlanCode={profile?.plan_code ?? "free"}
        plans={plans.map((p) => ({ ...p, price_monthly_usd: Number(p.price_monthly_usd), price_yearly_usd: Number(p.price_yearly_usd) }))}
        subscription={
          subscription
            ? {
                planCode: subscription.plan_code,
                status: subscription.status,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                providerSubscriptionId: subscription.provider_subscription_id,
              }
            : null
        }
      />
    </>
  );
}
