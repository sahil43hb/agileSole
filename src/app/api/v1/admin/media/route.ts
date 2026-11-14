import { fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { saveUpload } from "@/server/modules/catalog/media.service";

export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("VALIDATION", "Choose an image file", 422);
    return ok(await saveUpload(file));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return fail("UPLOAD", message, 422);
  }
}
