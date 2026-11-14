"use client";

import { useEffect } from "react";
import { applyBrandIcon, DEFAULT_LOGO, LOGO_CHANGED_EVENT } from "@/lib/brand-icon";

export function BrandIconSync({ src }: { src?: string }) {
  useEffect(() => {
    let cancelled = false;

    function apply(url?: string | null) {
      if (!cancelled) applyBrandIcon(url || DEFAULT_LOGO);
    }

    if (src) apply(src);
    else {
      fetch("/api/v1/settings/public")
        .then((r) => r.json())
        .then((j) => {
          if (j.ok) apply(j.data?.logo);
        })
        .catch(() => apply(DEFAULT_LOGO));
    }

    function onChange(e: Event) {
      apply((e as CustomEvent<string>).detail);
    }
    window.addEventListener(LOGO_CHANGED_EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(LOGO_CHANGED_EVENT, onChange);
    };
  }, [src]);

  return null;
}
