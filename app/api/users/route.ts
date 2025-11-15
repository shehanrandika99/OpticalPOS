import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { User } from "@/lib/types/database";

export async function GET() {
  try {
    const result = await query<User>(
      `SELECT 
        id, 
        nic, 
        contact_no as "contactNo", 
        first_name as "firstName", 
        last_name as "lastName", 
        branch, 
        is_active as "isActive", 
        finance_previlage as "financePrevilage", 
        username,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM users 
      ORDER BY created_at DESC`
    );

    return NextResponse.json(
      {
        success: true,
        users: result.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching users:", error);

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
          users: [],
          message: "Users table does not exist yet",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

