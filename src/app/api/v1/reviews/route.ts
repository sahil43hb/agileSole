import { z } from "zod";
import { fromError, ok } from "@/server/lib/api";
import { submitReview } from "@/server/modules/catalog/review.service";
import { getSessionCustomer } from "@/server/lib/require-customer";

export async function POST(request: Request) {
  try {
    const customer = await getSessionCustomer();
    const body = z
      .object({
        slug: z.string().min(1),
        authorName: z.string().min(2),
        rating: z.number().int().min(1).max(5),
        title: z.string().optional(),
        body: z.string().min(8),
        fit: z.enum(["small", "true", "large"]).optional(),
      })
      .parse(await request.json());
    const review = await submitReview({ ...body, customerId: customer?.id });
    return ok({ review }, 201);
  } catch (err) {
    return fromError(err);
  }
}
