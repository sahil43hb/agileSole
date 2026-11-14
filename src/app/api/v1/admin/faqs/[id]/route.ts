import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { deleteFaq, upsertFaq } from "@/server/modules/cms/cms.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("faqs");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    return ok({ faq: await upsertFaq(await request.json(), id) });
  } catch (err) {
    return fromError(err);
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  const gate = await requireAdminApi("faqs");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    await deleteFaq(id);
    return ok({ deleted: true });
  } catch (err) {
    return fromError(err);
  }
}
