import { Schema, model, models } from "mongoose";

const staffSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role" },
    role: { type: String, default: "support" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

if (models.Staff) {
  const rolePath = models.Staff.schema.path("role") as { enumValues?: unknown[] } | undefined;
  if (rolePath?.enumValues?.length) delete models.Staff;
}
export const Staff = models.Staff || model("Staff", staffSchema);
