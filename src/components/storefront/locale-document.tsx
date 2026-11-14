"use client";

import { useEffect } from "react";

export function LocaleDocument({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ur" ? "rtl" : "ltr";
    document.body.classList.toggle("font-urdu", locale === "ur");
  }, [locale]);
  return null;
}
