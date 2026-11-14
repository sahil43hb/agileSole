"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function setLocale(next: "en" | "ur") {
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="flex h-10 items-center rounded-full bg-[#f2f4f2] p-0.5 text-[11px] font-semibold tracking-[0.08em]">
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-full px-2.5 py-1.5 transition ${
          locale === "en" ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("ur")}
        className={`rounded-full px-2.5 py-1.5 transition ${
          locale === "ur" ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
        }`}
      >
        اردو
      </button>
    </div>
  );
}
