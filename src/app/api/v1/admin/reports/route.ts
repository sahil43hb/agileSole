import { NextResponse } from "next/server";
import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { reportPayload, toCsv } from "@/server/modules/admin/reports.service";

export async function GET(request: Request) {
  const gate = await requireAdminApi("reports");
  if (gate.response) return gate.response;
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "sales";
    const format = url.searchParams.get("format") || "json";
    const data = await reportPayload(type);
    if (format === "csv") {
      const rows = Array.isArray(data.rows) ? (data.rows as Array<Record<string, unknown>>) : [];
      return new NextResponse(toCsv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${type}.csv"`,
        },
      });
    }
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}
