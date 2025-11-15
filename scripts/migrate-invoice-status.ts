import { config } from "dotenv";
import { join } from "path";

// Load environment variables from .env.local
config({ path: join(process.cwd(), ".env.local") });

// Also try .env if .env.local doesn't exist
if (!process.env.DATABASE_URL) {
  config({ path: join(process.cwd(), ".env") });
}

import { query } from "../lib/db";

async function migrateInvoiceStatus() {
  try {
    console.log("🚀 Starting invoice status migration...");

    // Check if status column exists
    const checkColumn = await query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'invoice' AND column_name = 'status'`
    );

    if (checkColumn.rows.length > 0) {
      console.log("✅ Status column already exists");
      process.exit(0);
    }

    console.log("📝 Adding status column to invoice table...");

    // Add status column
    await query(`
      ALTER TABLE invoice 
      ADD COLUMN status VARCHAR(20) DEFAULT 'Pending'
    `);

    console.log("📝 Updating existing invoices to 'Pending' status...");

    // Update existing invoices to have 'Pending' status
    await query(`
      UPDATE invoice 
      SET status = 'Pending' 
      WHERE status IS NULL
    `);

    console.log("📝 Creating index for status column...");

    // Create index for status column
    await query(`
      CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoice(status)
    `);

    console.log("✅ Migration completed successfully!");
    console.log("📊 Status column added to invoice table with default value 'Pending'");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrateInvoiceStatus();

