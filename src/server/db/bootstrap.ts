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

export const SEED_VERSION = 4;

function loc(en: string, ur: string) {
  return { en, ur };
}

function img(file: string) {
  return `/catalog/${file}`;
}

function sizes(
  eu: string[],
  price: number,
  color: string,
  hex: string,
  skuBase: string,
  extra?: { image?: string },
) {
  return eu.map((sizeEu, i) => ({
    sku: `${skuBase}-${sizeEu}`,
    color,
    colorHex: hex,
    sizeEu,
    sizeUk: String(Number(sizeEu) - 33),
    sizePk: String(Number(sizeEu) - 33),
    sizeUs: String(Number(sizeEu) - 32.5),
    sizeCm: String((Number(sizeEu) * 0.666).toFixed(1)),
    price,
    compareAt: Math.round(price * 1.15),
    cost: Math.round(price * 0.62),
    onHand: 8 - (i % 4),
    reserved: 0,
    isActive: true,
    weightGrams: 280,
    image: extra?.image,
  }));
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(11, 20, 0, 0);
  return d;
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

  const brand = await Brand.create({
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

  const catalog = [
    {
      slug: "pulse-runner-mint",
      gender: "men",
      type: "sneaker",
      cats: [men._id],
      sizeChartCode: "men-eu",
      material: "Mesh / EVA",
      title: loc("Pulse Runner Mint", "پلس رنر منٹ"),
      description: loc(
        "Lightweight mint runner from the Facebook drop. City miles, true colour as photographed in the studio.",
        "ہلکا منٹ رنر۔ فیس بک ڈراپ والی جوڑی۔",
      ),
      fitNote: loc("True to size", "سائز درست ہے"),
      featured: true,
      images: [img("pulse-mint-display.jpg"), img("campaign-green-1.jpg")],
      variants: sizes(["40", "41", "42", "43", "44", "45"], 4990, "Mint", "#9FD9BF", "AS-PULSE-MINT", {
        image: img("pulse-mint-display.jpg"),
      }),
    },
    {
      slug: "beat-green-runner",
      gender: "men",
      type: "sneaker",
      cats: [men._id],
      sizeChartCode: "men-eu",
      material: "Knit mesh",
      title: loc("Beat Green Runner", "بیٹ گرین رنر"),
      description: loc(
        "The green knit from the Gujranwala campaign. Every Step a Perfect Beat.",
        "گرین نٹ رنر۔ ہر قدم ایک مکمل تال ہے۔",
      ),
      fitNote: loc("True to size", "سائز درست ہے"),
      featured: true,
      images: [img("campaign-green-1.jpg"), img("campaign-green-2.jpg")],
      variants: sizes(["40", "41", "42", "43", "44", "45"], 5290, "Forest", "#3D6B4F", "AS-BEAT-GRN", {
        image: img("campaign-green-1.jpg"),
      }),
    },
    {
      slug: "motion-comfort-grey",
      gender: "men",
      type: "sneaker",
      cats: [men._id],
      sizeChartCode: "men-eu",
      material: "Mesh / foam",
      title: loc("Motion Comfort Grey", "موشن کمفرٹ گرے"),
      description: loc("Grey-blue trainer photographed on the stone plinth. Soft ride for all-day wear.", "گرے بلیو ٹرینر۔ دن بھر نرم۔"),
      fitNote: loc("True to size", "سائز درست ہے"),
      featured: true,
      images: [img("grey-pair.jpg"), img("grey-pedestal.jpg")],
      variants: sizes(["40", "41", "42", "43", "44"], 4890, "Grey blue", "#6B7C8A", "AS-MOTION-GRY", {
        image: img("grey-pair.jpg"),
      }),
    },
    {
      slug: "aero-flash-orange",
      gender: "men",
      type: "sneaker",
      cats: [men._id],
      sizeChartCode: "men-eu",
      material: "Mesh",
      title: loc("Aero Flash Orange", "ایرو فلیش اورنج"),
      description: loc("Orange-flash runner from the park set. Lightweight mesh, responsive cushioning.", "پارک سیٹ کا اورنج رنر۔"),
      fitNote: loc("Runs slightly large", "ذرا بڑا چلتا ہے"),
      featured: true,
      images: [img("orange-park.jpg"), img("orange-black.jpg")],
      variants: [
        ...sizes(["40", "41", "42", "43", "44", "45"], 5490, "Orange flash", "#F15A24", "AS-AERO-ORG", {
          image: img("orange-park.jpg"),
        }),
        ...sizes(["40", "41", "42", "43", "44", "45"], 5490, "Black", "#111111", "AS-AERO-BLK", {
          image: img("orange-black.jpg"),
        }),
      ],
    },
    {
      slug: "track-navy-runner",
      gender: "men",
      type: "sneaker",
      cats: [men._id],
      sizeChartCode: "men-eu",
      material: "Mesh",
      title: loc("Track Navy Runner", "ٹریک نیوی رنر"),
      description: loc("Navy and lime track pair. Photographed on the oval — weekend speed.", "نیوی اور لائم ٹریک جوڑی۔"),
      fitNote: loc("True to size", "سائز درست ہے"),
      featured: true,
      images: [img("track-navy.jpg"), img("campaign-grid.jpg")],
      variants: sizes(["40", "41", "42", "43", "44", "45"], 5190, "Navy lime", "#1E3A5F", "AS-TRACK-NVY", {
        image: img("track-navy.jpg"),
      }),
    },
    {
      slug: "city-soft-pink",
      gender: "women",
      type: "sneaker",
      cats: [women._id],
      sizeChartCode: "women-eu",
      material: "Mesh",
      title: loc("City Soft Pink", "سٹی سافٹ پنک"),
      description: loc("Women’s everyday trainer. The pink outsole from the product close-up.", "زنانہ روزمرہ ٹرینر۔ گلابی تلا۔"),
      fitNote: loc("True to size", "سائز درست ہے"),
      featured: true,
      images: [img("pink-sole.jpg"), img("campaign-family.jpg")],
      variants: sizes(["36", "37", "38", "39", "40"], 4290, "Blush", "#E8A0A0", "AS-CITY-PNK", {
        image: img("pink-sole.jpg"),
      }),
    },
    {
      slug: "city-pump-black",
      gender: "women",
      type: "heel",
      cats: [women._id],
      sizeChartCode: "women-eu",
      material: "Leather-look / rubber",
      title: loc("City Pump Black", "سٹی پمپ بلیک"),
      description: loc("Work pump with the Agile Sole stamp on the outsole. Same pair as the Facebook stills.", "کام کی پمپ۔ تلے پر ایجائیل سول۔"),
      fitNote: loc("Runs slightly small — size up if between", "ذرا چھوٹی۔ درمیان میں ہوں تو بڑا لیں"),
      featured: false,
      images: [img("pump-sole-1.jpg"), img("pump-sole-2.jpg")],
      variants: sizes(["36", "37", "38", "39", "40"], 3890, "Black", "#1A1A1A", "AS-PUMP-BLK", {
        image: img("pump-sole-1.jpg"),
      }),
    },
    {
      slug: "dual-strap-comfort",
      gender: "unisex",
      type: "sandal",
      cats: [comfort._id],
      sizeChartCode: "sandal-eu",
      material: "Leather-look / cork footbed",
      title: loc("Dual Strap Comfort", "ڈوئل سٹریپ کمفرٹ"),
      description: loc("Tan and ocean dual-strap sandals from the wooden-table photos. Cushioned footbed.", "ٹین اور نیلی پٹی والا سینڈل۔"),
      fitNote: loc("True to size", "سائز درست ہے"),
      featured: true,
      images: [img("dual-strap-sandals.jpg"), img("dual-strap-close.jpg")],
      variants: [
        ...sizes(["38", "39", "40", "41", "42", "43", "44"], 3490, "Tan", "#C4A574", "AS-DUAL-TAN", {
          image: img("dual-strap-sandals.jpg"),
        }),
        ...sizes(["38", "39", "40", "41", "42", "43", "44"], 3490, "Ocean", "#3B6FA0", "AS-DUAL-BLU", {
          image: img("dual-strap-close.jpg"),
        }),
      ],
    },
    {
      slug: "family-cloud-sandal",
      gender: "unisex",
      type: "sandal",
      cats: [comfort._id],
      sizeChartCode: "sandal-eu",
      material: "Suede-look",
      title: loc("Family Cloud Sandal", "فیملی کلاؤڈ سینڈل"),
      description: loc("The courtyard pair — mum and kids, same Facebook afternoon. Easy strap, all-day sole.", "آنگن والی جوڑی۔ خاندان کے ساتھ۔"),
      fitNote: loc("True to size", "سائز درست ہے"),
      featured: true,
      images: [img("family-courtyard.jpg"), img("dual-strap-sandals.jpg")],
      variants: sizes(["38", "39", "40", "41", "42", "43", "44"], 3290, "Sand", "#D2B48C", "AS-CLOUD-SND", {
        image: img("family-courtyard.jpg"),
      }),
    },
    {
      slug: "shearling-house-clog",
      gender: "unisex",
      type: "clog",
      cats: [comfort._id],
      sizeChartCode: "sandal-eu",
      material: "Shearling / EVA",
      title: loc("Shearling House Clog", "شیرلنگ ہاؤس کلاگ"),
      description: loc("Coral shearling clog from the winter still. Indoor-outdoor sole stamped Agile Sole.", "مرجانی شیرلنگ کلاگ۔"),
      fitNote: loc("Roomy — stay true if you like socks", "کشادہ۔ موزوں کے ساتھ ٹھیک"),
      featured: true,
      images: [img("boot-clog.jpg"), img("slipper-sole.jpg")],
      variants: sizes(["38", "40", "42", "44"], 2990, "Coral", "#C46A5A", "AS-CLOG-CRL", {
        image: img("boot-clog.jpg"),
      }),
    },
    {
      slug: "winter-lace-boot",
      gender: "unisex",
      type: "boot",
      cats: [comfort._id],
      sizeChartCode: "men-eu",
      material: "Suede-look / shearling lining",
      title: loc("Winter Lace Boot", "ونٹر لیس بوٹ"),
      description: loc("Tan lace boot with shearling collar, shot next to the clog. Facebook winter drop.", "ٹین لیس بوٹ، شیرلنگ کالر۔"),
      fitNote: loc("True to size with a mid sock", "درمیانی موزے کے ساتھ درست"),
      featured: false,
      images: [img("boot-clog.jpg"), img("slipper-sole.jpg")],
      variants: sizes(["40", "41", "42", "43", "44"], 6490, "Tan", "#A67C52", "AS-BOOT-TAN", {
        image: img("boot-clog.jpg"),
      }),
    },
    {
      slug: "soft-walk-slipper",
      gender: "unisex",
      type: "slipper",
      cats: [comfort._id],
      sizeChartCode: "sandal-eu",
      material: "Shearling / rubber",
      title: loc("Soft Walk Slipper", "سافٹ واک سلپر"),
      description: loc("Chestnut slipper. Outsole close-up shows the Agile Sole mark from the Facebook reel still.", "شاہ بلوط سلپر۔ تلے پر ایجائیل سول۔"),
      fitNote: loc("True to size", "سائز درست ہے"),
      featured: false,
      images: [img("slipper-sole.jpg"), img("boot-clog.jpg")],
      variants: sizes(["40", "41", "42", "43", "44"], 2190, "Chestnut", "#8B5A2B", "AS-SOFT-CHN", {
        image: img("slipper-sole.jpg"),
      }),
    },
    {
      slug: "little-beat-sneaker",
      gender: "kids",
      type: "sneaker",
      cats: [kids._id],
      sizeChartCode: "kids-eu",
      material: "Mesh / rubber",
      title: loc("Little Beat Sneaker", "لٹل بیٹ سنیکر"),
      description: loc("Kids trainers from the Family Comfort poster. Flexible sole, easy on.", "خاندانی پوسٹر کے بچوں کے سنیکرز۔"),
      fitNote: loc("True to size", "سائز درست ہے"),
      featured: true,
      images: [img("family-comfort-collage.jpg"), img("campaign-family.jpg")],
      variants: sizes(["28", "30", "32", "34"], 2890, "Multi", "#4A7C59", "AS-LITTLE-MLT", {
        image: img("family-comfort-collage.jpg"),
      }),
    },
    {
      slug: "junior-play-sandal",
      gender: "kids",
      type: "sandal",
      cats: [kids._id, comfort._id],
      sizeChartCode: "kids-eu",
      material: "Synthetic",
      title: loc("Junior Play Sandal", "جونیئر پلے سینڈل"),
      description: loc("Open sandal for warm days — the kids running in the courtyard photo.", "گرمیوں کا بچوں کا سینڈل۔ آنگن والی تصویر۔"),
      fitNote: loc("True to size", "سائز درست ہے"),
      featured: false,
      images: [img("family-courtyard.jpg"), img("campaign-grid.jpg")],
      variants: sizes(["28", "30", "32"], 2190, "Sand", "#C4A574", "AS-JUNIOR-SND", {
        image: img("family-courtyard.jpg"),
      }),
    },
  ];

  const created = [];
  const bySlug: Record<string, { id: string; slug: string; title: string; sku: string; price: number; image: string; sizeEu: string; color: string }> = {};
  for (const item of catalog) {
    const product = await Product.create({
      slug: item.slug,
      brandId: brand._id,
      categoryIds: item.cats,
      gender: item.gender,
      type: item.type,
      title: item.title,
      description: item.description,
      fitNote: item.fitNote,
      featured: item.featured,
      status: "active",
      tags: ["facebook", item.type],
      images: item.images,
      sizeChartCode: item.sizeChartCode,
      material: item.material,
      variants: item.variants,
    });
    created.push(product._id);
    const v = item.variants[Math.min(2, item.variants.length - 1)];
    bySlug[item.slug] = {
      id: String(product._id),
      slug: item.slug,
      title: item.title.en,
      sku: v.sku,
      price: v.price,
      image: item.images[0],
      sizeEu: v.sizeEu,
      color: v.color,
    };
  }

  await Collection.insertMany([
    {
      slug: "new-arrivals",
      title: loc("New Arrivals", "نیا آیا"),
      type: "manual",
      productIds: created.slice(0, 6),
    },
    {
      slug: "family-comfort",
      title: loc("Family Comfort", "خاندانی آرام"),
      type: "manual",
      productIds: created.slice(7, 14),
    },
    {
      slug: "bestsellers",
      title: loc("Best Sellers", "سب سے زیادہ بکے"),
      type: "manual",
      productIds: created.filter((_, i) => [0, 1, 3, 7, 8, 12].includes(i)),
    },
    {
      slug: "facebook-drop",
      title: loc("From the Facebook shop", "فیس بک شاپ سے"),
      type: "manual",
      productIds: created,
    },
  ]);

  await Discount.insertMany([
    { code: "WELCOME10", type: "percent", value: 10, minOrder: 2000, maxUses: 200, usedCount: 12, isActive: true },
    { code: "FREESHIP", type: "free_shipping", value: 0, minOrder: 0, maxUses: 0, usedCount: 4, isActive: true },
    { code: "FAMILY300", type: "fixed", value: 300, minOrder: 4000, maxUses: 80, usedCount: 6, isActive: true },
  ]);

  const customers = await Customer.insertMany([
    {
      name: "Hassan Malik",
      phone: "+923001234567",
      phoneVerifiedAt: daysAgo(20),
      email: "hassan.malik@example.com",
      locale: "en",
      whatsappOptIn: true,
      marketingOptIn: true,
      preferredGender: "men",
      addresses: [
        {
          label: "Home",
          fullName: "Hassan Malik",
          phone: "+923001234567",
          province: "Punjab",
          city: "Gujranwala",
          area: "Satellite Town",
          street: "House 12, Block B",
          isDefault: true,
        },
      ],
    },
    {
      name: "Ayesha Khan",
      phone: "+923215551234",
      phoneVerifiedAt: daysAgo(12),
      locale: "ur",
      whatsappOptIn: true,
      preferredGender: "women",
      addresses: [
        {
          label: "Home",
          fullName: "Ayesha Khan",
          phone: "+923215551234",
          province: "Punjab",
          city: "Lahore",
          area: "Johar Town",
          street: "44-C",
          isDefault: true,
        },
      ],
    },
    {
      name: "Usman Raza",
      phone: "+923331237890",
      phoneVerifiedAt: daysAgo(8),
      locale: "en",
      whatsappOptIn: true,
      preferredGender: "men",
      addresses: [
        {
          label: "Home",
          fullName: "Usman Raza",
          phone: "+923331237890",
          province: "Punjab",
          city: "Gujranwala",
          area: "Model Town",
          street: "Street 9",
          isDefault: true,
        },
      ],
    },
    {
      name: "Sana Farooq",
      phone: "+923451112233",
      phoneVerifiedAt: daysAgo(5),
      locale: "ur",
      whatsappOptIn: true,
      preferredGender: "kids",
      addresses: [
        {
          label: "Home",
          fullName: "Sana Farooq",
          phone: "+923451112233",
          province: "Punjab",
          city: "Faisalabad",
          area: "Madina Town",
          street: "House 8",
          isDefault: true,
        },
      ],
    },
    {
      name: "Bilal Tariq",
      phone: "+923128889900",
      phoneVerifiedAt: daysAgo(3),
      locale: "en",
      rtoCount: 1,
      addresses: [
        {
          label: "Shop",
          fullName: "Bilal Tariq",
          phone: "+923128889900",
          province: "Punjab",
          city: "Sialkot",
          street: "Kashmir Road",
          isDefault: true,
        },
      ],
    },
    {
      name: "Blocked COD",
      phone: "+923000001111",
      blockedAt: daysAgo(2),
      rtoCount: 3,
      locale: "en",
    },
  ]);

  const pulse = bySlug["pulse-runner-mint"];
  const dual = bySlug["dual-strap-comfort"];
  const little = bySlug["little-beat-sneaker"];
  const grey = bySlug["motion-comfort-grey"];
  const clog = bySlug["shearling-house-clog"];
  const orange = bySlug["aero-flash-orange"];

  function line(p: typeof pulse, qty = 1) {
    return {
      sku: p.sku,
      productId: p.id,
      slug: p.slug,
      title: p.title,
      color: p.color,
      sizeEu: p.sizeEu,
      qty,
      price: p.price,
      image: p.image,
    };
  }

  function ship(fee: number) {
    return { id: "standard-cod", name: "Standard COD", fee, eta: "2–5 working days" };
  }

  const hassan = customers[0];
  const ayesha = customers[1];
  const usman = customers[2];
  const sana = customers[3];
  const bilal = customers[4];

  const demoOrders = [
    {
      number: "AS-100001",
      status: "delivered",
      channel: "web",
      customer: hassan,
      items: [line(pulse)],
      discount: 0,
      shipping: 250,
      paid: true,
      stockCommitted: true,
      createdAt: daysAgo(18),
      events: [
        { from: "pending_confirmation", to: "confirmed", at: daysAgo(17) },
        { from: "confirmed", to: "packed", at: daysAgo(16) },
        { from: "packed", to: "shipped", at: daysAgo(16) },
        { from: "shipped", to: "delivered", at: daysAgo(14) },
      ],
      shipment: { courierName: "TCS", trackingNumber: "TCS-DEMO-001" },
    },
    {
      number: "AS-100002",
      status: "shipped",
      channel: "facebook",
      customer: ayesha,
      items: [line(dual), line(little)],
      discount: 300,
      shipping: 0,
      paid: false,
      stockCommitted: true,
      createdAt: daysAgo(4),
      events: [
        { from: "pending_confirmation", to: "confirmed", at: daysAgo(4) },
        { from: "confirmed", to: "packed", at: daysAgo(3) },
        { from: "packed", to: "shipped", at: daysAgo(2) },
      ],
      shipment: { courierName: "Leopard", trackingNumber: "LCS-88211" },
      discountCode: "FAMILY300",
    },
    {
      number: "AS-100003",
      status: "pending_confirmation",
      channel: "web",
      customer: usman,
      items: [line(grey)],
      discount: 0,
      shipping: 250,
      paid: false,
      stockCommitted: false,
      createdAt: daysAgo(0),
      events: [],
    },
    {
      number: "AS-100004",
      status: "confirmed",
      channel: "web",
      customer: sana,
      items: [line(little, 2)],
      discount: 0,
      shipping: 250,
      paid: false,
      stockCommitted: false,
      createdAt: daysAgo(1),
      events: [{ from: "pending_confirmation", to: "confirmed", at: daysAgo(1) }],
    },
    {
      number: "AS-100005",
      status: "packed",
      channel: "web",
      customer: hassan,
      items: [line(clog)],
      discount: 0,
      shipping: 250,
      paid: false,
      stockCommitted: true,
      createdAt: daysAgo(2),
      events: [
        { from: "pending_confirmation", to: "confirmed", at: daysAgo(2) },
        { from: "confirmed", to: "packed", at: daysAgo(1) },
      ],
    },
    {
      number: "AS-100006",
      status: "delivery_failed",
      channel: "web",
      customer: bilal,
      items: [line(orange)],
      discount: 0,
      shipping: 250,
      paid: false,
      stockCommitted: true,
      deliveryAttempts: 1,
      createdAt: daysAgo(7),
      events: [
        { from: "pending_confirmation", to: "confirmed", at: daysAgo(7) },
        { from: "confirmed", to: "packed", at: daysAgo(6) },
        { from: "packed", to: "shipped", at: daysAgo(6) },
        { from: "shipped", to: "delivery_failed", at: daysAgo(5) },
      ],
      shipment: { courierName: "TCS", trackingNumber: "TCS-RTO-019" },
    },
    {
      number: "AS-100007",
      status: "cancelled",
      channel: "web",
      customer: usman,
      items: [line(pulse)],
      discount: 0,
      shipping: 250,
      paid: false,
      stockCommitted: false,
      createdAt: daysAgo(9),
      events: [{ from: "pending_confirmation", to: "cancelled", at: daysAgo(9), note: "Customer cancelled before pack" }],
    },
  ];

  for (const row of demoOrders) {
    const addr = (row.customer.addresses?.[0] || {}) as {
      fullName?: string;
      phone?: string;
      province?: string;
      city?: string;
      area?: string;
      street?: string;
    };
    const subtotal = row.items.reduce((s, i) => s + i.price * i.qty, 0);
    const total = Math.max(0, subtotal - row.discount) + row.shipping;
    const createdAt = row.createdAt;
    await Order.create({
      number: row.number,
      customerId: String(row.customer._id),
      status: row.status,
      channel: row.channel,
      locale: row.customer.locale || "en",
      items: row.items,
      amounts: { subtotal, shipping: row.shipping, discount: row.discount, tax: 0, total, currency: "PKR" },
      shippingAddress: {
        fullName: addr.fullName,
        phone: addr.phone || row.customer.phone,
        country: "PK",
        province: addr.province || "Punjab",
        city: addr.city || "Gujranwala",
        area: addr.area,
        street: addr.street || "—",
      },
      shippingMethod: ship(row.shipping),
      payment: {
        method: "cod",
        status: row.paid ? "paid" : "unpaid",
        collectAmount: total,
        collectedAt: row.paid ? daysAgo(14) : undefined,
      },
      stockCommitted: row.stockCommitted,
      deliveryAttempts: row.deliveryAttempts || 0,
      discountCode: row.discountCode || "",
      callBeforeDelivery: true,
      whatsappOptIn: true,
      shipment: row.shipment,
      events: [
        {
          from: "draft",
          to: "pending_confirmation",
          actorType: "customer",
          note: "Order placed",
          customerVisible: true,
          at: createdAt,
        },
        ...row.events.map((e) => ({
          from: e.from,
          to: e.to,
          actorType: "staff",
          note: "note" in e ? e.note || e.to : e.to,
          customerVisible: true,
          at: e.at,
        })),
      ],
      createdAt,
      updatedAt: createdAt,
    });
  }

  await Counter.create({ key: "order", seq: 7 });

  await Ticket.insertMany([
    {
      customerId: String(sana._id),
      orderNumber: "AS-100004",
      type: "exchange",
      reason: "Kids pair EU 30 instead of 32",
      status: "open",
      locale: "ur",
    },
    {
      customerId: String(bilal._id),
      orderNumber: "AS-100006",
      type: "return",
      reason: "Delivery failed — please retry OFD",
      status: "open",
      locale: "en",
    },
    {
      type: "support",
      reason: "Fatima · 03019876543\nSize question on Dual Strap Comfort EU 40 vs 41.",
      status: "open",
      locale: "en",
    },
  ]);

  const reviewCopy = [
    {
      slug: "pulse-runner-mint",
      authorName: "Hassan M.",
      rating: 5,
      title: "True beat",
      body: "Light on the foot and the mint colour is exactly as shown. COD was smooth.",
      fit: "true",
    },
    {
      slug: "dual-strap-comfort",
      authorName: "Ayesha K.",
      rating: 5,
      title: "Comfort for the house",
      body: "Wore the tan strap all day in Gujranwala heat. Size is honest.",
      fit: "true",
    },
    {
      slug: "family-cloud-sandal",
      authorName: "Usman R.",
      rating: 5,
      title: "Family pair",
      body: "Same sandals as the courtyard photo. Kids pair next.",
      fit: "true",
    },
    {
      slug: "little-beat-sneaker",
      authorName: "Sana F.",
      rating: 4,
      title: "School days",
      body: "Flexible sole. Ordered a second size after the first week.",
      fit: "small",
    },
    {
      slug: "motion-comfort-grey",
      authorName: "Bilal T.",
      rating: 5,
      title: "Looks current",
      body: "Grey-blue is quieter than the campaign photos. WhatsApp team confirmed EU 42.",
      fit: "true",
    },
    {
      slug: "beat-green-runner",
      authorName: "Omar S.",
      rating: 4,
      title: "Campaign pair",
      body: "The green knit from the Shop Now post. Slightly roomy in 43.",
      fit: "large",
      status: "pending",
    },
  ];

  await Review.insertMany(
    reviewCopy.map((r) => ({
      productId: bySlug[r.slug].id,
      productSlug: r.slug,
      authorName: r.authorName,
      rating: r.rating,
      title: r.title,
      body: r.body,
      fit: r.fit,
      status: r.status || "published",
    })),
  );

  await Newsletter.insertMany([
    { email: "hassan.malik@example.com", locale: "en" },
    { email: "drops@example.com", locale: "ur" },
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
    { key: "maintenance", value: { enabled: false } },
    { key: "seed.version", value: SEED_VERSION },
  ]);

  console.log(`Seeded owner ${email} (role Owner) + catalog/orders staff`);
  console.log(`Products: ${created.length} with Facebook photos`);
  console.log(`Customers: ${customers.length} · Orders: ${demoOrders.length}`);
}
