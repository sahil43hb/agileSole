"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, Sparkles, Trash2, X } from "lucide-react";
import { slugify } from "@/shared/money";
import { AppSelect } from "@/components/ui/app-select";

type Loc = { en: string; ur: string };
type Variant = {
  sku: string;
  color?: string;
  colorHex?: string;
  sizeEu?: string;
  price: number;
  compareAt?: number | null;
  onHand?: number;
  isActive?: boolean;
};

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
  material?: string;
  variants?: Variant[];
};

const SIZES_MEN = ["40", "41", "42", "43", "44", "45"];
const SIZES_WOMEN = ["36", "37", "38", "39", "40", "41"];
const SIZES_KIDS = ["28", "30", "32", "34", "36"];

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
  sizeCharts: { code: string; title: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState<Loc>(initial?.title || { en: "", ur: "" });
  const [description, setDescription] = useState<Loc>(initial?.description || { en: "", ur: "" });
  const [fitNote, setFitNote] = useState<Loc>(initial?.fitNote || { en: "", ur: "" });
  const [slug, setSlug] = useState(initial?.slug || "");
  const [gender, setGender] = useState(initial?.gender || "men");
  const [type, setType] = useState(initial?.type || "sneaker");
  const [status, setStatus] = useState(initial?.status || "active");
  const [featured, setFeatured] = useState(Boolean(initial?.featured));
  const [brandId, setBrandId] = useState(initial?.brandId || "");
  const [categoryIds, setCategoryIds] = useState<string[]>(initial?.categoryIds || []);
  const [material, setMaterial] = useState(initial?.material || "");
  const [sizeChartCode, setSizeChartCode] = useState(initial?.sizeChartCode || "");
  const [images, setImages] = useState<string[]>(initial?.images || []);
  const [imageUrl, setImageUrl] = useState("");
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(() => {
    const map = new Map<string, string>();
    for (const v of initial?.variants || []) {
      if (v.color) map.set(v.color, v.colorHex || "#1FA64A");
    }
    return map.size ? [...map.entries()].map(([name, hex]) => ({ name, hex })) : [{ name: "Green", hex: "#1FA64A" }];
  });
  const defaultSizes = gender === "kids" ? SIZES_KIDS : gender === "women" ? SIZES_WOMEN : SIZES_MEN;
  const [sizes, setSizes] = useState<string[]>(() => {
    const set = new Set((initial?.variants || []).map((v) => v.sizeEu).filter(Boolean) as string[]);
    return set.size ? [...set] : defaultSizes;
  });
  const [grid, setGrid] = useState<Record<string, { price: string; compareAt: string; onHand: string; sku: string }>>(
    () => {
      const next: Record<string, { price: string; compareAt: string; onHand: string; sku: string }> = {};
      for (const v of initial?.variants || []) {
        const key = `${v.color || ""}|${v.sizeEu || ""}`;
        next[key] = {
          price: String(v.price || ""),
          compareAt: String(v.compareAt || ""),
          onHand: String(v.onHand ?? 0),
          sku: v.sku,
        };
      }
      return next;
    },
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const keys = useMemo(() => colors.flatMap((c) => sizes.map((s) => `${c.name}|${s}`)), [colors, sizes]);
  const sizeOptions = gender === "kids" ? SIZES_KIDS : gender === "women" ? SIZES_WOMEN : SIZES_MEN;

  function cell(key: string) {
    return grid[key] || { price: "4990", compareAt: "", onHand: "5", sku: "" };
  }

  function generate() {
    const base = (slug || slugify(title.en) || "AS").toUpperCase().replace(/[^A-Z0-9]+/g, "");
    const next = { ...grid };
    for (const c of colors) {
      const colorCode = c.name.slice(0, 4).toUpperCase();
      for (const s of sizes) {
        const key = `${c.name}|${s}`;
        const prev = next[key];
        next[key] = {
          price: prev?.price || "4990",
          compareAt: prev?.compareAt || "",
          onHand: prev?.onHand || "5",
          sku: prev?.sku || `${base}-${colorCode}-${s}`,
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
    if (!json.ok) throw new Error(json.error?.message || "Upload failed");
    setImages((prev) => [...prev, json.data.url]);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const variants: Variant[] = keys.map((key) => {
      const [color, sizeEu] = key.split("|");
      const c = colors.find((x) => x.name === color);
      const cellVal = cell(key);
      return {
        sku: cellVal.sku || `${slugify(title.en)}-${color}-${sizeEu}`,
        color,
        colorHex: c?.hex,
        sizeEu,
        price: Number(cellVal.price || 0),
        compareAt: cellVal.compareAt ? Number(cellVal.compareAt) : null,
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
      setError(json.error?.message || "Could not save");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/products" className="text-sm text-ink-muted hover:text-ink">
            ← Products
          </Link>
          <h1 className="mt-2">{initial?._id ? "Edit product" : "New product"}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {initial?._id ? title.en || "Update this style for the store." : "Add a style, photos, and size grid."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {initial?.slug ? (
            <Link
              href={`/en/product/${initial.slug}`}
              target="_blank"
              className="inline-flex h-11 items-center rounded-xl border border-[var(--admin-line)] bg-white px-4 text-sm"
            >
              View on store
            </Link>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : initial?._id ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
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
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--admin-line)] bg-[#f7f8f7] text-ink-muted hover:border-brand hover:text-brand-dark">
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs font-medium">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(file).catch((err) => setError(err.message));
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
              <p className="mb-2 text-[13px] font-medium text-ink-muted">EU sizes</p>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((s) => {
                  const on = sizes.includes(s);
                  return (
                    <label
                      key={s}
                      className={`flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-medium ${
                        on ? "border-ink bg-ink text-white" : "border-[var(--admin-line)] bg-white text-ink-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        onChange={(e) => setSizes(e.target.checked ? [...sizes, s].sort() : sizes.filter((x) => x !== s))}
                      />
                      {s}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[var(--admin-line)]">
              <table className="variant-grid min-w-full text-left text-sm">
                <thead>
                  <tr>
                    <th>Color</th>
                    <th>EU</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Compare-at</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => {
                    const [color, size] = key.split("|");
                    const val = cell(key);
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
            <p className="text-xs text-ink-faint">Generate SKUs after colors and sizes. Empty SKUs fill on save.</p>
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
                onChange={setGender}
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
                onChange={setType}
                options={[
                  { value: "sneaker", label: "Sneaker" },
                  { value: "sandal", label: "Sandal" },
                  { value: "slide", label: "Slide" },
                  { value: "clog", label: "Clog" },
                  { value: "slipper", label: "Slipper" },
                ]}
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
              <span className={`h-5 w-9 rounded-full p-0.5 ${featured ? "bg-brand" : "bg-[#d5ddd7]"}`}>
                <span className={`block h-4 w-4 rounded-full bg-white transition ${featured ? "translate-x-4" : ""}`} />
              </span>
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
              Size chart
              <AppSelect
                value={sizeChartCode}
                onChange={setSizeChartCode}
                options={[{ value: "", label: "Auto" }, ...sizeCharts.map((c) => ({ value: c.code, label: c.title }))]}
              />
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
