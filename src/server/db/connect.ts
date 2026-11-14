import mongoose from "mongoose";
import { mkdirSync } from "fs";
import { join } from "path";

type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  memoryUri?: string;
};

const globalWithMongo = globalThis as typeof globalThis & { _mongoose?: Cache };

function cache(): Cache {
  if (!globalWithMongo._mongoose) {
    globalWithMongo._mongoose = { conn: null, promise: null };
  }
  return globalWithMongo._mongoose;
}

async function resolveUri(): Promise<string> {
  const c = cache();
  if (c.memoryUri) return c.memoryUri;

  const useMemory =
    !process.env.VERCEL &&
    (process.env.USE_MEMORY_MONGO === "true" || process.env.USE_MEMORY_MONGO === "1");

  if (!useMemory && process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const dbPath = join(process.cwd(), ".mongo-data");
  mkdirSync(dbPath, { recursive: true });
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: "agilesole", dbPath, storageEngine: "wiredTiger" },
  });
  c.memoryUri = mongod.getUri();
  return c.memoryUri;
}

let ensureDevDataPromise: Promise<void> | null = null;

async function ensureDevData() {
  if (process.env.NODE_ENV === "production") return;
  if (process.env.SKIP_DEV_SEED === "1") return;
  if (!ensureDevDataPromise) {
    ensureDevDataPromise = (async () => {
      const { Product } = await import("@/server/models/product");
      const count = await Product.countDocuments();
      const withPhotos = await Product.countDocuments({ "images.0": { $exists: true } });
      if (count === 0 || withPhotos === 0) {
        const { seedDatabase } = await import("./bootstrap");
        await seedDatabase();
      }
      const { seedReviewsIfEmpty } = await import("@/server/modules/catalog/review.service");
      await seedReviewsIfEmpty();
      const { seedFaqsIfEmpty } = await import("@/server/modules/cms/cms.service");
      await seedFaqsIfEmpty();
    })();
  }
  await ensureDevDataPromise;
}

export async function connectDb(): Promise<typeof mongoose> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    throw new Error("Mongo is not used during next build");
  }

  const c = cache();
  if (c.conn) {
    if (ensureDevDataPromise) await ensureDevDataPromise;
    return c.conn;
  }

  if (!c.promise) {
    c.promise = (async () => {
      const uri = await resolveUri();
      return mongoose.connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 1,
        // Windows DNS often stalls on IPv6 for mongodb+srv. Vercel needs default family.
        ...(process.platform === "win32" ? { family: 4 as const } : {}),
        serverSelectionTimeoutMS: process.env.VERCEL ? 12000 : 8000,
      });
    })().catch((err) => {
      c.promise = null;
      throw err;
    });
  }

  c.conn = await c.promise;
  await ensureDevData();
  return c.conn;
}

export async function pingDb(): Promise<boolean> {
  try {
    const conn = await connectDb();
    await conn.connection.db?.admin().command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}
