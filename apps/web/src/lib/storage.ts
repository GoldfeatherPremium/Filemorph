import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { STORAGE_BUCKET, UPLOAD_URL_TTL_SECONDS, DOWNLOAD_URL_TTL_SECONDS } from "@filemorph/shared";

export interface SignedUploadUrl {
  uploadUrl: string;
  path: string;
  token: string;
  expiresAt: string;
}

export interface StorageAdapter {
  mode: "prod" | "demo";
  bucket: string;
  createSignedUploadUrl(storagePath: string, contentType: string, size: number): Promise<SignedUploadUrl>;
  putObject(storagePath: string, data: Buffer, contentType: string): Promise<void>;
  download(storagePath: string): Promise<Buffer>;
  createSignedDownloadUrl(storagePath: string): Promise<string>;
  removeObject(storagePath: string): Promise<void>;
}

function assertSafeStoragePath(storagePath: string): void {
  const normalized = path.posix.normalize(storagePath);
  if (normalized.startsWith("../") || normalized.includes("..") || normalized.startsWith("/")) {
    throw new Error("invalid storage path");
  }
}

/**
 * Directory used for the local demo storage adapter. In serverless runtimes
 * (e.g. Vercel) the project directory is read-only, so we default to the OS
 * temp directory; DEMO_DATA_DIR may override this for local development.
 */
export function demoDataDir(): string {
  const override = process.env.DEMO_DATA_DIR;
  if (override) return path.resolve(override);
  return path.join(os.tmpdir(), "filemorph-demo");
}

/** Strict structural check for demo object keys. */
const SAFE_DEMO_PATH = /^(uploads|output)\/[A-Za-z0-9-]+(\/[A-Za-z0-9._-]+)*$/;

export function isSafeDemoPath(storagePath: string): boolean {
  if (!storagePath || storagePath.length > 512) return false;
  if (!SAFE_DEMO_PATH.test(storagePath)) return false;
  try {
    assertSafeStoragePath(storagePath);
    return true;
  } catch {
    return false;
  }
}

class ProdStorage implements StorageAdapter {
  mode = "prod" as const;
  bucket = STORAGE_BUCKET;
  private sb = getSupabaseAdmin();

  async createSignedUploadUrl(storagePath: string, _contentType: string, _size: number): Promise<SignedUploadUrl> {
    assertSafeStoragePath(storagePath);
    const res = await this.sb.storage.from(this.bucket).createSignedUploadUrl(storagePath, { upsert: true });
    if (res.error || !res.data) throw new Error(res.error?.message ?? "Failed to create upload URL");
    return {
      uploadUrl: res.data.signedUrl,
      path: res.data.path,
      token: res.data.token,
      expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000).toISOString(),
    };
  }

  async putObject(storagePath: string, data: Buffer, contentType: string): Promise<void> {
    assertSafeStoragePath(storagePath);
    const res = await this.sb.storage.from(this.bucket).upload(storagePath, data, {
      contentType,
      upsert: true,
      cacheControl: "private, no-store",
    });
    if (res.error) throw new Error(res.error.message);
  }

  async download(storagePath: string): Promise<Buffer> {
    assertSafeStoragePath(storagePath);
    const res = await this.sb.storage.from(this.bucket).download(storagePath);
    if (res.error || !res.data) throw new Error(res.error?.message ?? "Failed to download object");
    return Buffer.from(await res.data.arrayBuffer());
  }

  async createSignedDownloadUrl(storagePath: string): Promise<string> {
    assertSafeStoragePath(storagePath);
    const res = await this.sb.storage.from(this.bucket).createSignedUrl(storagePath, DOWNLOAD_URL_TTL_SECONDS);
    if (res.error || !res.data) throw new Error(res.error?.message ?? "Failed to create download URL");
    return res.data.signedUrl;
  }

  async removeObject(storagePath: string): Promise<void> {
    assertSafeStoragePath(storagePath);
    await this.sb.storage.from(this.bucket).remove([storagePath]);
  }
}

// ---- demo storage ----
const g = globalThis as unknown as {
  __fmSignedTokens?: Map<string, { kind: "upload" | "download"; expiresAt: number }>;
};

function tokens() {
  if (!g.__fmSignedTokens) g.__fmSignedTokens = new Map();
  return g.__fmSignedTokens;
}

class DemoStorage implements StorageAdapter {
  mode = "demo" as const;
  bucket = STORAGE_BUCKET;

  private root(): string {
    return path.join(demoDataDir(), "storage", this.bucket);
  }

  private resolve(storagePath: string): string {
    assertSafeStoragePath(storagePath);
    return path.join(this.root(), storagePath);
  }

  private issueToken(kind: "upload" | "download", storagePath: string): string {
    const token = randomBytes(20).toString("hex");
    const ttl = kind === "upload" ? UPLOAD_URL_TTL_SECONDS : DOWNLOAD_URL_TTL_SECONDS;
    tokens().set(token, { kind, expiresAt: Date.now() + ttl * 1000 });
    const key = `${kind}:${storagePath}`;
    tokens().set(key, { kind, expiresAt: Date.now() + ttl * 1000 });
    return token;
  }

  async createSignedUploadUrl(storagePath: string): Promise<SignedUploadUrl> {
    assertSafeStoragePath(storagePath);
    const token = this.issueToken("upload", storagePath);
    await fs.mkdir(path.dirname(this.resolve(storagePath)), { recursive: true });
    return {
      uploadUrl: `/api/v1/demo/upload?p=${encodeURIComponent(storagePath)}&t=${token}`,
      path: storagePath,
      token,
      expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000).toISOString(),
    };
  }

  async putObject(storagePath: string, data: Buffer): Promise<void> {
    const target = this.resolve(storagePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
  }

  async download(storagePath: string): Promise<Buffer> {
    return fs.readFile(this.resolve(storagePath));
  }

  async createSignedDownloadUrl(storagePath: string): Promise<string> {
    const token = this.issueToken("download", storagePath);
    return `/api/v1/demo/file?p=${encodeURIComponent(storagePath)}&t=${token}`;
  }

  async removeObject(storagePath: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(storagePath));
    } catch {
      /* ignore */
    }
  }
}

let cached: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (cached) return cached;
  const env = serverEnv();
  cached = env.supabaseUrl && env.supabaseServiceRoleKey ? new ProdStorage() : new DemoStorage();
  return cached;
}

export function isDemoStorage(): boolean {
  return getStorage().mode === "demo";
}

/** Verify a demo storage token (upload or download) issued by DemoStorage. */
export function demoVerifyToken(kind: "upload" | "download", storagePath: string, token: string | null): boolean {
  if (!token) return false;
  const entry = tokens().get(token);
  const keyEntry = tokens().get(`${kind}:${storagePath}`);
  if (!entry || !keyEntry) return false;
  if (entry.kind !== kind) return false;
  if (Date.now() > entry.expiresAt) return false;
  return entry.expiresAt === keyEntry.expiresAt;
}

export { DemoStorage };
