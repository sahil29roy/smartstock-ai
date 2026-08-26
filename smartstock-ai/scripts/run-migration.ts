import "dotenv/config";
import { query } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";

async function run() {
  try {
    const filePath = path.join(process.cwd(), "db/migrations/013_add_missing_indexes.sql");
    const sql = fs.readFileSync(filePath, "utf-8");
    console.log("Running migration 013_add_missing_indexes.sql...");
    await query(sql);
    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();
