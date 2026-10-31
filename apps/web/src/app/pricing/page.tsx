import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Footer } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for FileMorph. Free, Plus and Pro plans — cancel anytime.",
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "For occasional transformations, at no cost.",
    cta: "Start free",
    href: "/signup",
    features: ["10 jobs per day", "20 MB maximum file size", "Single-file processing", "Standard queue", "24-hour file retention"],
  },
  {
    name: "Plus",
    price: "$4.99",
    cadence: "/month",
    blurb: "For active creators who need batches and more headroom.",
    cta: "Choose Plus",
    href: "/signup",
    highlight: true,
    features: ["300 jobs per month", "100 MB maximum file size", "Batch processing — up to 20 files", "Priority queue", "7-day file history"],
  },
  {
    name: "Pro",
    price: "$9.99",
    cadence: "/month",
    blurb: "For professionals who need speed, scale, and advanced control.",
    cta: "Choose Pro",
    href: "/signup",
    features: ["1,500 jobs per month", "250 MB maximum file size", "Batch processing — up to 50 files", "Faster processing queue", "30-day file history", "Advanced compression presets"],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-fm-bg">
      <MarketingNav />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pricing that stays out of your way</h1>
          <p className="mt-4 text-muted-foreground">Start free. Upgrade when you need larger files, batches, or longer history. Cancel anytime.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <Card key={p.name} className={`flex flex-col p-7 ${p.highlight ? "ring-2 ring-fm-accent" : ""}`}>
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.cadence}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-fm-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-7 w-full" variant={p.highlight ? "default" : "outline"} size="lg">
                <Link href={p.href}>{p.cta}</Link>
              </Button>
            </Card>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Prices are initial proposed limits and can be adjusted by the FileMorph team. Questions?{" "}
          <Link href="/contact" className="font-medium text-foreground hover:underline">Contact us</Link>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
