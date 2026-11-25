import { Types, FilterQuery } from "mongoose";
import { z } from "zod";
import { connectDb } from "@/server/db/connect";
import { Category, Product } from "@/server/models";
import { pickLocale } from "@/server/lib/localized";
import { slugify } from "@/shared/money";
import { asDoc } from "@/server/lib/lean";
import { displaySize, parseSizeSystem, sortSizeValues, variantMatchesSize } from "@/shared/size-system";

const loc = z.object({ en: z.string().default(""), ur: z.string().default("") });

const variantInput = z.object({
  sku: z.string().min(1),
  color: z.string().optional(),
  colorHex: z.string().optional(),
  sizeEu: z.string().optional(),
  sizePk: z.string().optional(),
  sizeUk: z.string().optional(),
  sizeUs: z.string().optional(),
  sizeCm: z.string().optional(),
  price: z.number().min(0),
  compareAt: z.number().min(0).optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  gtin: z.string().optional(),
  weightGrams: z.number().optional().nullable(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
  onHand: z.number().int().min(0).optional(),
  reserved: z.number().int().min(0).optional(),
  _id: z.string().optional(),
});

export const productInputSchema = z.object({
  slug: z.string().optional(),
  brandId: z.string().nullable().optional(),
  categoryIds: z.array(z.string()).default([]),
  gender: z.enum(["men", "women", "kids", "unisex"]),
  type: z.string().default("sneaker"),
  title: loc,
  description: loc.optional(),
  fitNote: loc.optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  sizeChartCode: z.string().optional().nullable(),
  sizeSystem: z.enum(["eu", "pk", "uk", "us"]).optional(),
  material: z.string().optional(),
  status: z.enum(["draft", "active", "archived", "unlisted"]).default("active"),
  featured: z.boolean().optional(),
  variants: z.array(variantInput).default([]),
});

export type PublicProduct = {
  id: string;
  slug: string;
  gender: string;
  type: string;
  title: string;
  description: string;
  fitNote: string;
  material?: string;
  sizeChartCode?: string;
  sizeSystem: "eu" | "pk" | "uk" | "us";
  images: string[];
  price: number;
  compareAt?: number;
  featured: boolean;
  colors: { name: string; hex?: string }[];
  sizes: string[];
  inStock: boolean;
  percentOff?: number;
  variants: {
    id: string;
    sku: string;
    color?: string;
    colorHex?: string;
    size?: string;
    sizeEu?: string;
    sizePk?: string;
    sizeUk?: string;
    sizeUs?: string;
    price: number;
    compareAt?: number;
    image?: string;
    onHand: number;
  }[];
};

function available(onHand: number, reserved: number) {
  return Math.max(0, onHand - reserved);
}

function toPublic(doc: Record<string, unknown>, locale: string): PublicProduct {
  const variants = (doc.variants as Array<Record<string, unknown>> | undefined) || [];
  const active = variants.filter((v) => v.isActive !== false);
  const prices = active.map((v) => Number(v.price));
  const compares = active.map((v) => Number(v.compareAt || 0)).filter((n) => n > 0);
  const colors = [
    ...new Map(
      active
        .filter((v) => v.color)
        .map((v) => [
          String(v.color),
          { name: String(v.color), hex: v.colorHex ? String(v.colorHex) : undefined },
        ]),
    ).values(),
  ];
  const sizeSystem = parseSizeSystem(doc.sizeSystem);
  const sizes = [
    ...new Set(
      active
        .map((v) =>
          displaySize(
            {
              sizeEu: v.sizeEu ? String(v.sizeEu) : undefined,
              sizePk: v.sizePk ? String(v.sizePk) : undefined,
              sizeUk: v.sizeUk ? String(v.sizeUk) : undefined,
              sizeUs: v.sizeUs ? String(v.sizeUs) : undefined,
            },
            sizeSystem,
          ),
        )
        .filter(Boolean),
    ),
  ].sort(sortSizeValues);
  const images = ((doc.images as string[]) || []).filter(Boolean);
  const variantImages = active.map((v) => v.image).filter(Boolean).map(String);
  const gallery = [...new Set([...images, ...variantImages])];
  const price = prices.length ? Math.min(...prices) : 0;
  const compareAt = compares.length ? Math.min(...compares) : undefined;
  const inStock = active.some((v) => available(Number(v.onHand || 0), Number(v.reserved || 0)) > 0);
  const percentOff =
    compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : undefined;

  return {
    id: String((doc._id as { toString(): string }).toString()),
    slug: String(doc.slug),
    gender: String(doc.gender),
    type: String(doc.type || "sneaker"),
    title: pickLocale(doc.title as { en: string; ur: string }, locale),
    description: pickLocale(doc.description as { en: string; ur: string } | undefined, locale),
    fitNote: pickLocale(doc.fitNote as { en: string; ur: string } | undefined, locale),
    material: doc.material ? String(doc.material) : undefined,
    sizeChartCode: doc.sizeChartCode ? String(doc.sizeChartCode) : undefined,
    sizeSystem,
    images: gallery,
    price,
    compareAt,
    featured: Boolean(doc.featured),
    inStock,
    percentOff,
    colors,
    sizes,
    variants: active.map((v) => {
      const sized = {
        sizeEu: v.sizeEu ? String(v.sizeEu) : undefined,
        sizePk: v.sizePk ? String(v.sizePk) : undefined,
        sizeUk: v.sizeUk ? String(v.sizeUk) : undefined,
        sizeUs: v.sizeUs ? String(v.sizeUs) : undefined,
      };
      return {
        id: String((v._id as { toString(): string })?.toString?.() || v.sku),
        sku: String(v.sku),
        color: v.color ? String(v.color) : undefined,
        colorHex: v.colorHex ? String(v.colorHex) : undefined,
        size: displaySize(sized, sizeSystem) || undefined,
        ...sized,
        price: Number(v.price),
        compareAt: v.compareAt ? Number(v.compareAt) : undefined,
        image: v.image ? String(v.image) : undefined,
        onHand: available(Number(v.onHand || 0), Number(v.reserved || 0)),
      };
    }),
  };
}

export async function listFeatured(locale: string, limit = 8) {
  await connectDb();
  const rows = await Product.find({ status: "active", featured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return rows.map((row) => toPublic(row as never, locale));
}

export async function getBySlug(slug: string, locale: string) {
  await connectDb();
  const row = await Product.findOne({ slug, status: { $in: ["active", "unlisted"] } }).lean();
  if (!row) return null;
  return toPublic(row as never, locale);
}

export type CatalogQuery = {
  locale?: string;
  category?: string;
  brand?: string;
  collection?: string;
  gender?: string;
  size?: string;
  color?: string;
  type?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
};

async function categoryScope(slug?: string) {
  if (!slug) return null;
  const cat = asDoc(await Category.findOne({ slug, isActive: true }).lean());
  if (!cat) return [];
  const children = await Category.find({ parentId: cat._id, isActive: true }).lean();
  return [cat._id, ...children.map((c) => c._id)];
}

export async function listCatalog(query: CatalogQuery) {
  await connectDb();
  const locale = query.locale || "en";
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(48, query.limit || 24);
  const filter: FilterQuery<typeof Product> = { status: "active" };

  if (query.gender) filter.gender = query.gender;
  if (query.type) filter.type = query.type;
  if (query.category) {
    const ids = await categoryScope(query.category);
    if (ids && ids.length) filter.categoryIds = { $in: ids };
    else if (ids) filter.categoryIds = { $in: [] };
  }
  if (query.brand) {
    const { Brand } = await import("@/server/models");
    const brand = asDoc(await Brand.findOne({ slug: query.brand, isActive: true }).lean());
    if (brand) filter.brandId = brand._id;
    else filter.brandId = new Types.ObjectId();
  }
  if (query.collection) {
    const { Collection } = await import("@/server/models");
    const col = asDoc<{ productIds?: unknown[] }>(
      await Collection.findOne({ slug: query.collection, isActive: true }).lean(),
    );
    if (col?.productIds?.length) filter._id = { $in: col.productIds };
    else filter._id = { $in: [] };
  }
  if (query.q) {
    const rx = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { "title.en": rx },
      { "title.ur": rx },
      { "variants.sku": rx },
      { "variants.color": rx },
      { tags: rx },
    ];
  }

  const variantMatch = variantElemMatch(query);
  if (variantMatch) filter.variants = { $elemMatch: variantMatch };

  let sort: Record<string, 1 | -1> = { featured: -1, createdAt: -1 };
  if (query.sort === "newest") sort = { createdAt: -1 };
  if (query.sort === "price-asc") sort = { "variants.price": 1 };
  if (query.sort === "price-desc") sort = { "variants.price": -1 };

  const facetFilter: FilterQuery<typeof Product> = { ...filter };
  const facetMatch = variantElemMatch(query, { size: true, color: true });
  if (facetMatch) facetFilter.variants = { $elemMatch: facetMatch };
  else delete facetFilter.variants;

  const [rows, total, facets] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
    buildFacets(facetFilter, query),
  ]);

  const products = rows.map((row) => toPublic(row as never, locale));

  return {
    products,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    facets,
  };
}

