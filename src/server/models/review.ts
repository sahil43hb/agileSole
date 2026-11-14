import { Schema, model, models, Types } from "mongoose";

const reviewSchema = new Schema(
  {
    productId: { type: Types.ObjectId, ref: "Product", required: true, index: true },
    productSlug: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    authorName: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, default: "" },
    body: { type: String, required: true },
    fit: { type: String, enum: ["small", "true", "large"], default: "true" },
    locale: { type: String, enum: ["en", "ur"], default: "en" },
    status: { type: String, enum: ["published", "pending", "hidden"], default: "published" },
  },
  { timestamps: true },
);

export const Review = models.Review || model("Review", reviewSchema);
