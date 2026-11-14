import { connectDb } from "@/server/db/connect";
import { AuditLog } from "@/server/models";

export async function writeAudit(input: {
  actorId?: string;
  actorEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  note?: string;
}) {
  await connectDb();
  await AuditLog.create(input);
}

export async function listAudit(limit = 100) {
  await connectDb();
  const rows = await AuditLog.find().sort({ createdAt: -1 }).limit(limit).lean();
  return rows.map((r) => JSON.parse(JSON.stringify(r)));
}
