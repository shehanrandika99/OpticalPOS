/**
 * Database Setup Script
 * Run this script to create the users table in your database
 * 
 * Usage:
 *   npx tsx scripts/setup-db.ts
 *   or
 *   pnpm tsx scripts/setup-db.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: join(process.cwd(), ".env.local") });

// Also try .env if .env.local doesn't exist
if (!process.env.DATABASE_URL) {
  config({ path: join(process.cwd(), ".env") });
}

import { query } from "../lib/db";

async function setupDatabase() {
  try {
    console.log("🚀 Starting database setup...");

    // Read the schema file
    const schemaPath = join(process.cwd(), "lib", "db", "schema.sql");
    const schemaSQL = readFileSync(schemaPath, "utf-8");

    console.log("📄 Reading schema file...");

    // Split by semicolons and execute each statement
    const statements = schemaSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        await query(statement);
      }
    }

    console.log("✅ Database setup completed successfully!");
    console.log("📊 Users table and indexes have been created.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database setup failed:", error);

    // Check if table already exists
    if (
      error instanceof Error &&
      (error.message.includes("already exists") ||
        error.message.includes("duplicate"))
    ) {
      console.log("ℹ️  Users table already exists. No changes needed.");
      process.exit(0);
    }

    process.exit(1);
  }
}

// Run the setup
setupDatabase();

