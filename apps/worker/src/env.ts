export interface WorkerEnv {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  redisUrl: string;
  storageBucket: string;
  concurrency: number;
  jobTimeoutMs: number;
  cleanupIntervalMs: number;
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export function readWorkerEnv(): WorkerEnv {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    redisUrl: required("REDIS_URL"),
    storageBucket: process.env.STORAGE_BUCKET || "user-files",
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 3),
    jobTimeoutMs: Number(process.env.JOB_TIMEOUT_MS ?? 120_000),
    cleanupIntervalMs: Number(process.env.CLEANUP_INTERVAL_MS ?? 900_000),
  };
}
