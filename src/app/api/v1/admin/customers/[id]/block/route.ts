import { z } from "zod";
import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { setCustomerBlocked } from "@/server/modules/admin/customers.service";
import { writeAudit } from "@/server/modules/admin/audit.service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("customers");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const body = z.object({ blocked: z.boolean() }).parse(await request.json());
    const customer = await setCustomerBlocked(id, body.blocked);
    await writeAudit({
      actorId: gate.staff!.id,
      action: body.blocked ? "customer.block" : "customer.unblock",
      entity: "customer",
      entityId: id,
    });
    return ok({ customer });
  } catch (err) {
    return fromError(err);
  }
}
