import { ok } from "@/server/lib/api";
import { ADMIN_COOKIE } from "@/server/lib/session";

export async function POST() {
  const res = ok({ loggedOut: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
