import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Footer } from "@/components/marketing/footer";
import { ToolCard } from "@/components/app/tool-card";
import { PDF_TOOLS, IMAGE_TOOLS } from "@filemorph/shared";

export const metadata: Metadata = {
  title: "All tools",
  description: "Explore every FileMorph tool: merge PDF, split PDF, compress PDF, PDF to JPG, JPG to PDF, rotate, organize, PDF to text, image compressor, resizer, PNG to JPG, and cropper.",
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-fm-bg">
      <MarketingNav />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">All tools</h1>
          <p className="mt-3 text-muted-foreground">Every tool runs in your browser with private processing. No installation, no signup required for single jobs.</p>
        </div>
        <section className="mb-12">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">PDF tools</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PDF_TOOLS.map((tool) => (
              <ToolCard key={tool.code} tool={tool} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Image tools</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {IMAGE_TOOLS.map((tool) => (
              <ToolCard key={tool.code} tool={tool} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
