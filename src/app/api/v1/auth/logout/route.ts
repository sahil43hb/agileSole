import { cookies } from "next/headers";
import { ok } from "@/server/lib/api";
import { CUSTOMER_COOKIE, cookieOptions } from "@/server/lib/session";

export async function POST() {
  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return ok({ signedOut: true });
}
