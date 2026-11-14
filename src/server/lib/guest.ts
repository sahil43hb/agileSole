import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { cookieOptions } from "@/server/lib/session";

export const GUEST_COOKIE = "as_guest";

export async function getGuestId() {
  const jar = await cookies();
  const existing = jar.get(GUEST_COOKIE)?.value;
  if (existing) return existing;
  const id = randomUUID();
  jar.set(GUEST_COOKIE, id, { ...cookieOptions, maxAge: 60 * 60 * 24 * 90 });
  return id;
}
