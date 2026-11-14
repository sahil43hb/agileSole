export type Localized = { en: string; ur: string };

export function pickLocale(value: Localized | undefined, locale: string) {
  if (!value) return "";
  if (locale === "ur" && value.ur) return value.ur;
  return value.en;
}
