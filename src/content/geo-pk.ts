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

export const SHIPPING_DEFAULT = {
  id: "standard-cod",
  name: "Standard COD",
  fee: 250,
  eta: "2–5 working days",
  freeOver: 5000,
};
