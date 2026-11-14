import { Schema, model, models } from "mongoose";

const staffSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "catalog", "orders", "content", "support", "reporter"],
      default: "support",
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export const Staff = models.Staff || model("Staff", staffSchema);
