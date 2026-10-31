"use client";

import { apiFetch, ClientApiError } from "@/lib/client-api";

export interface UploadedFile {
  fileId: string;
  name: string;
  contentType: string;
  size: number;
}

interface UploadUrlResponse {
  uploadUrl: string;
  path: string;
}

export async function uploadFile(file: File): Promise<string> {
  const { uploadUrl, path } = await apiFetch<UploadUrlResponse>("/api/v1/files/upload-url", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    }),
  });

  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!put.ok) {
    throw new ClientApiError(put.status, "upload_failed", `Upload failed (${put.status})`);
  }

  const data = await apiFetch<{ id: string }>("/api/v1/files/complete", {
    method: "POST",
    body: JSON.stringify({
      path,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    }),
  });
  return data.id;
}

export async function uploadFiles(files: File[], onProgress?: (done: number, total: number) => void): Promise<UploadedFile[]> {
  const out: UploadedFile[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const fileId = await uploadFile(f);
    out.push({ fileId, name: f.name, contentType: f.type || "application/octet-stream", size: f.size });
    onProgress?.(i + 1, files.length);
  }
  return out;
}
