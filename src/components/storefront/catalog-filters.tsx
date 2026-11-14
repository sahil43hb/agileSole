"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { AppSelect } from "@/components/ui/app-select";

const COLOR_HEX: Record<string, string> = {
  black: "#1a1a1a",
  forest: "#2f5d3a",
  "grey blue": "#6b7c8a",
  mint: "#9fd9b8",
  "navy lime": "#3d4a2c",
  "orange flash": "#e85d04",
  navy: "#1e3a5f",
  grey: "#8a8a8a",
  pink: "#e8a0b4",
  white: "#f4f4f4",
};

function colorHex(name: string) {
  return COLOR_HEX[name.toLowerCase()] || "#c8c8c8";
}

function Toggle({
  on,
  label,
  onClick,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-1.5 text-start text-sm">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
          on ? "border-ink bg-ink text-white" : "border-paper-line bg-white"
        }`}
      >
        {on ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
      {label}
    </button>
  );
}

export function CatalogFilters({
  sizes,
  colors,
  total,
  audience,
  styles,
  stylePath,
  children,
}: {
  sizes: string[];
  colors: string[];
  total: number;
  audience?: "men" | "women" | "kids";
  styles?: { href: string; label: string }[];
  stylePath?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function go(href: string) {
    const y = typeof window !== "undefined" ? window.scrollY : 0;
    router.replace(href, { scroll: false });
    if (typeof window === "undefined") return;
    const pin = () => {
      if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
    };
    pin();
    requestAnimationFrame(pin);
    window.setTimeout(pin, 40);
    window.setTimeout(pin, 120);
  }

  function setParam(key: string, value?: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || next.get(key) === value) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    const qs = next.toString();
    go(qs ? `${pathname}?${qs}` : pathname);
  }

  const currentSize = searchParams.get("size") || "";
  const currentColor = searchParams.get("color") || "";
  const gender = searchParams.get("gender") || audience || "";
  const sort = searchParams.get("sort") || "";
  const inStock = searchParams.get("inStock") === "1";
  const onSale = searchParams.get("onSale") === "1";
  const activeCount = ["size", "color", "inStock", "onSale"].filter((k) => searchParams.get(k)).length;

  function pickWho(g: string) {
    if (g === "men" || g === "women" || g === "kids") {
      go(`/c/${g}`);
      return;
    }
    setParam("gender", g);
  }

  return (
    <>
      <div className="sticky top-[6.5rem] z-30 -mx-4 mb-2 flex items-center justify-between gap-3 border-b border-paper-line/70 bg-paper/95 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-[#f3f5f3] px-3.5 py-2 text-sm font-medium md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount ? (
              <span className="rounded-full bg-ink px-1.5 text-[11px] leading-5 text-white">{activeCount}</span>
            ) : null}
            <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
          </button>
          <p className="text-sm text-ink-muted">
            <span className="font-medium text-ink">{total}</span> {total === 1 ? "pair" : "pairs"}
          </p>
        </div>
        <AppSelect
          tone="store"
          size="sm"
          className="w-[12.5rem]"
          value={sort}
          onChange={(next) => setParam("sort", next || undefined)}
          options={[
            { value: "all", label: "All" },
            { value: "", label: "Featured" },
            { value: "newest", label: "Newest" },
            { value: "price-asc", label: "Price: low to high" },
            { value: "price-desc", label: "Price: high to low" },
          ]}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16.5rem_1fr] lg:gap-12">
        <aside className={`${open ? "block" : "hidden"} md:block`}>
          <div className="space-y-8">
            {styles?.length ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint">Style</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {styles.map((s) => {
                    const on = stylePath === s.href;
                    return (
                      <Link
                        key={s.href}
                        href={s.href}
                        scroll={false}
                        className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                          on ? "bg-ink text-paper" : "bg-[#f3f5f3] text-ink hover:bg-[#e8ece9]"
                        }`}
                      >
                        {s.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint">Who</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["men", "women", "kids", "unisex"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => pickWho(g)}
                    className={`rounded-full px-3.5 py-1.5 text-sm capitalize transition ${
                      gender === g ? "bg-ink text-paper" : "bg-[#f3f5f3] text-ink hover:bg-[#e8ece9]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            {sizes.length ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint">EU size</p>
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setParam("size", s)}
                      className={`rounded-xl py-2 text-sm tabular-nums transition ${
                        currentSize === s ? "bg-ink text-paper" : "bg-[#f3f5f3] hover:bg-[#e8ece9]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {colors.length ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint">Color</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setParam("color", c)}
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm capitalize transition ${
                        currentColor === c ? "bg-ink text-paper" : "bg-[#f3f5f3] text-ink hover:bg-[#e8ece9]"
                      }`}
                    >
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border border-black/15"
                        style={{ background: colorHex(c) }}
                      />
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint">Availability</p>
              <div className="mt-2">
                <Toggle on={inStock} label="In stock" onClick={() => setParam("inStock", inStock ? undefined : "1")} />
                <Toggle on={onSale} label="On sale" onClick={() => setParam("onSale", onSale ? undefined : "1")} />
              </div>
            </div>
          </div>
        </aside>
        <div>{children}</div>
      </div>
    </>
  );
}
