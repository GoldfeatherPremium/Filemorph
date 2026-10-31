import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { SupportForm } from "@/components/app/support-form";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <>
      <PageHeader title="Support" description="Tell us what's going on — we usually reply within one business day." />
      <SupportForm />
    </>
  );
}
