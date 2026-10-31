import { apiRoute } from "@/lib/api";
import { getOwnerContext } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { isWorkerMode, enqueueJob, toBullPriority } from "@/lib/queue";
import { executeJob } from "@/lib/processor";
import { NotFoundError, ForbiddenError, BadRequestError } from "@filemorph/shared";
import { JOB_TERMINAL } from "@filemorph/shared";

export const POST = apiRoute(async (_req, ctx) => {
  const { id } = await ctx.params;
  const store = await getDataStore();
  const owner = await getOwnerContext();
  const job = await store.getJob(id);
  if (!job) throw new NotFoundError("Job not found.");
  const owned = owner.userId ? job.user_id === owner.userId : job.owner_token === owner.ownerToken;
  if (!owned) throw new ForbiddenError("You don't have access to this job.");
  if (!JOB_TERMINAL.has(job.status as never)) {
    throw new BadRequestError("job_not_terminal", "Only finished jobs can be retried.");
  }

  const updated = await store.updateJob(id, {
    status: "queued",
    attempts: 0,
    started_at: null,
    completed_at: null,
    cancelled_at: null,
    error_code: null,
    error_message: null,
    result: null,
    output_total_bytes: 0,
    progress_pct: 0,
    stage: null,
  });
  if (!updated) throw new NotFoundError("Job not found.");

  if (isWorkerMode()) {
    await enqueueJob(id, { priority: toBullPriority(job.priority) });
  } else {
    await executeJob(id);
  }

  const fresh = await store.getJob(id);
  return { job: fresh };
});
