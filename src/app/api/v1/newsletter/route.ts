import { fail, fromError, ok } from "@/server/lib/api";
import { connectDb } from "@/server/db/connect";
import { Newsletter } from "@/server/models";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    await connectDb();
    const body = z
      .object({ email: z.string().email(), locale: z.string().optional() })
      .parse(await request.json());
    await Newsletter.updateOne(
      { email: body.email.toLowerCase() },
      { $setOnInsert: { email: body.email.toLowerCase(), locale: body.locale || "en" } },
      { upsert: true },
    );
    return ok({ subscribed: true });
  } catch (err) {
    if (err instanceof z.ZodError) return fail("VALIDATION", "Enter a valid email", 422);
    return fromError(err);
  }
}
