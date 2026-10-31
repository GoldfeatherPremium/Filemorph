"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUp, ArrowDown, Trash2, Download, RotateCcw, Lock } from "lucide-react";
import { toast } from "sonner";
import type { JobDTO, ToolDef } from "@filemorph/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDropzone } from "@/components/tool/file-dropzone";
import { SettingsPanel } from "@/components/tool/settings-panel";
import { ProgressRing } from "@/components/tool/progress-ring";
import { CropStage } from "@/components/tool/crop-stage";
import { OrganizeStage } from "@/components/tool/organize-stage";
import { apiFetch, ClientApiError } from "@/lib/client-api";
import { formatBytes, percentSaved } from "@/lib/utils";
import { MAX_FILE_BYTES_ABSOLUTE } from "@filemorph/shared";

interface UploadedFile {
  fileId: string;
  name: string;
  contentType: string;
  size: number;
}

const TERMINAL = ["completed", "failed", "cancelled", "expired"];

export function ToolRunner({ tool }: { tool: ToolDef }) {
  const [phase, setPhase] = useState<"select" | "ready" | "processing" | "done" | "error">("select");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>(tool.defaultSettings);
  const [job, setJob] = useState<JobDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (phase !== "processing" || !job) return;
    const id = window.setInterval(async () => {
      try {
        const data = await apiFetch<JobDTO>(`/api/v1/jobs/${job.id}`);
        setJob(data);
        if (TERMINAL.includes(data.status)) {
          window.clearInterval(id);
          if (data.status === "completed") {
            setPhase("done");
          } else {
            setPhase("error");
            setError(data.errorMessage ?? "The job could not be completed.");
          }
        }
      } catch {
        // transient network hiccup — keep polling
      }
    }, 1200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, job?.id]);

  function move(index: number, dir: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (files.length === 1) setPhase("select");
  }

  const readyToRun =
    files.length >= tool.batchMin &&
    files.length <= Math.min(tool.batchMax, 50) &&
    (tool.code !== "image-cropper" || Boolean(settings.crop)) &&
    (tool.code !== "organize-pdf" || Boolean(settings.order) || Boolean(settings.deletePages));

  async function run() {
    if (!readyToRun) return;
    setStarting(true);
    setError(null);
    try {
      const created = await apiFetch<JobDTO>("/api/v1/jobs", {
        method: "POST",
        body: JSON.stringify({ toolCode: tool.code, fileIds: files.map((f) => f.fileId), settings }),
      });
      setJob(created);
      if (created.status === "completed") {
        setPhase("done");
      } else if (created.status === "failed") {
        setPhase("error");
        setError(created.errorMessage);
      } else {
        setPhase("processing");
      }
    } catch (e) {
      setPhase("error");
      if (e instanceof ClientApiError && e.status === 402) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "Could not start the job.");
      }
      toast.error(e instanceof Error ? e.message : "Could not start the job.");
    } finally {
      setStarting(false);
    }
  }

  function reset() {
    setFiles([]);
    setSettings(tool.defaultSettings);
    setJob(null);
    setError(null);
    setPhase("select");
  }

  if (phase === "processing" || (phase === "done" && job)) {
    return (
      <Card className="p-8">
        <CardContent className="flex flex-col items-center pt-0">
          {phase === "processing" ? (
            <ProgressRing value={job?.progressPct ?? 5} stage={job?.stage} status={job?.status ?? "processing"} />
          ) : (
            <div className="flex w-full flex-col items-center gap-6">
              <ProgressRing value={100} stage="Done" status="completed" />
              {job && job.outputTotalBytes > 0 ? (
                <div className="flex items-center gap-6 rounded-2xl border bg-card px-6 py-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Original</p>
                    <p className="font-medium">{formatBytes(job.inputTotalBytes)}</p>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Result</p>
                    <p className="font-medium">{formatBytes(job.outputTotalBytes)}</p>
                  </div>
                  {job.inputTotalBytes > 0 && job.outputTotalBytes < job.inputTotalBytes ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                      −{percentSaved(job.inputTotalBytes, job.outputTotalBytes)}%
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="flex flex-col items-center gap-2">
                {job?.result?.outputs?.map((o, i) => (
                  <a
                    key={i}
                    href={`/api/v1/files/${String(o.fileId)}/download`}
                    className="flex w-full min-w-[260px] items-center gap-3 rounded-xl border bg-background px-4 py-2.5 text-sm transition-colors hover:bg-muted"
                  >
                    <Download className="h-4 w-4 text-fm-accent" />
                    <span className="min-w-0 flex-1 truncate">{o.fileName}</span>
                    <span className="text-xs text-muted-foreground">{formatBytes(Number(o.sizeBytes))}</span>
                  </a>
                ))}
              </div>
              <div className="flex gap-3">
                <Button onClick={reset} variant="outline">
                  <RotateCcw /> Try another
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/app/history">View history</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (phase === "error") {
    return (
      <Card className="p-8">
        <CardContent className="flex flex-col items-center gap-4 pt-0">
          <ProgressRing value={0} stage={null} status="failed" errorMessage={error} />
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
      <FileDropzone
        accept={tool.accepts}
        multiple={tool.supportsBatch}
        maxFiles={Math.min(tool.batchMax, 50)}
        maxBytesPerFile={MAX_FILE_BYTES_ABSOLUTE}
        onFilesUploaded={(uploaded) => {
          setFiles(uploaded);
          setPhase("ready");
          toast.success(`${uploaded.length} file${uploaded.length > 1 ? "s" : ""} ready`);
        }}
        onError={(m) => toast.error(m)}
      />

      {files.length > 0 ? (
        <>
          <Card>
            <CardContent className="space-y-3 pt-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{files.length} file{files.length > 1 ? "s" : ""} selected</p>
                {tool.batchMin > 1 ? <p className="text-xs text-muted-foreground">min {tool.batchMin} · order matters</p> : null}
              </div>
              <ul className="space-y-2">
                {files.map((f, i) => (
                  <li key={f.fileId} className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm">
                    <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                    {files.length > 1 ? (
                      <span className="flex items-center gap-1">
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg p-1 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Move up">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => move(i, 1)} disabled={i === files.length - 1} className="rounded-lg p-1 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Move down">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ) : null}
                    <button onClick={() => remove(i)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Remove">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {tool.code === "image-cropper" && files.length === 1 ? (
            <Card>
              <CardContent className="space-y-3 pt-5">
                <p className="text-sm font-medium">Crop</p>
                <CropStage src={`/api/v1/files/${files[0].fileId}/download`} aspect={String(settings.aspect ?? "free")} onChange={(crop) => setSettings((s) => ({ ...s, crop }))} />
              </CardContent>
            </Card>
          ) : null}

          {tool.code === "organize-pdf" ? (
            <Card>
              <CardContent className="pt-5">
                <OrganizeStage onChange={(s) => setSettings((prev) => ({ ...prev, ...s }))} />
              </CardContent>
            </Card>
          ) : null}

          {tool.settings.length > 0 ? (
            <Card>
              <CardContent className="space-y-4 pt-5">
                <p className="text-sm font-medium">Settings</p>
                <SettingsPanel settings={tool.settings} values={settings} onChange={setSettings} />
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-col items-center gap-3">
            <Button onClick={run} size="lg" className="w-full sm:w-auto" disabled={!readyToRun || starting}>
              {starting ? "Starting…" : "Transform files"}
            </Button>
            {!readyToRun && tool.code === "image-cropper" ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Drag a crop area to continue</p>
            ) : null}
            {!readyToRun && tool.code === "organize-pdf" ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Set a page order or pages to delete</p>
            ) : null}
          </div>
        </>
      ) : null}
    </motion.div>
  );
}
