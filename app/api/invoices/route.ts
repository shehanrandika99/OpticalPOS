import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Invoice, InvoiceProduct } from "@/lib/types/database";

// GET - Get all invoices with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    let queryString = `
      SELECT
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
        due,
        balance,
        special_note as "specialNote",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM invoice
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Date range filter
    if (startDate) {
      queryString += ` AND date >= $${paramIndex++}`;
      queryParams.push(startDate);
    }
    if (endDate) {
      queryString += ` AND date <= $${paramIndex++}`;
      queryParams.push(endDate);
    }

    // Status filter
    if (status) {
      queryString += ` AND status = $${paramIndex++}`;
      queryParams.push(status);
    }

    // Search filter (customer name, NIC, or contact number)
    if (search) {
      queryString += ` AND (
        customer_name ILIKE $${paramIndex} OR
        customer_nic ILIKE $${paramIndex} OR
        customer_contactno ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    queryString += ` ORDER BY created_at DESC`;

    const result = await query<Invoice>(queryString, queryParams);

    return NextResponse.json(
      {
        success: true,
        invoices: result.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching invoices:", error);

    // If table doesn't exist, return empty array
    if (
      error instanceof Error &&
      (error.message.includes("does not exist") ||
        error.message.includes("relation") ||
        error.message.includes("table"))
    ) {
      return NextResponse.json(
        {
          success: true,
          invoices: [],
          message: "Invoice table does not exist yet",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch invoices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      customerName,
      customerContactNo,
      customerNIC,
      total,
      grandTotal,
      discount,
      paid,
      balance,
      specialNote,
      items, // Array of invoice items
    } = body;

    // Validate required fields
    if (!userId || total === undefined || grandTotal === undefined) {
      return NextResponse.json(
        { error: "Required fields: userId, total, grandTotal" },
        { status: 400 }
      );
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invoice must have at least one item" },
        { status: 400 }
      );
    }

    // Get current date and time
    const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const currentTime = new Date().toTimeString().split(" ")[0]; // HH:MM:SS

    // Ensure all numeric values are properly converted
    const numTotal = Number(total) || 0;
    const numGrandTotal = Number(grandTotal) || 0;
    const numDiscount = Number(discount) || 0;
    const numPaid = Number(paid) || 0;
    
    // Calculate due: amount customer owes (grandTotal - paid, if grandTotal > paid, else 0)
    const numDue = Math.max(0, numGrandTotal - numPaid);
    
    // Calculate balance: change/overpayment (paid - grandTotal, if paid > grandTotal, else 0)
    const numBalance = Math.max(0, numPaid - numGrandTotal);

    // Start transaction - Insert invoice
    const invoiceResult = await query<Invoice>(
      `INSERT INTO invoice (
        date, time, userid, customer_name, customer_contactno, customer_nic,
        total, grandtotal, discount, paid, due, balance, special_note, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING iid, date, time, userid, customer_name as "customerName",
      customer_contactno as "customerContactNo", customer_nic as "customerNIC",
      total, grandtotal as "grandTotal", discount, paid, due, balance, special_note as "specialNote", status`,
      [
        currentDate,
        currentTime,
        userId,
        customerName || null,
        customerContactNo || null,
        customerNIC || null,
        numTotal,
        numGrandTotal,
        numDiscount,
        numPaid,
        numDue,
        numBalance,
        specialNote || null,
        "Pending", // Default status
      ]
    );

    const invoice = invoiceResult.rows[0];
    const invoiceId = invoice.iid;

    // Insert invoice items
    const invoiceItems: InvoiceProduct[] = [];
    for (const item of items) {
      const itemResult = await query<InvoiceProduct>(
        `INSERT INTO inv_has_product (
          inv_iid, pid, qty, unitprice, date, time
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, inv_iid as "invIid", pid, qty, unitprice as "unitPrice", date, time`,
        [
          invoiceId,
          item.productId,
          item.qty,
          item.productPrice,
          currentDate,
          currentTime,
        ]
      );
      invoiceItems.push(itemResult.rows[0]);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Invoice saved successfully",
        invoice: {
          iid: invoice.iid,
          date: invoice.date,
          time: invoice.time,
          userId: invoice.userId,
          customerName: invoice.customerName,
          customerContactNo: invoice.customerContactNo,
          customerNIC: invoice.customerNIC,
          total: invoice.total,
          grandTotal: invoice.grandTotal,
          discount: invoice.discount,
          paid: invoice.paid,
          due: invoice.due,
          balance: invoice.balance,
          specialNote: invoice.specialNote,
          status: invoice.status,
          items: invoiceItems,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to save invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
