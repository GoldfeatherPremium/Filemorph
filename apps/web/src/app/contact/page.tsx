import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Footer } from "@/components/marketing/footer";
import { SUPPORT_EMAIL } from "@filemorph/shared";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with the FileMorph team." };

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-fm-bg">
      <MarketingNav />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Contact us</h1>
        <p className="mt-3 text-muted-foreground">We read every message. For account or billing help, the fastest route is the support form in your workspace.</p>
        <div className="mt-10 space-y-4">
          <Card className="flex items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fm-accent/12 text-fm-accent"><Mail className="h-5 w-5" /></span>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{SUPPORT_EMAIL}</p>
              </div>
            </div>
            <Button asChild variant="outline"><a href={`mailto:${SUPPORT_EMAIL}`}>Write to us</a></Button>
          </Card>
          <Card className="p-6">
            <p className="font-medium">Already have an account?</p>
            <p className="mt-1 text-sm text-muted-foreground">Submit a ticket from your support page and we'll respond within one business day.</p>
            <Button asChild className="mt-4"><Link href="/app/support">Open support</Link></Button>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
