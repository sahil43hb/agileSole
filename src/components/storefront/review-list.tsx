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
  if (!count) {
    return (
      <section className="mt-16">
        <h2 className="text-xl font-semibold">Reviews</h2>
        <p className="mt-3 text-sm text-ink-muted">No reviews on this pair yet.</p>
      </section>
    );
  }
  const totalFit = fit.small + fit.true + fit.large || 1;
  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold">Reviews</h2>
      <p className="mt-2 text-sm">
        {average} / 5 · {count} review{count === 1 ? "" : "s"}
      </p>
      <div className="mt-4 max-w-md space-y-2 text-xs">
        {(["small", "true", "large"] as const).map((key) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-16 capitalize text-ink-faint">{key === "true" ? "True" : key}</span>
            <div className="h-1.5 flex-1 bg-paper-warm">
              <div className="h-1.5 bg-brand" style={{ width: `${(fit[key] / totalFit) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <ul className="mt-8 space-y-6">
        {reviews.map((r) => (
          <li key={r.id} className="border-t border-paper-line pt-4">
            <p className="text-sm font-medium">
              {r.authorName} · {r.rating}/5
            </p>
            {r.title ? <p className="mt-1 text-sm">{r.title}</p> : null}
            <p className="mt-1 text-sm text-ink-muted">{r.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
