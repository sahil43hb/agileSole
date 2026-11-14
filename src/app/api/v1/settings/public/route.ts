import { fromError, ok } from "@/server/lib/api";
import { getPublicSettings } from "@/server/modules/admin/settings.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await getPublicSettings());
  } catch (err) {
    return fromError(err);
  }
}
