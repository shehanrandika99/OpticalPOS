import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { query } from "@/lib/db";
import type { User } from "@/lib/types/database";

// Hash password using SHA-256
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body: Omit<User, "id" | "createdAt" | "updatedAt"> = await request.json();

    // Validate required fields (lastName is optional)
    if (
      !body.nic ||
      !body.contactNo ||
      !body.firstName ||
      !body.branch ||
      !body.username ||
      !body.password
    ) {
      return NextResponse.json(
        { error: "Required fields: NIC, Contact No, First Name, Branch, Username, Password" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await query<User>(
      "SELECT id FROM users WHERE username = $1",
      [body.username]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Insert new user
    const result = await query<User>(
      `INSERT INTO users (
        nic, contact_no, first_name, last_name, branch, 
        is_active, finance_previlage, username, password
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, nic, contact_no as "contactNo", first_name as "firstName", 
      last_name as "lastName", branch, is_active as "isActive", 
      finance_previlage as "financePrevilage", username`,
      [
        body.nic,
        body.contactNo,
        body.firstName,
        body.lastName,
        body.branch,
        body.isActive ?? true,
        body.financePrevilage ?? false,
        body.username,
        hashPassword(body.password), // Hash password using SHA-256
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        error: "Failed to register user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

