import { NextRequest, NextResponse } from "next/server";
import { ok } from "@/server/lib/api";
import { ADMIN_COOKIE } from "@/server/lib/session";

function clearAdminCookie(res: NextResponse) {
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET(request: NextRequest) {
  const login = new URL("/admin/login", request.url);
  return clearAdminCookie(NextResponse.redirect(login));
}

export async function POST() {
  return clearAdminCookie(ok({ loggedOut: true }));
}
