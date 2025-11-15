import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { User } from "@/lib/types/database";

// GET - Get single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

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
        username
      FROM users 
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const body: Partial<User> = await request.json();

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await query<User>(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.nic) {
      updates.push(`nic = $${paramIndex++}`);
      values.push(body.nic);
    }
    if (body.contactNo) {
      updates.push(`contact_no = $${paramIndex++}`);
      values.push(body.contactNo);
    }
    if (body.firstName) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(body.firstName);
    }
    if (body.lastName) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(body.lastName);
    }
    if (body.branch) {
      updates.push(`branch = $${paramIndex++}`);
      values.push(body.branch);
    }
    if (typeof body.isActive === "boolean") {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(body.isActive);
    }
    if (typeof body.financePrevilage === "boolean") {
      updates.push(`finance_previlage = $${paramIndex++}`);
      values.push(body.financePrevilage);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, nic, contact_no as "contactNo", first_name as "firstName", 
      last_name as "lastName", branch, is_active as "isActive", 
      finance_previlage as "financePrevilage", username
    `;

    const result = await query<User>(updateQuery, values);

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully",
        user: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

