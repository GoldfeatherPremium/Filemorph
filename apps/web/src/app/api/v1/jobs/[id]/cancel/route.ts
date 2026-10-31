import { apiRoute } from "@/lib/api";
import { getOwnerContext } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { NotFoundError, ForbiddenError, BadRequestError } from "@filemorph/shared";

export const POST = apiRoute(async (_req, ctx) => {
  const { id } = await ctx.params;
  const store = await getDataStore();
  const owner = await getOwnerContext();
  const job = await store.getJob(id);
  if (!job) throw new NotFoundError("Job not found.");
  const owned = owner.userId ? job.user_id === owner.userId : job.owner_token === owner.ownerToken;
  if (!owned) throw new ForbiddenError("You don't have access to this job.");
  if (!["queued", "processing"].includes(job.status)) {
    throw new BadRequestError("cannot_cancel", "Only queued or processing jobs can be cancelled.");
  }
  const updated = await store.updateJob(id, { status: "cancelled", cancelled_at: new Date().toISOString(), stage: "Cancelled" });
  return { job: updated };
});
