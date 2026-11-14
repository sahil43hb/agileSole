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
      <ol className="space-y-3">
        {TRACK_STEPS.map((step, i) => {
          const done = !side && idx >= i;
          const current = !side && idx === i;
          return (
            <li key={step} className="flex gap-3">
              <span
                className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${
                  current ? "bg-brand" : done ? "bg-ink" : "bg-paper-line"
                }`}
              />
              <div>
                <p className={`text-sm ${current ? "font-medium" : "text-ink-muted"}`}>{statusLabel(step, locale)}</p>
                {current ? <p className="text-xs text-ink-faint">{statusHint(step, locale)}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
      {side ? (
        <p className="mt-4 border border-paper-line bg-paper-warm px-3 py-2 text-sm">
          <span className="font-medium">{statusLabel(status, locale)}</span>
          <span className="ms-2 text-ink-muted">{statusHint(status, locale)}</span>
        </p>
      ) : null}
      {shipment?.trackingNumber ? (
        <p className="mt-4 text-sm">
          {shipment.courierName || "Courier"} · {shipment.trackingNumber}
          {shipment.trackingUrl ? (
            <a href={shipment.trackingUrl} className="ms-2 text-brand-dark" target="_blank" rel="noreferrer">
              Track with courier
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
