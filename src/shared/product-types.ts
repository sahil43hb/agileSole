import { slugify } from "@/shared/money";

export type ProductTypeSetting = {
  id: string;
  label: string;
  labelUr: string;
  openFootwear: boolean;
};

export const PRODUCT_TYPE_DEFAULTS: ProductTypeSetting[] = [
  { id: "sneaker", label: "Sneaker", labelUr: "سنیکرز", openFootwear: false },
  { id: "sandal", label: "Sandal", labelUr: "سینڈل", openFootwear: true },
  { id: "slide", label: "Slide", labelUr: "سلائیڈ", openFootwear: true },
  { id: "clog", label: "Clog", labelUr: "کلاگ", openFootwear: true },
  { id: "slipper", label: "Slipper", labelUr: "سلپر", openFootwear: true },
];

export function normalizeProductTypes(raw: unknown): ProductTypeSetting[] {
  const list = Array.isArray(raw) ? raw : PRODUCT_TYPE_DEFAULTS;
  const out: ProductTypeSetting[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const row = (item || {}) as Partial<ProductTypeSetting> & { name?: string };
    const label = String(row.label || row.name || "").trim();
    if (!label) continue;
    const id = slugify(String(row.id || label));
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      label,
      labelUr: String(row.labelUr || "").trim(),
      openFootwear: Boolean(row.openFootwear),
    });
  }
  return out.length ? out : PRODUCT_TYPE_DEFAULTS;
}

export function defaultProductTypeId(types: ProductTypeSetting[] = PRODUCT_TYPE_DEFAULTS) {
  return types[0]?.id || PRODUCT_TYPE_DEFAULTS[0].id;
}

export function productTypeLabel(id: string, types: ProductTypeSetting[], locale = "en") {
  const row = types.find((t) => t.id === id);
  if (!row) return id;
  if (locale === "ur" && row.labelUr) return row.labelUr;
  return row.label;
}

export function openFootwearIds(types: ProductTypeSetting[] = PRODUCT_TYPE_DEFAULTS) {
  return types.filter((t) => t.openFootwear).map((t) => t.id);
}

export function typeSelectOptions(types: ProductTypeSetting[], extraIds: string[] = []) {
  const seen = new Set<string>();
  const options: { value: string; label: string }[] = [];
  for (const t of types) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    options.push({ value: t.id, label: t.label });
  }
  for (const id of extraIds) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    options.push({ value: id, label: id.replace(/-/g, " ") });
  }
  return options;
}
