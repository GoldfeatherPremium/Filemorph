import { apiRoute } from "@/lib/api";
import { getOwnerContext } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { toFileDTO } from "@/lib/dto";
import { NotFoundError, ForbiddenError } from "@filemorph/shared";

async function assertOwnedFile(id: string) {
  const store = await getDataStore();
  const ctx = await getOwnerContext();
  const file = await store.getFile(id);
  if (!file) throw new NotFoundError("File not found.");
  const owned = ctx.userId ? file.user_id === ctx.userId : file.owner_token === ctx.ownerToken;
  if (!owned) throw new ForbiddenError("You don't have access to this file.");
  return file;
}

export const GET = apiRoute(async (_req, ctx) => {
  const { id } = await ctx.params;
  const file = await assertOwnedFile(id);
  return toFileDTO(file);
});

export const DELETE = apiRoute(async (_req, ctx) => {
  const { id } = await ctx.params;
  const file = await assertOwnedFile(id);
  const store = await getDataStore();
  await store.deleteFile(id);
  const storage = getStorage();
  await storage.removeObject(file.storage_path).catch(() => {});
  return { ok: true };
});
