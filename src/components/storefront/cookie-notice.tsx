"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getConsent, setConsent } from "@/lib/analytics";

export function CookieNotice() {
  const locale = useLocale();
  const ur = locale === "ur";
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(!getConsent());
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-xl border border-paper-line bg-paper p-4 text-sm shadow-sm md:bottom-6">
      <p>
        {ur
          ? "زبان، بیگ اور پسندیدہ کے لیے ضروری کوکیز۔ تجزیہ صرف آپ کی اجازت سے۔ "
          : "We use a few cookies so language, wishlist, and cart keep working. Analytics load only if you accept. See "}
        <Link href="/privacy" className="underline">
          {ur ? "پرائیویسی" : "privacy"}
        </Link>
        {ur ? " دیکھیں۔" : "."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="cookie-accept"
          className="bg-ink px-3 py-1.5 text-xs text-paper"
          onClick={() => {
            setConsent("all");
            setShow(false);
          }}
        >
          {ur ? "سب قبول" : "Accept all"}
        </button>
        <button
          type="button"
          data-testid="cookie-necessary"
          className="border border-paper-line px-3 py-1.5 text-xs"
          onClick={() => {
            setConsent("necessary");
            setShow(false);
          }}
        >
          {ur ? "صرف ضروری" : "Necessary only"}
        </button>
      </div>
    </div>
  );
}
