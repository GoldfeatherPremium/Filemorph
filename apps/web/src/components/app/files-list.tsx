"use client";

import { useState } from "react";
import { Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client-api";
import { formatBytes, formatDate } from "@/lib/utils";
import type { FileDTO } from "@filemorph/shared";

export function FilesList({ initial }: { initial: FileDTO[] }) {
  const [files, setFiles] = useState<FileDTO[]>(initial);

  async function remove(id: string) {
    try {
      await apiFetch(`/api/v1/files/${id}`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success("File deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (files.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">No files yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((f) => (
        <div key={f.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{f.filename}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(f.sizeBytes)} · {formatDate(f.createdAt)}
              {f.expiresAt ? ` · expires ${formatDate(f.expiresAt)}` : ""}
            </p>
          </div>
          <a href={`/api/v1/files/${f.id}/download`} aria-label="Download">
            <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
          </a>
          <Button variant="ghost" size="icon" onClick={() => void remove(f.id)} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
