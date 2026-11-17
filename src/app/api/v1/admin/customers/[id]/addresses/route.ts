import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { addAddress } from "@/server/modules/account/account.service";
import { writeAudit } from "@/server/modules/admin/audit.service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("customers", "update");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const customer = await addAddress(id, await request.json());
    await writeAudit({
      actorId: gate.staff!.id,
      action: "customer.address.add",
      entity: "customer",
      entityId: id,
    });
    return ok({ customer }, 201);
  } catch (err) {
    return fromError(err);
  }
}
