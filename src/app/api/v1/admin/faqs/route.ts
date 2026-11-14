import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listAdminFaqs, upsertFaq } from "@/server/modules/cms/cms.service";

export async function GET() {
  const gate = await requireAdminApi("faqs");
  if (gate.response) return gate.response;
  try {
    return ok({ faqs: await listAdminFaqs() });
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminApi("faqs");
  if (gate.response) return gate.response;
  try {
    return ok({ faq: await upsertFaq(await request.json()) }, 201);
  } catch (err) {
    return fromError(err);
  }
}
