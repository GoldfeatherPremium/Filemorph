import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ShieldCheck, Zap, Layers, FileCheck2, CloudDownload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Footer } from "@/components/marketing/footer";
import { Reveal } from "@/components/marketing/reveal";
import { ToolCard } from "@/components/app/tool-card";
import { ToolRunner } from "@/components/tool/tool-runner";
import { TOOLS, PDF_TOOLS, IMAGE_TOOLS, APP_NAME } from "@filemorph/shared";

export const metadata: Metadata = {
  title: `${APP_NAME} — Every file. Every format. One beautiful workspace.`,
  description: "Convert, compress and organize your files in seconds. Free online PDF and image tools with private, fast processing.",
};

const FORMATS = ["PDF", "JPG", "PNG", "WEBP", "TXT"];

const STEPS = [
  { title: "Upload", text: "Drag and drop your files — no signup needed for one-off jobs." },
  { title: "Transform", text: "Pick settings and process securely in our queue. Real conversions, not renamed stubs." },
  { title: "Download", text: "Grab your finished file. Everything is deleted automatically after retention." },
];

const FEATURES = [
  { icon: Layers, title: "Many formats", text: "PDF and image tools in one clean workspace." },
  { icon: Zap, title: "Fast processing", text: "A dedicated queue keeps things snappy." },
  { icon: Sparkles, title: "Simple interface", text: "No desktop install. No clutter." },
  { icon: FileCheck2, title: "Superior output", text: "We validate results — sizes and quality are real." },
  { icon: CloudDownload, title: "Secure downloads", text: "Short-lived signed download links on private storage." },
  { icon: ShieldCheck, title: "Privacy first", text: "Auto-deletion, ownership checks, and honest policies." },
];

const FAQS = [
  { q: "Do I need an account?", a: "No — you can run single-file jobs as a guest. Accounts unlock history, batch processing, and higher limits." },
  { q: "Where are my files stored?", a: "Files live in private object storage and are deleted automatically after your plan's retention window (1h guests, 24h free, 7d Plus, 30d Pro)." },
  { q: "Are my files private?", a: "Yes. We never share or train on your files. Access is strictly scoped to your account or guest token." },
  { q: "Is compression lossy?", a: "Compression re-encodes images. We always show the true before/after sizes so you decide." },
  { q: "What are the limits?", a: "Free: 10 jobs/day, 20 MB files. Plus: 300 jobs/month, batches up to 20 files. Pro: 1,500 jobs/month, batches up to 50." },
];

export default function HomePage() {
  const demoTool = IMAGE_TOOLS.find((t) => t.code === "image-compressor") ?? TOOLS[0];
  return (
    <div className="min-h-screen bg-fm-bg">
      <MarketingNav />

      {/* HERO */}
      <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-fm-accent/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <Badge variant="info" className="mb-6">Every file. Every format.</Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
              Your files. Transformed beautifully.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
              Convert, compress and organize your files in seconds. Everything you need, in one simple workspace.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/tools">Start transforming <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/tools">Explore all tools</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {FORMATS.map((f) => (
                <span key={f} className="rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
                  {f}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* LIVE DEMO */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Try it right here</h2>
              <p className="mt-2 text-muted-foreground">Upload an image and compress it — live, in your browser.</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ToolRunner tool={demoTool} />
          </Reveal>
        </div>
      </section>

      {/* TOOLS */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Twelve tools. One workspace.</h2>
                <p className="mt-2 max-w-xl text-muted-foreground">Everything from merging PDFs to cropping images — built for speed and clarity.</p>
              </div>
              <Button asChild variant="outline"><Link href="/tools">View all <ArrowRight /></Link></Button>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool, i) => (
              <Reveal key={tool.code} delay={(i % 3) * 0.05}>
                <ToolCard tool={tool} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
              <p className="mt-2 text-muted-foreground">Three steps. Usually under a minute.</p>
            </div>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <Card className="h-full p-6">
                  <span className="text-sm font-semibold text-fm-accent">0{i + 1}</span>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMPRESSION ILLUSTRATION */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <Card className="overflow-hidden">
              <CardContent className="p-8 sm:p-12">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Original</p>
                    <p className="text-3xl font-semibold">12.4 MB</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Compressed</p>
                    <p className="text-3xl font-semibold text-fm-accent">3.1 MB</p>
                  </div>
                  <Badge variant="success" className="text-sm">75% smaller</Badge>
                </div>
                <p className="mt-6 text-xs text-muted-foreground">Illustrative comparison — every job shows your real before/after sizes.</p>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight sm:text-3xl">Why FileMorph</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.06}>
                <Card className="h-full p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fm-accent/12 text-fm-accent">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <Card className="bg-[#17191C] text-white">
              <CardContent className="p-10 text-center sm:p-14">
                <ShieldCheck className="mx-auto h-10 w-10 text-fm-accent" />
                <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">Your files are yours. Always.</h2>
                <p className="mx-auto mt-4 max-w-2xl text-white/70">
                  Files are stored privately and deleted automatically — 1 hour for guests, 24 hours on Free, 7 days on Plus and 30 days on Pro.
                  We never share or train on your content.
                </p>
                <Button asChild variant="outline" className="mt-7 bg-transparent text-white hover:bg-white/10">
                  <Link href="/privacy">Read the privacy policy</Link>
                </Button>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Simple pricing</h2>
              <p className="mt-2 text-muted-foreground">Start free. Upgrade when you need more.</p>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { name: "Free", price: "$0", blurb: "For occasional transformations.", cta: "Start free", href: "/signup" },
              { name: "Plus", price: "$4.99", blurb: "For active creators. Batches, bigger files.", cta: "Choose Plus", href: "/pricing" },
              { name: "Pro", price: "$9.99", blurb: "For professionals. Speed, scale, advanced tools.", cta: "Choose Pro", href: "/pricing" },
            ].map((p, i) => (
              <Reveal key={p.name} delay={i * 0.07}>
                <Card className="h-full p-6 text-center">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="mt-1 text-3xl font-semibold">{p.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <p className="mt-2 text-sm text-muted-foreground">{p.blurb}</p>
                  <Button asChild className="mt-6 w-full" variant={p.name === "Plus" ? "default" : "outline"}>
                    <Link href={p.href}>{p.cta}</Link>
                  </Button>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight sm:text-3xl">Frequently asked</h2>
          </Reveal>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.04}>
                <details className="group rounded-2xl border bg-card p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                    {f.q}
                    <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            More questions? <Link href="/faq" className="font-medium text-foreground hover:underline">Visit the full FAQ</Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 pb-28 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Your next file transformation starts here.</h2>
            <p className="mt-4 text-muted-foreground">Join thousands of students, freelancers, and professionals.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href="/signup">Get started free</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href={PDF_TOOLS[0] ? `/tools/${PDF_TOOLS[0].slug}` : "/tools"}>Try a tool</Link></Button>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
