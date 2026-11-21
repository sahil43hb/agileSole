import { z } from "zod";
import { connectDb } from "@/server/db/connect";
import { Discount, Order } from "@/server/models";

export const discountInput = z.object({
  code: z.string().min(2),
  type: z.enum(["percent", "fixed", "free_shipping"]),
  value: z.number().min(0).optional(),
  minOrder: z.number().min(0).optional(),
  maxUses: z.number().int().min(0).optional(),
  maxPerCustomer: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type QuoteDiscountOpts = {
  customerId?: string | null;
  requireCustomer?: boolean;
  excludeOrderId?: string;
};

async function countCodeUses(code: string, extra: Record<string, unknown> = {}) {
  return Order.countDocuments({
    discountCode: code,
    status: { $nin: ["cancelled"] },
    ...extra,
  });
}

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

export async function quoteDiscount(code: string, subtotal: number, shipping: number, opts: QuoteDiscountOpts = {}) {
  await connectDb();
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw new Error("Enter a promo code");
  if (opts.requireCustomer && !opts.customerId) {
    throw new Error("Sign in to apply a promo code");
  }

  const row = await Discount.findOne({ code: normalized });
  if (!row) throw new Error("This promo code is not valid");
  if (row.isActive === false) throw new Error("This promo code is not currently active");
  const now = Date.now();
  if (row.startsAt && row.startsAt.getTime() > now) throw new Error("This promo code is not active yet");
  if (row.endsAt && row.endsAt.getTime() < now) throw new Error("This promo code has expired");

  const exclude = opts.excludeOrderId ? { _id: { $ne: opts.excludeOrderId } } : {};
  const used = Math.max(row.usedCount || 0, await countCodeUses(normalized, exclude));
  if (row.maxUses && used >= row.maxUses) {
    throw new Error("This promo code has reached its usage limit");
  }

  if (row.maxPerCustomer && opts.customerId) {
    const customerUses = await countCodeUses(normalized, {
      customerId: opts.customerId,
      ...exclude,
    });
    if (customerUses >= row.maxPerCustomer) {
      throw new Error("You've already used this promo code the maximum number of times");
    }
  }

  if (subtotal < (row.minOrder || 0)) {
    throw new Error(`Minimum order is Rs ${row.minOrder}`);
  }

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

export async function setDiscountActive(id: string, isActive: boolean) {
  await connectDb();
  const row = await Discount.findByIdAndUpdate(id, { $set: { isActive } }, { new: true });
  if (!row) throw new Error("Discount not found");
  return JSON.parse(JSON.stringify(row));
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
