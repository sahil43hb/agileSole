"use client";

import { useId, useState } from "react";
import { ArrowUpRight, MessageCircle, Minus, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function HomeFaq({ items, ur }: { items: { q: string; a: string }[]; ur: boolean }) {
  const [open, setOpen] = useState(0);
  const baseId = useId();
  const list = items.slice(0, 6);
  const wa = (process.env.NEXT_PUBLIC_WHATSAPP || "923069158103").replace(/\D/g, "");

  if (!list.length) return null;

  return (
    <section className="mx-auto max-w-[90rem] px-4 py-12 md:px-8 md:py-16">
      <div className="grid overflow-hidden rounded-[2.25rem] bg-white shadow-[0_24px_80px_-40px_rgba(17,24,17,0.35)] ring-1 ring-black/[0.05] md:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        <div className="relative isolate flex flex-col justify-between overflow-hidden bg-ink px-7 py-10 text-paper md:px-10 md:py-12 lg:min-h-[28rem] lg:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-brand-mint/20 blur-3xl" />
          <p className="relative text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-light">
            {ur ? "مدد" : "Help desk"}
          </p>
          <h2 className="relative mt-4 max-w-[12ch] text-[2rem] font-semibold leading-[1.08] tracking-tight md:text-4xl">
            {ur ? "آرڈر سے پہلے جواب" : "Answers before you order"}
          </h2>
          <p className="relative mt-4 max-w-sm text-sm leading-relaxed text-paper/65">
            {ur
              ? "کیس آن ڈیلیوری، سائز، شپنگ اور ایکسچینج — گوجرانوالہ سے پاکستان بھر۔"
              : "COD, EU sizing, nationwide shipping from Gujranwala, and unworn size swaps — in one place."}
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Link
              href="/faq"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand-dark"
            >
              {ur ? "سب سوالات" : "All questions"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-medium text-paper ring-1 ring-white/15 transition hover:bg-white/15"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>

        <div className="min-w-0 bg-[#f7f8f6] p-3 sm:p-5 md:p-6 lg:p-8">
          <ul className="space-y-2">
            {list.map((item, i) => {
              const isOpen = open === i;
              const panelId = `${baseId}-panel-${i}`;
              const btnId = `${baseId}-btn-${i}`;
              return (
                <li
                  key={item.q}
                  className={`rounded-[1.35rem] transition ${
                    isOpen ? "bg-white shadow-[0_10px_30px_-18px_rgba(17,24,17,0.45)]" : "bg-transparent hover:bg-white/70"
                  }`}
                >
                  <button
                    id={btnId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center gap-4 px-4 py-4 text-start md:px-5 md:py-[1.15rem]"
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums transition ${
                        isOpen ? "bg-brand text-white" : "bg-white text-ink-muted ring-1 ring-black/[0.06]"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug tracking-tight text-ink md:text-base">
                      {item.q}
                    </span>
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${
                        isOpen ? "bg-ink text-paper" : "bg-white text-ink ring-1 ring-black/[0.06]"
                      }`}
                    >
                      {isOpen ? <Minus className="h-3.5 w-3.5" strokeWidth={2.2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />}
                    </span>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    aria-hidden={!isOpen}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-4 pb-5 ps-[4.25rem] pe-12 text-sm leading-relaxed text-ink-muted md:px-5 md:ps-[4.5rem]">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
