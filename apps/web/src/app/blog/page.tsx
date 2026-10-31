import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Footer } from "@/components/marketing/footer";
import { Card } from "@/components/ui/card";
import { BLOG_POSTS } from "@/lib/blog-posts";

export const metadata: Metadata = { title: "Blog", description: "Guides and explainers about file formats, PDFs, images, and productivity." };

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-fm-bg">
      <MarketingNav />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Resources</h1>
        <p className="mt-3 text-muted-foreground">Guides, explainers, and tips — no jargon.</p>
        <div className="mt-10 space-y-4">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="p-6 transition-all hover:shadow-lift hover:-translate-y-0.5">
                <p className="text-xs text-muted-foreground">{post.date} · {post.readingTime}</p>
                <h2 className="mt-2 text-lg font-semibold">{post.title}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{post.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
