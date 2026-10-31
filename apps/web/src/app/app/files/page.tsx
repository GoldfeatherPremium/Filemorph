import type { Metadata } from "next";
import { getDataStore } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { FilesList } from "@/components/app/files-list";
import { toFileDTO } from "@/lib/dto";

export const metadata: Metadata = { title: "Files" };

export default async function FilesPage() {
  const session = await requireUser();
  const store = await getDataStore();
  const files = await store.listFiles(session.userId, null);

  return (
    <>
      <PageHeader title="Files" description="Your uploaded and generated files. Files are deleted automatically after your plan's retention window." />
      <FilesList initial={files.map(toFileDTO)} />
    </>
  );
}
