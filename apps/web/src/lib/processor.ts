import { processTool, toProcessingError, type ProcessInputFile } from "@filemorph/processing";
import { getDataStore } from "@/lib/db";
import type { JobFileRow } from "@/lib/db/types";
import { getStorage } from "@/lib/storage";
import { logger } from "@/lib/logger";

/**
 * Execute one processing job: download inputs, run the tool, upload outputs,
 * and update the job row atomically. Shared by the external worker and the
 * inline path (Vercel / demo).
 */
export async function executeJob(jobId: string): Promise<void> {
  const store = await getDataStore();
  const storage = getStorage();

  const job = await store.getJob(jobId);
  if (!job) {
    logger.warn("processor.job_missing", { jobId });
    return;
  }
  if (job.status === "cancelled") return;
  if (job.status !== "queued") return;

  await store.updateJob(jobId, {
    status: "processing",
    started_at: new Date().toISOString(),
    progress_pct: 1,
    stage: "Preparing",
  });

  try {
    const rows = await store.listJobFiles(jobId);
    const inputRows = rows.filter((r) => r.kind === "input");
    if (!inputRows.length) throw new Error("No input files on this job.");

    const files: ProcessInputFile[] = [];
    for (const row of inputRows) {
      if (!row.storage_path) throw new Error("Input file missing storage path.");
      const data = await storage.download(row.storage_path);
      files.push({
        id: row.id,
        name: row.label ?? "file",
        contentType: row.content_type ?? "application/octet-stream",
        data,
      });
    }

    const result = await processTool({
      toolCode: job.tool_code,
      settings: job.settings ?? {},
      files,
      onProgress: (pct, stage) => {
        void store.updateJob(jobId, { progress_pct: Math.round(pct), stage }).catch(() => {});
      },
    });

    const jobFiles: Array<Partial<JobFileRow>> = [];
    const outputsMeta: Array<Record<string, unknown>> = [];
    let outputTotalBytes = 0;

    for (let i = 0; i < result.outputs.length; i++) {
      const o = result.outputs[i];
      const safe = o.name.replace(/[^\w.\-]+/g, "_").slice(0, 120) || `output-${i + 1}`;
      const storagePath = `output/${jobId}/${i + 1}-${safe}`;
      await storage.putObject(storagePath, o.data, o.contentType);
      const fileRow = await store.insertFile({
        user_id: job.user_id,
        owner_token: job.owner_token,
        bucket: storage.bucket,
        storage_path: storagePath,
        filename: o.name,
        content_type: o.contentType,
        size_bytes: o.data.length,
        width: o.width ?? null,
        height: o.height ?? null,
        status: "ready",
        expires_at: job.expires_at,
      });
      outputTotalBytes += o.data.length;
      jobFiles.push({
        job_id: jobId,
        file_id: fileRow.id,
        kind: "output",
        sequence: i + 1,
        label: o.name,
        bucket: storage.bucket,
        storage_path: storagePath,
        content_type: o.contentType,
        size_bytes: o.data.length,
        width: o.width ?? null,
        height: o.height ?? null,
        page: o.page ?? null,
      });
      outputsMeta.push({
        fileId: fileRow.id,
        fileName: o.name,
        contentType: o.contentType,
        sizeBytes: o.data.length,
        width: o.width ?? null,
        height: o.height ?? null,
        page: o.page ?? null,
      });
    }

    if (jobFiles.length) await store.insertJobFiles(jobFiles);

    // Honour a cancellation that arrived while processing.
    const after = await store.getJob(jobId);
    if (after?.status === "cancelled") {
      await store.updateJob(jobId, { progress_pct: 0, stage: null, output_total_bytes: outputTotalBytes });
      return;
    }

    await store.updateJob(jobId, {
      status: "completed",
      result: { outputs: outputsMeta },
      output_total_bytes: outputTotalBytes,
      completed_at: new Date().toISOString(),
      progress_pct: 100,
      stage: "Done",
    });
    logger.info("processor.completed", { jobId, outputs: outputsMeta.length });
  } catch (e) {
    const pe = toProcessingError(e);
    logger.error("processor.failed", { jobId, code: pe.code, message: pe.message });
    await store.updateJob(jobId, {
      status: "failed",
      error_code: pe.code,
      error_message: pe.message,
      completed_at: new Date().toISOString(),
      stage: "Failed",
    });
  }
}
