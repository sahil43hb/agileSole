import { Schema, model, models } from "mongoose";

const customerSchema = new Schema(
  {
    name: { type: String, default: "" },
    phone: { type: String, sparse: true, unique: true },
    phoneVerifiedAt: Date,
    email: { type: String, sparse: true, unique: true, lowercase: true },
    emailVerifiedAt: Date,
    locale: { type: String, enum: ["en", "ur"], default: "en" },
    marketingOptIn: { type: Boolean, default: false },
    whatsappOptIn: { type: Boolean, default: false },
    rtoCount: { type: Number, default: 0 },
    blockedAt: Date,
    preferredGender: { type: String, enum: ["men", "women", "kids", ""], default: "" },
    sessionEpoch: { type: Number, default: 0 },
    dataRequestAt: Date,
    addresses: [
      {
        label: { type: String, default: "Home" },
        fullName: String,
        phone: String,
        province: String,
        city: String,
        area: String,
        street: String,
        landmark: String,
        postalCode: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true },
);

export const Customer = models.Customer || model("Customer", customerSchema);
