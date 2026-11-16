"use client";

import { createContext, useContext, type ReactNode } from "react";
import { BRAND } from "@/shared/constants";

export type StoreIdentity = {
  name: string;
  city: string;
  logo: string;
  email?: string;
  whatsapp?: string;
};

const FALLBACK: StoreIdentity = {
  name: BRAND.name,
  city: BRAND.city,
  logo: "/favicon.png",
};

const StoreIdentityContext = createContext<StoreIdentity>(FALLBACK);

export function StoreIdentityProvider({
  value,
  children,
}: {
  value?: Partial<StoreIdentity> | null;
  children: ReactNode;
}) {
  const next: StoreIdentity = {
    name: value?.name?.trim() || FALLBACK.name,
    city: value?.city?.trim() || FALLBACK.city,
    logo: value?.logo || FALLBACK.logo,
    email: value?.email || "",
    whatsapp: value?.whatsapp || "",
  };
  return <StoreIdentityContext.Provider value={next}>{children}</StoreIdentityContext.Provider>;
}

export function useStoreIdentity() {
  return useContext(StoreIdentityContext);
}
