import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Footer } from "@/components/marketing/footer";
import { APP_NAME, SUPPORT_EMAIL } from "@filemorph/shared";

export const metadata: Metadata = { title: "Terms of service", description: `${APP_NAME} terms of service.` };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-fm-bg">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. Acceptance</h2>
            <p className="mt-2">By accessing or using {APP_NAME}, you agree to these terms. If you don't agree, don't use the service.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">2. Use of the service</h2>
            <p className="mt-2">You may use {APP_NAME} to transform files you have the right to process. You must not upload malware, or use the service to infringe others' rights or violate law. Free and paid plans include usage limits described on the pricing page; we may enforce them automatically.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">3. Accounts & billing</h2>
            <p className="mt-2">You're responsible for keeping your credentials safe. Paid plans renew until cancelled; Paddle processes payments. We don't guarantee that any particular transformation will produce a specific size or quality — we show real results.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">4. Limitation of liability</h2>
            <p className="mt-2">The service is provided “as is” without warranties. To the maximum extent permitted by law, we're not liable for indirect or consequential damages. Check outputs for accuracy on material documents.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">5. Changes</h2>
            <p className="mt-2">We may update these terms. Material changes will be announced. Continued use means acceptance. Questions: {SUPPORT_EMAIL}.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