function variantElemMatch(
  query: CatalogQuery,
  omit: { size?: boolean; color?: boolean } = {},
) {
  const elem: Record<string, unknown> = { isActive: { $ne: false } };
  let used = false;
  if (!omit.size && query.size) {
    elem.$or = [
      { sizeEu: query.size },
      { sizePk: query.size },
      { sizeUk: query.size },
      { sizeUs: query.size },
    ];
    used = true;
  }
  if (!omit.color && query.color) {
    elem.color = query.color;
    used = true;
  }
  if (query.minPrice != null || query.maxPrice != null) {
    elem.price = {
      ...(query.minPrice != null ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice != null ? { $lte: query.maxPrice } : {}),
    };
    used = true;
  }
  if (query.onSale) {
    elem.compareAt = { $gt: 0 };
    used = true;
  }
  if (query.inStock) {
    elem.onHand = { $gt: 0 };
    used = true;
  }
  return used ? elem : null;
}

function variantFits(
  v: {
    sizeEu?: string;
    sizePk?: string;
    sizeUk?: string;
    sizeUs?: string;
    color?: string;
    isActive?: boolean;
    onHand?: number;
    compareAt?: number;
    price?: number;
  },
  query: CatalogQuery,
  omit: { size?: boolean; color?: boolean },
) {
  if (v.isActive === false) return false;
  if (!omit.size && query.size && !variantMatchesSize(v, query.size)) return false;
  if (!omit.color && query.color && v.color !== query.color) return false;
  if (query.inStock && !(Number(v.onHand) > 0)) return false;
  if (query.onSale && !(Number(v.compareAt) > 0)) return false;
  if (query.minPrice != null && Number(v.price) < query.minPrice) return false;
  if (query.maxPrice != null && Number(v.price) > query.maxPrice) return false;
  return true;
}

