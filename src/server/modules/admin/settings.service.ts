import { connectDb } from "@/server/db/connect";
import { getSetting, setSetting } from "@/server/models/setting";

export const STORE_DEFAULTS = {
  name: "Agile Sole",
  city: "Gujranwala",
  whatsapp: "923069158103",
  email: "agilesole@gmail.com",
  ntn: "",
  logo: "/favicon.png",
  returnDays: 14,
  maxCod: 50000,
  minOrder: 0,
  highValue: 15000,
};

export const ANALYTICS_DEFAULTS = {
  ga4Id: "",
  metaPixelId: "",
};

export const PAYMENTS_DEFAULTS = {
  cod: true,
  jazzcash: false,
  easypaisa: false,
  cards: false,
  stripe: false,
};

export const COURIERS_DEFAULTS = {
  manual: true,
  tcsApi: false,
  leopardApi: false,
  postex: false,
};

export async function getAllSettings() {
  await connectDb();
  const [store, analytics, payments, couriers] = await Promise.all([
    getSetting("store", STORE_DEFAULTS),
    getSetting("analytics", ANALYTICS_DEFAULTS),
    getSetting("payments", PAYMENTS_DEFAULTS),
    getSetting("couriers", COURIERS_DEFAULTS),
  ]);
  return {
    store: { ...STORE_DEFAULTS, ...store },
    analytics: { ...ANALYTICS_DEFAULTS, ...analytics },
    payments: { ...PAYMENTS_DEFAULTS, ...payments },
    couriers: { ...COURIERS_DEFAULTS, ...couriers },
  };
}

export async function saveAllSettings(input: {
  store?: Partial<typeof STORE_DEFAULTS>;
  analytics?: Partial<typeof ANALYTICS_DEFAULTS>;
  payments?: Partial<typeof PAYMENTS_DEFAULTS>;
  couriers?: Partial<typeof COURIERS_DEFAULTS>;
}) {
  await connectDb();
  const current = await getAllSettings();
  const nextStore = { ...current.store, ...input.store };
  if (typeof nextStore.name === "string") {
    nextStore.name = nextStore.name.trim() || STORE_DEFAULTS.name;
  }
  if (typeof nextStore.city === "string") {
    nextStore.city = nextStore.city.trim() || STORE_DEFAULTS.city;
  }
  const store = await setSetting("store", nextStore);
  const analytics = await setSetting("analytics", { ...current.analytics, ...input.analytics });
  const payments = await setSetting("payments", { ...current.payments, ...input.payments });
  const couriers = await setSetting("couriers", { ...current.couriers, ...input.couriers });
  return { store, analytics, payments, couriers };
}

export async function getPublicSettings() {
  try {
    const all = await getAllSettings();
    return {
      name: (all.store.name || STORE_DEFAULTS.name).trim() || STORE_DEFAULTS.name,
      city: (all.store.city || STORE_DEFAULTS.city).trim() || STORE_DEFAULTS.city,
      logo: all.store.logo || "/favicon.png",
      whatsapp: all.store.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP || STORE_DEFAULTS.whatsapp,
      email: all.store.email,
      ga4Id: all.analytics.ga4Id,
      metaPixelId: all.analytics.metaPixelId,
      payments: all.payments,
      couriers: all.couriers,
    };
  } catch {
    return {
      name: STORE_DEFAULTS.name,
      city: STORE_DEFAULTS.city,
      logo: STORE_DEFAULTS.logo,
      whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || STORE_DEFAULTS.whatsapp,
      email: STORE_DEFAULTS.email,
      ga4Id: "",
      metaPixelId: "",
      payments: PAYMENTS_DEFAULTS,
      couriers: COURIERS_DEFAULTS,
    };
  }
}
