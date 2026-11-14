import { fromError, fail, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { updateCustomer } from "@/server/modules/admin/customers.service";
import { writeAudit } from "@/server/modules/admin/audit.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("customers");
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
    if (err instanceof Error && err.message !== "Something went wrong") {
      return fail("VALIDATION", err.message, 400);
    }
    return fromError(err);
  }
}
