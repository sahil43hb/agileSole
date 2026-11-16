"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PublicReview } from "@/server/modules/catalog/review.service";

export function ReviewList({
  reviews,
  average,
  count,
  fit,
}: {
  reviews: PublicReview[];
  average: number;
  count: number;
  fit: { small: number; true: number; large: number };
}) {
  const t = useTranslations("reviewsUi");
  const a = useTranslations("account");
  const FIT_LABEL = {
    small: t("runsSmall"),
    true: t("true"),
    large: t("runsLarge"),
  } as const;
  const totalFit = fit.small + fit.true + fit.large || 1;
  const filled = Math.round(average);

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-dark">{t("fromWearers")}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{a("reviews")}</h2>

      {count ? (
        <div className="mt-6 flex flex-wrap items-end gap-6">
          <div>
            <p className="text-5xl font-semibold tracking-tight">{average.toFixed(1)}</p>
            <div className="mt-2 flex gap-0.5 text-brand">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < filled ? "fill-brand" : "text-paper-line"}`} />
              ))}
            </div>
            <p className="mt-2 text-sm text-ink-muted">
              {count === 1 ? t("count", { count }) : t("countPlural", { count })}
            </p>
          </div>
          <div className="min-w-[12rem] flex-1 space-y-2.5">
            {(["true", "small", "large"] as const).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-ink-muted">{FIT_LABEL[key]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                  <div className="h-2 rounded-full bg-brand" style={{ width: `${(fit[key] / totalFit) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
          {t("first")}
        </p>
      )}

      {count ? (
        <ul className="mt-8 space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-mist text-sm font-semibold text-brand-dark">
                  {r.authorName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold">{r.authorName}</p>
                    <div className="flex gap-0.5 text-brand">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-brand" : "text-paper-line"}`} />
                      ))}
                    </div>
                  </div>
                  {r.title ? <p className="mt-1 text-sm font-medium">{r.title}</p> : null}
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{r.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
