import { connectDb } from "@/server/db/connect";
import { Brand, Category, Product } from "@/server/models";
import { slugify } from "@/shared/money";

type Row = Record<string, string>;

function parseCsv(text: string): Row[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = splitLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row: Row = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] || "").trim();
    });
    return row;
  });
}

function splitLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (const ch of line) {
    if (ch === '"') {
      q = !q;
      continue;
    }
    if (ch === "," && !q) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export async function importProductsCsv(text: string) {
  await connectDb();
  const rows = parseCsv(text);
  if (!rows.length) throw new Error("CSV needs a header and at least one row");

  const grouped = new Map<string, Row[]>();
  for (const row of rows) {
    const slug = slugify(row.slug || row.title_en || "");
    if (!slug) continue;
    const list = grouped.get(slug) || [];
    list.push({ ...row, slug });
    grouped.set(slug, list);
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [slug, group] of grouped) {
    try {
      const head = group[0];
      let brandId;
      if (head.brand_slug) {
        const brand = await Brand.findOne({ slug: head.brand_slug });
        brandId = brand?._id;
      }
      const categoryIds = [];
      if (head.category_slug) {
        const cat = await Category.findOne({ slug: head.category_slug });
        if (cat) categoryIds.push(cat._id);
      }
      const variants = group.map((r, i) => ({
        sku: r.sku || `${slug.toUpperCase().replace(/-/g, "")}-${r.color || "NA"}-${r.sizeeu || i}`,
        color: r.color || "",
        colorHex: r.colorhex || "",
        sizeEu: r.sizeeu || r.size_eu || "",
        sizePk: r.sizepk || r.size_pk || r.sizeuk || r.size_uk || "",
        sizeUk: r.sizeuk || r.size_uk || "",
        sizeUs: r.sizeus || r.size_us || "",
        sizeCm: r.sizecm || r.size_cm || "",
        price: Number(r.price || 0),
        compareAt: r.compareat ? Number(r.compareat) : undefined,
        onHand: Number(r.onhand || r.stock || 0),
        reserved: 0,
        isActive: true,
      }));

      const payload = {
        slug,
        title: { en: head.title_en || slug, ur: head.title_ur || "" },
        description: { en: head.description_en || "", ur: head.description_ur || "" },
        gender: (head.gender as "men" | "women" | "kids" | "unisex") || "unisex",
        type: head.type || "sneaker",
        status: (head.status as "active") || "active",
        featured: head.featured === "true" || head.featured === "1",
        brandId,
        categoryIds,
        variants,
      };

      const existing = await Product.findOne({ slug });
      if (existing) {
        existing.set(payload);
        await existing.save();
        updated += 1;
      } else {
        await Product.create(payload);
        created += 1;
      }
    } catch (err) {
      errors.push(`${slug}: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  return { created, updated, errors, rows: rows.length };
}
