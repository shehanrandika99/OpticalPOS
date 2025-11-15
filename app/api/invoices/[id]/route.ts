import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Invoice, InvoiceProduct } from "@/lib/types/database";

// GET - Get single invoice by ID with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: "Invalid invoice ID" },
        { status: 400 }
      );
    }

    // Get invoice details
    const invoiceResult = await query<Invoice>(
      `SELECT
        iid,
        date,
        time,
        userid as "userId",
        customer_name as "customerName",
        customer_contactno as "customerContactNo",
        customer_nic as "customerNIC",
        total,
        grandtotal as "grandTotal",
        discount,
        paid,
        balance,
        special_note as "specialNote",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM invoice
      WHERE iid = $1`,
      [invoiceId]
    );

    if (invoiceResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const invoice = invoiceResult.rows[0];

    // Get invoice items
    const itemsResult = await query<InvoiceProduct>(
      `SELECT
        ihp.id,
        ihp.inv_iid as "invIid",
        ihp.pid as "pid",
        ihp.qty,
        ihp.unitprice as "unitPrice",
        p.product_name as "productName",
        p.product_search_id as "productSearchId",
        p.product_price as "productPrice"
      FROM inv_has_product ihp
      INNER JOIN products p ON ihp.pid = p.id
      WHERE ihp.inv_iid = $1`,
      [invoiceId]
    );

    return NextResponse.json(
      {
        success: true,
        invoice: {
          ...invoice,
          items: itemsResult.rows.map((item) => ({
            id: item.id,
            productId: item.pid,
            productName: (item as any).productName,
            productSearchId: (item as any).productSearchId,
            qty: item.qty,
            productPrice: item.unitPrice,
            total: item.qty * item.unitPrice,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT - Update invoice (mainly for payment updates)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);
    const body = await request.json();

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: "Invalid invoice ID" },
        { status: 400 }
      );
    }

    // Check if invoice exists
    const existingInvoice = await query<Invoice>(
      "SELECT iid, grandtotal, paid FROM invoice WHERE iid = $1",
      [invoiceId]
    );

    if (existingInvoice.rows.length === 0) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const currentInvoice = existingInvoice.rows[0];
    const newPaid = body.paid !== undefined ? Number(body.paid) || 0 : Number(currentInvoice.paid) || 0;
    const grandTotal = Number(currentInvoice.grandTotal) || 0;
    
    // Calculate balance (if paid > grandTotal, balance = 0)
    const balance = Math.max(0, grandTotal - newPaid);
    
    // Ensure balance is a valid number
    if (isNaN(balance)) {
      return NextResponse.json(
        { error: "Invalid balance calculation" },
        { status: 400 }
      );
    }

    // Update invoice
    const result = await query<Invoice>(
      `UPDATE invoice
      SET paid = $1, balance = $2, updated_at = CURRENT_TIMESTAMP
      WHERE iid = $3
      RETURNING iid, date, time, userid as "userId",
      customer_name as "customerName", customer_contactno as "customerContactNo",
      customer_nic as "customerNIC", total, grandtotal as "grandTotal",
      discount, paid, balance, special_note as "specialNote", status`,
      [newPaid, balance, invoiceId]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Invoice payment updated successfully",
        invoice: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

