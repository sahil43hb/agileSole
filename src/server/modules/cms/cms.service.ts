import { connectDb } from "@/server/db/connect";
import { Faq } from "@/server/models";
import { getSetting, setSetting } from "@/server/models/setting";
import { FAQS } from "@/content/faqs";
import { pickLocale } from "@/server/lib/localized";
import { z } from "zod";

export const DEFAULT_HOME_SECTIONS = [
  { type: "hero", enabled: true },
  { type: "trust", enabled: true },
  { type: "categoryGrid", enabled: true },
  { type: "styleGrid", enabled: true },
  { type: "productCarousel", enabled: true },
  { type: "family", enabled: true },
  { type: "bestsellers", enabled: true },
  { type: "splitStory", enabled: true },
  { type: "lookbook", enabled: true },
  { type: "reviews", enabled: true },
  { type: "social", enabled: true },
  { type: "faq", enabled: true },
  { type: "newsletter", enabled: true },
];

export async function getHomeSections() {
  await connectDb();
  return getSetting<{ type: string; enabled: boolean }[]>("home.sections", DEFAULT_HOME_SECTIONS);
}

export async function saveHomeSections(sections: { type: string; enabled: boolean }[]) {
  await connectDb();
  return setSetting("home.sections", sections);
}

export async function sectionEnabled(type: string) {
  const sections = await getHomeSections();
  const row = sections.find((s) => s.type === type);
  return row ? row.enabled !== false : true;
}

function stripFacebookShopBanner(text: string) {
  return text
    .replace(/\s*[·•|]\s*Gujranwala Facebook shop/gi, "")
    .replace(/Gujranwala Facebook shop/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[·•]\s*$/g, "")
    .trim();
}

export async function getAnnouncement() {
  await connectDb();
  const fallback = {
    en: "Cash on delivery across Pakistan · Easy size exchange",
    ur: "پاکستان بھر کیش آن ڈیلیوری · آسان سائز تبدیلی",
  };
  const raw = await getSetting("store.announce", fallback);
  const cleaned = {
    en: stripFacebookShopBanner(raw.en || fallback.en),
    ur: stripFacebookShopBanner(raw.ur || fallback.ur),
  };
  if (cleaned.en !== raw.en || cleaned.ur !== raw.ur) {
    void setSetting("store.announce", cleaned).catch(() => {});
  }
  return cleaned;
}

export async function saveAnnouncement(value: { en: string; ur: string }) {
  await connectDb();
  return setSetting("store.announce", value);
}

const faqInput = z.object({
  question: z.object({ en: z.string().min(2), ur: z.string().optional() }),
  answer: z.object({ en: z.string().min(2), ur: z.string().optional() }),
  sort: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function seedFaqsIfEmpty() {
  if ((await Faq.countDocuments()) > 0) return;
  await Faq.insertMany(
    FAQS.map((item, i) => ({
      sort: i,
      question: item.q,
      answer: item.a,
      isActive: true,
    })),
  );
}

export async function listFaqs(locale = "en") {
  await connectDb();
  await seedFaqsIfEmpty();
  const rows = await Faq.find({ isActive: true }).sort({ sort: 1 }).lean();
  return rows.map((r) => ({
    id: String(r._id),
    q: pickLocale(r.question as { en: string; ur: string }, locale),
    a: pickLocale(r.answer as { en: string; ur: string }, locale),
    question: r.question,
    answer: r.answer,
    sort: r.sort,
    isActive: r.isActive,
  }));
}

export async function listAdminFaqs() {
  await connectDb();
  await seedFaqsIfEmpty();
  const rows = await Faq.find().sort({ sort: 1 }).lean();
  return rows.map((r) => JSON.parse(JSON.stringify(r)));
}

export async function upsertFaq(raw: unknown, id?: string) {
  await connectDb();
  const input = faqInput.parse(raw);
  if (id) {
    const row = await Faq.findByIdAndUpdate(id, input, { new: true });
    if (!row) throw new Error("FAQ not found");
    return JSON.parse(JSON.stringify(row));
  }
  return JSON.parse(JSON.stringify(await Faq.create(input)));
}

export async function deleteFaq(id: string) {
  await connectDb();
  await Faq.findByIdAndDelete(id);
}
