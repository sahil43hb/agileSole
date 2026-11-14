import { Schema, model, models } from "mongoose";

const auditLogSchema = new Schema(
  {
    actorId: String,
    actorEmail: String,
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: String,
    note: String,
  },
  { timestamps: true },
);

export const AuditLog = models.AuditLog || model("AuditLog", auditLogSchema);
