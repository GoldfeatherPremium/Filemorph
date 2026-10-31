import { redirect } from "next/navigation";
import { apiRoute } from "@/lib/api";
import { getOwnerContext } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { NotFoundError, ForbiddenError } from "@filemorph/shared";

export const GET = apiRoute(async (_req, ctx) => {
  const { id } = await ctx.params;
  const store = await getDataStore();
  const owner = await getOwnerContext();
  const file = await store.getFile(id);
  if (!file) throw new NotFoundError("File not found.");
  const owned = owner.userId ? file.user_id === owner.userId : file.owner_token === owner.ownerToken;
  if (!owned) throw new ForbiddenError("You don't have access to this file.");

  const storage = getStorage();
  const url = await storage.createSignedDownloadUrl(file.storage_path);
  redirect(url);
});
