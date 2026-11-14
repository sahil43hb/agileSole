import { Schema, model, models, Types } from "mongoose";
import { localizedString } from "./localized";

const categorySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    parentId: { type: Types.ObjectId, ref: "Category", default: null },
    name: localizedString,
    description: localizedString,
    image: String,
    sort: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seo: {
      title: localizedString,
      description: localizedString,
    },
  },
  { timestamps: true },
);

export const Category = models.Category || model("Category", categorySchema);
