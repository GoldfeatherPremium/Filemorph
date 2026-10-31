import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { getDataStore } from "@/lib/db";
import { isWorkerMode, getQueueDepth } from "@/lib/queue";

export async function GET() {
  const env = serverEnv();
  const store = await getDataStore();
  const dbOk = await (async () => {
    try {
      await store.getPlan("free");
      return true;
    } catch {
      return false;
    }
  })();

  const depth = isWorkerMode() ? await getQueueDepth() : -1;

  return NextResponse.json({
    data: {
      ok: true,
      mode: store.mode,
      supabaseConfigured: Boolean(env.supabaseUrl && env.supabaseServiceRoleKey),
      workerMode: isWorkerMode(),
      queueDepth: depth,
      dbOk,
      timestamp: new Date().toISOString(),
    },
  });
}
