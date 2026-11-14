import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import mongoose from "mongoose";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI to dump Atlas or local Mongo. Memory Mongo is not backed up.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error("No database");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = join(process.cwd(), "backups", stamp);
  mkdirSync(dir, { recursive: true });

  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    const docs = await db.collection(col.name).find({}).toArray();
    writeFileSync(join(dir, `${col.name}.json`), JSON.stringify(docs, null, 2));
    console.log(`${col.name}: ${docs.length} documents`);
  }

  await mongoose.disconnect();
  console.log(`Wrote ${dir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
