import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { errorMessage, formatZodError } from "@/shared/api-error";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(code: string, message: string, status = 400, fields?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, fields } },
    { status },
  );
}

export { errorMessage };

export function fromError(err: unknown) {
  if (err instanceof ZodError) {
    return fail("VALIDATION", formatZodError(err), 422);
  }
  const message = errorMessage(err, "Unexpected error");
  if (message.includes("MONGODB_URI")) {
    return fail("DB_CONFIG", "Database is not configured", 503);
  }
  if (err instanceof Error && message && message !== "Unexpected error" && message !== "Something went wrong") {
    if (!message.includes("\n") && message.length < 280) {
      return fail("VALIDATION", message, 400);
    }
  }
  console.error(err);
  return fail("INTERNAL", message.length < 180 ? message : "Something went wrong", 500);
}
