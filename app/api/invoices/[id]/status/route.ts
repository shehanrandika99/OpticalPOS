import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Invoice } from "@/lib/types/database";

// PUT - Update invoice status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);
    const body = await request.json();
    const { status } = body;

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: "Invalid invoice ID" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["Pending", "Ready to Deliver", "Delivered"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if invoice exists
    const existingInvoice = await query<Invoice>(
      "SELECT iid FROM invoice WHERE iid = $1",
      [invoiceId]
    );

    if (existingInvoice.rows.length === 0) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Update invoice status
    const result = await query<Invoice>(
      `UPDATE invoice
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE iid = $2
      RETURNING iid, date, time, userid as "userId",
      customer_name as "customerName", customer_contactno as "customerContactNo",
      customer_nic as "customerNIC", total, grandtotal as "grandTotal",
      discount, paid, balance, special_note as "specialNote", status`,
      [status, invoiceId]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Invoice status updated successfully",
        invoice: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update invoice status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