async function buildFacets(base: FilterQuery<typeof Product>, query: CatalogQuery) {
  const rows = await Product.find(base, { variants: 1, sizeSystem: 1 }).lean();
  const sizes = new Set<string>();
  const colors = new Set<string>();
  type Variant = {
    sizeEu?: string;
    sizePk?: string;
    sizeUk?: string;
    sizeUs?: string;
    color?: string;
    isActive?: boolean;
    onHand?: number;
    compareAt?: number;
    price?: number;
  };
  for (const row of rows) {
    const system = parseSizeSystem((row as { sizeSystem?: string }).sizeSystem);
    for (const v of (row.variants || []) as Variant[]) {
      if (variantFits(v, query, { color: true }) && v.color) colors.add(v.color);
      const label = displaySize(v, system);
      if (variantFits(v, query, { size: true }) && label) sizes.add(label);
    }
  }
  return {
    sizes: [...sizes].sort((a, b) => Number(a) - Number(b)),
    colors: [...colors].sort(),
  };
}

export async function listAdminProducts(q?: string) {
  await connectDb();
  const filter: FilterQuery<typeof Product> = {};
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ "title.en": rx }, { slug: rx }, { "variants.sku": rx }];
  }
  const rows = await Product.find(filter).sort({ updatedAt: -1 }).lean();
  return rows.map((row) => {
    const variants = (row.variants || []) as Array<{ onHand?: number; reserved?: number; price?: number; sku?: string }>;
    const stock = variants.reduce((s, v) => s + Math.max(0, (v.onHand || 0) - (v.reserved || 0)), 0);
    return {
      id: String(row._id),
      slug: row.slug,
      title: row.title,
      gender: row.gender,
      status: row.status,
      featured: row.featured,
      image: ((row.images || []) as string[])[0] || "",
      skus: variants.map((v) => v.sku || "").join(" "),
      variantCount: variants.length,
      stock,
      price: variants.length ? Math.min(...variants.map((v) => v.price || 0)) : 0,
      updatedAt: row.updatedAt,
    };
  });
}

export async function getAdminProduct(id: string) {
  await connectDb();
  const row = await Product.findById(id).lean();
  if (!row) return null;
  return JSON.parse(JSON.stringify(row));
}

async function assertUniqueSkus(variants: { sku: string }[], excludeProductId?: string) {
  const skus = variants.map((v) => v.sku.trim()).filter(Boolean);
  const unique = new Set(skus);
  if (unique.size !== skus.length) throw new Error("Duplicate SKUs in this product");
  const clash = await Product.findOne({
    ...(excludeProductId ? { _id: { $ne: excludeProductId } } : {}),
    "variants.sku": { $in: skus },
  });
  if (clash) throw new Error(`SKU already used on ${clash.slug}`);
}

