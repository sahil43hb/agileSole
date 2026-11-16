"use client";

import { useTranslations } from "next-intl";
import { workingDayRange } from "@/shared/shipping-eta";

export function ShippingEta({ eta }: { eta?: string | null }) {
  const t = useTranslations("common");
  const { from, to } = workingDayRange(eta);
  return (
    <span className="inline-flex items-center">
      {t.rich("etaRange", {
        from: () => <bdi>{from}</bdi>,
        to: () => <bdi>{to}</bdi>,
      })}
    </span>
  );
}
