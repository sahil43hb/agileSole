import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { connectDb } from "@/server/db/connect";
import { Media } from "@/server/models/media";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extFor(type: string) {
  return type.split("/")[1] === "jpeg" ? "jpg" : type.split("/")[1];
}

function fileName(type: string) {
  return `${Date.now()}-${randomUUID().slice(0, 8)}.${extFor(type)}`;
}

function serverlessDisk() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

async function saveCloudinary(file: File) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) return null;
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

async function saveMongo(file: File) {
  await connectDb();
  const filename = fileName(file.type);
  const doc = await Media.create({
    filename,
    contentType: file.type,
    bytes: Buffer.from(await file.arrayBuffer()),
  });
  return { url: `/api/v1/media/${doc._id}`, provider: "mongo" as const };
}

async function saveLocal(file: File) {
  const name = fileName(file.type);
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${name}`, provider: "local" as const };
}

export async function saveUpload(file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Only JPG, PNG, WEBP, or GIF images are allowed");
  }
  if (file.size > 6 * 1024 * 1024) {
    throw new Error("Image must be under 6MB");
  }

  const cloud = await saveCloudinary(file);
  if (cloud) return cloud;

  if (serverlessDisk()) {
    return saveMongo(file);
  }

  return saveLocal(file);
}

function asBuffer(raw: unknown) {
  if (Buffer.isBuffer(raw)) return raw;
  if (raw && typeof raw === "object" && "buffer" in raw) {
    const inner = (raw as { buffer: ArrayBuffer | Buffer }).buffer;
    return Buffer.isBuffer(inner) ? inner : Buffer.from(inner);
  }
  if (raw instanceof ArrayBuffer) return Buffer.from(raw);
  if (raw instanceof Uint8Array) return Buffer.from(raw);
  return null;
}

export async function getMedia(id: string) {
  await connectDb();
  const doc = await Media.findById(id).lean<{
    filename: string;
    contentType: string;
    bytes: unknown;
  } | null>();
  if (!doc) return null;
  const bytes = asBuffer(doc.bytes);
  if (!bytes) return null;
  return {
    filename: doc.filename,
    contentType: doc.contentType,
    bytes,
  };
}
