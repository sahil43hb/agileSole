import { Schema, model, models } from "mongoose";

const counterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export const Counter = models.Counter || model("Counter", counterSchema);

export async function nextOrderNumber() {
  const row = await Counter.findOneAndUpdate({ key: "order" }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  const seq = (row as { seq: number }).seq || 1;
  return `AS-${100000 + seq}`;
}
