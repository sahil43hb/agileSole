export const SIZE_SYSTEMS = ["eu", "pk", "uk", "us"] as const;
export type SizeSystem = (typeof SIZE_SYSTEMS)[number];

export type SizeRow = {
  eu?: string;
  pk?: string;
  uk?: string;
  us?: string;
  cm?: string;
};

export const SIZE_SYSTEM_OPTIONS: { value: SizeSystem; label: string; short: string }[] = [
  { value: "pk", label: "Pakistan", short: "PK" },
  { value: "eu", label: "Europe (EU)", short: "EU" },
  { value: "uk", label: "United Kingdom", short: "UK" },
  { value: "us", label: "United States", short: "US" },
];

const FALLBACK: Record<string, string[]> = {
  men: ["40", "41", "42", "43", "44", "45"],
  unisex: ["40", "41", "42", "43", "44", "45"],
  women: ["36", "37", "38", "39", "40", "41"],
  kids: ["28", "30", "32", "34", "36"],
};

export const DEFAULT_SIZE_SYSTEM: SizeSystem = "pk";
export const DEFAULT_SIZE_CHART = "kids-eu";

export function parseSizeSystem(value: unknown, fallback: SizeSystem = "eu"): SizeSystem {
  return SIZE_SYSTEMS.includes(value as SizeSystem) ? (value as SizeSystem) : fallback;
}

export function sizeSystemShort(system: SizeSystem) {
  return SIZE_SYSTEM_OPTIONS.find((o) => o.value === system)?.short || "EU";
}

export function defaultChartCode(gender?: string, type?: string, openFootwear: string[] = ["sandal", "slide", "slipper", "clog"]) {
  if (gender === "kids") return "kids-eu";
  if (type && openFootwear.includes(type)) return "sandal-eu";
  if (gender === "women") return "women-eu";
  return "men-eu";
}

export function sizeFromRow(row: SizeRow | undefined, system: SizeSystem) {
  if (!row) return "";
  const value = row[system] || row.eu || "";
  return String(value).trim();
}

export function findSizeRow(rows: SizeRow[], system: SizeSystem, value: string) {
  const needle = value.trim();
  if (!needle) return undefined;
  return rows.find((row) => sizeFromRow(row, system) === needle);
}

export function displaySize(
  variant: { sizeEu?: string; sizePk?: string; sizeUk?: string; sizeUs?: string },
  system: SizeSystem,
) {
  if (system === "pk") return String(variant.sizePk || variant.sizeEu || "").trim();
  if (system === "uk") return String(variant.sizeUk || variant.sizeEu || "").trim();
  if (system === "us") return String(variant.sizeUs || variant.sizeEu || "").trim();
  return String(variant.sizeEu || "").trim();
}

export function variantMatchesSize(
  variant: { sizeEu?: string; sizePk?: string; sizeUk?: string; sizeUs?: string },
  size: string,
) {
  const needle = size.trim();
  if (!needle) return false;
  return [variant.sizeEu, variant.sizePk, variant.sizeUk, variant.sizeUs]
    .filter(Boolean)
    .map(String)
    .includes(needle);
}

export function mappedSizes(row: SizeRow | undefined, picked: string, system: SizeSystem) {
  return {
    sizeEu: row?.eu || (system === "eu" ? picked : picked),
    sizePk: row?.pk || (system === "pk" ? picked : undefined),
    sizeUk: row?.uk || (system === "uk" ? picked : undefined),
    sizeUs: row?.us || (system === "us" ? picked : undefined),
    sizeCm: row?.cm || undefined,
  };
}

export function sortSizeValues(a: string, b: string) {
  return Number(a) - Number(b) || a.localeCompare(b, undefined, { numeric: true });
}

export function sizesForSystem(rows: SizeRow[], system: SizeSystem, gender = "men") {
  const fromChart = rows.map((row) => sizeFromRow(row, system)).filter(Boolean);
  const unique = [...new Set(fromChart)];
  if (unique.length) return unique;
  return FALLBACK[gender] || FALLBACK.men;
}

export function orderSizes(values: string[], rows: SizeRow[], system: SizeSystem, gender = "men") {
  const order = sizesForSystem(rows, system, gender);
  const rank = new Map(order.map((s, i) => [s, i]));
  return [...new Set(values.filter(Boolean))].sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999));
}

export function remapSizeValue(value: string, from: SizeSystem, to: SizeSystem, rows: SizeRow[]) {
  const row = findSizeRow(rows, from, value) || findSizeRow(rows, "eu", value);
  return sizeFromRow(row, to) || (from === to ? value : "");
}
