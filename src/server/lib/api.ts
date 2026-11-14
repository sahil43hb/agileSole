import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(code: string, message: string, status = 400, fields?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, fields } },
    { status },
  );
}

export function fromError(err: unknown) {
  if (err instanceof ZodError) {
    return fail("VALIDATION", "Invalid input", 422, err.flatten());
  }
  const message = err instanceof Error ? err.message : "Unexpected error";
  if (message.includes("MONGODB_URI")) {
    return fail("DB_CONFIG", "Database is not configured", 503);
  }
  console.error(err);
  return fail("INTERNAL", "Something went wrong", 500);
}
