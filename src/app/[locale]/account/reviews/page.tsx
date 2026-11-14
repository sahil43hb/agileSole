"use client";

import { useEffect, useState } from "react";
import { AccountShell } from "@/components/storefront/account-shell";
import { Link } from "@/i18n/navigation";

type Review = { _id: string; productSlug: string; title: string; body: string; rating: number };

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch("/api/v1/me/reviews", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => j.ok && setReviews(j.data.reviews));
  }, []);

  return (
    <AccountShell>
      <h1 className="text-2xl font-semibold">Your reviews</h1>
      <ul className="mt-6 space-y-4">
        {reviews.map((r) => (
          <li key={r._id} className="border-b border-paper-line pb-3 text-sm">
            <p className="font-medium">
              {r.rating}/5 · {r.title}
            </p>
            <p className="text-ink-muted">{r.body}</p>
            <Link href={`/product/${r.productSlug}`} className="text-brand-dark">
              View pair
            </Link>
          </li>
        ))}
      </ul>
      {!reviews.length ? (
        <p className="mt-6 text-sm text-ink-muted">Reviews you write after delivery will show here.</p>
      ) : null}
    </AccountShell>
  );
}
