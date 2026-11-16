"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getConsent, setConsent } from "@/lib/analytics";

export function CookieNotice() {
  const t = useTranslations("cookies");
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(!getConsent());
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-xl border border-paper-line bg-paper p-4 text-sm shadow-sm md:bottom-6">
      <p>
        {t("body")}
        <Link href="/privacy" className="underline">
          {t("privacy")}
        </Link>
        {t("bodyEnd")}
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
          {t("accept")}
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
          {t("necessary")}
        </button>
      </div>
    </div>
  );
}
