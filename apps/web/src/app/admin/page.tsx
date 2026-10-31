import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { AdminPanel } from "@/components/admin/admin-panel";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Admin" description="Operational overview and moderation tools." />
      <AdminPanel />
    </>
  );
}
