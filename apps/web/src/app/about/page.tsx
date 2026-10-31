import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Footer } from "@/components/marketing/footer";
import { APP_NAME } from "@filemorph/shared";

export const metadata: Metadata = { title: "About", description: `About ${APP_NAME} — the premium file transformation workspace.` };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-fm-bg">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">We build tools we wanted to use.</h1>
        <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            {APP_NAME} started with a simple frustration: converting a file shouldn't require desktop software, sketchy
            upload sites, or a maze of tabs. So we built one clean workspace that handles the formats people actually use —
            PDFs and images — beautifully.
          </p>
          <p>
            Our team cares about craft. That means a calm interface, honest outputs (real sizes, real percentages), and
            privacy that's straightforward: files are stored privately and deleted automatically.
          </p>
          <p>
            We're a small, independent team. Every tool is built and tested by us — no fake conversions, no dark patterns.
          </p>
        </div>
        <div className="mt-10 flex gap-3">
          <Button asChild><Link href="/tools">Try the tools</Link></Button>
          <Button asChild variant="outline"><Link href="/contact">Say hello</Link></Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
