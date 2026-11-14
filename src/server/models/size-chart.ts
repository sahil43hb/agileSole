import { Schema, model, models } from "mongoose";
import { localizedString } from "./localized";

const sizeChartSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    title: localizedString,
    productType: { type: String, required: true },
    rows: [
      {
        eu: String,
        pk: String,
        uk: String,
        us: String,
        cm: String,
      },
    ],
  },
  { timestamps: true },
);

if (models.SizeChart) {
  delete models.SizeChart;
}
export const SizeChart = model("SizeChart", sizeChartSchema);
