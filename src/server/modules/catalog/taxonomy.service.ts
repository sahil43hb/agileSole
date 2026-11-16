import { z } from "zod";
import { connectDb } from "@/server/db/connect";
import { ttlDel } from "@/server/lib/ttl-cache";
import { Brand, Category, Collection, Product, SizeChart } from "@/server/models";
import { slugify } from "@/shared/money";
import { pickLocale } from "@/server/lib/localized";
import { asDoc } from "@/server/lib/lean";

const loc = z.object({ en: z.string().min(1), ur: z.string().default("") });

export const categoryInput = z.object({
  slug: z.string().optional(),
  parentId: z.string().nullable().optional(),
  name: loc,
  description: loc.optional(),
  sort: z.number().optional(),
  isActive: z.boolean().optional(),
  image: z.string().optional(),
});

export const brandInput = z.object({
  slug: z.string().optional(),
  name: loc,
  description: loc.optional(),
  logo: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const collectionInput = z.object({
  slug: z.string().optional(),
  title: loc,
  type: z.enum(["manual", "rules"]).optional(),
  productIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function listCategories(locale = "en") {
  await connectDb();
  const rows = await Category.find().sort({ sort: 1, "name.en": 1 }).lean();
  return rows.map((c) => ({
    id: String(c._id),
    slug: c.slug,
    parentId: c.parentId ? String(c.parentId) : null,
    name: c.name,
    description: c.description || { en: "", ur: "" },
    label: pickLocale(c.name as { en: string; ur: string }, locale),
    sort: c.sort,
    isActive: c.isActive !== false,
  }));
}

export async function getCategoryBySlug(slug: string, locale = "en") {
  await connectDb();
  const c = asDoc(await Category.findOne({ slug, isActive: true }).lean());
  if (!c) return null;
  return {
    id: String(c._id),
    slug: c.slug,
    parentId: c.parentId ? String(c.parentId) : null,
    name: pickLocale(c.name as { en: string; ur: string }, locale),
    description: pickLocale(c.description as { en: string; ur: string } | undefined, locale),
  };
}

export async function upsertCategory(raw: unknown, id?: string) {
  await connectDb();
  const input = categoryInput.parse(raw);
  const slug = slugify(input.slug || input.name.en);
  const exists = await Category.findOne({ slug, ...(id ? { _id: { $ne: id } } : {}) });
  if (exists) throw new Error("Category slug already exists");
  const payload = {
    ...input,
    slug,
    parentId: input.parentId || null,
  };
  ttlDel("menu:", true);
  if (id) {
    const row = await Category.findByIdAndUpdate(id, payload, { new: true });
    if (!row) throw new Error("Category not found");
    return JSON.parse(JSON.stringify(row));
  }
  const created = await Category.create(payload);
  return JSON.parse(JSON.stringify(created));
}

export async function deleteCategory(id: string) {
  await connectDb();
  const inUse = await Product.countDocuments({ categoryIds: id });
  if (inUse) throw new Error("Move products out of this category first");
  const children = await Category.countDocuments({ parentId: id });
  if (children) throw new Error("Remove or reassign child categories first");
  await Category.findByIdAndDelete(id);
  return { ok: true };
}

export async function listBrands(locale = "en") {
  await connectDb();
  const rows = await Brand.find().sort({ "name.en": 1 }).lean();
  return rows.map((b) => ({
    id: String(b._id),
    slug: b.slug,
    name: b.name,
    description: b.description || { en: "", ur: "" },
    label: pickLocale(b.name as { en: string; ur: string }, locale),
    logo: b.logo,
    isActive: b.isActive !== false,
  }));
}

export async function getBrandBySlug(slug: string, locale = "en") {
  await connectDb();
  const b = asDoc(await Brand.findOne({ slug, isActive: true }).lean());
  if (!b) return null;
  return {
    id: String(b._id),
    slug: b.slug,
    name: pickLocale(b.name as { en: string; ur: string }, locale),
    description: pickLocale(b.description as { en: string; ur: string } | undefined, locale),
  };
}

export async function upsertBrand(raw: unknown, id?: string) {
  await connectDb();
  const input = brandInput.parse(raw);
  const slug = slugify(input.slug || input.name.en);
  const exists = await Brand.findOne({ slug, ...(id ? { _id: { $ne: id } } : {}) });
  if (exists) throw new Error("Brand slug already exists");
  if (id) {
    const row = await Brand.findByIdAndUpdate(id, { ...input, slug }, { new: true });
    if (!row) throw new Error("Brand not found");
    return JSON.parse(JSON.stringify(row));
  }
  return JSON.parse(JSON.stringify(await Brand.create({ ...input, slug })));
}

export async function deleteBrand(id: string) {
  await connectDb();
  const inUse = await Product.countDocuments({ brandId: id });
  if (inUse) throw new Error("Reassign products before deleting this brand");
  await Brand.findByIdAndDelete(id);
  return { ok: true };
}

export async function listCollections(locale = "en") {
  await connectDb();
  const rows = await Collection.find().sort({ "title.en": 1 }).lean();
  return rows.map((c) => ({
    id: String(c._id),
    slug: c.slug,
    title: c.title,
    label: pickLocale(c.title as { en: string; ur: string }, locale),
    type: c.type,
    productIds: (c.productIds || []).map(String),
    isActive: c.isActive !== false,
  }));
}

export async function getCollectionBySlug(slug: string, locale = "en") {
  await connectDb();
  const c = asDoc(await Collection.findOne({ slug, isActive: true }).lean());
  if (!c) return null;
  return {
    id: String(c._id),
    slug: c.slug,
    title: pickLocale(c.title as { en: string; ur: string }, locale),
  };
}

export async function upsertCollection(raw: unknown, id?: string) {
  await connectDb();
  const input = collectionInput.parse(raw);
  const slug = slugify(input.slug || input.title.en);
  const exists = await Collection.findOne({ slug, ...(id ? { _id: { $ne: id } } : {}) });
  if (exists) throw new Error("Collection slug already exists");
  ttlDel("menu:", true);
  if (id) {
    const row = await Collection.findByIdAndUpdate(id, { ...input, slug }, { new: true });
    if (!row) throw new Error("Collection not found");
    return JSON.parse(JSON.stringify(row));
  }
  return JSON.parse(JSON.stringify(await Collection.create({ ...input, slug })));
}

export async function deleteCollection(id: string) {
  await connectDb();
  await Collection.findByIdAndDelete(id);
  return { ok: true };
}

function chartRows(rows: unknown) {
  const list = Array.isArray(rows) ? rows : [];
  return list.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      eu: r.eu ? String(r.eu) : "",
      pk: r.pk ? String(r.pk) : r.uk ? String(r.uk) : "",
      uk: r.uk ? String(r.uk) : "",
      us: r.us ? String(r.us) : "",
      cm: r.cm ? String(r.cm) : "",
    };
  });
}

export async function listSizeCharts(locale = "en") {
  await connectDb();
  const rows = await SizeChart.find().sort({ code: 1 }).lean();
  for (const c of rows) {
    const chartRowsList = (c.rows || []) as Array<{ pk?: string; uk?: string }>;
    if (chartRowsList.some((r) => !r.pk && r.uk)) {
      const next = chartRowsList.map((r) => ({ ...r, pk: r.pk || r.uk || "" }));
      await SizeChart.updateOne({ _id: c._id }, { rows: next });
    }
  }
  return rows.map((c) => ({
    id: String(c._id),
    code: c.code,
    productType: c.productType,
    title: pickLocale(c.title as { en: string; ur: string }, locale),
    rawTitle: c.title,
    rows: chartRows(c.rows),
  }));
}

export async function upsertSizeChart(raw: unknown, id?: string) {
  await connectDb();
  const input = z
    .object({
      code: z.string().min(2),
      productType: z.string().min(1),
      title: loc,
      rows: z.array(
        z.object({
          eu: z.string().optional(),
          pk: z.string().optional(),
          uk: z.string().optional(),
          us: z.string().optional(),
          cm: z.string().optional(),
        }),
      ),
    })
    .parse(raw);
  if (id) {
    const row = await SizeChart.findByIdAndUpdate(id, input, { new: true });
    if (!row) throw new Error("Size chart not found");
    return JSON.parse(JSON.stringify(row));
  }
  return JSON.parse(JSON.stringify(await SizeChart.create(input)));
}

export async function deleteSizeChart(id: string) {
  await connectDb();
  const row = await SizeChart.findByIdAndDelete(id);
  if (!row) throw new Error("Size chart not found");
  return { ok: true };
}

export async function getSizeChart(code: string, locale = "en") {
  await connectDb();
  const c = asDoc(await SizeChart.findOne({ code }).lean());
  if (!c) return null;
  return {
    code: String(c.code || ""),
    title: pickLocale(c.title as { en: string; ur: string }, locale),
    rows: chartRows(c.rows),
  };
}

export async function listInventory() {
  await connectDb();
  const products = await Product.find({ status: { $ne: "archived" } })
    .sort({ "title.en": 1 })
    .lean();
  return products.flatMap((p) =>
    ((p.variants || []) as Array<{
      _id?: { toString(): string };
      sku: string;
      color?: string;
      sizeEu?: string;
      onHand?: number;
      reserved?: number;
      isActive?: boolean;
    }>).map((v) => ({
      productId: String(p._id),
      productTitle: (p.title as { en: string }).en,
      slug: p.slug,
      gender: p.gender,
      sku: v.sku,
      color: v.color,
      sizeEu: v.sizeEu,
      onHand: v.onHand || 0,
      reserved: v.reserved || 0,
      available: Math.max(0, (v.onHand || 0) - (v.reserved || 0)),
      isActive: v.isActive !== false,
    })),
  );
}

export async function adjustInventory(sku: string, onHand: number) {
  await connectDb();
  const product = await Product.findOne({ "variants.sku": sku });
  if (!product) throw new Error("SKU not found");
  const variant = product.variants.find((v: { sku: string }) => v.sku === sku);
  if (!variant) throw new Error("SKU not found");
  if (onHand < (variant.reserved || 0)) {
    throw new Error("On-hand cannot be below reserved stock");
  }
  variant.onHand = onHand;
  await product.save();
  const available = Math.max(0, onHand - (variant.reserved || 0));
  if (available <= 2) {
    const { notifyAdminLowStock } = await import("@/server/modules/admin/admin-notice.service");
    const title = pickLocale(product.title as { en: string; ur: string }, "en") || sku;
    notifyAdminLowStock({ sku, title, available });
  }
  return { sku, onHand, reserved: variant.reserved };
}
