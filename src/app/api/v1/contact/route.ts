import { z } from "zod";
import { fromError, ok } from "@/server/lib/api";
import { connectDb } from "@/server/db/connect";
import { Ticket } from "@/server/models";

export async function POST(request: Request) {
  try {
    await connectDb();
    const body = z
      .object({
        name: z.string().min(2),
        contact: z.string().min(5),
        message: z.string().min(8),
      })
      .parse(await request.json());
    const ticket = await Ticket.create({
      type: "support",
      reason: `${body.name} · ${body.contact}\n${body.message}`,
      status: "open",
    });
    const { notifyAdminTicket } = await import("@/server/modules/admin/admin-notice.service");
    notifyAdminTicket(ticket.toObject());
    return ok({ ticketId: String(ticket._id) }, 201);
  } catch (err) {
    return fromError(err);
  }
}
