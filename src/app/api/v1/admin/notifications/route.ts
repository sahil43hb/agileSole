import { z } from "zod";
import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listAdminNotices, markAdminNoticesRead } from "@/server/modules/admin/admin-notice.service";

export async function GET() {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  try {
    return ok(await listAdminNotices(gate.staff!.id));
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  try {
    const body = z
      .object({
        ids: z.array(z.string()).optional(),
        all: z.boolean().optional(),
      })
      .parse(await request.json());
    return ok(await markAdminNoticesRead(gate.staff!.id, body.ids, body.all));
  } catch (err) {
    return fromError(err);
  }
}
