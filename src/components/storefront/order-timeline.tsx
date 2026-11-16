"use client";

import { statusHint, statusLabel, TRACK_STEPS } from "@/shared/order-copy";

export function OrderTimeline({
  status,
  locale = "en",
  shipment,
}: {
  status: string;
  locale?: string;
  shipment?: { courierName?: string; trackingNumber?: string; trackingUrl?: string };
}) {
  const idx = TRACK_STEPS.indexOf(status as (typeof TRACK_STEPS)[number]);
  const side = ["unreachable", "on_hold", "cancelled", "delivery_failed", "returned", "pickup_ready"].includes(status);

  return (
    <div>
      <ol className="relative space-y-0">
        {TRACK_STEPS.map((step, i) => {
          const done = !side && idx >= i;
          const current = !side && idx === i;
          const last = i === TRACK_STEPS.length - 1;
          return (
            <li key={step} className="relative flex gap-3 pb-3.5 last:pb-0">
              {!last ? (
                <span className={`absolute start-[7px] top-4 h-full w-px ${done ? "bg-brand/40" : "bg-black/[0.08]"}`} />
              ) : null}
              <span
                className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-white ${
                  current ? "bg-brand" : done ? "bg-ink" : "bg-[#e4e8e4]"
                }`}
              />
              <div>
                <p className={`text-sm ${current ? "font-semibold text-ink" : done ? "font-medium text-ink" : "text-ink-muted"}`}>
                  {statusLabel(step, locale)}
                </p>
                {current ? <p className="mt-0.5 text-xs text-ink-muted">{statusHint(step, locale)}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
      {side ? (
        <p className="mt-4 rounded-2xl bg-[#f6f7f5] px-4 py-3 text-sm">
          <span className="font-medium">{statusLabel(status, locale)}</span>
          <span className="ms-2 text-ink-muted">{statusHint(status, locale)}</span>
        </p>
      ) : null}
      {shipment?.trackingNumber ? (
        <p className="mt-4 text-sm text-ink-muted">
          {shipment.courierName || "Courier"} · {shipment.trackingNumber}
          {shipment.trackingUrl ? (
            <a href={shipment.trackingUrl} className="ms-2 font-medium text-brand-dark hover:underline" target="_blank" rel="noreferrer">
              Track with courier
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
