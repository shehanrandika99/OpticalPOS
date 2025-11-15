import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Migration endpoint to add status column to invoice table
export async function POST() {
  try {
    // Check if status column exists
    const checkColumn = await query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'invoice' AND column_name = 'status'`
    );

    if (checkColumn.rows.length > 0) {
      return NextResponse.json(
        {
          success: true,
          message: "Status column already exists",
        },
        { status: 200 }
      );
    }

    // Add status column
    await query(`
      ALTER TABLE invoice 
      ADD COLUMN status VARCHAR(20) DEFAULT 'Pending'
    `);

    // Update existing invoices to have 'Pending' status
    await query(`
      UPDATE invoice 
      SET status = 'Pending' 
      WHERE status IS NULL
    `);

    // Create index for status column
    await query(`
      CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoice(status)
    `);

    return NextResponse.json(
      {
        success: true,
        message: "Status column added successfully to invoice table",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Failed to add status column",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

