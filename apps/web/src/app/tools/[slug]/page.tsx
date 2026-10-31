import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { TOOL_BY_SLUG, TOOLS, SITE_URL, type ToolDef } from "@filemorph/shared";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Footer } from "@/components/marketing/footer";
import { Card, CardContent } from "@/components/ui/card";
import { ToolRunner } from "@/components/tool/tool-runner";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOL_BY_SLUG[slug];
  if (!tool) return { title: "Tool not found" };
  return {
    title: tool.seo.title,
    description: tool.seo.description,
    alternates: { canonical: `${SITE_URL}/tools/${tool.slug}` },
    openGraph: { title: tool.seo.title, description: tool.seo.description, url: `${SITE_URL}/tools/${tool.slug}`, type: "website" },
  };
}

function HowTo({ tool }: { tool: ToolDef }) {
  const steps: string[] = [
    `Upload one${tool.supportsBatch ? " or more" : ""} ${tool.extensions.join("/").toUpperCase()} file${tool.supportsBatch ? "s" : ""} using the area above.`,
    "Adjust the settings to your preference (quality, ranges, sizes, and so on).",
    "Click “Transform files” and download the finished result — we show the real output sizes.",
  ];
  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <h2 className="text-lg font-semibold">How to use {tool.name}</h2>
        <ol className="space-y-2 text-sm text-muted-foreground">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fm-accent/12 text-xs font-semibold text-fm-accent">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = TOOL_BY_SLUG[slug];
  if (!tool) return notFound();
  const others = TOOLS.filter((t) => t.code !== tool.code).slice(0, 6);

  return (
    <div className="min-h-screen bg-fm-bg">
      <MarketingNav />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-6">
              <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground">← All tools</Link>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{tool.name}</h1>
              <p className="mt-3 max-w-xl text-muted-foreground">{tool.longDescription}</p>
            </div>
            <Card className="p-6 sm:p-8">
              <CardContent className="pt-0">
                <ToolRunner tool={tool} />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <HowTo tool={tool} />
            <Card>
              <CardContent className="space-y-3 pt-5">
                <h2 className="text-sm font-semibold">Supported formats</h2>
                <div className="flex flex-wrap gap-2">
                  {tool.extensions.map((e) => (
                    <span key={e} className="rounded-full border bg-card px-3 py-1 text-xs font-medium uppercase text-muted-foreground">{e}</span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </CardContent>
            </Card>
            {tool.examples.length ? (
              <Card>
                <CardContent className="space-y-3 pt-5">
                  <h2 className="text-sm font-semibold">Example</h2>
                  {tool.examples.map((ex, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{ex.from}</span>
                      <ArrowRight className="h-4 w-4 text-fm-accent" />
                      <span className="font-medium">{ex.to}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
            <Card>
              <CardContent className="space-y-3 pt-5">
                <h2 className="text-sm font-semibold">FAQ</h2>
                {tool.faq.map((f) => (
                  <details key={f.q} className="group">
                    <summary className="cursor-pointer list-none text-sm font-medium">{f.q}</summary>
                    <p className="mt-1.5 text-sm text-muted-foreground">{f.a}</p>
                  </details>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <section className="mt-20">
          <h2 className="text-xl font-semibold tracking-tight">More tools</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((t) => (
              <Link key={t.code} href={`/tools/${t.slug}`} className="rounded-2xl border bg-card p-5 transition-all hover:shadow-lift hover:-translate-y-0.5">
                <p className="font-medium">{t.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
