import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Footer } from "@/components/marketing/footer";
import { APP_NAME, SUPPORT_EMAIL } from "@filemorph/shared";

export const metadata: Metadata = { title: "Privacy policy", description: `${APP_NAME} privacy policy.` };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-fm-bg">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. What we collect</h2>
            <p className="mt-2">When you create an account we store your email, an optional display name, and your preferences. When you upload files, we store the file bytes in private object storage for the duration of your plan&apos;s retention window.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">2. How files are handled</h2>
            <p className="mt-2">Files are processed automatically to produce your output and are used for no other purpose. We do not sell, share, or train on your files. Files are deleted automatically: guests 1 hour, Free 24 hours, Plus 7 days, Pro 30 days. Deleting a job or file from your account removes it immediately.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">3. Payments</h2>
            <p className="mt-2">Subscriptions are handled by Paddle, a PCI-compliant payment provider. We never see or store your full card details. Payment events we receive (such as subscription status changes) are used only to manage your plan entitlements.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">4. Analytics & cookies</h2>
            <p className="mt-2">We use essential cookies for authentication and guest sessions. We may collect aggregated, anonymous usage metrics to improve the product. You can opt out of marketing email at any time from Settings.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">5. Your rights</h2>
            <p className="mt-2">You can access, export, or delete your data at any time from your account. For any privacy request, email {SUPPORT_EMAIL}.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
