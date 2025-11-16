"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getUserId } from "@/lib/utils/auth";

interface Product {
  id: number;
  productName: string;
  productSearchId: string;
  productPrice: number;
  productStockCount: number;
}

interface InvoiceItem {
  id: number;
  productId: number;
  productName: string;
  productSearchId: string;
  productPrice: number;
  qty: number;
  total: number;
}

export default function Invoice() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invoiceIdParam = searchParams.get("invoiceId");
  
  // Check authentication on mount
  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      router.push("/");
    }
  }, [router]);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [specialNote, setSpecialNote] = useState<string>("");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerContact, setCustomerContact] = useState<string>("");
  const [customerNIC, setCustomerNIC] = useState<string>("");
  const [paid, setPaid] = useState<number>(0);
  const [printAfterSave, setPrintAfterSave] = useState<boolean>(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState<number | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(
    invoiceIdParam ? parseInt(invoiceIdParam) : null
  );
  const [loadingInvoice, setLoadingInvoice] = useState<boolean>(false);

  // Fetch all products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const loadInvoiceData = async (invoiceId: number) => {
    try {
      setLoadingInvoice(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);
      const data = await response.json();

      if (response.ok && data.invoice) {
        const invoice = data.invoice;
        
        // Set customer details
        setCustomerName(invoice.customerName || "");
        setCustomerContact(invoice.customerContactNo || "");
        setCustomerNIC(invoice.customerNIC || "");
        setPaid(invoice.paid || 0);
        setDiscount(invoice.discount || 0);
        setSpecialNote(invoice.specialNote || "");
        setSavedInvoiceId(invoice.iid);
        
        // Set invoice items
        if (invoice.items && invoice.items.length > 0) {
          const items: InvoiceItem[] = invoice.items.map((item: any) => ({
            id: item.id || Date.now(),
            productId: item.productId,
            productName: item.productName,
            productSearchId: item.productSearchId,
            productPrice: item.productPrice,
            qty: item.qty,
            total: item.qty * item.productPrice,
          }));
          setInvoiceItems(items);
        }
      } else {
        alert(data.error || "Failed to load invoice");
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
      alert("An error occurred while loading invoice");
    } finally {
      setLoadingInvoice(false);
    }
  };

  // Load invoice data if invoiceId is provided
  useEffect(() => {
    if (editingInvoiceId) {
      loadInvoiceData(editingInvoiceId);
    }
  }, [editingInvoiceId]);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts([]);
      setShowDropdown(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = products.filter(
      (product) =>
        product.productName.toLowerCase().includes(query) ||
        product.productSearchId.toLowerCase().includes(query)
    );

    setFilteredProducts(filtered);
    setShowDropdown(filtered.length > 0);
  }, [searchQuery, products]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(product.productName);
    setShowDropdown(false);
    setQty(1);
  };

  const handleAddItem = () => {
    if (!selectedProduct || qty <= 0) {
      alert("Please select a product and enter a valid quantity");
      return;
    }

    // Check if product already exists in invoice
    const existingItemIndex = invoiceItems.findIndex(
      (item) => item.productId === selectedProduct.id
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...invoiceItems];
      updatedItems[existingItemIndex].qty += qty;
      updatedItems[existingItemIndex].total =
        updatedItems[existingItemIndex].productPrice *
        updatedItems[existingItemIndex].qty;
      setInvoiceItems(updatedItems);
    } else {
      // Add new item
      const newItem: InvoiceItem = {
        id: Date.now(), // Temporary ID
        productId: selectedProduct.id,
        productName: selectedProduct.productName,
        productSearchId: selectedProduct.productSearchId,
        productPrice: selectedProduct.productPrice,
        qty: qty,
        total: selectedProduct.productPrice * qty,
      };
      setInvoiceItems([...invoiceItems, newItem]);
    }

    // Reset
    setSelectedProduct(null);
    setSearchQuery("");
    setQty(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddItem();
    }
  };

  const handleRemoveItem = (itemId: number) => {
    setInvoiceItems(invoiceItems.filter((item) => item.id !== itemId));
  };

  const handleUpdateQty = (itemId: number) => {
    if (editQty <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    const updatedItems = invoiceItems.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          qty: editQty,
          total: item.productPrice * editQty,
        };
      }
      return item;
    });

    setInvoiceItems(updatedItems);
    setEditingItemId(null);
    setEditQty(1);
  };

  const handleStartEdit = (item: InvoiceItem) => {
    setEditingItemId(item.id);
    setEditQty(item.qty);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditQty(1);
  };

  // Calculate subtotal (sum of all items)
  const subtotal = invoiceItems.reduce((sum, item) => {
    const itemTotal = Number(item.total) || 0;
    return sum + itemTotal;
  }, 0);

  // Calculate grand total (subtotal - discount)
  const numDiscount = Number(discount) || 0;
  const grandTotal = Math.max(0, subtotal - numDiscount);

  // Calculate due: amount customer owes (grandTotal - paid, if grandTotal > paid, else 0)
  const numPaid = Number(paid) || 0;
  const due = Math.max(0, grandTotal - numPaid);
  
  // Calculate balance: change/overpayment (paid - grandTotal, if paid > grandTotal, else 0)
  const balance = Math.max(0, numPaid - grandTotal);
  
  // Check if customer paid in full or overpaid
  const isPaidInFull = numPaid >= grandTotal;
  const isOverpaid = numPaid > grandTotal;

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Handle print invoice
  const handlePrintInvoice = (invoiceId?: number | null) => {
    // Use provided invoice ID, saved invoice ID, or show "N/A" if not saved yet
    const invoiceIdToPrint = invoiceId !== undefined ? invoiceId : (savedInvoiceId || "N/A");
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the invoice");
      return;
    }

    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    const userName = localStorage.getItem("firstName") || "User";

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>NEPTUNE OPTICAL INVOICE - ${invoiceIdToPrint}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none; }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              color: #000;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .info-section {
              flex: 1;
            }
            .info-section h3 {
              margin-top: 0;
              font-size: 16px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .info-section p {
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            table th, table td {
              border: 1px solid #000;
              padding: 10px;
              text-align: left;
            }
            table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .totals {
              margin-top: 20px;
              margin-left: auto;
              width: 300px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #ccc;
            }
            .totals-row.grand-total {
              border-top: 2px solid #000;
              border-bottom: 2px solid #000;
              font-weight: bold;
              font-size: 18px;
              margin-top: 10px;
            }
            .totals-row.balance {
              font-weight: bold;
              font-size: 16px;
              margin-top: 10px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              border-top: 1px solid #ccc;
              padding-top: 20px;
            }
            .special-note {
              margin-top: 20px;
              padding: 10px;
              background-color: #f9f9f9;
              border: 1px solid #ccc;
            }
            .print-button {
              text-align: center;
              margin: 20px 0;
            }
            .print-button button {
              padding: 10px 20px;
              font-size: 16px;
              background-color: #000;
              color: white;
              border: none;
              cursor: pointer;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NEPTUNE OPTICAL</h1>
            <h2 style="margin: 10px 0; font-size: 24px;">INVOICE</h2>
            <p style="font-size: 18px; font-weight: bold; margin-top: 10px;">Invoice ID: #${invoiceIdToPrint}</p>
          </div>

          <div class="invoice-info">
            <div class="info-section">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${customerName || "N/A"}</p>
              <p><strong>Contact:</strong> ${customerContact || "N/A"}</p>
              <p><strong>NIC:</strong> ${customerNIC || "N/A"}</p>
            </div>
            <div class="info-section">
              <h3>Invoice Details</h3>
              <p><strong>Date:</strong> ${currentDate}</p>
              <p><strong>Time:</strong> ${currentTime}</p>
              <p><strong>Cashier By:</strong> ${userName}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Search ID</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceItems
                .map(
                  (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.productName}</td>
                  <td>${item.productSearchId}</td>
                  <td class="text-right">${formatPrice(item.productPrice)}</td>
                  <td class="text-right">${item.qty}</td>
                  <td class="text-right">${formatPrice(item.total)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>${formatPrice(subtotal)}</span>
            </div>
            ${discount > 0 ? `
            <div class="totals-row">
              <span>Discount:</span>
              <span style="color: #d32f2f;">-${formatPrice(discount)}</span>
            </div>
            ` : ""}
            <div class="totals-row grand-total">
              <span>Grand Total:</span>
              <span>${formatPrice(grandTotal)}</span>
            </div>
            ${paid > 0 ? `
            <div class="totals-row">
              <span>Paid:</span>
              <span>${formatPrice(paid)}</span>
            </div>
            ` : ""}
            ${due > 0 ? `
            <div class="totals-row">
              <span>Due:</span>
              <span style="color: #d32f2f;">${formatPrice(due)}</span>
            </div>
            ` : ""}
            ${balance > 0 ? `
            <div class="totals-row">
              <span>Balance (Change):</span>
              <span style="color: #1976d2;">${formatPrice(balance)}</span>
            </div>
            ` : ""}
            ${due === 0 && balance === 0 && numPaid >= grandTotal ? `
            <div class="totals-row balance">
              <span>Status:</span>
              <span style="color: #2e7d32;">Paid in Full</span>
            </div>
            ` : ""}
          </div>

          ${specialNote ? `
          <div class="special-note">
            <strong>Special Note:</strong>
            <p>${specialNote}</p>
          </div>
          ` : ""}

          <div class="footer">
            <p>Thank you!</p>
            <p>Generated on ${currentDate} at ${currentTime}</p>
          </div>

          <div class="print-button no-print">
            <button onclick="window.print()">Print Invoice</button>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice</h1>
            <p className="text-gray-600 mt-1">Create and manage invoices</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Product Search and Form */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            {/* Customer Information */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Customer Information
                {editingInvoiceId && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (Invoice #{editingInvoiceId})
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="customerName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
                    placeholder="Enter customer name (required)"
                  />
                </div>
                <div>
                  <label
                    htmlFor="customerContact"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contact Number
                  </label>
                  <input
                    id="customerContact"
                    type="tel"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
                    placeholder="Enter contact number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="customerNIC"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    NIC
                  </label>
                  <input
                    id="customerNIC"
                    type="text"
                    value={customerNIC}
                    onChange={(e) => setCustomerNIC(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
                    placeholder="Enter NIC (9 digits with V/X or 12 digits with V/X)"
                  />
                </div>
              </div>
            </div>

            {!editingInvoiceId && (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Add Products
                </h2>

                {/* Product Search */}
                <div className="mb-6 relative">
                  <label
                    htmlFor="productSearch"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Search Product (Name or Search ID)
                  </label>
                  <div className="relative">
                    <input
                      id="productSearch"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (filteredProducts.length > 0) setShowDropdown(true);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
                      placeholder="Type product name or search ID..."
                    />

                    {/* Dropdown */}
                    {showDropdown && filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductSelect(product)}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {product.productName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {product.productSearchId} | Price:{" "}
                              {formatPrice(product.productPrice)} | Stock:{" "}
                              {product.productStockCount}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Product and Qty */}
                {selectedProduct && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedProduct.productName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          ID: {selectedProduct.productSearchId} | Price:{" "}
                          {formatPrice(selectedProduct.productPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label
                          htmlFor="qty"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Quantity
                        </label>
                        <input
                          id="qty"
                          type="number"
                          min="1"
                          value={qty}
                          onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                          onKeyPress={handleKeyPress}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
                          placeholder="Enter quantity"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleAddItem}
                          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                        >
                          Add to Invoice
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Press Enter to add, or click "Add to Invoice"
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Invoice Items Table */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Invoice Items
              </h3>
              {invoiceItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                  No items added yet. Search and add products above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Product
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Search ID
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Price
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Qty
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Total
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {item.productName}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {item.productSearchId}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {formatPrice(item.productPrice)}
                          </td>
                          <td className="py-3 px-4">
                            {editingItemId === item.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={editQty}
                                  onChange={(e) =>
                                    setEditQty(parseInt(e.target.value) || 1)
                                  }
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900"
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      handleUpdateQty(item.id);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleUpdateQty(item.id)}
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-900">{item.qty}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                            {formatPrice(item.total)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {!editingInvoiceId && editingItemId !== item.id && (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(item)}
                                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                  >
                                    Update
                                  </button>
                                  <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                                  >
                                    Remove
                                  </button>
                                </>
                              )}
                              {editingInvoiceId && (
                                <span className="text-xs text-gray-500">Read-only</span>
                              )}
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

          {/* Right Side - Summary and Notes */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Invoice Summary
            </h2>

            {/* Customer Info Display */}
            {(customerName || customerContact || customerNIC) && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Customer Details:
                </h3>
                {customerName && (
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Name:</span> {customerName}
                  </p>
                )}
                {customerContact && (
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Contact:</span> {customerContact}
                  </p>
                )}
                {customerNIC && (
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">NIC:</span> {customerNIC}
                  </p>
                )}
              </div>
            )}

            {/* Totals */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Subtotal:</span>
                <span className="text-gray-900 font-semibold">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div>
                <label
                  htmlFor="discount"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Discount (Optional)
                </label>
                <input
                  id="discount"
                  type="number"
                  min="0"
                  max={subtotal}
                  step="0.01"
                  value={discount || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || value === null || value === undefined) {
                      setDiscount(0);
                    } else {
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        // Ensure discount doesn't exceed subtotal
                        if (numValue > subtotal) {
                          alert(`Discount cannot exceed subtotal (${formatPrice(subtotal)}). Setting discount to subtotal.`);
                          setDiscount(subtotal);
                        } else {
                          setDiscount(numValue);
                        }
                      } else {
                        setDiscount(0);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === "" || parseFloat(value) < 0) {
                      setDiscount(0);
                    } else {
                      const numValue = parseFloat(value);
                      if (numValue > subtotal) {
                        alert(`Discount cannot exceed subtotal (${formatPrice(subtotal)}). Setting discount to subtotal.`);
                        setDiscount(subtotal);
                      }
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
                  placeholder={`Enter discount amount (max: ${formatPrice(subtotal)})`}
                />
                {discount > subtotal && (
                  <p className="mt-1 text-sm text-red-600">
                    Discount cannot exceed subtotal
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center py-3 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-gray-900">
                  Grand Total:
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(grandTotal)}
                </span>
              </div>

              <div>
                <label
                  htmlFor="paid"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Paid Amount
                </label>
                <input
                  id="paid"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paid}
                  onChange={(e) =>
                    setPaid(parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
                  placeholder="Enter paid amount"
                />
              </div>

              {/* Due - Amount customer owes */}
              {due > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-base font-semibold text-red-600">
                    Due:
                  </span>
                  <span className="text-base font-semibold text-red-600">
                    {formatPrice(due)}
                  </span>
                </div>
              )}

              {/* Balance - Change/Overpayment */}
              {balance > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-base font-semibold text-blue-600">
                    Balance (Change):
                  </span>
                  <span className="text-base font-semibold text-blue-600">
                    {formatPrice(balance)}
                  </span>
                </div>
              )}

              {/* Paid in Full indicator */}
              {isPaidInFull && due === 0 && balance === 0 && (
                <div className="flex justify-between items-center py-3 border-t-2 border-green-300">
                  <span className="text-lg font-bold text-green-600">
                    Status:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    Paid in Full
                  </span>
                </div>
              )}
            </div>

            {/* Special Note */}
            <div className="mb-6">
              <label
                htmlFor="specialNote"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Special Note
              </label>
              <textarea
                id="specialNote"
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900 resize-none"
                placeholder="Add any special notes or instructions..."
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Print After Save Checkbox */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  id="printAfterSave"
                  type="checkbox"
                  checked={printAfterSave}
                  onChange={(e) => setPrintAfterSave(e.target.checked)}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <label
                  htmlFor="printAfterSave"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Print Invoice after saving
                </label>
              </div>

              <button
                onClick={async () => {
                  if (invoiceItems.length === 0) {
                    alert("Please add at least one item to the invoice");
                    return;
                  }

                  // Validate customer name
                  if (!customerName || customerName.trim() === "") {
                    alert("Customer Name is required. Please enter customer name before saving.");
                    return;
                  }

                  try {
                    // Get userId from localStorage
                    const userId = localStorage.getItem("userId");
                    if (!userId) {
                      alert("User not logged in. Please login again.");
                      return;
                    }

                    // Ensure all numeric values are properly converted
                    const numSubtotal = Number(subtotal) || 0;
                    const numGrandTotal = Number(grandTotal) || 0;
                    const numDiscount = Number(discount) || 0;
                    const numPaid = Number(paid) || 0;
                    
                    // Calculate due: amount customer owes (grandTotal - paid, if grandTotal > paid, else 0)
                    const numDue = Math.max(0, numGrandTotal - numPaid);
                    
                    // Calculate balance: change/overpayment (paid - grandTotal, if paid > grandTotal, else 0)
                    const numBalance = Math.max(0, numPaid - numGrandTotal);

                    // Prepare invoice data
                    const invoiceData = {
                      userId: parseInt(userId),
                      customerName: customerName || null,
                      customerContactNo: customerContact || null,
                      customerNIC: customerNIC || null,
                      total: numSubtotal,
                      grandTotal: numGrandTotal,
                      discount: numDiscount,
                      paid: numPaid,
                      due: numDue,
                      balance: numBalance,
                      specialNote: specialNote || null,
                      items: invoiceItems.map((item) => ({
                        productId: item.productId,
                        qty: item.qty,
                        productPrice: item.productPrice,
                      })),
                    };

                    let response;
                    
                    // If editing existing invoice, update payment
                    if (editingInvoiceId) {
                      response = await fetch(`/api/invoices/${editingInvoiceId}`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ paid: paid }),
                      });
                    } else {
                      // Create new invoice
                      response = await fetch("/api/invoices", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(invoiceData),
                      });
                    }

                    const data = await response.json();

                    if (response.ok) {
                      // If updating existing invoice payment
                      if (editingInvoiceId) {
                        const updatedInvoice = data.invoice;
                        alert(`Payment updated successfully! Balance: ${formatPrice(updatedInvoice.balance || 0)}`);
                        
                        // If print checkbox is enabled, print the invoice
                        if (printAfterSave) {
                          setTimeout(() => {
                            handlePrintInvoice(updatedInvoice.iid);
                          }, 500);
                        }
                        
                        // Clear form data after successful payment update
                        setInvoiceItems([]);
                        setDiscount(0);
                        setSpecialNote("");
                        setSearchQuery("");
                        setSelectedProduct(null);
                        setCustomerName("");
                        setCustomerContact("");
                        setCustomerNIC("");
                        setPaid(0);
                        setEditingInvoiceId(null);
                        setSavedInvoiceId(null);
                        setPrintAfterSave(false);
                        
                        // Navigate to clean invoice page (remove query parameter)
                        router.push("/invoice");
                      } else {
                        // New invoice
                        const invoiceId = data.invoice?.iid || data.invoice?.invoice?.iid || null;
                        setSavedInvoiceId(invoiceId);
                        
                        if (invoiceId) {
                          alert(`Invoice saved successfully! Invoice ID: #${invoiceId}`);
                        } else {
                          alert("Invoice saved successfully!");
                        }
                        
                        // If print checkbox is enabled, print the invoice with the new ID
                        if (printAfterSave) {
                          setTimeout(() => {
                            handlePrintInvoice(invoiceId);
                          }, 500);
                        }
                        
                        // Clear form data after successful save
                        setInvoiceItems([]);
                        setDiscount(0);
                        setSpecialNote("");
                        setSearchQuery("");
                        setSelectedProduct(null);
                        setCustomerName("");
                        setCustomerContact("");
                        setCustomerNIC("");
                        setPaid(0);
                        setSavedInvoiceId(null);
                        setPrintAfterSave(false);
                      }
                    } else {
                      // Check if error is about missing status column
                      if (data.details && data.details.includes("column \"status\"")) {
                        // Try to run migration
                        const migrateResponse = await fetch("/api/migrate/add-invoice-status", {
                          method: "POST",
                        });
                        const migrateData = await migrateResponse.json();
                        
                        if (migrateResponse.ok) {
                          // Retry saving invoice
                          const retryResponse = await fetch("/api/invoices", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify(invoiceData),
                          });
                          
                          const retryData = await retryResponse.json();
                          
                          if (retryResponse.ok) {
                            const invoiceId = retryData.invoice?.iid || retryData.invoice?.invoice?.iid || null;
                            setSavedInvoiceId(invoiceId);
                            
                            if (invoiceId) {
                              alert(`Invoice saved successfully! Invoice ID: #${invoiceId}`);
                            } else {
                              alert("Invoice saved successfully!");
                            }
                            
                            if (printAfterSave) {
                              setTimeout(() => {
                                handlePrintInvoice(invoiceId);
                              }, 500);
                            }
                            
                            // Clear form data after successful save
                            setInvoiceItems([]);
                            setDiscount(0);
                            setSpecialNote("");
                            setSearchQuery("");
                            setSelectedProduct(null);
                            setCustomerName("");
                            setCustomerContact("");
                            setCustomerNIC("");
                            setPaid(0);
                            setSavedInvoiceId(null);
                            setPrintAfterSave(false);
                          } else {
                            alert(retryData.error || "Failed to save invoice after migration");
                          }
                        } else {
                          alert("Database migration failed. Please contact administrator.");
                        }
                      } else {
                        alert(data.error || "Failed to save invoice");
                      }
                    }
                  } catch (error) {
                    console.error("Error saving invoice:", error);
                    alert("An error occurred while saving the invoice");
                  }
                }}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
              >
                Save Invoice
              </button>
              <button
                onClick={() => handlePrintInvoice()}
                disabled={invoiceItems.length === 0}
                className={`w-full px-4 py-3 rounded-lg transition-colors font-semibold ${
                  invoiceItems.length === 0
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Print Invoice
              </button>
              <button
                onClick={() => {
                  // Clear all form fields
                  setInvoiceItems([]);
                  setDiscount(0);
                  setSpecialNote("");
                  setSearchQuery("");
                  setSelectedProduct(null);
                  setCustomerName("");
                  setCustomerContact("");
                  setCustomerNIC("");
                  setPaid(0);
                  // Clear invoice IDs
                  setEditingInvoiceId(null);
                  setSavedInvoiceId(null);
                  // Navigate to clean invoice page (remove query parameter)
                  router.push("/invoice");
                }}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
              >
                Clear Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

