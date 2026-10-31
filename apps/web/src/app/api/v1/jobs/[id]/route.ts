import { apiRoute } from "@/lib/api";
import { getOwnerContext } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { toJobDTO } from "@/lib/dto";
import { NotFoundError, ForbiddenError, BadRequestError } from "@filemorph/shared";
import { JOB_TERMINAL } from "@filemorph/shared";

async function assertOwnedJob(id: string) {
  const store = await getDataStore();
  const ctx = await getOwnerContext();
  const job = await store.getJob(id);
  if (!job) throw new NotFoundError("Job not found.");
  const owned = ctx.userId ? job.user_id === ctx.userId : job.owner_token === ctx.ownerToken;
  if (!owned) throw new ForbiddenError("You don't have access to this job.");
  return { store, ctx, job };
}

export const GET = apiRoute(async (_req, ctx) => {
  const { id } = await ctx.params;
  const { store, job } = await assertOwnedJob(id);
  const files = await store.listJobFiles(id);
  return toJobDTO(job as never, files);
});

export const DELETE = apiRoute(async (_req, ctx) => {
  const { id } = await ctx.params;
  const { store, job } = await assertOwnedJob(id);
  if (!JOB_TERMINAL.has(job.status as never)) {
    throw new BadRequestError("job_not_terminal", "Only finished jobs can be deleted.");
  }
  const storage = getStorage();
  const jobFiles = await store.listJobFiles(id);
  for (const jf of jobFiles) {
    if (jf.kind === "output" && jf.file_id) await store.deleteFile(jf.file_id);
    if (jf.storage_path) await storage.removeObject(jf.storage_path).catch(() => {});
  }
  await store.deleteJob(id);
  return { ok: true };
});
