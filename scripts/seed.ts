import mongoose from "mongoose";
import { seedDatabase } from "../src/server/db/bootstrap";

seedDatabase()
  .then(async () => {
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
