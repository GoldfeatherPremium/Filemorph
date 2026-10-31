import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Footer } from "@/components/marketing/footer";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "FAQ", description: "Frequently asked questions about FileMorph." };

const FAQS = [
  { q: "Is FileMorph free?", a: "Yes — the Free plan covers 10 jobs per day with 20 MB files, forever. Paid plans add batches, bigger files, priority queue, and longer retention." },
  { q: "Do I need to create an account?", a: "No. You can run single-file jobs as a guest. Files are kept for 1 hour and then deleted. An account gives you history, higher limits, and batch processing." },
  { q: "Which browsers are supported?", a: "We support the latest versions of Chrome, Safari, Firefox, and Edge on desktop and mobile." },
  { q: "What happens to my files after processing?", a: "Files are stored in private object storage and auto-deleted: guests 1 hour, Free 24 hours, Plus 7 days, Pro 30 days. You can delete any file or job early from your Files/History pages." },
  { q: "Is my data used for training?", a: "Never. We do not train models on your files or share them with third parties." },
  { q: "Can I process multiple files at once?", a: "Batch processing is available on Plus and Pro plans — up to 20 or 50 files per job respectively." },
  { q: "What is the maximum file size?", a: "20 MB on Free, 100 MB on Plus, and 250 MB on Pro. There is a hard 250 MB cap for all accounts." },
  { q: "Do you store payment details?", a: "No. Payments are processed by Paddle. We only store subscription status and basic event metadata." },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-fm-bg">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h1>
        <p className="mt-3 text-muted-foreground">Can't find an answer? <Link href="/contact" className="font-medium text-foreground hover:underline">Contact us</Link>.</p>
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <Card key={i} className="p-5">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                  {f.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
