import { z } from "zod";
import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { setReviewStatus } from "@/server/modules/catalog/review.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("reviews", "update");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const body = z.object({ status: z.enum(["published", "pending", "hidden"]) }).parse(await request.json());
    return ok({ review: await setReviewStatus(id, body.status) });
  } catch (err) {
    return fromError(err);
  }
}
