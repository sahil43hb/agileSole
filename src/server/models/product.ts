import { Schema, model, models, Types } from "mongoose";
import { localizedString } from "./localized";

const variantSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true },
    color: String,
    colorHex: String,
    sizeEu: String,
    sizePk: String,
    sizeUk: String,
    sizeUs: String,
    sizeCm: String,
    price: { type: Number, required: true },
    compareAt: Number,
    cost: Number,
    gtin: String,
    weightGrams: Number,
    image: String,
    isActive: { type: Boolean, default: true },
    onHand: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
  },
  { _id: true },
);

const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    brandId: { type: Types.ObjectId, ref: "Brand" },
    categoryIds: [{ type: Types.ObjectId, ref: "Category" }],
    gender: { type: String, enum: ["men", "women", "kids", "unisex"], required: true },
    type: { type: String, default: "sneaker" },
    title: localizedString,
    description: localizedString,
    fitNote: localizedString,
    tags: [String],
    images: [String],
    sizeChartCode: String,
    sizeSystem: { type: String, enum: ["eu", "pk", "uk", "us"], default: "pk" },
    material: String,
    status: { type: String, enum: ["draft", "active", "archived", "unlisted"], default: "active" },
    featured: { type: Boolean, default: false },
    variants: [variantSchema],
  },
  { timestamps: true },
);

if (models.Product) {
  delete models.Product;
}
export const Product = model("Product", productSchema);
