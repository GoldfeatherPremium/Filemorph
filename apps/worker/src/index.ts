import { Worker } from "bullmq";
import IORedis from "ioredis";
import { readWorkerEnv } from "./env";
import { JobRunner } from "./job-runner";
import { startCleanup } from "./cleanup";

const env = readWorkerEnv();
const log = (msg: string) => console.log(JSON.stringify({ ts: new Date().toISOString(), level: "info", msg }));

function start(): void {
  const connection = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });
  const runner = new JobRunner(env);

  const worker = new Worker(
    "processing",
    async (job) => {
      const jobId = job.data?.jobId as string | undefined;
      if (!jobId) throw new Error("Job payload missing jobId");
      log(`processing job ${jobId} (attempt ${job.attemptsMade + 1})`);
      await runner.run(jobId);
    },
    {
      connection,
      concurrency: env.concurrency,
      limiter: { max: 20, duration: 1000 },
      lockDuration: env.jobTimeoutMs,
    },
  );

  worker.on("completed", (job) => log(`job ${job.id} completed`));
  worker.on("failed", (job, err) => log(`job ${job?.id} failed: ${err.message}`));
  worker.on("error", (err) => log(`worker error: ${err.message}`));

  startCleanup(env, log);
  log(`worker started: concurrency=${env.concurrency}, redis=${env.redisUrl.split("@").pop()}`);

  const shutdown = async () => {
    log("shutting down");
    await worker.close();
    await connection.quit();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());
}

start();
