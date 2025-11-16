import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
  try {
    console.log("Starting migration: Adding 'due' column to invoice table...");

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

    return NextResponse.json(
      {
        success: true,
        message: "Due column added and existing records updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

