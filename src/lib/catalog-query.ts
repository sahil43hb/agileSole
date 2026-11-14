import type { CatalogQuery } from "@/server/modules/catalog/product.service";

export type SearchValues = Record<string, string | string[] | undefined>;

function first(sp: SearchValues, key: string) {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

export function filtersFromSearch(
  sp: SearchValues,
): Pick<CatalogQuery, "size" | "color" | "sort" | "inStock" | "onSale" | "page" | "q" | "type" | "gender"> {
  return {
    size: first(sp, "size"),
    color: first(sp, "color"),
    sort: first(sp, "sort"),
    type: first(sp, "type"),
    gender: first(sp, "gender"),
    inStock: first(sp, "inStock") === "1",
    onSale: first(sp, "onSale") === "1",
    page: first(sp, "page") ? Number(first(sp, "page")) : 1,
    q: first(sp, "q"),
  };
}

export function filterQueryRecord(sp: SearchValues) {
  const keys = ["size", "color", "sort", "inStock", "onSale", "page", "q", "type", "gender"] as const;
  const out: Record<string, string | undefined> = {};
  for (const k of keys) {
    const v = first(sp, k);
    if (v) out[k] = v;
  }
  return out;
}
