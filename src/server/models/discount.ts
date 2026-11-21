import { Schema, model, models } from "mongoose";

const discountSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    type: { type: String, enum: ["percent", "fixed", "free_shipping"], required: true },
    value: { type: Number, default: 0 },
    minOrder: { type: Number, default: 0 },
    maxUses: { type: Number, default: 0 },
    maxPerCustomer: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    startsAt: Date,
    endsAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Discount = models.Discount || model("Discount", discountSchema);
