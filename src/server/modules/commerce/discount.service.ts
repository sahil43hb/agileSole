import { z } from "zod";
import { connectDb } from "@/server/db/connect";
import { Discount } from "@/server/models";

export const discountInput = z.object({
  code: z.string().min(2),
  type: z.enum(["percent", "fixed", "free_shipping"]),
  value: z.number().min(0).optional(),
  minOrder: z.number().min(0).optional(),
  maxUses: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function listDiscounts() {
  await connectDb();
  const rows = await Discount.find().sort({ createdAt: -1 }).lean();
  return rows.map((r) => JSON.parse(JSON.stringify(r)));
}

export async function upsertDiscount(raw: unknown, id?: string) {
  await connectDb();
  const input = discountInput.parse(raw);
  const payload = { ...input, code: input.code.trim().toUpperCase() };
  if (id) {
    const row = await Discount.findByIdAndUpdate(id, payload, { new: true });
    if (!row) throw new Error("Discount not found");
    return JSON.parse(JSON.stringify(row));
  }
  const created = await Discount.create(payload);
  return JSON.parse(JSON.stringify(created));
}

export async function quoteDiscount(code: string, subtotal: number, shipping: number) {
  await connectDb();
  const row = await Discount.findOne({ code: code.trim().toUpperCase(), isActive: true });
  if (!row) throw new Error("Code is not valid");
  const now = Date.now();
  if (row.startsAt && row.startsAt.getTime() > now) throw new Error("Code is not active yet");
  if (row.endsAt && row.endsAt.getTime() < now) throw new Error("Code has expired");
  if (row.maxUses && row.usedCount >= row.maxUses) throw new Error("Code has been used up");
  if (subtotal < (row.minOrder || 0)) throw new Error(`Minimum order is Rs ${row.minOrder}`);
  let discount = 0;
  let nextShipping = shipping;
  if (row.type === "percent") discount = Math.round((subtotal * (row.value || 0)) / 100);
  if (row.type === "fixed") discount = Math.min(subtotal, row.value || 0);
  if (row.type === "free_shipping") nextShipping = 0;
  discount = Math.min(discount, subtotal);
  return {
    code: row.code,
    type: row.type,
    discount,
    shipping: nextShipping,
  };
}

export async function deleteDiscount(id: string) {
  await connectDb();
  const row = await Discount.findByIdAndDelete(id);
  if (!row) throw new Error("Discount not found");
  return { ok: true };
}

export async function bumpDiscountUse(code?: string) {
  if (!code) return;
  await Discount.updateOne({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
}
