import { Schema, model, models } from "mongoose";

const adminNotificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["order_placed", "order_cancelled", "order_return", "ticket_open", "review_pending", "stock_low"],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    href: { type: String, required: true },
    severity: { type: String, enum: ["info", "urgent"], default: "info" },
    entity: String,
    entityId: { type: String, index: true },
    orderNumber: { type: String, index: true },
    readBy: { type: [String], default: [] },
  },
  { timestamps: true },
);

adminNotificationSchema.index({ createdAt: -1 });
adminNotificationSchema.index({ readBy: 1, createdAt: -1 });

export const AdminNotification = models.AdminNotification || model("AdminNotification", adminNotificationSchema);
