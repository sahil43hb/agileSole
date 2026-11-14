import { Schema, model, models } from "mongoose";

const ticketSchema = new Schema(
  {
    customerId: { type: String, index: true },
    orderId: { type: String, index: true },
    orderNumber: String,
    type: {
      type: String,
      enum: ["cancel", "return", "exchange", "support", "data"],
      required: true,
      index: true,
    },
    reason: { type: String, default: "" },
    status: { type: String, enum: ["open", "accepted", "closed"], default: "open", index: true },
    locale: { type: String, default: "en" },
  },
  { timestamps: true },
);

export const Ticket = models.Ticket || model("Ticket", ticketSchema);
