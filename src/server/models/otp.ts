import { Schema, model, models } from "mongoose";

const otpSchema = new Schema(
  {
    identifier: { type: String, required: true, index: true },
    purpose: { type: String, enum: ["login", "checkout", "verify"], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export const OtpChallenge = models.OtpChallenge || model("OtpChallenge", otpSchema);
