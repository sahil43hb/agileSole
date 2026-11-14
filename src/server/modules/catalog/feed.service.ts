import { connectDb } from "@/server/db/connect";
import { Product } from "@/server/models";
import { localizedPath, siteUrl } from "@/lib/site";
import { pickLocale } from "@/server/lib/localized";
import { BRAND } from "@/shared/constants";

type Variant = {
  sku: string;
  gtin?: string;
  color?: string;
  sizeEu?: string;
  price: number;
  onHand?: number;
  reserved?: number;
  isActive?: boolean;
  image?: string;
};

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function catalogFeedRows() {
  await connectDb();
  const products = await Product.find({ status: "active" }).lean();
  const out: {
    id: string;
    itemGroupId: string;
    title: string;
    description: string;
    link: string;
    image: string;
    availability: string;
    price: string;
    brand: string;
    condition: string;
    mpn: string;
    gtin: string;
    color: string;
    size: string;
  }[] = [];

  for (const product of products) {
    const title = pickLocale(product.title as { en: string; ur: string }, "en");
    const description = pickLocale((product.description as { en: string; ur: string }) || { en: title, ur: title }, "en");
    const images = ((product.images as string[]) || []).filter(Boolean);
    const variants = ((product.variants as Variant[]) || []).filter((v) => v.isActive !== false);
    for (const variant of variants) {
      const available = Math.max(0, Number(variant.onHand || 0) - Number(variant.reserved || 0));
      const image = variant.image || images[0] || `${siteUrl()}/favicon.png`;
      out.push({
        id: variant.sku,
        itemGroupId: String(product.slug),
        title: `${title}${variant.color ? ` ${variant.color}` : ""}${variant.sizeEu ? ` EU ${variant.sizeEu}` : ""}`,
        description,
        link: localizedPath("en", `/product/${product.slug}`),
        image,
        availability: available > 0 ? "in stock" : "out of stock",
        price: `${Number(variant.price || 0).toFixed(2)} PKR`,
        brand: BRAND.name,
        condition: "new",
        mpn: variant.sku,
        gtin: variant.gtin || "",
        color: variant.color || "",
        size: variant.sizeEu || "",
      });
    }
  }
  return out;
}

export async function googleMerchantTsv() {
  const header = ["id", "title", "description", "link", "image_link", "availability", "price", "brand", "condition", "mpn", "gtin", "item_group_id", "color", "size"];
  const lines = [header.join("\t")];
  for (const row of await catalogFeedRows()) {
    lines.push(
      [
        row.id,
        row.title,
        row.description,
        row.link,
        row.image,
        row.availability,
        row.price,
        row.brand,
        row.condition,
        row.mpn,
        row.gtin,
        row.itemGroupId,
        row.color,
        row.size,
      ]
        .map((v) => v.replace(/\t/g, " "))
        .join("\t"),
    );
  }
  return lines.join("\n");
}

export async function metaCatalogCsv() {
  const header = ["id", "title", "description", "availability", "condition", "price", "link", "image_link", "brand", "item_group_id", "gtin", "mpn", "color", "size"];
  const lines = [header.join(",")];
  for (const row of await catalogFeedRows()) {
    lines.push(
      [row.id, row.title, row.description, row.availability, row.condition, row.price, row.link, row.image, row.brand, row.itemGroupId, row.gtin, row.mpn, row.color, row.size]
        .map(csvEscape)
        .join(","),
    );
  }
  return lines.join("\n");
}
