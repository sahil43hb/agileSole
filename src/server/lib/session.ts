import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { ADMIN_COOKIE, CUSTOMER_COOKIE } from "@/shared/constants";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error("SESSION_SECRET must be set (16+ characters)");
  }
  return new TextEncoder().encode(value);
}

export type AdminToken = {
  sub: string;
  email: string;
  role: string;
  kind: "admin";
};

export type CustomerToken = {
  sub: string;
  identifier: string;
  kind: "customer";
  epoch?: number;
};

export async function signAdminToken(payload: Omit<AdminToken, "kind">) {
  return new SignJWT({ ...payload, kind: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function signCustomerToken(payload: Omit<CustomerToken, "kind">) {
  return new SignJWT({ ...payload, kind: "customer", epoch: payload.epoch || 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifyAdminToken(token: string): Promise<AdminToken | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.kind !== "admin" || !payload.sub || !payload.email) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      role: String(payload.role || "support"),
      kind: "admin",
    };
  } catch {
    return null;
  }
}

export async function verifyCustomerToken(token: string): Promise<CustomerToken | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.kind !== "customer" || !payload.sub) return null;
    return {
      sub: String(payload.sub),
      identifier: String(payload.identifier || ""),
      kind: "customer",
      epoch: Number(payload.epoch || 0),
    };
  } catch {
    return null;
  }
}

export async function peekCustomerId() {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyCustomerToken(token);
  return session?.sub || null;
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export { ADMIN_COOKIE, CUSTOMER_COOKIE };
