import { cache } from "react";
import { connectDb } from "@/server/db/connect";
import { ttlRemember } from "@/server/lib/ttl-cache";
import { listCatalog } from "./product.service";
import { listCategories, listCollections } from "./taxonomy.service";
import { listHomeReviews } from "./review.service";
import { getSetting } from "@/server/models/setting";

export async function homePayload(locale: string) {
  await connectDb();
  const [newArrivals, bestsellers, family, categories, collections, reviews, store] = await Promise.all([
    listCatalog({ locale, collection: "new-arrivals", limit: 8 }),
    listCatalog({ locale, collection: "bestsellers", limit: 8 }),
    listCatalog({ locale, collection: "family-comfort", limit: 8 }),
    listCategories(locale),
    listCollections(locale),
    listHomeReviews(3),
    getSetting("store", {
      name: "Agile Sole",
      city: "Gujranwala",
      whatsapp: "",
      tagline: { en: "Every Step a Perfect Beat", ur: "ہر قدم ایک مکمل تال ہے" },
    }),
  ]);
  const roots = categories.filter((c) => !c.parentId && c.isActive !== false);
  return {
    store,
    categories: roots,
    collections: collections.filter((c) => c.isActive !== false),
    newArrivals: newArrivals.products,
    bestsellers: bestsellers.products,
    family: family.products,
    reviews,
  };
}

export const menuPayload = cache(async function menuPayload(locale: string) {
  return ttlRemember(`menu:${locale}`, 30_000, async () => {
    await connectDb();
    const [categories, collections] = await Promise.all([listCategories(locale), listCollections(locale)]);
    const roots = categories.filter((c) => !c.parentId && c.isActive !== false);
    return {
      categories: roots.map((root) => ({
        ...root,
        children: categories.filter((c) => c.parentId === root.id && c.isActive !== false),
      })),
      collections: collections.filter((c) => c.isActive !== false),
    };
  });
});
