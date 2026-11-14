import { fromError, ok } from "@/server/lib/api";
import { requireCustomerApi } from "@/server/lib/require-customer";
import { getGuestId } from "@/server/lib/guest";
import { reorder } from "@/server/modules/account/account.service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const locale = new URL(request.url).searchParams.get("locale") || "en";
    const guestId = await getGuestId();
    return ok(await reorder(gate.customer!.id, id, guestId, locale));
  } catch (err) {
    return fromError(err);
  }
}
