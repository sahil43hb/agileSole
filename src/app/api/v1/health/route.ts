import { pingDb } from "@/server/db/connect";
import { ok } from "@/server/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await pingDb();
  return ok({
    service: "agile-sole",
    phase: 6,
    time: new Date().toISOString(),
    db: db ? "connected" : "disconnected",
  });
}