export async function createProduct(raw: unknown) {
  await connectDb();
  const input = productInputSchema.parse(raw);
  const slug = slugify(input.slug || input.title.en);
  if (!slug) throw new Error("Title or slug is required");
  const exists = await Product.findOne({ slug });
  if (exists) throw new Error("Slug already exists");
  await assertUniqueSkus(input.variants);
  const doc = await Product.create({
    ...input,
    slug,
    brandId: input.brandId || undefined,
    categoryIds: input.categoryIds,
    variants: input.variants.map((v) => ({ ...v, onHand: v.onHand ?? 0, reserved: 0, isActive: v.isActive !== false })),
  });
  return JSON.parse(JSON.stringify(doc));
}

export async function updateProduct(id: string, raw: unknown) {
  await connectDb();
  const input = productInputSchema.parse(raw);
  const slug = slugify(input.slug || input.title.en);
  const exists = await Product.findOne({ slug, _id: { $ne: id } });
  if (exists) throw new Error("Slug already exists");
  await assertUniqueSkus(input.variants, id);
  const current = await Product.findById(id);
  if (!current) throw new Error("Product not found");
  const reservedBySku = new Map<string, number>();
  for (const variant of current.variants) {
    const row = variant as unknown as { sku?: string; reserved?: number };
    if (row.sku) reservedBySku.set(row.sku, row.reserved || 0);
  }
  current.set({
    ...input,
    slug,
    brandId: input.brandId || undefined,
    variants: input.variants.map((v) => ({
      ...v,
      reserved: reservedBySku.get(v.sku) || 0,
      onHand: v.onHand ?? 0,
      isActive: v.isActive !== false,
    })),
  });
  await current.save();
  return JSON.parse(JSON.stringify(current));
}

export async function setProductStatus(id: string, status: "draft" | "active" | "archived" | "unlisted") {
  await connectDb();
  const row = await Product.findByIdAndUpdate(id, { status }, { new: true });
  if (!row) throw new Error("Product not found");
  return { id: String(row._id), status: row.status };
}

export async function deleteProduct(id: string) {
  await connectDb();
  const row = await Product.findByIdAndUpdate(id, { status: "archived" }, { new: true });
  if (!row) throw new Error("Product not found");
  return { id, status: row.status };
}

export async function countCatalog() {
  await connectDb();
  const [products, active] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ status: "active" }),
  ]);
  return { products, active };
}

export async function listBySlugs(slugs: string[], locale: string) {
  await connectDb();
  const unique = [...new Set(slugs.filter(Boolean))];
  if (!unique.length) return [];
  const rows = await Product.find({ slug: { $in: unique }, status: { $in: ["active", "unlisted"] } }).lean();
  const map = new Map(
    rows.map((row) => [String((row as unknown as { slug: string }).slug), toPublic(row as never, locale)]),
  );
  return unique.map((slug) => map.get(slug)).filter(Boolean) as PublicProduct[];
}

export async function listRelated(slug: string, locale: string, limit = 4) {
  await connectDb();
  const row = asDoc(await Product.findOne({ slug }).lean());
  if (!row) return [];
  const categoryIds = (row.categoryIds as unknown[]) || [];
  const related = await Product.find({
    status: "active",
    slug: { $ne: slug },
    $or: [{ categoryIds: { $in: categoryIds } }, { gender: row.gender }, { type: row.type }],
  })
    .limit(limit)
    .lean();
  return related.map((item) => toPublic(item as never, locale));
}

export async function suggestSearch(q: string, locale: string) {
  await connectDb();
  const term = q.trim();
  if (term.length < 2) return { products: [] as PublicProduct[], categories: [], brands: [] };
  const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const [products, categories, brands] = await Promise.all([
    listCatalog({ locale, q: term, limit: 6, sort: "newest" }),
    Category.find({ isActive: true, $or: [{ "name.en": rx }, { "name.ur": rx }, { slug: rx }] })
      .limit(4)
      .lean(),
    (await import("@/server/models")).Brand.find({
      isActive: true,
      $or: [{ "name.en": rx }, { "name.ur": rx }, { slug: rx }],
    })
      .limit(4)
      .lean(),
  ]);
  return {
    products: products.products,
    categories: categories.map((c) => {
      const doc = c as unknown as { slug: string; name: { en: string; ur: string } };
      return { slug: String(doc.slug), label: pickLocale(doc.name, locale) };
    }),
    brands: brands.map((b) => {
      const doc = b as unknown as { slug: string; name: { en: string; ur: string } };
      return { slug: String(doc.slug), label: pickLocale(doc.name, locale) };
    }),
  };
}
