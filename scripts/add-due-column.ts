/**
 * Migration script to add 'due' column to invoice table
 * Run this script to add the due column and update existing records
 */

import { query } from "../lib/db";

async function addDueColumn() {
  try {
    console.log("Adding 'due' column to invoice table...");

    // Add due column if it doesn't exist
    await query(`
      ALTER TABLE invoice 
      ADD COLUMN IF NOT EXISTS due DECIMAL(10, 2) NOT NULL DEFAULT 0.00
    `);

    console.log("Column added successfully!");

    // Update existing records to calculate due
    // Due = grandTotal - paid (only if grandTotal > paid, else 0)
    console.log("Updating existing records to calculate due...");
    await query(`
      UPDATE invoice 
      SET due = GREATEST(0, grandtotal - paid)
    `);

    // Update balance for existing records
    // Balance = paid - grandTotal (only if paid > grandTotal, else 0)
    console.log("Updating existing records to calculate balance (change/overpayment)...");
    await query(`
      UPDATE invoice 
      SET balance = GREATEST(0, paid - grandtotal)
    `);

    console.log("Migration completed successfully!");
    console.log("Due column added and existing records updated.");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addDueColumn()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

export default addDueColumn;

