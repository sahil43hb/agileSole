import { Schema, model, models } from "mongoose";
import { ttlDel, ttlRemember } from "@/server/lib/ttl-cache";

const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export const Setting = models.Setting || model("Setting", settingSchema);

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  return ttlRemember(`setting:${key}`, 30_000, async () => {
    const row = await Setting.findOne({ key }).lean<{ value: T } | null>();
    if (!row) return fallback;
    return row.value;
  });
}

export async function setSetting<T>(key: string, value: T) {
  await Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
  ttlDel(`setting:${key}`);
  return value;
}
