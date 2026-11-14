import { cookies } from "next/headers";
import { CUSTOMER_COOKIE, verifyCustomerToken } from "@/server/lib/session";
import { fail } from "@/server/lib/api";
import { getCustomerById } from "@/server/modules/account/account.service";

export async function getSessionCustomer() {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyCustomerToken(token);
  if (!session) return null;
  const customer = await getCustomerById(session.sub);
  if (!customer) return null;
  if ((customer.sessionEpoch || 0) !== (session.epoch || 0)) return null;
  return customer;
}

export async function requireCustomerApi() {
  const customer = await getSessionCustomer();
  if (!customer) {
    return { customer: null, response: fail("UNAUTHENTICATED", "Sign in required", 401) };
  }
  return { customer, response: null };
}
