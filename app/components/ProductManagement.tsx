"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id?: number;
  productName: string;
  productSearchId: string;
  productExpDate: string;
  productStockCount: number;
  productLowStockAlert: number;
  productPrice: number;
  isActive: boolean;
}

export default function ProductManagement() {
  const [formData, setFormData] = useState({
    productName: "",
    productSearchId: "",
    productExpDate: "",
    productStockCount: 0,
    productLowStockAlert: 0,
    productPrice: 0,
    isActive: true,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Fetch all products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData({
      ...formData,
      [name]:
        type === "number"
          ? parseFloat(value) || 0
          : type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    });
    
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const validateForm = (): string | null => {
    // Validate required fields
    if (!formData.productName || formData.productName.trim() === "") {
      return "Product Name is required";
    }

    if (!formData.productSearchId || formData.productSearchId.trim() === "") {
      return "Product Search ID (Barcode) is required";
    }

    if (formData.productStockCount === undefined || formData.productStockCount < 0) {
      return "Product Stock Count is required and must be 0 or greater";
    }

    if (formData.productLowStockAlert === undefined || formData.productLowStockAlert < 0) {
      return "Product Low Stock Alert is required and must be 0 or greater";
    }

    if (formData.productPrice === undefined || formData.productPrice < 0) {
      return "Product Price is required and must be 0 or greater";
    }

    return null; // No validation errors
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate form fields
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitting(true);

    try {
      if (selectedProductId) {
        // Update existing product
        const response = await fetch(`/api/products/${selectedProductId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
          // Success
          resetForm();
          fetchProducts();
          alert("Product updated successfully!");
        } else {
          setErrorMessage(data.error || "Failed to update product");
        }
      } else {
        // Create new product
        const response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
          // Success
          resetForm();
          fetchProducts();
          alert("Product saved successfully!");
        } else {
          setErrorMessage(data.error || "Failed to save product");
        }
      }
    } catch (error) {
      console.error("Error saving product:", error);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectProduct = async (productId: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (response.ok && data.product) {
        const product = data.product;
        setFormData({
          productName: product.productName || "",
          productSearchId: product.productSearchId || "",
          productExpDate: product.productExpDate || "",
          productStockCount: product.productStockCount || 0,
          productLowStockAlert: product.productLowStockAlert || 0,
          productPrice: product.productPrice || 0,
          isActive: product.isActive ?? true,
        });
        setSelectedProductId(productId);
        setErrorMessage("");
      } else {
        setErrorMessage(data.error || "Invalid product ID");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setErrorMessage("Failed to load product details");
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to permanently delete this product? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        // If deleted product was selected, reset form
        if (selectedProductId === productId) {
          resetForm();
        }
        fetchProducts();
        alert("Product deleted successfully!");
      } else {
        alert(data.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("An error occurred while deleting the product");
    }
  };

  const resetForm = () => {
    setFormData({
      productName: "",
      productSearchId: "",
      productExpDate: "",
      productStockCount: 0,
      productLowStockAlert: 0,
      productPrice: 0,
      isActive: true,
    });
    setSelectedProductId(null);
    setErrorMessage("");
  };

  // Filter products based on status
  const filteredProducts =
    statusFilter === "all"
      ? products
      : statusFilter === "active"
      ? products.filter((p) => p.isActive)
      : products.filter((p) => !p.isActive);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-1">Manage your product inventory</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {selectedProductId ? "View/Edit Product" : "Add New Product"}
            </h2>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label
                  htmlFor="productName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="productName"
                  name="productName"
                  type="text"
                  value={formData.productName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
                  placeholder="Enter product name"
                />
              </div>

              {/* Product Search ID (Barcode) */}
              <div>
                <label
                  htmlFor="productSearchId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Product Search ID (Barcode) <span className="text-red-500">*</span>
                </label>
                <input
                  id="productSearchId"
                  name="productSearchId"
                  type="text"
                  value={formData.productSearchId}
                  onChange={handleChange}
                  required
                  readOnly={selectedProductId !== null}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900 ${
                    selectedProductId !== null ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  placeholder="Enter barcode or search ID"
                />
                {selectedProductId !== null && (
                  <p className="mt-1 text-xs text-gray-500">(Not editable)</p>
                )}
              </div>

              {/* Product Expiry Date */}
              <div>
                <label
                  htmlFor="productExpDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Product Expiry Date
                </label>
                <input
                  id="productExpDate"
                  name="productExpDate"
                  type="date"
                  value={formData.productExpDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
                />
              </div>

              {/* Product Stock Count */}
              <div>
                <label
                  htmlFor="productStockCount"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Product Stock Count <span className="text-red-500">*</span>
                </label>
                <input
                  id="productStockCount"
                  name="productStockCount"
                  type="number"
                  min="0"
                  value={formData.productStockCount}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
                  placeholder="Enter stock count"
                />
              </div>

              {/* Product Low Stock Alert */}
              <div>
                <label
                  htmlFor="productLowStockAlert"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Product Low Stock Alert <span className="text-red-500">*</span>
                </label>
                <input
                  id="productLowStockAlert"
                  name="productLowStockAlert"
                  type="number"
                  min="0"
                  value={formData.productLowStockAlert}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
                  placeholder="Enter low stock threshold"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Alert will trigger when stock falls below this value
                </p>
              </div>

              {/* Product Price */}
              <div>
                <label
                  htmlFor="productPrice"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Product Price <span className="text-red-500">*</span>
                </label>
                <input
                  id="productPrice"
                  name="productPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.productPrice}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
                  placeholder="Enter product price"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-3">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700"
                >
                  Product is Active
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all ${
                    submitting
                      ? "bg-gray-900 text-white opacity-50 cursor-not-allowed"
                      : selectedProductId !== null
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {submitting
                    ? selectedProductId !== null
                      ? "Updating..."
                      : "Saving..."
                    : selectedProductId !== null
                    ? "Update Product"
                    : "Save Product"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Right Side - Table */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">All Products</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                    statusFilter === "all"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                    statusFilter === "active"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter("inactive")}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                    statusFilter === "inactive"
                      ? "bg-gray-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No products found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        ID
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Search ID
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Stock
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Price
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          selectedProductId === product.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {product.id}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {product.productName}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {product.productSearchId}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          <span
                            className={
                              product.productStockCount <=
                              product.productLowStockAlert
                                ? "text-red-600 font-semibold"
                                : "text-gray-900"
                            }
                          >
                            {product.productStockCount}
                          </span>
                          {product.productStockCount <=
                            product.productLowStockAlert && (
                            <span className="ml-1 text-xs text-red-500">
                              (Low)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {formatPrice(product.productPrice)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              product.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSelectProduct(product.id!)}
                              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                            >
                              Select
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id!)}
                              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

