import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { query } from "@/lib/db";

export async function POST() {
  try {
    // Read the schema file
    const schemaPath = join(process.cwd(), "lib", "db", "schema.sql");
    const schemaSQL = readFileSync(schemaPath, "utf-8");

    // Split by semicolons and execute each statement
    const statements = schemaSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement) {
        await query(statement);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Users table created successfully!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Schema setup error:", error);

    // Check if table already exists
    if (
      error instanceof Error &&
      (error.message.includes("already exists") ||
        error.message.includes("duplicate"))
    ) {
      return NextResponse.json(
        {
          success: true,
          message: "Users table already exists",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create users table",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

