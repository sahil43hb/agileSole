import { connectDb } from "@/server/db/connect";
import { Product, Review } from "@/server/models";
import { asDoc } from "@/server/lib/lean";

export type PublicReview = {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  fit: string;
  createdAt: string;
};

function asReview(row: unknown) {
  const doc = row as Record<string, unknown>;
  return {
    id: String((doc._id as { toString(): string })?.toString?.() || ""),
    authorName: String(doc.authorName || ""),
    rating: Number(doc.rating || 0),
    title: String(doc.title || ""),
    body: String(doc.body || ""),
    fit: String(doc.fit || "true"),
    createdAt: String(doc.createdAt || ""),
    productSlug: String(doc.productSlug || ""),
  };
}

export async function listProductReviews(slug: string) {
  await connectDb();
  const rows = await Review.find({ productSlug: slug, status: "published" })
    .sort({ createdAt: -1 })
    .limit(24)
    .lean();
  const reviews: PublicReview[] = rows.map((row) => asReview(row));
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const fit = { small: 0, true: 0, large: 0 };
  for (const r of reviews) {
    if (r.fit === "small") fit.small += 1;
    else if (r.fit === "large") fit.large += 1;
    else fit.true += 1;
  }
  return { reviews, count, average: Math.round(average * 10) / 10, fit };
}

export async function listHomeReviews(limit = 3) {
  await connectDb();
  const rows = await Review.find({ status: "published" }).sort({ createdAt: -1 }).limit(limit).lean();
  return rows.map((row) => asReview(row));
}

export async function seedReviewsIfEmpty() {
  if ((await Review.countDocuments()) > 0) return;
  const products = await Product.find({ status: "active" }).lean();
  if (!products.length) return;
  const samples = [
    { authorName: "Hassan M.", rating: 5, title: "True beat", body: "Light on the foot and the mint colour is exactly as shown. COD was smooth.", fit: "true" as const },
    { authorName: "Ayesha K.", rating: 4, title: "Comfort for the house", body: "Wore the sandals all day in Gujranwala heat. Size is honest.", fit: "true" as const },
    { authorName: "Usman R.", rating: 5, title: "Daily runner", body: "EU 42 is my usual and it fits. Will order the kids pair next.", fit: "true" as const },
    { authorName: "Sana F.", rating: 4, title: "Family pair", body: "Bought with the kids clogs. Exchange note on the site was clear.", fit: "small" as const },
    { authorName: "Bilal T.", rating: 5, title: "Looks current", body: "Street knit looks better in person. WhatsApp team confirmed the size.", fit: "true" as const },
  ];
  await Review.insertMany(
    products.map((row, i) => {
      const product = row as unknown as { _id: unknown; slug: string };
      const sample = samples[i % samples.length];
      return {
        productId: product._id,
        productSlug: product.slug,
        ...sample,
        locale: "en",
        status: "published",
      };
    }),
  );
}

export async function ensureProductExists(slug: string) {
  const row = asDoc(await Product.findOne({ slug }).lean());
  return Boolean(row);
}

export async function submitReview(raw: {
  slug: string;
  authorName: string;
  rating: number;
  title?: string;
  body: string;
  fit?: "small" | "true" | "large";
  customerId?: string;
}) {
  await connectDb();
  const product = asDoc(await Product.findOne({ slug: raw.slug }).lean());
  if (!product) throw new Error("Product not found");
  const created = await Review.create({
    productId: product._id,
    productSlug: raw.slug,
    authorName: raw.authorName,
    rating: raw.rating,
    title: raw.title || "",
    body: raw.body,
    fit: raw.fit || "true",
    customerId: raw.customerId,
    status: "pending",
  });
  return JSON.parse(JSON.stringify(created));
}

export async function listAdminReviews(status?: string) {
  await connectDb();
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const rows = await Review.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  return rows.map((r) => JSON.parse(JSON.stringify(r)));
}

export async function setReviewStatus(id: string, status: "published" | "pending" | "hidden") {
  await connectDb();
  const row = await Review.findByIdAndUpdate(id, { status }, { new: true });
  if (!row) throw new Error("Review not found");
  return JSON.parse(JSON.stringify(row));
}
