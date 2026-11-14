import { Schema, model, models } from "mongoose";
import { localizedString } from "./localized";

const brandSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: localizedString,
    logo: String,
    description: localizedString,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Brand = models.Brand || model("Brand", brandSchema);
