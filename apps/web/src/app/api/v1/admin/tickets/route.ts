import { apiRoute, parseBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { adminTicketUpdateSchema } from "@filemorph/shared";

export const GET = apiRoute(async () => {
  await requireAdmin();
  const store = await getDataStore();
  return store.listTickets();
});

export const PATCH = apiRoute(async (req) => {
  await requireAdmin();
  const body = await parseBody(req, adminTicketUpdateSchema);
  const store = await getDataStore();
  await store.updateTicket(body.ticketId, body.status);
  return { ok: true };
});
