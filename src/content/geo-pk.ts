export const GEO_PK = [
  {
    province: "Punjab",
    cities: ["Gujranwala", "Lahore", "Faisalabad", "Rawalpindi", "Multan", "Sialkot", "Gujrat", "Sargodha"],
  },
  {
    province: "Sindh",
    cities: ["Karachi", "Hyderabad", "Sukkur"],
  },
  {
    province: "Khyber Pakhtunkhwa",
    cities: ["Peshawar", "Abbottabad", "Mardan"],
  },
  {
    province: "Balochistan",
    cities: ["Quetta"],
  },
  {
    province: "Islamabad Capital Territory",
    cities: ["Islamabad"],
  },
] as const;

const GEO_UR: Record<string, string> = {
  Gujranwala: "گوجرانوالہ",
  Lahore: "لاہور",
  Faisalabad: "فیصل آباد",
  Rawalpindi: "راولپنڈی",
  Multan: "ملتان",
  Sialkot: "سیالکوٹ",
  Gujrat: "گجرات",
  Sargodha: "سرگودھا",
  Karachi: "کراچی",
  Hyderabad: "حیدرآباد",
  Sukkur: "سکھر",
  Peshawar: "پشاور",
  Abbottabad: "ایبٹ آباد",
  Mardan: "مردان",
  Quetta: "کوئٹہ",
  Islamabad: "اسلام آباد",
  Punjab: "پنجاب",
  Sindh: "سندھ",
  "Khyber Pakhtunkhwa": "خیبر پختونخوا",
  Balochistan: "بلوچستان",
  "Islamabad Capital Territory": "وفاقی دارالحکومت اسلام آباد",
  Pakistan: "پاکستان",
};

/** Display label for a stored English city/province. Values stay English for shipping. */
export function geoLabel(name: string | undefined | null, locale?: string) {
  if (!name) return "";
  if (locale !== "ur") return name;
  return GEO_UR[name] || name;
}

export const SHIPPING_DEFAULT = {
  id: "standard-cod",
  name: "Standard COD",
  fee: 250,
  eta: "2–5 working days",
  freeOver: 5000,
};
