"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { AccountShell } from "@/components/storefront/account-shell";
import { Link } from "@/i18n/navigation";

type Review = { _id: string; productSlug: string; title: string; body: string; rating: number };

export default function MyReviewsPage() {
  const t = useTranslations("account");
  const c = useTranslations("common");
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch("/api/v1/me/reviews", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => j.ok && setReviews(j.data.reviews));
  }, []);

  return (
    <AccountShell>
      <h1 className="text-3xl font-semibold tracking-tight">{t("yourReviews")}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t("reviewsHint")}</p>
      {reviews.length ? (
        <ul className="mt-6 space-y-3">
          {reviews.map((r) => (
            <li key={r._id} className="rounded-[1.25rem] bg-white p-5 ring-1 ring-black/[0.04]">
              <div className="flex gap-0.5 text-brand">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-brand" : "text-paper-line"}`} />
                ))}
              </div>
              {r.title ? <p className="mt-2 font-semibold">{r.title}</p> : null}
              <p className="mt-1 text-sm text-ink-muted">{r.body}</p>
              <Link href={`/product/${r.productSlug}`} className="mt-3 inline-block text-sm font-medium text-brand-dark hover:underline">
                {t("viewPair")}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 max-w-lg rounded-[1.35rem] bg-white p-8 text-center ring-1 ring-black/[0.04]">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f5f2]">
            <Star className="h-5 w-5 text-ink-muted" />
          </span>
          <p className="mt-4 font-medium">{t("noReviews")}</p>
          <p className="mt-1 text-sm text-ink-muted">{t("reviewsEmptyHint")}</p>
          <Link href="/shop" className="btn-primary mt-6 inline-flex h-11 rounded-full px-5">
            {c("shopCollection")}
          </Link>
        </div>
      )}
    </AccountShell>
  );
}
