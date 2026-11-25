import { NextRequest, NextResponse } from "next/server";
import { getMedia } from "@/server/modules/catalog/media.service";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || !/^[a-f0-9]{24}$/i.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const file = await getMedia(id);
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(file.bytes), {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${file.filename}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
