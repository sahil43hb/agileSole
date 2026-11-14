import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getPublicSettings } from "@/server/modules/admin/settings.service";
import { DEFAULT_LOGO } from "@/lib/brand-icon";

export const dynamic = "force-dynamic";

function mimeFor(file: string) {
  const lower = file.toLowerCase();
  if (lower.includes(".svg")) return "image/svg+xml";
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg";
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".gif")) return "image/gif";
  if (lower.includes(".ico")) return "image/x-icon";
  return "image/png";
}

function publicFile(rel: string) {
  const publicRoot = path.join(process.cwd(), "public");
  const filePath = path.join(publicRoot, rel.replace(/^[/\\]+/, ""));
  if (!filePath.startsWith(publicRoot)) return null;
  return filePath;
}

async function fileResponse(filePath: string, logo: string) {
  const buf = await readFile(filePath);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": mimeFor(logo),
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}

export async function GET() {
  const { logo } = await getPublicSettings();
  const src = logo || DEFAULT_LOGO;
  try {
    if (src.startsWith("http://") || src.startsWith("https://")) {
      const res = await fetch(src, { cache: "no-store" });
      if (!res.ok) throw new Error("remote logo");
      return new NextResponse(await res.arrayBuffer(), {
        headers: {
          "Content-Type": res.headers.get("content-type") || mimeFor(src),
          "Cache-Control": "no-store, must-revalidate",
        },
      });
    }
    const filePath = publicFile(src);
    if (!filePath) throw new Error("invalid");
    return await fileResponse(filePath, src);
  } catch {
    const fallback = publicFile(DEFAULT_LOGO);
    if (!fallback) return new NextResponse(null, { status: 404 });
    return await fileResponse(fallback, DEFAULT_LOGO);
  }
}
