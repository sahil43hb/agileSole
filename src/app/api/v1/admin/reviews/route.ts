import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listAdminReviews } from "@/server/modules/catalog/review.service";

export async function GET(request: Request) {
  const gate = await requireAdminApi("reviews");
  if (gate.response) return gate.response;
  try {
    const status = new URL(request.url).searchParams.get("status") || undefined;
    return ok({ reviews: await listAdminReviews(status) });
  } catch (err) {
    return fromError(err);
  }
}
