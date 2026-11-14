import { Suspense } from "react";
import { OrderConfirmation } from "@/components/storefront/order-confirmation";

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-sm text-ink-muted">Loading…</div>}>
      <OrderConfirmation />
    </Suspense>
  );
}
