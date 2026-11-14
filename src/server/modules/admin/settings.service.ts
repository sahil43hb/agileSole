import { connectDb } from "@/server/db/connect";
import { getSetting, setSetting } from "@/server/models/setting";

export const STORE_DEFAULTS = {
  name: "Agile Sole",
  city: "Gujranwala",
  whatsapp: "923069158103",
  email: "sahilmubeen30@gmail.com",
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
  const store = await setSetting("store", { ...current.store, ...input.store });
  const analytics = await setSetting("analytics", { ...current.analytics, ...input.analytics });
  const payments = await setSetting("payments", { ...current.payments, ...input.payments });
  const couriers = await setSetting("couriers", { ...current.couriers, ...input.couriers });
  return { store, analytics, payments, couriers };
}

export async function getPublicSettings() {
  const all = await getAllSettings();
  return {
    name: all.store.name,
    logo: all.store.logo || "/favicon.png",
    whatsapp: all.store.whatsapp,
    email: all.store.email,
    ga4Id: all.analytics.ga4Id,
    metaPixelId: all.analytics.metaPixelId,
    payments: all.payments,
    couriers: all.couriers,
  };
}
