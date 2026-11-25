"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, ImagePlus, Plus, Sparkles, Trash2, X } from "lucide-react";
import { AdminHeaderAction, AdminPageHeader } from "@/components/admin/ui";
import { slugify } from "@/shared/money";
import { AppSelect } from "@/components/ui/app-select";
import { SwitchTrack } from "@/components/ui/switch";
import { toast, toastApiError } from "@/components/ui/toast";
import { useCan } from "@/components/admin/access";
import { useStoreIdentity } from "@/components/store-identity";
import { defaultProductTypeId, openFootwearIds, typeSelectOptions } from "@/shared/product-types";
import {
  DEFAULT_SIZE_CHART,
  DEFAULT_SIZE_SYSTEM,
  SIZE_SYSTEM_OPTIONS,
  defaultChartCode,
  displaySize,
  findSizeRow,
  mappedSizes,
  orderSizes,
  parseSizeSystem,
  remapSizeValue,
  sizesForSystem,
  sizeSystemShort,
  type SizeRow,
  type SizeSystem,
} from "@/shared/size-system";

type Loc = { en: string; ur: string };
type Variant = {
  sku: string;
  color?: string;
  colorHex?: string;
  sizeEu?: string;
  sizePk?: string;
  sizeUk?: string;
  sizeUs?: string;
  sizeCm?: string;
  price: number;
  compareAt?: number | null;
  cost?: number | null;
  onHand?: number;
  isActive?: boolean;
};

type GridCell = { price: string; compareAt: string; cost: string; onHand: string; sku: string };

function splitKey(key: string): [string, string] {
  const i = key.indexOf("|");
  if (i < 0) return [key, ""];
  return [key.slice(0, i), key.slice(i + 1)];
}

function money(n: number) {
  return `Rs ${Math.round(n).toLocaleString("en-PK")}`;
}

export type ProductFormValue = {
  _id?: string;
  slug?: string;
  title?: Loc;
  description?: Loc;
  fitNote?: Loc;
  gender?: string;
  type?: string;
  status?: string;
  featured?: boolean;
  brandId?: string | null;
  categoryIds?: string[];
  images?: string[];
  sizeChartCode?: string;
  sizeSystem?: string;
  material?: string;
  variants?: Variant[];
};

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
const area =
  "mt-1.5 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
const card = "space-y-4 rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm sm:p-6";
const label = "block text-[13px] font-medium text-ink-muted";

