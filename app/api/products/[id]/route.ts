import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Product } from "@/lib/types/database";

// GET - Get single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const result = await query<Product>(
      `SELECT
        id,
        product_name as "productName",
        product_search_id as "productSearchId",
        product_exp_date as "productExpDate",
        product_stock_count as "productStockCount",
        product_low_stock_alert as "productLowStockAlert",
        product_price as "productPrice",
        is_active as "isActive"
      FROM products
      WHERE id = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        product: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch product",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const body: Partial<Product> = await request.json();

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await query<Product>(
      "SELECT id, product_search_id FROM products WHERE id = $1",
      [productId]
    );

    if (existingProduct.rows.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // If product_search_id is being updated, check if it's already used by another product
    if (body.productSearchId) {
      const currentSearchId = existingProduct.rows[0].productSearchId;
      // Only check for duplicates if the search ID is different from current one
      if (body.productSearchId !== currentSearchId) {
        const duplicateCheck = await query<Product>(
          "SELECT id FROM products WHERE product_search_id = $1 AND id != $2",
          [body.productSearchId, productId]
        );

        if (duplicateCheck.rows.length > 0) {
          return NextResponse.json(
            { error: "Product Search ID already exists for another product" },
            { status: 400 }
          );
        }
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.productName) {
      updates.push(`product_name = $${paramIndex++}`);
      values.push(body.productName);
    }
    if (body.productSearchId) {
      updates.push(`product_search_id = $${paramIndex++}`);
      values.push(body.productSearchId);
    }
    if (body.productExpDate !== undefined) {
      updates.push(`product_exp_date = $${paramIndex++}`);
      values.push(body.productExpDate || null);
    }
    if (body.productStockCount !== undefined) {
      updates.push(`product_stock_count = $${paramIndex++}`);
      values.push(body.productStockCount);
    }
    if (body.productLowStockAlert !== undefined) {
      updates.push(`product_low_stock_alert = $${paramIndex++}`);
      values.push(body.productLowStockAlert);
    }
    if (body.productPrice !== undefined) {
      updates.push(`product_price = $${paramIndex++}`);
      values.push(body.productPrice);
    }
    if (typeof body.isActive === "boolean") {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(body.isActive);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(productId); // Add productId as the last parameter for WHERE clause

    const updateQuery = `
      UPDATE products
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, product_name as "productName", product_search_id as "productSearchId",
      product_exp_date as "productExpDate", product_stock_count as "productStockCount",
      product_low_stock_alert as "productLowStockAlert", product_price as "productPrice",
      is_active as "isActive"
    `;

    const result = await query<Product>(updateQuery, values);

    return NextResponse.json(
      {
        success: true,
        message: "Product updated successfully",
        product: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update product",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete product permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await query<Product>(
      "SELECT id FROM products WHERE id = $1",
      [productId]
    );

    if (existingProduct.rows.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Delete product permanently
    await query("DELETE FROM products WHERE id = $1", [productId]);

    return NextResponse.json(
      {
        success: true,
        message: "Product deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete product",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

