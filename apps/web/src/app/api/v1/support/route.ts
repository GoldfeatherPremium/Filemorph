import { apiRoute, parseBody } from "@/lib/api";
import { getOwnerContext } from "@/lib/auth";
import { getDataStore } from "@/lib/db";
import { supportTicketSchema } from "@filemorph/shared";

export const POST = apiRoute(async (req) => {
  const body = await parseBody(req, supportTicketSchema);
  const ctx = await getOwnerContext();
  const store = await getDataStore();
  const email = body.email ?? (ctx.userId ? (await store.getProfile(ctx.userId))?.email : null);
  if (!email) throw new Error("An email is required for guest support requests.");
  const ticket = await store.createTicket({
    user_id: ctx.userId,
    email,
    subject: body.subject,
    message: body.message,
    category: body.category,
  });
  return { ticket };
});
