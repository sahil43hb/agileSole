import { requireAdminApi } from "@/server/lib/require-admin";
import { latestAdminNoticeId, listAdminNoticesAfter } from "@/server/modules/admin/admin-notice.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Server-sent events. Socket.io is a poor fit on Vercel serverless;
 * this stream + a short REST poll keeps every admin tab live.
 */
export async function GET(request: Request) {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  const staffId = gate.staff!.id;
  const encoder = new TextEncoder();
  let cursor = await latestAdminNoticeId();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("hello", { ok: true, cursor });

      const tick = async () => {
        if (closed) return;
        if (!cursor) {
          cursor = await latestAdminNoticeId();
          return;
        }
        const items = await listAdminNoticesAfter(cursor, staffId);
        for (const item of items) {
          cursor = item.id;
          send("notification", item);
        }
        controller.enqueue(encoder.encode(`: ping\n\n`));
      };

      const interval = setInterval(() => {
        void tick().catch((err) => console.error("[admin-sse]", err));
      }, 2500);

      const abort = () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      request.signal.addEventListener("abort", abort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
