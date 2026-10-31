import { createClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET } from "@filemorph/shared";
import type { WorkerEnv } from "./env";

/**
 * Periodic cleanup: expires stale jobs via the DB function and removes
 * expired file objects from storage.
 */
export function startCleanup(env: WorkerEnv, log: (msg: string) => void): NodeJS.Timeout {
  const sb = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const bucket = env.storageBucket || STORAGE_BUCKET;

  async function run(): Promise<void> {
    try {
      await sb.rpc("cleanup_expired");

      const { data: expired } = await sb
        .from("files")
        .select("id,storage_path")
        .eq("status", "expired")
        .limit(500);
      for (const f of expired ?? []) {
        try {
          if (f.storage_path) {
            await sb.storage.from(bucket).remove([f.storage_path]);
          }
          await sb.from("files").delete().eq("id", f.id);
        } catch {
          /* ignore per-object errors */
        }
      }
      log(`cleanup run: ${(expired ?? []).length} expired files removed`);
    } catch (e) {
      log(`cleanup error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const first = setTimeout(() => void run(), 10_000);
  const interval = setInterval(() => void run(), env.cleanupIntervalMs);
  first.unref?.();
  interval.unref?.();
  return interval;
}
