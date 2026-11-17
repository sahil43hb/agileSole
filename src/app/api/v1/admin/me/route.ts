import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { updateOwnProfile } from "@/server/modules/admin/staff.service";
import { writeAudit } from "@/server/modules/admin/audit.service";
import { getStaffById } from "@/server/modules/auth/admin.service";

export async function GET() {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  const staff = await getStaffById(gate.staff!.id);
  return ok({ staff });
}

export async function PATCH(request: Request) {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  try {
    const staff = await updateOwnProfile(gate.staff!.id, await request.json());
    await writeAudit({
      actorId: gate.staff!.id,
      action: "staff.profile",
      entity: "staff",
      entityId: staff.id,
    });
    return ok({ staff });
  } catch (err) {
    return fromError(err);
  }
}
