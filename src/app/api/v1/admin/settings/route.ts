import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { getAllSettings, saveAllSettings } from "@/server/modules/admin/settings.service";
import { writeAudit } from "@/server/modules/admin/audit.service";

export async function GET() {
  const gate = await requireAdminApi("settings", "view");
  if (gate.response) return gate.response;
  try {
    return ok(await getAllSettings());
  } catch (err) {
    return fromError(err);
  }
}

export async function PUT(request: Request) {
  const gate = await requireAdminApi("settings", "update");
  if (gate.response) return gate.response;
  try {
    const body = await request.json();
    const settings = await saveAllSettings(body);
    await writeAudit({ actorId: gate.staff!.id, action: "settings.update", entity: "settings" });
    return ok(settings);
  } catch (err) {
    return fromError(err);
  }
}
