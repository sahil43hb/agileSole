import { Schema, model, models } from "mongoose";
import { localizedString } from "./localized";

const faqSchema = new Schema(
  {
    sort: { type: Number, default: 0 },
    question: localizedString,
    answer: localizedString,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Faq = models.Faq || model("Faq", faqSchema);
