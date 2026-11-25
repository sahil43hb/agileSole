import { connectDb } from "./connect";
import { hashPassword } from "../lib/password";
import {
  AdminNotification,
  AuditLog,
  Brand,
  Cart,
  Category,
  Collection,
  Counter,
  Customer,
  Discount,
  Faq,
  Media,
  Newsletter,
  NotificationLog,
  Order,
  OtpChallenge,
  Product,
  Review,
  Role,
  Setting,
  SizeChart,
  Staff,
  Ticket,
} from "../models";
import { allPermissions, permissionsFor } from "@/shared/admin-rbac";

export const SEED_VERSION = 5;

function loc(en: string, ur: string) {
  return { en, ur };
}

export async function seedDatabase() {
  process.env.SKIP_DEV_SEED = "1";
  await connectDb();
  console.log("Connected to MongoDB");

  const email = (process.env.SEED_ADMIN_EMAIL || "agilesole@gmail.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin123";
  const staffPassword = process.env.SEED_STAFF_PASSWORD || "Staff123";

  await Promise.all([
    Staff.deleteMany({}),
    Role.deleteMany({}),
    AdminNotification.deleteMany({}),
    NotificationLog.deleteMany({}),
    OtpChallenge.deleteMany({}),
    Brand.deleteMany({}),
    Category.deleteMany({}),
    Collection.deleteMany({}),
    SizeChart.deleteMany({}),
    Product.deleteMany({}),
    Media.deleteMany({}),
    Setting.deleteMany({}),
    Customer.deleteMany({}),
    Order.deleteMany({}),
    Ticket.deleteMany({}),
    Discount.deleteMany({}),
    Review.deleteMany({}),
    Cart.deleteMany({}),
    Faq.deleteMany({}),
    AuditLog.deleteMany({}),
    Counter.deleteMany({}),
    Newsletter.deleteMany({}),
  ]);

  const ownerRole = await Role.create({
    name: "Owner",
    slug: "owner",
    description: "Full access to every admin module",
    isSystem: true,
    permissions: allPermissions(),
  });
  const catalogRole = await Role.create({
    name: "Catalog",
    slug: "catalog",
    description: "Products, stock, and taxonomy",
    permissions: permissionsFor({
      dashboard: ["view"],
      products: "all",
      inventory: "all",
      categories: "all",
      brands: "all",
      collections: "all",
      size_charts: "all",
    }),
  });
  const ordersRole = await Role.create({
    name: "Orders",
    slug: "orders",
    description: "Orders, customers, and tickets",
    permissions: permissionsFor({
      dashboard: ["view"],
      orders: "all",
      customers: ["view", "update"],
      tickets: "all",
    }),
  });

  await Staff.create({
    name: "Store Owner",
    email,
    passwordHash: await hashPassword(password),
    role: "owner",
    roleId: ownerRole._id,
    isActive: true,
  });
  await Staff.create({
    name: "Amina Catalog",
    email: "peter.m@example.com",
    passwordHash: await hashPassword(staffPassword),
    role: "catalog",
    roleId: catalogRole._id,
    isActive: true,
  });
  await Staff.create({
    name: "Rashid Orders",
    email: "xavier.y@example.org",
    passwordHash: await hashPassword(staffPassword),
    role: "orders",
    roleId: ordersRole._id,
    isActive: true,
  });

  await Brand.create({
    slug: "agile-sole",
    name: loc("Agile Sole", "ایجائیل سول"),
    description: loc(
      "House brand from Gujranwala. Athletic sneakers and family comfort — the same pairs from the Facebook shop.",
      "گوجرانوالہ کا اپنا برانڈ۔ سنیکرز اور خاندانی آرام۔",
    ),
  });

  const men = await Category.create({ slug: "men", name: loc("Men", "مردانہ"), sort: 1 });
  const women = await Category.create({ slug: "women", name: loc("Women", "زنانہ"), sort: 2 });
  const kids = await Category.create({ slug: "kids", name: loc("Kids", "بچے"), sort: 3 });
  const comfort = await Category.create({ slug: "comfort", name: loc("Comfort", "آرام"), sort: 4 });

  await Category.insertMany([
    { slug: "men-athletic", parentId: men._id, name: loc("Athletic & Running", "ایتھلیٹک"), sort: 1 },
    { slug: "men-casual", parentId: men._id, name: loc("Casual Sneakers", "کیژوئل"), sort: 2 },
    { slug: "women-sneakers", parentId: women._id, name: loc("Sneakers", "سنیکرز"), sort: 1 },
    { slug: "women-heels", parentId: women._id, name: loc("Work heels", "ہیلز"), sort: 2 },
    { slug: "kids-everyday", parentId: kids._id, name: loc("School & Everyday", "روزمرہ"), sort: 1 },
    { slug: "comfort-sandals", parentId: comfort._id, name: loc("Sandals & Slides", "سینڈل"), sort: 1 },
    { slug: "comfort-indoor", parentId: comfort._id, name: loc("House & winter", "گھر اور سردی"), sort: 2 },
  ]);

  await SizeChart.insertMany([
    {
      code: "men-eu",
      productType: "sneaker",
      title: loc("Men sneakers", "مردانہ سنیکرز"),
      rows: [
        { eu: "40", pk: "6", uk: "6", us: "7", cm: "25" },
        { eu: "41", pk: "7", uk: "7", us: "8", cm: "26" },
        { eu: "42", pk: "8", uk: "8", us: "9", cm: "26.5" },
        { eu: "43", pk: "9", uk: "9", us: "10", cm: "27.5" },
        { eu: "44", pk: "9.5", uk: "9.5", us: "10.5", cm: "28" },
        { eu: "45", pk: "10.5", uk: "10.5", us: "11.5", cm: "29" },
      ],
    },
    {
      code: "women-eu",
      productType: "sneaker",
      title: loc("Women sneakers", "زنانہ سنیکرز"),
      rows: [
        { eu: "36", pk: "3.5", uk: "3.5", us: "6", cm: "23" },
        { eu: "37", pk: "4", uk: "4", us: "6.5", cm: "23.5" },
        { eu: "38", pk: "5", uk: "5", us: "7.5", cm: "24" },
        { eu: "39", pk: "6", uk: "6", us: "8.5", cm: "25" },
        { eu: "40", pk: "6.5", uk: "6.5", us: "9", cm: "25.5" },
      ],
    },
    {
      code: "kids-eu",
      productType: "kids",
      title: loc("Kids", "بچے"),
      rows: [
        { eu: "28", pk: "10", uk: "10", us: "11", cm: "17" },
        { eu: "30", pk: "11.5", uk: "11.5", us: "12.5", cm: "18.5" },
        { eu: "32", pk: "13", uk: "13", us: "1", cm: "20" },
        { eu: "34", pk: "2", uk: "2", us: "3", cm: "21.5" },
      ],
    },
    {
      code: "sandal-eu",
      productType: "sandal",
      title: loc("Sandals", "سینڈل"),
      rows: [
        { eu: "36", pk: "3.5", uk: "3.5", us: "6", cm: "23" },
        { eu: "38", pk: "5", uk: "5", us: "7.5", cm: "24" },
        { eu: "40", pk: "6.5", uk: "6.5", us: "7", cm: "25.5" },
        { eu: "42", pk: "8", uk: "8", us: "9", cm: "26.5" },
        { eu: "44", pk: "9.5", uk: "9.5", us: "10.5", cm: "28" },
      ],
    },
  ]);

  await Collection.insertMany([
    { slug: "new-arrivals", title: loc("New Arrivals", "نیا آیا"), type: "manual", productIds: [] },
    { slug: "family-comfort", title: loc("Family Comfort", "خاندانی آرام"), type: "manual", productIds: [] },
    { slug: "bestsellers", title: loc("Best Sellers", "سب سے زیادہ بکے"), type: "manual", productIds: [] },
    { slug: "facebook-drop", title: loc("From the Facebook shop", "فیس بک شاپ سے"), type: "manual", productIds: [] },
  ]);

  await Discount.insertMany([
    { code: "WELCOME10", type: "percent", value: 10, minOrder: 2000, maxUses: 200, maxPerCustomer: 1, usedCount: 0, isActive: true },
    { code: "FREESHIP", type: "free_shipping", value: 0, minOrder: 0, maxUses: 0, maxPerCustomer: 0, usedCount: 0, isActive: true },
    { code: "FAMILY300", type: "fixed", value: 300, minOrder: 4000, maxUses: 80, maxPerCustomer: 5, usedCount: 0, isActive: true },
  ]);

  await Setting.insertMany([
    {
      key: "store",
      value: {
        name: "Agile Sole",
        city: "Gujranwala",
        country: "PK",
        currency: "PKR",
        locales: ["en", "ur"],
        whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "923069158103",
        email: "agilesole@gmail.com",
        tagline: { en: "Every Step a Perfect Beat", ur: "ہر قدم ایک مکمل تال ہے" },
        returnDays: 14,
        maxCod: 50000,
        shippingAlwaysFree: false,
        shippingFee: 250,
        shippingFreeOver: 5000,
      },
    },
    {
      key: "store.announce",
      value: {
        en: "Cash on delivery across Pakistan · Easy size exchange",
        ur: "پاکستان بھر کیش آن ڈیلیوری · آسان سائز تبدیلی · گوجرانوالہ",
      },
    },
    {
      key: "checkout",
      value: {
        guestAllowed: true,
        otpRequired: true,
        paymentMethods: [{ id: "cod", enabled: true }],
        minOrder: 0,
        maxCod: 200000,
      },
    },
    {
      key: "catalog",
      value: {
        productTypes: [
          { id: "sneaker", label: "Sneaker", labelUr: "سنیکرز", openFootwear: false },
          { id: "sandal", label: "Sandal", labelUr: "سینڈل", openFootwear: true },
          { id: "slide", label: "Slide", labelUr: "سلائیڈ", openFootwear: true },
          { id: "clog", label: "Clog", labelUr: "کلاگ", openFootwear: true },
          { id: "slipper", label: "Slipper", labelUr: "سلپر", openFootwear: true },
        ],
      },
    },
    { key: "maintenance", value: { enabled: false } },
    { key: "seed.version", value: SEED_VERSION },
  ]);

  const { seedFaqsIfEmpty } = await import("@/server/modules/cms/cms.service");
  await seedFaqsIfEmpty();

  console.log(`Seeded owner ${email} (role Owner) + catalog/orders staff`);
  console.log("Catalog structure only: no products, orders, customers, or tickets");
}