export function ProductForm({
  initial,
  brands,
  categories,
  sizeCharts,
}: {
  initial?: ProductFormValue;
  brands: { id: string; label: string }[];
  categories: { id: string; label: string; parentId: string | null }[];
  sizeCharts: { code: string; title: string; productType?: string; rows?: SizeRow[] }[];
}) {
  const router = useRouter();
  const access = useCan("products");
  const { productTypes } = useStoreIdentity();
  const typeOptions = typeSelectOptions(productTypes, initial?.type ? [initial.type] : []);
  const openFootwear = useMemo(() => openFootwearIds(productTypes), [productTypes]);
  const canSave = initial?._id ? access.update : access.create;
  const [title, setTitle] = useState<Loc>(initial?.title || { en: "", ur: "" });
  const [description, setDescription] = useState<Loc>(initial?.description || { en: "", ur: "" });
  const [fitNote, setFitNote] = useState<Loc>(initial?.fitNote || { en: "", ur: "" });
  const [slug, setSlug] = useState(initial?.slug || "");
  const [gender, setGender] = useState(initial?.gender || "kids");
  const [type, setType] = useState(initial?.type || defaultProductTypeId(productTypes));
  const [status, setStatus] = useState(initial?.status || "active");
  const [featured, setFeatured] = useState(Boolean(initial?.featured));
  const [brandId, setBrandId] = useState(initial?.brandId || "");
  const [categoryIds, setCategoryIds] = useState<string[]>(initial?.categoryIds || []);
  const [material, setMaterial] = useState(initial?.material || "");
  const [sizeChartCode, setSizeChartCode] = useState(initial?.sizeChartCode || (initial?._id ? "" : DEFAULT_SIZE_CHART));
  const [sizeSystem, setSizeSystem] = useState<SizeSystem>(
    parseSizeSystem(initial?.sizeSystem, DEFAULT_SIZE_SYSTEM),
  );
  const [images, setImages] = useState<string[]>(initial?.images || []);
  const [imageUrl, setImageUrl] = useState("");
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(() => {
    const map = new Map<string, string>();
    for (const v of initial?.variants || []) {
      if (v.color) map.set(v.color, v.colorHex || "#1FA64A");
    }
    return map.size ? [...map.entries()].map(([name, hex]) => ({ name, hex })) : [{ name: "Green", hex: "#1FA64A" }];
  });
  const [sizes, setSizes] = useState<string[]>(() => {
    const system = parseSizeSystem(initial?.sizeSystem);
    const set = new Set(
      (initial?.variants || []).map((v) => displaySize(v, system)).filter(Boolean),
    );
    return set.size ? [...set] : [];
  });
  const [grid, setGrid] = useState<Record<string, GridCell>>(() => {
    const next: Record<string, GridCell> = {};
    for (const v of initial?.variants || []) {
      const system = parseSizeSystem(initial?.sizeSystem);
      const key = `${v.color || ""}|${displaySize(v, system)}`;
      next[key] = {
        price: String(v.price || ""),
        compareAt: String(v.compareAt || ""),
        cost: v.cost != null && v.cost !== 0 ? String(v.cost) : "",
        onHand: String(v.onHand ?? 0),
        sku: v.sku,
      };
    }
    return next;
  });
  const [bulkCost, setBulkCost] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const keys = useMemo(() => colors.flatMap((c) => sizes.map((s) => `${c.name}|${s}`)), [colors, sizes]);
  const activeChart = useMemo(() => {
    if (sizeChartCode) return sizeCharts.find((c) => c.code === sizeChartCode);
    return sizeCharts.find((c) => c.code === defaultChartCode(gender, type, openFootwear));
  }, [sizeCharts, sizeChartCode, gender, type, openFootwear]);
  const chartRows = activeChart?.rows || [];
  const sizeOptions = sizesForSystem(chartRows, sizeSystem, gender);
  const sizeOptionKey = sizeOptions.join("|");
  const systemShort = sizeSystemShort(sizeSystem);

  function rewriteGrid(mapSize: (size: string) => string) {
    setGrid((prev) => {
      const next: Record<string, GridCell> = {};
      for (const [key, val] of Object.entries(prev)) {
        const [color, size] = splitKey(key);
        next[`${color}|${mapSize(size)}`] = val;
      }
      return next;
    });
  }

  function changeSizeSystem(next: SizeSystem) {
    if (next === sizeSystem) return;
    const mapped = sizes
      .map((s) => remapSizeValue(s, sizeSystem, next, chartRows))
      .filter(Boolean);
    const unique = orderSizes(mapped, chartRows, next, gender);
    rewriteGrid((s) => remapSizeValue(s, sizeSystem, next, chartRows) || s);
    setSizeSystem(next);
    setSizes(unique.length ? unique : sizesForSystem(chartRows, next, gender));
  }

  useEffect(() => {
    setSizes((prev) => {
      if (!sizeOptions.length) return prev;
      if (!prev.length) return sizeOptions;
      const keep = orderSizes(
        prev.filter((s) => sizeOptions.includes(s)),
        chartRows,
        sizeSystem,
        gender,
      );
      return keep.length ? keep : sizeOptions;
    });
    // sizeOptionKey is the chart/country list; clicking a size must not re-seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeOptionKey]);

  function cell(key: string): GridCell {
    return grid[key] || { price: "4990", compareAt: "", cost: "", onHand: "5", sku: "" };
  }

  function generate() {
    const base = (slug || slugify(title.en) || "AS").toUpperCase().replace(/[^A-Z0-9]+/g, "");
    const next = { ...grid };
    for (const c of colors) {
      const colorCode = c.name.slice(0, 4).toUpperCase();
      for (const s of sizes) {
        const key = `${c.name}|${s}`;
        const prev = next[key];
        const eu = mappedSizes(findSizeRow(chartRows, sizeSystem, s), s, sizeSystem).sizeEu || s;
        next[key] = {
          price: prev?.price || "4990",
          compareAt: prev?.compareAt || "",
          cost: prev?.cost || "",
          onHand: prev?.onHand || "5",
          sku: prev?.sku || `${base}-${colorCode}-${eu}`,
        };
      }
    }
    setGrid(next);
  }

  async function upload(file: File) {
    const body = new FormData();
    body.set("file", file);
    const res = await fetch("/api/v1/admin/media", { method: "POST", body });
    const json = await res.json();
    if (!json.ok) {
      toastApiError(json, "Could not upload image");
      return;
    }
    setImages((prev) => [...prev, json.data.url]);
    toast.success("Photo added");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const variants: Variant[] = keys.map((key) => {
      const [color, size] = splitKey(key);
      const c = colors.find((x) => x.name === color);
      const cellVal = cell(key);
      const row = findSizeRow(chartRows, sizeSystem, size);
      const mapped = mappedSizes(row, size, sizeSystem);
      return {
        sku: cellVal.sku || `${slugify(title.en)}-${color}-${mapped.sizeEu || size}`,
        color,
        colorHex: c?.hex,
        ...mapped,
        price: Number(cellVal.price || 0),
        compareAt: cellVal.compareAt ? Number(cellVal.compareAt) : null,
        cost: cellVal.cost ? Number(cellVal.cost) : null,
        onHand: Number(cellVal.onHand || 0),
        isActive: true,
      };
    });
    const payload = {
      slug: slug || slugify(title.en),
      title,
      description,
      fitNote,
      gender,
      type,
      status,
      featured,
      brandId: brandId || null,
      categoryIds,
      images,
      sizeChartCode: sizeChartCode || null,
      sizeSystem,
      material,
      variants,
    };
    const url = initial?._id ? `/api/v1/admin/products/${initial._id}` : "/api/v1/admin/products";
    const res = await fetch(url, {
      method: initial?._id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) {
      toastApiError(json, "Could not save");
      return;
    }
    toast.success("Product saved");
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-8">
      <div>
        <Link href="/admin/products" className="text-sm text-ink-muted hover:text-ink">
          ← Products
        </Link>
        <div className="mt-2">
          <AdminPageHeader
            title={initial?._id ? "Edit product" : "New product"}
            description={initial?._id ? title.en || "Update this style for the store." : "Add a style, photos, and size grid."}
            actions={
              <>
                {initial?.slug ? (
                  <AdminHeaderAction
                    icon={ExternalLink}
                    label="View on store"
                    href={`/en/product/${initial.slug}`}
                    target="_blank"
                    variant="secondary"
                  />
                ) : null}
                {canSave ? (
                <AdminHeaderAction
                  icon={Check}
                  type="submit"
                  label={initial?._id ? "Save changes" : "Create product"}
                  loadingLabel="Saving…"
                  disabled={saving}
                />
                ) : null}
              </>
            }
          />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
          <section className={card}>
            <h2 className="text-sm font-semibold tracking-tight">Details</h2>
            <label className={label}>
              Title (English)
              <input required className={field} value={title.en} onChange={(e) => setTitle({ ...title, en: e.target.value })} />
            </label>
            <label className={label}>
              Title (Urdu)
              <input dir="rtl" className={field} value={title.ur} onChange={(e) => setTitle({ ...title, ur: e.target.value })} />
            </label>
            <label className={label}>
              Description (English)
              <textarea className={area} rows={4} value={description.en} onChange={(e) => setDescription({ ...description, en: e.target.value })} />
            </label>
            <label className={label}>
              Fit note
              <input className={field} value={fitNote.en} onChange={(e) => setFitNote({ ...fitNote, en: e.target.value })} placeholder="True to size" />
            </label>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold tracking-tight">Photos</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((src) => (
                <button
                  key={src}
                  type="button"
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-[#f4f7f5]"
                  onClick={() => setImages(images.filter((i) => i !== src))}
                  title="Remove"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/50 opacity-0 transition group-hover:opacity-100">
                    <X className="h-5 w-5 text-white" />
                  </span>
                </button>
              ))}
              <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-[var(--admin-line)] bg-[#f7f8f7] text-ink-muted hover:border-brand hover:text-brand-dark">
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs font-medium">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(file);
                  }}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                className={`${field} mt-0 min-w-48 flex-1`}
                placeholder="Paste image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <button
                type="button"
                className="h-11 rounded-xl border border-[var(--admin-line)] bg-white px-4 text-sm"
                onClick={() => {
                  if (imageUrl.trim()) {
                    setImages([...images, imageUrl.trim()]);
                    setImageUrl("");
                  }
                }}
              >
                Add URL
              </button>
            </div>
          </section>

          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold tracking-tight">Colors & sizes</h2>
              <button
                type="button"
                onClick={generate}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3 text-sm font-medium text-ink"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate SKUs
              </button>
            </div>
            <div className="space-y-2">
              {colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-[#f7f8f7] p-2">
                  <input
                    type="color"
                    value={c.hex}
                    onChange={(e) => {
                      const next = [...colors];
                      next[i] = { ...c, hex: e.target.value };
                      setColors(next);
                    }}
                    className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-[#e7ebe8] bg-white p-1"
                  />
                  <input
                    className={`${field} mt-0`}
                    value={c.name}
                    onChange={(e) => {
                      const next = [...colors];
                      next[i] = { ...c, name: e.target.value };
                      setColors(next);
                    }}
                  />
                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-faint hover:bg-white hover:text-red-700"
                    onClick={() => setColors(colors.filter((_, j) => j !== i))}
                    aria-label="Remove color"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="inline-flex h-10 items-center gap-1.5 text-sm font-medium text-brand-dark"
                onClick={() => setColors([...colors, { name: "Black", hex: "#111111" }])}
              >
                <Plus className="h-4 w-4" />
                Add color
              </button>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-ink-muted">{systemShort} sizes</p>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((s) => {
                  const on = sizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={on}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-medium ${
                        on ? "border-ink bg-ink text-white" : "border-[var(--admin-line)] bg-white text-ink-muted"
                      }`}
                      onClick={() =>
                        setSizes(
                          on
                            ? sizes.filter((x) => x !== s)
                            : orderSizes([...sizes, s], chartRows, sizeSystem, gender),
                        )
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2 rounded-xl bg-[#f7f8f7] p-3">
              <label className="min-w-[10rem] flex-1 text-[13px] font-medium text-ink-muted">
                Cost (what you pay)
                <input
                  className={`${field} mt-1`}
                  inputMode="numeric"
                  placeholder="e.g. 2800"
                  value={bulkCost}
                  onChange={(e) => setBulkCost(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="h-11 rounded-xl border border-[var(--admin-line)] bg-white px-4 text-sm font-medium"
                onClick={() => {
                  if (!bulkCost) return;
                  const next = { ...grid };
                  for (const key of keys) {
                    const prev = cell(key);
                    next[key] = { ...prev, cost: bulkCost };
                  }
                  setGrid(next);
                }}
              >
                Apply cost to all sizes
              </button>
            </div>
            <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-[var(--admin-line)]">
              <table className="variant-grid min-w-full text-left text-sm">
                <thead>
                  <tr>
                    <th>Color</th>
                    <th>{systemShort}</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Cost</th>
                    <th>Profit</th>
                    <th>Compare-at</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => {
                    const [color, size] = splitKey(key);
                    const val = cell(key);
                    const price = Number(val.price || 0);
                    const cost = Number(val.cost || 0);
                    const profit = price && cost ? price - cost : null;
                    const pct = price && cost ? Math.round((profit! / price) * 100) : null;
                    return (
                      <tr key={key}>
                        <td className="whitespace-nowrap">{color}</td>
                        <td>{size}</td>
                        <td>
                          <input
                            className="h-9 w-40 rounded-lg border border-[#e7ebe8] bg-white px-2 text-sm"
                            value={val.sku}
                            onChange={(e) => setGrid({ ...grid, [key]: { ...val, sku: e.target.value } })}
                          />
                        </td>
                        <td>
                          <input
                            className="h-9 w-24 rounded-lg border border-[#e7ebe8] bg-white px-2 text-sm"
                            value={val.price}
                            onChange={(e) => setGrid({ ...grid, [key]: { ...val, price: e.target.value } })}
                          />
                        </td>
                        <td>
                          <input
                            className="h-9 w-24 rounded-lg border border-[#e7ebe8] bg-white px-2 text-sm"
                            value={val.cost}
                            placeholder="0"
                            onChange={(e) => setGrid({ ...grid, [key]: { ...val, cost: e.target.value } })}
                          />
                        </td>
                        <td className="whitespace-nowrap text-xs text-ink-muted">
                          {profit != null ? (
                            <span className={profit < 0 ? "font-medium text-red-700" : "font-medium text-brand-dark"}>
                              {money(profit)} · {pct}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <input
                            className="h-9 w-24 rounded-lg border border-[#e7ebe8] bg-white px-2 text-sm"
                            value={val.compareAt}
                            onChange={(e) => setGrid({ ...grid, [key]: { ...val, compareAt: e.target.value } })}
                          />
                        </td>
                        <td>
                          <input
                            className="h-9 w-16 rounded-lg border border-[#e7ebe8] bg-white px-2 text-sm"
                            value={val.onHand}
                            onChange={(e) => setGrid({ ...grid, [key]: { ...val, onHand: e.target.value } })}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-ink-faint">
              Cost is what you pay the supplier. Profit = selling price − cost. Saved on each order so later cost edits do not rewrite old reports.
            </p>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className={card}>
            <h2 className="text-sm font-semibold tracking-tight">Publishing</h2>
            <label className={label}>
              Status
              <AppSelect
                value={status}
                onChange={setStatus}
                options={[
                  { value: "active", label: "Active — on the store" },
                  { value: "unlisted", label: "Inactive — hidden" },
                  { value: "draft", label: "Draft" },
                  { value: "archived", label: "Archived" },
                ]}
              />
            </label>
            <label className={label}>
              Gender
              <AppSelect
                value={gender}
                onChange={(next) => {
                  setGender(next);
                  setSizeChartCode(defaultChartCode(next, type, openFootwear));
                }}
                options={[
                  { value: "men", label: "Men" },
                  { value: "women", label: "Women" },
                  { value: "kids", label: "Kids" },
                  { value: "unisex", label: "Unisex" },
                ]}
              />
            </label>
            <label className={label}>
              Type
              <AppSelect
                value={type}
                onChange={(next) => {
                  setType(next);
                  setSizeChartCode(defaultChartCode(gender, next, openFootwear));
                }}
                options={typeOptions}
              />
            </label>
            <button
              type="button"
              onClick={() => setFeatured((v) => !v)}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-sm ${
                featured ? "border-brand bg-brand-mist text-brand-dark" : "border-[var(--admin-line)] bg-[#f7f8f7] text-ink-muted"
              }`}
            >
              Featured on home
              <SwitchTrack on={featured} />
            </button>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold tracking-tight">Organization</h2>
            <label className={label}>
              Slug
              <input className={field} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(title.en)} />
            </label>
            <label className={label}>
              Brand
              <AppSelect
                value={brandId}
                onChange={setBrandId}
                options={[{ value: "", label: "—" }, ...brands.map((b) => ({ value: b.id, label: b.label }))]}
              />
            </label>
            <label className={label}>
              Size country
              <AppSelect
                value={sizeSystem}
                onChange={(v) => changeSizeSystem(parseSizeSystem(v))}
                options={SIZE_SYSTEM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
            </label>
            <label className={label}>
              Size chart
              <AppSelect
                value={sizeChartCode || activeChart?.code || DEFAULT_SIZE_CHART}
                onChange={setSizeChartCode}
                options={sizeCharts.map((c) => ({ value: c.code, label: c.title }))}
              />
              <span className="mt-1 block text-xs font-normal text-ink-faint">
                Size chips follow this chart in {systemShort} order.
              </span>
            </label>
            <label className={label}>
              Material
              <input className={field} value={material} onChange={(e) => setMaterial(e.target.value)} />
            </label>
            <div>
              <p className="mb-2 text-[13px] font-medium text-ink-muted">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const on = categoryIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryIds((prev) => (on ? prev.filter((x) => x !== c.id) : [...prev, c.id]))}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        on ? "bg-ink text-white" : "border border-[var(--admin-line)] bg-white text-ink-muted"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </aside>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
