import { Schema, model, models } from "mongoose";

const notificationLogSchema = new Schema(
  {
    to: { type: String, required: true, index: true },
    channel: { type: String, enum: ["email", "sms", "console"], required: true },
    template: { type: String, required: true },
    subject: String,
    body: String,
    orderNumber: String,
    status: { type: String, enum: ["sent", "skipped", "failed"], default: "sent" },
  },
  { timestamps: true },
);

export const NotificationLog = models.NotificationLog || model("NotificationLog", notificationLogSchema);
