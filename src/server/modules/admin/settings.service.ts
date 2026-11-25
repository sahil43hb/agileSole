import { connectDb } from "@/server/db/connect";
import { getSetting, setSetting } from "@/server/models/setting";
import { SHIPPING_DEFAULT } from "@/content/geo-pk";
import { PRODUCT_TYPE_DEFAULTS, normalizeProductTypes, type ProductTypeSetting } from "@/shared/product-types";

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
  shippingAlwaysFree: false,
  shippingFee: SHIPPING_DEFAULT.fee,
  shippingFreeOver: SHIPPING_DEFAULT.freeOver,
};

export type StoreSettings = typeof STORE_DEFAULTS;

export type ShippingMeta = {
  id: string;
  name: string;
  fee: number;
  eta: string;
  freeOver: number;
};

function money(value: unknown, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.round(n);
}

export function shippingFromStore(store: Partial<StoreSettings> = {}) {
  const alwaysFree = Boolean(store.shippingAlwaysFree);
  const fee = money(store.shippingFee, STORE_DEFAULTS.shippingFee);
  const freeOver = money(store.shippingFreeOver, STORE_DEFAULTS.shippingFreeOver);
  return {
    alwaysFree,
    fee,
    freeOver,
    meta: {
      id: SHIPPING_DEFAULT.id,
      name: alwaysFree || fee === 0 ? "Free shipping" : SHIPPING_DEFAULT.name,
      fee: alwaysFree ? 0 : fee,
      eta: SHIPPING_DEFAULT.eta,
      freeOver: alwaysFree ? 0 : freeOver,
    } satisfies ShippingMeta,
  };
}

export function shippingFeeForSubtotal(subtotal: number, store: Partial<StoreSettings> = {}) {
  if (subtotal <= 0) return 0;
  const cfg = shippingFromStore(store);
  if (cfg.alwaysFree || cfg.fee === 0) return 0;
  if (cfg.freeOver > 0 && subtotal >= cfg.freeOver) return 0;
  return cfg.fee;
}

export async function getShippingMeta() {
  const { store } = await getAllSettings();
  return shippingFromStore(store).meta;
}

export async function quoteShipping(subtotal: number) {
  const { store } = await getAllSettings();
  return shippingFeeForSubtotal(subtotal, store);
}

export function shippingPolicyCopy(locale: string, store: Partial<StoreSettings> = {}) {
  const cfg = shippingFromStore(store);
  if (cfg.alwaysFree || cfg.fee === 0) {
    return locale === "ur" ? "ڈیلیوری ہر آرڈر پر مفت ہے۔" : "Delivery is free on every order.";
  }
  if (cfg.freeOver > 0) {
    return locale === "ur"
      ? `معیاری کیش آن ڈیلیوری شپنگ ${cfg.fee} روپے، ${cfg.freeOver} سے اوپر مفت۔`
      : `Standard cash-on-delivery shipping is Rs ${cfg.fee}, and free over Rs ${cfg.freeOver.toLocaleString("en-PK")}.`;
  }
  return locale === "ur"
    ? `معیاری کیش آن ڈیلیوری شپنگ ${cfg.fee} روپے ہے۔`
    : `Standard cash-on-delivery shipping is Rs ${cfg.fee}.`;
}

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

export const CATALOG_DEFAULTS = {
  productTypes: PRODUCT_TYPE_DEFAULTS,
};

export type CatalogSettings = {
  productTypes: ProductTypeSetting[];
};

export async function getAllSettings() {
  await connectDb();
  const [store, analytics, payments, couriers, catalogRaw] = await Promise.all([
    getSetting("store", STORE_DEFAULTS),
    getSetting("analytics", ANALYTICS_DEFAULTS),
    getSetting("payments", PAYMENTS_DEFAULTS),
    getSetting("couriers", COURIERS_DEFAULTS),
    getSetting("catalog", CATALOG_DEFAULTS),
  ]);
  return {
    store: { ...STORE_DEFAULTS, ...store },
    analytics: { ...ANALYTICS_DEFAULTS, ...analytics },
    payments: { ...PAYMENTS_DEFAULTS, ...payments },
    couriers: { ...COURIERS_DEFAULTS, ...couriers },
    catalog: {
      productTypes: normalizeProductTypes(
        (catalogRaw as { productTypes?: unknown } | null)?.productTypes ?? CATALOG_DEFAULTS.productTypes,
      ),
    },
  };
}

export async function saveAllSettings(input: {
  store?: Partial<typeof STORE_DEFAULTS>;
  analytics?: Partial<typeof ANALYTICS_DEFAULTS>;
  payments?: Partial<typeof PAYMENTS_DEFAULTS>;
  couriers?: Partial<typeof COURIERS_DEFAULTS>;
  catalog?: Partial<CatalogSettings>;
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
  nextStore.shippingAlwaysFree = Boolean(nextStore.shippingAlwaysFree);
  nextStore.shippingFee = money(nextStore.shippingFee, STORE_DEFAULTS.shippingFee);
  nextStore.shippingFreeOver = money(nextStore.shippingFreeOver, STORE_DEFAULTS.shippingFreeOver);
  const store = await setSetting("store", nextStore);
  const analytics = await setSetting("analytics", { ...current.analytics, ...input.analytics });
  const payments = await setSetting("payments", { ...current.payments, ...input.payments });
  const couriers = await setSetting("couriers", { ...current.couriers, ...input.couriers });
  const catalog = await setSetting("catalog", {
    productTypes: normalizeProductTypes(input.catalog?.productTypes ?? current.catalog.productTypes),
  });
  return { store, analytics, payments, couriers, catalog };
}

export async function getProductTypes() {
  const { catalog } = await getAllSettings();
  return catalog.productTypes;
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
      productTypes: all.catalog.productTypes,
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
      productTypes: PRODUCT_TYPE_DEFAULTS,
    };
  }
}
