import { readServerEnv, type ServerEnv } from "@filemorph/shared";

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (!cached) {
    cached = readServerEnv();
    if (cached.missing.length) {
      console.warn(`[env] missing variables: ${cached.missing.join(", ")}`);
    }
  }
  return cached;
}

/** True when a real Supabase backend is configured. */
export function isProductionMode(): boolean {
  const env = serverEnv();
  return Boolean(env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey);
}
