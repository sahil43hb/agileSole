import { mkdirSync } from "fs";
import { join } from "path";
import { MongoMemoryServer } from "mongodb-memory-server";

const dbPath = join(process.cwd(), ".mongo-local");
mkdirSync(dbPath, { recursive: true });

async function main() {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      ip: "127.0.0.1",
      dbName: "agilesole",
      dbPath,
      storageEngine: "wiredTiger",
    },
  });
  console.log("Local MongoDB ready:", mongod.getUri());
  console.log("Database: agilesole  —  Compass: mongodb://127.0.0.1:27017");
  await new Promise(() => {});
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
