import type { MetadataRoute } from "next";
import { connectDb } from "@/server/db/connect";
import { Brand, Category, Collection, Product } from "@/server/models";
import { localizedPath } from "@/lib/site";
import { LOCALES } from "@/shared/constants";

export const dynamic = "force-dynamic";

function alts(path: string) {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) languages[locale] = localizedPath(locale, path);
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["/", "/shop", "/lookbook", "/about", "/faq", "/contact", "/size-guide", "/privacy", "/terms", "/shipping-returns", "/brands"];
  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    entries.push({
      url: localizedPath("en", path),
      lastModified: new Date(),
      alternates: alts(path),
    });
  }

  try {
    await connectDb();
    const [products, categories, brands, collections] = await Promise.all([
      Product.find({ status: "active" }).select("slug updatedAt").lean(),
      Category.find({ isActive: true }).select("slug updatedAt").lean(),
      Brand.find({ isActive: true }).select("slug updatedAt").lean(),
      Collection.find({ isActive: true }).select("slug updatedAt").lean(),
    ]);
    for (const p of products) {
      entries.push({
        url: localizedPath("en", `/product/${p.slug}`),
        lastModified: (p as { updatedAt?: Date }).updatedAt || new Date(),
        alternates: alts(`/product/${p.slug}`),
      });
    }
    for (const c of categories) {
      entries.push({
        url: localizedPath("en", `/c/${c.slug}`),
        lastModified: (c as { updatedAt?: Date }).updatedAt || new Date(),
        alternates: alts(`/c/${c.slug}`),
      });
    }
    for (const b of brands) {
      entries.push({
        url: localizedPath("en", `/brands/${b.slug}`),
        lastModified: (b as { updatedAt?: Date }).updatedAt || new Date(),
        alternates: alts(`/brands/${b.slug}`),
      });
    }
    for (const col of collections) {
      entries.push({
        url: localizedPath("en", `/collections/${col.slug}`),
        lastModified: (col as { updatedAt?: Date }).updatedAt || new Date(),
        alternates: alts(`/collections/${col.slug}`),
      });
    }
  } catch {
    // sitemap still lists static URLs if Mongo is cold
  }

  return entries;
}
