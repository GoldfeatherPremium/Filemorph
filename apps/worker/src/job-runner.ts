import { createClient } from "@supabase/supabase-js";
import { processTool, toProcessingError, type ProcessInputFile } from "@filemorph/processing";
import { STORAGE_BUCKET } from "@filemorph/shared";
import type { WorkerEnv } from "./env";

interface JobRow {
  id: string;
  user_id: string | null;
  owner_token: string | null;
  tool_code: string;
  status: string;
  settings: Record<string, unknown>;
  expires_at: string | null;
}

interface JobFileRow {
  id: string;
  job_id: string;
  file_id: string | null;
  kind: "input" | "output";
  sequence: number;
  label: string | null;
  bucket: string;
  storage_path: string | null;
  content_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  page: number | null;
}

export class JobRunner {
  private sb: ReturnType<typeof createClient>;
  private bucket: string;

  constructor(env: WorkerEnv) {
    this.sb = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.bucket = env.storageBucket || STORAGE_BUCKET;
  }

  private async updateJob(id: string, patch: Record<string, unknown>) {
    await this.sb.from("processing_jobs").update(patch).eq("id", id);
  }

  async run(jobId: string): Promise<void> {
    const { data: job } = await this.sb.from("processing_jobs").select("*").eq("id", jobId).maybeSingle();
    if (!job) return;
    const j = job as unknown as JobRow;
    if (j.status === "cancelled") return;
    if (j.status !== "queued") return;

    await this.updateJob(jobId, { status: "processing", started_at: new Date().toISOString(), progress_pct: 1, stage: "Preparing" });

    try {
      const { data: rows } = await this.sb.from("job_files").select("*").eq("job_id", jobId).eq("kind", "input").order("sequence");
      const inputRows = (rows ?? []) as unknown as JobFileRow[];
      if (!inputRows.length) throw new Error("No input files on this job.");

      const files: ProcessInputFile[] = [];
      for (const row of inputRows) {
        if (!row.storage_path) throw new Error("Input file missing storage path.");
        const { data, error } = await this.sb.storage.from(this.bucket).download(row.storage_path);
        if (error || !data) throw new Error(error?.message ?? "Failed to download input");
        files.push({
          id: row.id,
          name: row.label ?? "file",
          contentType: row.content_type ?? "application/octet-stream",
          data: Buffer.from(await data.arrayBuffer()),
        });
      }

      const result = await processTool({
        toolCode: j.tool_code,
        settings: j.settings ?? {},
        files,
        onProgress: (pct, stage) => {
          void this.updateJob(jobId, { progress_pct: Math.round(pct), stage }).catch(() => {});
        },
      });

      const jobFiles: Array<Partial<JobFileRow>> = [];
      const outputsMeta: Array<Record<string, unknown>> = [];
      let outputTotalBytes = 0;

      for (let i = 0; i < result.outputs.length; i++) {
        const o = result.outputs[i];
        const safe = o.name.replace(/[^\w.\-]+/g, "_").slice(0, 120) || `output-${i + 1}`;
        const storagePath = `output/${jobId}/${i + 1}-${safe}`;
        const { error: upErr } = await this.sb.storage.from(this.bucket).upload(storagePath, o.data, {
          contentType: o.contentType,
          upsert: true,
          cacheControl: "private, no-store",
        });
        if (upErr) throw new Error(upErr.message);

        const { data: fileRow, error: fileErr } = await this.sb
          .from("files")
          .insert({
            user_id: j.user_id,
            owner_token: j.owner_token,
            bucket: this.bucket,
            storage_path: storagePath,
            filename: o.name,
            content_type: o.contentType,
            size_bytes: o.data.length,
            width: o.width ?? null,
            height: o.height ?? null,
            status: "ready",
            expires_at: j.expires_at,
          })
          .select("id")
          .single();
        if (fileErr || !fileRow) throw new Error(fileErr?.message ?? "Failed to record output file");
        const fileId = String(fileRow.id);

        outputTotalBytes += o.data.length;
        jobFiles.push({
          job_id: jobId,
          file_id: fileId,
          kind: "output",
          sequence: i + 1,
          label: o.name,
          bucket: this.bucket,
          storage_path: storagePath,
          content_type: o.contentType,
          size_bytes: o.data.length,
          width: o.width ?? null,
          height: o.height ?? null,
          page: o.page ?? null,
        });
        outputsMeta.push({
          fileId,
          fileName: o.name,
          contentType: o.contentType,
          sizeBytes: o.data.length,
          width: o.width ?? null,
          height: o.height ?? null,
          page: o.page ?? null,
        });
      }

      if (jobFiles.length) await this.sb.from("job_files").insert(jobFiles);

      const { data: after } = await this.sb.from("processing_jobs").select("status").eq("id", jobId).single();
      if (after?.status === "cancelled") {
        await this.updateJob(jobId, { progress_pct: 0, stage: null, output_total_bytes: outputTotalBytes });
        return;
      }

      await this.updateJob(jobId, {
        status: "completed",
        result: { outputs: outputsMeta },
        output_total_bytes: outputTotalBytes,
        completed_at: new Date().toISOString(),
        progress_pct: 100,
        stage: "Done",
      });
    } catch (e) {
      const pe = toProcessingError(e);
      await this.updateJob(jobId, {
        status: "failed",
        error_code: pe.code,
        error_message: pe.message,
        completed_at: new Date().toISOString(),
        stage: "Failed",
      });
      throw pe;
    }
  }
}
