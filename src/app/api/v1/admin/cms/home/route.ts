import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { getHomeSections, saveHomeSections } from "@/server/modules/cms/cms.service";
import { writeAudit } from "@/server/modules/admin/audit.service";

export async function GET() {
  const gate = await requireAdminApi("cms");
  if (gate.response) return gate.response;
  try {
    return ok({ sections: await getHomeSections() });
  } catch (err) {
    return fromError(err);
  }
}

export async function PUT(request: Request) {
  const gate = await requireAdminApi("cms");
  if (gate.response) return gate.response;
  try {
    const body = (await request.json()) as { sections: { type: string; enabled: boolean }[] };
    const sections = await saveHomeSections(body.sections);
    await writeAudit({ actorId: gate.staff!.id, action: "cms.home", entity: "settings" });
    return ok({ sections });
  } catch (err) {
    return fromError(err);
  }
}
