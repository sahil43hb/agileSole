import { Schema, model, models, Types } from "mongoose";
import { localizedString } from "./localized";

const collectionSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: localizedString,
    type: { type: String, enum: ["manual", "rules"], default: "manual" },
    productIds: [{ type: Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Collection = models.Collection || model("Collection", collectionSchema);
