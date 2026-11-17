import { ZodError, type ZodIssue } from "zod";

const FIELD_LABELS: Record<string, string> = {
  phone: "Phone",
  fullName: "Full name",
  street: "Street / area",
  sku: "SKU",
  qty: "Quantity",
  email: "Email",
  identifier: "Phone or email",
  code: "Code",
  password: "Password",
  name: "Name",
  city: "City",
  province: "Province",
  items: "Items",
  message: "Message",
  contact: "Phone or email",
  title: "Title",
  body: "Details",
  slug: "URL slug",
  otp: "Code",
};

function fieldLabel(path: (string | number)[]) {
  const key = [...path].reverse().find((p) => typeof p === "string" && Number.isNaN(Number(p)));
  if (typeof key !== "string" || !key) return "This field";
  return FIELD_LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

export function formatZodIssue(issue: ZodIssue): string {
  const label = fieldLabel(issue.path);
  const key = String(issue.path[issue.path.length - 1] || "");
  if (issue.code === "too_small") {
    if (issue.type === "string") {
      if (key === "phone") return "Enter a Pakistan mobile like 03XX XXXXXXX";
      if (key === "code" || key === "otp") return "Enter the 6-digit code";
      if (key === "identifier") return "Enter a valid phone or email";
      if (key === "street") return "Enter house, street, or landmark";
      if (key === "fullName" || key === "name") return "Enter the full name";
      return `${label} must be at least ${issue.minimum} characters`;
    }
    if (issue.type === "array") return "Add at least one item";
    if (issue.type === "number") return `${label} must be at least ${issue.minimum}`;
  }
  if (issue.code === "too_big") {
    if (key === "code" || key === "otp") return "Enter the 6-digit code";
    return `${label} is too long`;
  }
  if (issue.code === "invalid_string") {
    if ("validation" in issue && issue.validation === "email") return "Enter a valid email";
  }
  if (issue.code === "invalid_enum_value") return `Choose a valid ${label.toLowerCase()}`;
  if (issue.code === "invalid_type") {
    if (issue.received === "undefined" || issue.received === "null") return `${label} is required`;
  }
  if (issue.message && !issue.message.startsWith("[") && !issue.message.includes('"code":')) {
    return issue.message;
  }
  return `${label} is invalid`;
}

export function formatZodError(err: ZodError) {
  const parts = [...new Set(err.issues.map(formatZodIssue))];
  return parts.slice(0, 3).join(". ");
}

export function parseZodJsonMessage(raw: string) {
  const text = raw.trim();
  if (!text.startsWith("[") && !text.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    const issues = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { issues?: unknown }).issues)
        ? (parsed as { issues: unknown[] }).issues
        : null;
    if (!issues?.length) return null;
    return formatZodError({ issues } as ZodError);
  } catch {
    return null;
  }
}

export function errorMessage(err: unknown, fallback = "Something went wrong") {
  if (err instanceof ZodError) return formatZodError(err);
  if (err instanceof Error) {
    const fromJson = parseZodJsonMessage(err.message);
    if (fromJson) return fromJson;
    if (err.message) return err.message;
  }
  return fallback;
}

const CODE_MESSAGES: Record<string, string> = {
  OTP_NOT_FOUND: "Request a new code first",
  OTP_EXPIRED: "That code has expired. Request a new one.",
  OTP_LOCKED: "Too many tries. Request a new code.",
  OTP_INVALID: "That code is incorrect",
  UNAUTHENTICATED: "Please sign in first",
  FORBIDDEN: "You don’t have access to do that",
  RATE_LIMIT: "Too many attempts. Try again in a minute.",
  NOT_FOUND: "We couldn’t find that",
  VALIDATION: "Please check the form and try again",
};

type ApiErrorBody = {
  ok?: boolean;
  error?: {
    code?: string;
    message?: string;
    fields?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
  };
};

export function apiErrorMessage(json: unknown, fallback = "Something went wrong") {
  const body = json as ApiErrorBody | null;
  const code = body?.error?.code || "";
  const raw = body?.error?.message || "";
  if (raw) {
    const fromZod = parseZodJsonMessage(raw);
    if (fromZod) return fromZod;
    if (raw !== "Invalid input" && raw !== "Something went wrong" && raw !== "Unexpected error") return raw;
  }
  const fieldErrors = body?.error?.fields?.fieldErrors;
  if (fieldErrors) {
    const first = Object.values(fieldErrors).flat().find(Boolean);
    if (first) return first;
  }
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  return fallback;
}
