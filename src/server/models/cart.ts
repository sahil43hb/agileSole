import { Schema, model, models } from "mongoose";

const cartSchema = new Schema(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, index: true },
    promoCode: { type: String, default: "" },
    items: [
      {
        sku: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },
      },
    ],
  },
  { timestamps: true },
);

export const Cart = models.Cart || model("Cart", cartSchema);
