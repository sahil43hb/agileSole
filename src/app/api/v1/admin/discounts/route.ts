import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listDiscounts, upsertDiscount } from "@/server/modules/commerce/discount.service";
import { writeAudit } from "@/server/modules/admin/audit.service";

export async function GET() {
  const gate = await requireAdminApi("orders");
  if (gate.response) return gate.response;
  try {
    return ok({ discounts: await listDiscounts() });
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminApi("orders");
  if (gate.response) return gate.response;
  try {
    const discount = await upsertDiscount(await request.json());
    await writeAudit({ actorId: gate.staff!.id, actorEmail: gate.staff!.email, action: "discount.create", entity: "discount", entityId: discount._id });
    return ok({ discount }, 201);
  } catch (err) {
    return fromError(err);
  }
}
