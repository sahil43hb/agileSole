import { connectDb } from "@/server/db/connect";
import { Cart, Product } from "@/server/models";
import { quoteDiscount } from "./discount.service";
import { asDoc } from "@/server/lib/lean";
import { getAllSettings, shippingFeeForSubtotal, shippingFromStore } from "@/server/modules/admin/settings.service";
import { pickLocale } from "@/server/lib/localized";
import { peekCustomerId } from "@/server/lib/session";

export type CartLine = {
  sku: string;
  qty: number;
  title: string;
  slug: string;
  color?: string;
  sizeEu?: string;
  price: number;
  cost?: number;
  image?: string;
  available: number;
};

function available(onHand: number, reserved: number) {
  return Math.max(0, onHand - reserved);
}

export async function hydrateSku(sku: string, locale = "en") {
  await connectDb();
  const product = asDoc(await Product.findOne({ "variants.sku": sku }).lean());
  if (!product) return null;
  const variants = (product.variants as Array<Record<string, unknown>>) || [];
  const variant = variants.find((v) => String(v.sku) === sku);
  if (!variant || variant.isActive === false) return null;
  const stock = available(Number(variant.onHand || 0), Number(variant.reserved || 0));
  const images = ((product.images as string[]) || []).filter(Boolean);
  return {
    sku,
    title: pickLocale(product.title as { en: string; ur: string }, locale),
    slug: String(product.slug),
    color: variant.color ? String(variant.color) : undefined,
    sizeEu: variant.sizeEu ? String(variant.sizeEu) : undefined,
    price: Number(variant.price || 0),
    cost: Number(variant.cost || 0),
    image: variant.image ? String(variant.image) : images[0],
    available: stock,
    productId: String((product._id as { toString(): string }).toString()),
    status: String(product.status),
  };
}

export async function getCart(guestId: string, locale = "en") {
  await connectDb();
  const row = asDoc(await Cart.findOne({ guestId }).lean()) || { items: [] as { sku: string; qty: number }[] };
  const rawItems = ((row as { items?: { sku: string; qty: number }[] }).items || []) as { sku: string; qty: number }[];
  const lines: CartLine[] = [];
  for (const item of rawItems) {
    const hydrated = await hydrateSku(item.sku, locale);
    if (!hydrated || hydrated.status === "archived" || hydrated.available < 1) continue;
    lines.push({
      sku: item.sku,
      qty: Math.min(item.qty, hydrated.available),
      title: hydrated.title,
      slug: hydrated.slug,
      color: hydrated.color,
      sizeEu: hydrated.sizeEu,
      price: hydrated.price,
      cost: hydrated.cost || 0,
      image: hydrated.image,
      available: hydrated.available,
    });
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const { store } = await getAllSettings();
  const shippingMeta = shippingFromStore(store).meta;
  let shipping = shippingFeeForSubtotal(subtotal, store);
  let discount = 0;
  let promoCode = String((row as { promoCode?: string }).promoCode || "");
  if (promoCode && subtotal > 0) {
    try {
      const customerId = await peekCustomerId();
      const quote = await quoteDiscount(promoCode, subtotal, shipping, { customerId, requireCustomer: true });
      discount = quote.discount;
      shipping = quote.shipping === 0 ? 0 : shipping;
      if (quote.type === "free_shipping") shipping = 0;
    } catch {
      discount = 0;
      promoCode = "";
      await Cart.updateOne({ guestId }, { $set: { promoCode: "" } });
    }
  }
  return {
    lines,
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal,
    discount,
    promoCode: promoCode || "",
    shipping,
    total: Math.max(0, subtotal - discount) + shipping,
    shippingMeta,
  };
}

export async function setCartItem(guestId: string, sku: string, qty: number, locale = "en") {
  await connectDb();
  const hydrated = await hydrateSku(sku, locale);
  if (!hydrated) throw new Error("That size is no longer available");
  if (hydrated.status !== "active" && hydrated.status !== "unlisted") {
    throw new Error("That pair is not for sale");
  }
  if (qty < 1) {
    await Cart.updateOne({ guestId }, { $pull: { items: { sku } } }, { upsert: true });
    return getCart(guestId, locale);
  }
  if (qty > hydrated.available) {
    throw new Error(`Only ${hydrated.available} left in this size`);
  }
  const cart = (await Cart.findOne({ guestId })) || (await Cart.create({ guestId, items: [] }));
  const existing = cart.items.find((i: { sku: string }) => i.sku === sku);
  if (existing) existing.qty = qty;
  else cart.items.push({ sku, qty });
  await cart.save();
  return getCart(guestId, locale);
}

export async function addCartItem(guestId: string, sku: string, qty = 1, locale = "en") {
  await connectDb();
  const cart = await Cart.findOne({ guestId });
  const current = cart?.items.find((i: { sku: string }) => i.sku === sku)?.qty || 0;
  return setCartItem(guestId, sku, current + qty, locale);
}

export async function clearCart(guestId: string) {
  await connectDb();
  await Cart.updateOne({ guestId }, { $set: { items: [], promoCode: "" } }, { upsert: true });
}

export async function applyCartPromo(guestId: string, code: string, locale = "en") {
  const customerId = await peekCustomerId();
  if (!customerId) throw new Error("Sign in to apply a promo code");
  const cart = await getCart(guestId, locale);
  if (!cart.lines.length) throw new Error("Add items to the bag before applying a code");
  const quote = await quoteDiscount(code, cart.subtotal, cart.shipping, { customerId, requireCustomer: true });
  await Cart.updateOne({ guestId }, { $set: { promoCode: quote.code } }, { upsert: true });
  return getCart(guestId, locale);
}

export async function clearCartPromo(guestId: string, locale = "en") {
  await connectDb();
  await Cart.updateOne({ guestId }, { $set: { promoCode: "" } });
  return getCart(guestId, locale);
}

export async function mergeCarts(guestId: string, otherItems: { sku: string; qty: number }[], locale = "en") {
  for (const item of otherItems) {
    try {
      await addCartItem(guestId, item.sku, item.qty, locale);
    } catch {
      // skip unavailable
    }
  }
  return getCart(guestId, locale);
}
