import { z } from "zod";
import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { getTicket, setTicketStatus } from "@/server/modules/account/account.service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("tickets", "view");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    return ok({ ticket: await getTicket(id) });
  } catch (err) {
    return fromError(err);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("tickets", "update");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const body = z.object({ status: z.enum(["open", "accepted", "closed"]) }).parse(await request.json());
    return ok({ ticket: await setTicketStatus(id, body.status) });
  } catch (err) {
    return fromError(err);
  }
}
