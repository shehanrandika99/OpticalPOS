import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { query } from "@/lib/db";
import { generateToken } from "@/lib/utils/jwt";
import type { User } from "@/lib/types/database";

// Hash password using SHA-256 (same as registration)
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find user by username
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
        password
      FROM users 
      WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: "User account is inactive" },
        { status: 403 }
      );
    }

    // Hash the provided password and compare with stored hash
    const hashedPassword = hashPassword(password);

    // Debug logging (remove in production)
    console.log("Password check:", {
      providedHash: hashedPassword.substring(0, 10) + "...",
      storedHash: user.password?.substring(0, 10) + "...",
      match: user.password === hashedPassword,
    });

    if (user.password !== hashedPassword) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Remove password from response for security
    const { password: _, ...userWithoutPassword } = user;

    // Generate JWT token
    const token = generateToken({
      userId: user.id!,
      username: user.username,
      firstName: user.firstName,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        token,
        user: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: "Failed to process login",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

