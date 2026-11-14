import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function saveUpload(file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Only JPG, PNG, WEBP, or GIF images are allowed");
  }
  if (file.size > 6 * 1024 * 1024) {
    throw new Error("Image must be under 6MB");
  }

  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (cloud && preset) {
    const body = new FormData();
    body.set("file", file);
    body.set("upload_preset", preset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: "POST",
      body,
    });
    const json = (await res.json()) as { secure_url?: string; error?: { message?: string } };
    if (!json.secure_url) {
      throw new Error(json.error?.message || "Cloudinary upload failed");
    }
    return { url: json.secure_url, provider: "cloudinary" as const };
  }

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, name), buffer);
  return { url: `/uploads/${name}`, provider: "local" as const };
}
