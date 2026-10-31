import { apiRoute, parseBody } from "@/lib/api";
import { getOwnerContext } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { toJobDTO } from "@/lib/dto";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { isWorkerMode, enqueueJob, toBullPriority } from "@/lib/queue";
import { executeJob } from "@/lib/processor";
import {
  createJobSchema,
  TOOL_BY_CODE,
  FREE_ENTITLEMENTS,
  toEntitlements,
  checkBatch,
  MAX_FILE_BYTES_ABSOLUTE,
  THROTTLE,
  PaymentRequiredError,
  BadRequestError,
  NotFoundError,
  type JobStatus,
} from "@filemorph/shared";

export const GET = apiRoute(async () => {
  const ctx = await getOwnerContext();
  const store = await getDataStore();
  const jobs = await store.listJobs(ctx.userId, ctx.ownerToken, { limit: 100 });
  const out = [];
  for (const job of jobs) {
    const files = await store.listJobFiles(job.id);
    out.push(toJobDTO(job, files));
  }
  return out;
});

export const POST = apiRoute(async (req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  checkRateLimit(rateLimitKey("jobs", ip), THROTTLE.maxJobsPerMinute, THROTTLE.rateLimitWindowMs);

  const body = await parseBody(req, createJobSchema);
  const tool = TOOL_BY_CODE[body.toolCode];
  if (!tool) throw new BadRequestError("unknown_tool", "Unknown tool.");

  const ctx = await getOwnerContext();
  const store = await getDataStore();

  const fileRows = [];
  for (const id of body.fileIds) {
    const f = await store.getFile(id);
    if (!f) throw new NotFoundError("One of the files was not found.");
    const owned = ctx.userId ? f.user_id === ctx.userId : f.owner_token === ctx.ownerToken;
    if (!owned) throw new NotFoundError("One of the files was not found.");
    fileRows.push(f);
  }

  if (fileRows.length < tool.batchMin || fileRows.length > tool.batchMax) {
    throw new BadRequestError("bad_file_count", `${tool.name} accepts ${tool.batchMin}–${tool.batchMax} file${tool.batchMax > 1 ? "s" : ""}.`);
  }

  let ent = FREE_ENTITLEMENTS;
  if (ctx.userId) {
    const profile = await store.getProfile(ctx.userId);
    if (!profile) throw new NotFoundError("Profile not found.");
    if (profile.suspended) throw new PaymentRequiredError("suspended", "This account is suspended.");
    ent = toEntitlements(profile.plan);
  }

  const totalBytes = fileRows.reduce((s, f) => s + Number(f.size_bytes), 0);
  const batchCheck = checkBatch(ent, fileRows.length, totalBytes);
  if (!batchCheck.ok) throw new PaymentRequiredError(batchCheck.reason);

  if (tool.code === "compress-pdf" && !ent.advancedCompression && ["low", "high"].includes(String(body.settings.preset))) {
    throw new PaymentRequiredError("advanced_compression_requires_pro", "Advanced compression presets are a Pro feature.");
  }

  const expiresAt = new Date(Date.now() + ent.retentionHours * 60 * 60 * 1000).toISOString();
  const job = await store.createJob({
    user_id: ctx.userId,
    owner_token: ctx.ownerToken,
    tool_code: tool.code,
    status: "queued",
    queue_name: "processing",
    priority: ent.priority,
    input_total_bytes: totalBytes,
    settings: body.settings,
    max_attempts: 3,
    expires_at: expiresAt,
  });

  await store.insertJobFiles(
    fileRows.map((f, i) => ({
      job_id: job.id,
      file_id: f.id,
      kind: "input" as const,
      sequence: i,
      label: f.filename,
      bucket: f.bucket,
      storage_path: f.storage_path,
      content_type: f.content_type,
      size_bytes: f.size_bytes,
    })),
  );

  const reserve = await store.reserveJob(ctx.userId, ctx.ownerToken, job.id, tool.code, totalBytes);
  if (!reserve.ok) {
    await store.deleteJob(job.id);
    throw new PaymentRequiredError(reserve.reason);
  }

  await store.logAudit({
    actorId: ctx.userId ?? undefined,
    action: "job.create",
    resource: "processing_jobs",
    resourceId: job.id,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    metadata: { toolCode: tool.code, bytes: totalBytes },
  });

  if (isWorkerMode()) {
    await enqueueJob(job.id, { priority: toBullPriority(ent.priority) });
  } else {
    await executeJob(job.id);
  }

  const fresh = await store.getJob(job.id);
  const jobFiles = await store.listJobFiles(job.id);
  if (!fresh) throw new NotFoundError("Job not found.");
  return { job: toJobDTO(fresh as never, jobFiles) };
});
