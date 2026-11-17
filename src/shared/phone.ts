import { z } from "zod";

export function normalizePkPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  let national = digits;
  if (digits.startsWith("92") && digits.length === 12) national = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) national = digits.slice(1);
  if (!/^3\d{9}$/.test(national)) {
    throw new Error("Enter a Pakistan mobile like 03XX XXXXXXX");
  }
  return `+92${national}`;
}

export function isPkMobile(raw: string) {
  try {
    normalizePkPhone(raw);
    return true;
  } catch {
    return false;
  }
}

export const pkPhoneField = z
  .string()
  .min(10, "Enter a Pakistan mobile like 03XX XXXXXXX")
  .refine((value) => isPkMobile(value), "Enter a Pakistan mobile like 03XX XXXXXXX");
