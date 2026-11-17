import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { removeAddress, updateAddress } from "@/server/modules/account/account.service";
import { writeAudit } from "@/server/modules/admin/audit.service";

type Ctx = { params: Promise<{ id: string; addressId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("customers", "update");
  if (gate.response) return gate.response;
  try {
    const { id, addressId } = await ctx.params;
    const customer = await updateAddress(id, addressId, await request.json());
    await writeAudit({
      actorId: gate.staff!.id,
      action: "customer.address.update",
      entity: "customer",
      entityId: id,
    });
    return ok({ customer });
  } catch (err) {
    return fromError(err);
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  const gate = await requireAdminApi("customers", "update");
  if (gate.response) return gate.response;
  try {
    const { id, addressId } = await ctx.params;
    const customer = await removeAddress(id, addressId);
    await writeAudit({
      actorId: gate.staff!.id,
      action: "customer.address.delete",
      entity: "customer",
      entityId: id,
    });
    return ok({ customer });
  } catch (err) {
    return fromError(err);
  }
}
