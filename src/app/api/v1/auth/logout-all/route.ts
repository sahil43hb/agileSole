import { cookies } from "next/headers";
import { fromError, ok } from "@/server/lib/api";
import { CUSTOMER_COOKIE, cookieOptions } from "@/server/lib/session";
import { requireCustomerApi } from "@/server/lib/require-customer";
import { bumpSessionEpoch } from "@/server/modules/account/account.service";

export async function POST() {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    await bumpSessionEpoch(gate.customer!.id);
    const jar = await cookies();
    jar.set(CUSTOMER_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return ok({ signedOut: true });
  } catch (err) {
    return fromError(err);
  }
}
