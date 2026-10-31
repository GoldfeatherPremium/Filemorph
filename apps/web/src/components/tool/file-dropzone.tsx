"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";

interface PendingFile {
  file: File;
  status: "uploading" | "done" | "error";
  error?: string;
}

interface FileDropzoneProps {
  accept: string[];
  multiple: boolean;
  maxFiles: number;
  maxBytesPerFile: number;
  onFilesUploaded: (files: { fileId: string; name: string; size: number; contentType: string }[]) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function FileDropzone({ accept, multiple, maxFiles, maxBytesPerFile, onFilesUploaded, onError, disabled }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState<PendingFile[]>([]);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = Array.from(list).slice(0, maxFiles);
    if (files.length > maxFiles) {
      onError?.(`Up to ${maxFiles} files can be processed per job.`);
    }
    const items: PendingFile[] = files.map((file) => ({ file, status: "uploading" }));
    setPending(items);

    const done: { fileId: string; name: string; size: number; contentType: string }[] = [];
    // Import here to keep module boundaries clean.
    const { uploadFile } = await import("@/lib/upload");

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (item.file.size > maxBytesPerFile) {
          throw new Error(`File exceeds ${formatBytes(maxBytesPerFile)}.`);
        }
        const fileId = await uploadFile(item.file);
        items[i] = { ...item, status: "done" };
        done.push({ fileId, name: item.file.name, size: item.file.size, contentType: item.file.type || "application/octet-stream" });
      } catch (e) {
        items[i] = { ...item, status: "error", error: e instanceof Error ? e.message : "Upload failed" };
      }
      // eslint-disable-next-line no-await-in-loop
      setPending([...items]);
    }
    if (done.length) onFilesUploaded(done);
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setActive(true);
        }}
        onDragLeave={() => setActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setActive(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all",
          active ? "border-fm-accent bg-fm-accent/5 scale-[1.01]" : "border-border bg-card hover:border-fm-accent/50",
          disabled && "pointer-events-none opacity-60",
        )}
        aria-label="Upload files"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fm-accent/12 text-fm-accent">
          <UploadCloud className="h-7 w-7" />
        </span>
        <span className="text-base font-medium">Drag &amp; drop files here</span>
        <span className="text-sm text-muted-foreground">or click to browse · {multiple ? "multiple files allowed" : "single file"}</span>
        <span className="text-xs text-muted-foreground/70">Accepted: {accept.join(", ")} · max {formatBytes(maxBytesPerFile)}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept.join(",")}
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {pending.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {pending.map((p, i) => (
            <li key={`${p.file.name}-${i}`} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5 text-sm">
              {p.status === "uploading" ? <Loader2 className="h-4 w-4 animate-spin text-fm-accent" /> : p.status === "done" ? <span className="h-2 w-2 rounded-full bg-emerald-500" /> : <span className="h-2 w-2 rounded-full bg-destructive" />}
              <span className="min-w-0 flex-1 truncate">{p.file.name}</span>
              <span className="text-xs text-muted-foreground">{formatBytes(p.file.size)}</span>
              {p.status === "error" ? (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <X className="h-3.5 w-3.5" /> {p.error}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
