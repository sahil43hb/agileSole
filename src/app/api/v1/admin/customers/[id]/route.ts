import { fromError, fail, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { getCustomerDetail, updateCustomer } from "@/server/modules/admin/customers.service";
import { writeAudit } from "@/server/modules/admin/audit.service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const gate = await requireAdminApi("customers", "view");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const data = await getCustomerDetail(id);
    if (!data) return fail("NOT_FOUND", "Customer not found", 404);
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("customers", "update");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const customer = await updateCustomer(id, await request.json());
    await writeAudit({
      actorId: gate.staff!.id,
      action: "customer.update",
      entity: "customer",
      entityId: id,
    });
    return ok({ customer });
  } catch (err) {
    return fromError(err);
  }
}
