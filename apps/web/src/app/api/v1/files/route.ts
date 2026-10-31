import { apiRoute } from "@/lib/api";
import { getOwnerContext } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { toFileDTO } from "@/lib/dto";

export const GET = apiRoute(async () => {
  const ctx = await getOwnerContext();
  const store = await getDataStore();
  const files = await store.listFiles(ctx.userId, ctx.ownerToken);
  return files.map(toFileDTO);
});
