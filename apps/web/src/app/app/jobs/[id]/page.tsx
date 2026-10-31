import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDataStore } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { toJobDTO } from "@/lib/dto";
import { PageHeader } from "@/components/app/page-header";
import { JobDetail } from "@/components/app/job-detail";

export const metadata: Metadata = { title: "Job" };

export default async function JobPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await requireUser();
  const store = await getDataStore();
  const job = await store.getJob(id);
  if (!job || (session.userId && job.user_id !== session.userId)) return notFound();
  const files = await store.listJobFiles(id);
  const dto = toJobDTO(job as never, files);
  return (
    <>
      <PageHeader title="Job details" description={dto.toolCode} />
      <JobDetail job={dto} />
    </>
  );
}
