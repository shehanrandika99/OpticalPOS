import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get income report by date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    // Get income data (sum of grandTotal) for the date range
    const incomeResult = await query<{
      totalInvoices: string | number;
      totalIncome: string | number;
      totalPaid: string | number;
      totalBalance: string | number;
      totalDiscount: string | number;
    }>(
      `SELECT
        COUNT(*) as "totalInvoices",
        COALESCE(SUM(grandtotal), 0) as "totalIncome",
        COALESCE(SUM(paid), 0) as "totalPaid",
        COALESCE(SUM(balance), 0) as "totalBalance",
        COALESCE(SUM(discount), 0) as "totalDiscount"
      FROM invoice
      WHERE date >= $1 AND date <= $2`,
      [startDate, endDate]
    );

    // Get daily breakdown
    const dailyBreakdownResult = await query<{
      date: string;
      invoiceCount: string | number;
      dailyIncome: string | number;
      dailyPaid: string | number;
      dailyBalance: string | number;
    }>(
      `SELECT
        date,
        COUNT(*) as "invoiceCount",
        COALESCE(SUM(grandtotal), 0) as "dailyIncome",
        COALESCE(SUM(paid), 0) as "dailyPaid",
        COALESCE(SUM(balance), 0) as "dailyBalance"
      FROM invoice
      WHERE date >= $1 AND date <= $2
      GROUP BY date
      ORDER BY date DESC`,
      [startDate, endDate]
    );

    // Get status breakdown
    const statusBreakdownResult = await query<{
      status: string;
      count: string | number;
      total: string | number;
    }>(
      `SELECT
        status,
        COUNT(*) as "count",
        COALESCE(SUM(grandtotal), 0) as "total"
      FROM invoice
      WHERE date >= $1 AND date <= $2
      GROUP BY status
      ORDER BY status`,
      [startDate, endDate]
    );

    const incomeData = incomeResult.rows[0] || {
      totalInvoices: "0",
      totalIncome: "0",
      totalPaid: "0",
      totalBalance: "0",
      totalDiscount: "0",
    };
    const dailyBreakdown = dailyBreakdownResult.rows;
    const statusBreakdown = statusBreakdownResult.rows;

    return NextResponse.json(
      {
        success: true,
        report: {
          startDate,
          endDate,
          totalInvoices: parseInt(String(incomeData.totalInvoices)) || 0,
          totalIncome: parseFloat(String(incomeData.totalIncome)) || 0,
          totalPaid: parseFloat(String(incomeData.totalPaid)) || 0,
          totalBalance: parseFloat(String(incomeData.totalBalance)) || 0,
          totalDiscount: parseFloat(String(incomeData.totalDiscount)) || 0,
          dailyBreakdown: dailyBreakdown.map((day) => ({
            date: String(day.date),
            invoiceCount: parseInt(String(day.invoiceCount)) || 0,
            dailyIncome: parseFloat(String(day.dailyIncome)) || 0,
            dailyPaid: parseFloat(String(day.dailyPaid)) || 0,
            dailyBalance: parseFloat(String(day.dailyBalance)) || 0,
          })),
          statusBreakdown: statusBreakdown.map((status) => ({
            status: String(status.status || "Unknown"),
            count: parseInt(String(status.count)) || 0,
            total: parseFloat(String(status.total)) || 0,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching income report:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch income report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

