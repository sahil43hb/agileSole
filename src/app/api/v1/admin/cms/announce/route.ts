import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { getAnnouncement, saveAnnouncement } from "@/server/modules/cms/cms.service";

export async function GET() {
  const gate = await requireAdminApi("cms");
  if (gate.response) return gate.response;
  return ok({ announce: await getAnnouncement() });
}

export async function PUT(request: Request) {
  const gate = await requireAdminApi("cms");
  if (gate.response) return gate.response;
  try {
    const body = (await request.json()) as { en: string; ur: string };
    return ok({ announce: await saveAnnouncement(body) });
  } catch (err) {
    return fromError(err);
  }
}
