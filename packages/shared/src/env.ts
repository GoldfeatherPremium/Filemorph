/**
 * Server-side environment access with graceful degradation.
 * Required credentials block critical paths; optional integrations (Paddle,
 * Resend, Sentry, Redis) degrade to safe no-op modes when absent.
 */

const REDACT = /(KEY|SECRET|TOKEN|PASSWORD|DSN|PUBLIC)/i;

export interface ServerEnv {
  nextPublicAppUrl: string;
  nextPublicSiteUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  databaseUrl: string | null;
  redisUrl: string | null;
  storageEndpoint: string | null;
  storageBucket: string;
  storageAccessKey: string | null;
  storageSecretKey: string | null;
  paddleApiKey: string | null;
  paddleWebhookSecret: string | null;
  paddleWebhookPublicKey: string | null;
  paddleClientToken: string | null;
  paddlePricePlusMonthly: string | null;
  paddlePricePlusYearly: string | null;
  paddlePriceProMonthly: string | null;
  paddlePriceProYearly: string | null;
  resendApiKey: string | null;
  sentryDsn: string | null;
  jobTimeoutMs: number;
  workerConcurrency: number;
  inlineProcessingEnabled: boolean;
  missing: string[];
}

export function sanitizeEnvValue(key: string, value: string | undefined): string | null {
  if (value === undefined || value === "") return null;
  return value.trim();
}

export function readServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const missing: string[] = [];
  const req = (key: string): string => {
    const v = sanitizeEnvValue(key, source[key]);
    if (!v) missing.push(key);
    return v ?? "";
  };

  const env: ServerEnv = {
    nextPublicAppUrl: sanitizeEnvValue("NEXT_PUBLIC_APP_URL", source.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000",
    nextPublicSiteUrl: sanitizeEnvValue("NEXT_PUBLIC_SITE_URL", source.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000",
    supabaseUrl: req("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: req("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: req("SUPABASE_SERVICE_ROLE_KEY"),
    databaseUrl: sanitizeEnvValue("DATABASE_URL", source.DATABASE_URL),
    redisUrl: sanitizeEnvValue("REDIS_URL", source.REDIS_URL),
    storageEndpoint: sanitizeEnvValue("STORAGE_ENDPOINT", source.STORAGE_ENDPOINT),
    storageBucket: sanitizeEnvValue("STORAGE_BUCKET", source.STORAGE_BUCKET) ?? "user-files",
    storageAccessKey: sanitizeEnvValue("STORAGE_ACCESS_KEY", source.STORAGE_ACCESS_KEY),
    storageSecretKey: sanitizeEnvValue("STORAGE_SECRET_KEY", source.STORAGE_SECRET_KEY),
    paddleApiKey: sanitizeEnvValue("PADDLE_API_KEY", source.PADDLE_API_KEY),
    paddleWebhookSecret: sanitizeEnvValue("PADDLE_WEBHOOK_SECRET", source.PADDLE_WEBHOOK_SECRET),
    paddleWebhookPublicKey: sanitizeEnvValue("PADDLE_WEBHOOK_PUBLIC_KEY", source.PADDLE_WEBHOOK_PUBLIC_KEY),
    paddleClientToken: sanitizeEnvValue("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN", source.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN),
    paddlePricePlusMonthly: sanitizeEnvValue("PADDLE_PRICE_PLUS_MONTHLY", source.PADDLE_PRICE_PLUS_MONTHLY),
    paddlePricePlusYearly: sanitizeEnvValue("PADDLE_PRICE_PLUS_YEARLY", source.PADDLE_PRICE_PLUS_YEARLY),
    paddlePriceProMonthly: sanitizeEnvValue("PADDLE_PRICE_PRO_MONTHLY", source.PADDLE_PRICE_PRO_MONTHLY),
    paddlePriceProYearly: sanitizeEnvValue("PADDLE_PRICE_PRO_YEARLY", source.PADDLE_PRICE_PRO_YEARLY),
    resendApiKey: sanitizeEnvValue("RESEND_API_KEY", source.RESEND_API_KEY),
    sentryDsn: sanitizeEnvValue("SENTRY_DSN", source.SENTRY_DSN),
    jobTimeoutMs: Number(source.JOB_TIMEOUT_MS ?? 120_000),
    workerConcurrency: Number(source.WORKER_CONCURRENCY ?? 3),
    inlineProcessingEnabled: sanitizeEnvValue("INLINE_PROCESSING", source.INLINE_PROCESSING) !== "false",
    missing,
  };

  return env;
}

export function requireCriticalEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const env = readServerEnv(source);
  const critical = ["supabaseUrl", "supabaseAnonKey", "supabaseServiceRoleKey"];
  const issues = env.missing.filter((k) =>
    critical.some((c) => {
      const mapping: Record<string, string> = {
        supabaseUrl: "NEXT_PUBLIC_SUPABASE_URL",
        supabaseAnonKey: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        supabaseServiceRoleKey: "SUPABASE_SERVICE_ROLE_KEY",
      };
      return mapping[c] === k;
    }),
  );
  if (issues.length) {
    throw new Error(`Missing critical environment variables: ${issues.join(", ")}`);
  }
  return env;
}

export function isSecretKey(key: string): boolean {
  return REDACT.test(key);
}
