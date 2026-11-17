import { Schema, model, models } from "mongoose";

const roleSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    isSystem: { type: Boolean, default: false },
    permissions: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const Role = models.Role || model("Role", roleSchema);
