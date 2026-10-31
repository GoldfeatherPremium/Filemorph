import { serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Job dispatch abstraction. When Redis is configured we enqueue to BullMQ for
 * the external worker to pick up; otherwise jobs are processed inline by the
 * web process (useful for demo and low-traffic deployments).
 */
export function isWorkerMode(): boolean {
  return Boolean(serverEnv().redisUrl);
}

export interface EnqueueOptions {
  priority: number;
  attempts?: number;
}

export async function enqueueJob(jobId: string, opts: EnqueueOptions): Promise<void> {
  const env = serverEnv();
  if (!env.redisUrl) {
    logger.info("queue.enqueue_inline", { jobId });
    return; // inline execution is handled by the caller
  }
  try {
    const { Queue } = await import("bullmq");
    const queue = new Queue("processing", {
      connection: { url: env.redisUrl, maxRetriesPerRequest: null },
      defaultJobOptions: {
        attempts: opts.attempts ?? 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 2000,
      },
    });
    await queue.add(
      "process",
      { jobId },
      {
        jobId,
        priority: opts.priority,
        attempts: opts.attempts ?? 3,
      },
    );
    await queue.close();
  } catch (e) {
    logger.error("queue.enqueue_failed", { jobId, error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

export async function getQueueDepth(): Promise<number> {
  const env = serverEnv();
  if (!env.redisUrl) return 0;
  try {
    const { Queue } = await import("bullmq");
    const queue = new Queue("processing", { connection: { url: env.redisUrl, maxRetriesPerRequest: null } });
    const counts = await queue.getJobCounts("waiting", "active", "delayed");
    await queue.close();
    return (counts.waiting ?? 0) + (counts.active ?? 0) + (counts.delayed ?? 0);
  } catch {
    return -1;
  }
}

/**
 * BullMQ priority is ascending (smaller = sooner). Our plan model uses a
 * descending "priority" value, so invert it when enqueuing.
 */
export function toBullPriority(planPriority: number): number {
  return Math.max(0, 10 - planPriority);
}
