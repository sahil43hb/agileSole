import { errorMessage, fail, fromError, ok } from "@/server/lib/api";
import { requireCustomerApi } from "@/server/lib/require-customer";
import { addAddress } from "@/server/modules/account/account.service";

export async function GET() {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  return ok({ addresses: gate.customer!.addresses || [] });
}

export async function POST(request: Request) {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    const customer = await addAddress(gate.customer!.id, await request.json());
    return ok({ customer }, 201);
  } catch (err) {
    const message = errorMessage(err, "Could not save");
    if (message !== "Something went wrong") {
      return fail("VALIDATION", message, 400);
    }
    return fromError(err);
  }
}
