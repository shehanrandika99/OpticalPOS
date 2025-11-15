import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Product } from "@/lib/types/database";

// GET - Get all products
export async function GET() {
  try {
    const result = await query<Product>(
      `SELECT
        id,
        product_name as "productName",
        product_search_id as "productSearchId",
        product_exp_date as "productExpDate",
        product_stock_count as "productStockCount",
        product_low_stock_alert as "productLowStockAlert",
        product_price as "productPrice",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM products
      ORDER BY created_at DESC`
    );

    return NextResponse.json(
      {
        success: true,
        products: result.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching products:", error);

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
          products: [],
          message: "Products table does not exist yet",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: Request) {
  try {
    const body: Omit<Product, "id" | "createdAt" | "updatedAt"> = await request.json();

    // Validate required fields
    if (
      !body.productName ||
      !body.productSearchId ||
      body.productStockCount === undefined ||
      body.productLowStockAlert === undefined ||
      body.productPrice === undefined
    ) {
      return NextResponse.json(
        { error: "Required fields: Product Name, Product Search ID, Stock Count, Low Stock Alert, Price" },
        { status: 400 }
      );
    }

    // Check if product_search_id already exists
    const existingProduct = await query<Product>(
      "SELECT id FROM products WHERE product_search_id = $1",
      [body.productSearchId]
    );

    if (existingProduct.rows.length > 0) {
      return NextResponse.json(
        { error: "Product Search ID already exists" },
        { status: 400 }
      );
    }

    // Insert new product
    const result = await query<Product>(
      `INSERT INTO products (
        product_name, product_search_id, product_exp_date,
        product_stock_count, product_low_stock_alert, product_price, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, product_name as "productName", product_search_id as "productSearchId",
      product_exp_date as "productExpDate", product_stock_count as "productStockCount",
      product_low_stock_alert as "productLowStockAlert", product_price as "productPrice",
      is_active as "isActive"`,
      [
        body.productName,
        body.productSearchId,
        body.productExpDate || null,
        body.productStockCount,
        body.productLowStockAlert,
        body.productPrice,
        body.isActive ?? true,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        product: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create product",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

