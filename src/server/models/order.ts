import { Schema, model, models } from "mongoose";
import { ORDER_STATUSES } from "@/shared/constants";

const addressSchema = new Schema(
  {
    fullName: String,
    phone: String,
    altPhone: String,
    country: { type: String, default: "PK" },
    province: String,
    city: String,
    area: String,
    street: String,
    landmark: String,
    postalCode: String,
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    number: { type: String, required: true, unique: true, index: true },
    guestId: { type: String, index: true },
    customerId: String,
    status: { type: String, enum: ORDER_STATUSES, default: "pending_confirmation", index: true },
    channel: { type: String, enum: ["web", "admin_manual", "facebook"], default: "web" },
    locale: { type: String, default: "en" },
    items: [
      {
        sku: String,
        productId: String,
        slug: String,
        title: String,
        color: String,
        sizeEu: String,
        qty: Number,
        price: Number,
        cost: Number,
        image: String,
      },
    ],
    amounts: {
      subtotal: Number,
      shipping: Number,
      discount: Number,
      tax: Number,
      total: Number,
      currency: { type: String, default: "PKR" },
    },
    shippingAddress: addressSchema,
    shippingMethod: {
      id: String,
      name: String,
      fee: Number,
      eta: String,
    },
    payment: {
      method: { type: String, default: "cod" },
      status: { type: String, default: "unpaid" },
      collectAmount: Number,
      collectedAt: Date,
    },
    stockCommitted: { type: Boolean, default: false },
    stockRestocked: { type: Boolean, default: false },
    deliveryAttempts: { type: Number, default: 0 },
    riskFlags: [String],
    discountCode: String,
    notes: String,
    deliveryInstructions: String,
    callBeforeDelivery: { type: Boolean, default: false },
    whatsappOptIn: { type: Boolean, default: false },
    email: String,
    idempotencyKey: { type: String, unique: true, sparse: true },
    shipment: {
      courierName: String,
      trackingNumber: String,
      trackingUrl: String,
    },
    customerCancelRequestedAt: Date,
    customerReturnRequestedAt: Date,
    events: [
      {
        from: String,
        to: String,
        actorType: String,
        actorId: String,
        note: String,
        customerVisible: { type: Boolean, default: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const Order = models.Order || model("Order", orderSchema);
