import { Schema, model, models } from "mongoose";

const mediaSchema = new Schema(
  {
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    bytes: { type: Buffer, required: true },
  },
  { timestamps: true },
);

if (models.Media) {
  delete models.Media;
}
export const Media = model("Media", mediaSchema);
