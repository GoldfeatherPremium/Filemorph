import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Footer } from "@/components/marketing/footer";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { SITE_URL } from "@filemorph/shared";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return { title: "Not found" };
  return { title: post.title, description: post.description, alternates: { canonical: `${SITE_URL}/blog/${post.slug}` } };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return notFound();

  return (
    <div className="min-h-screen bg-fm-bg">
      <MarketingNav />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">← All resources</Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{post.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{post.date} · {post.readingTime} read</p>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground">
          {post.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
