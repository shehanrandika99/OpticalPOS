"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Invoice } from "@/lib/types/database";
import { getUserId } from "@/lib/utils/auth";

export default function ViewInvoice() {
  const router = useRouter();
  
  // Check authentication on mount
  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      router.push("/");
    }
  }, [router]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch invoices on component mount and when filters change
  useEffect(() => {
    fetchInvoices();
  }, [startDate, endDate, searchQuery, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/invoices?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setInvoices(data.invoices || []);
      } else {
        console.error("Error fetching invoices:", data.error);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (invoiceId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setInvoices(
          invoices.map((inv) =>
            inv.iid === invoiceId ? { ...inv, status: newStatus as any } : inv
          )
        );
        alert(`Invoice status updated to ${newStatus}`);
      } else {
        alert(data.error || "Failed to update invoice status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("An error occurred while updating invoice status");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "Ready to Deliver":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleLoadForPayment = (invoice: Invoice) => {
    // Navigate to invoice page with invoice ID
    router.push(`/invoice?invoiceId=${invoice.iid}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">View Invoices</h1>
            <p className="text-gray-600 mt-1">Manage and track all invoices</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range - Start Date */}
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
              />
            </div>

            {/* Date Range - End Date */}
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
              />
            </div>

            {/* Search */}
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Search (Name, NIC, Contact)
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
                placeholder="Search customer..."
              />
            </div>

            {/* Status Filter */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900"
              >
                <option value="all">All</option>
                <option value="Pending">Pending</option>
                <option value="Ready to Deliver">Ready to Deliver</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Invoices ({invoices.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No invoices found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Invoice ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Customer Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Contact
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Grand Total
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Paid
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Balance
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
                  {invoices.map((invoice) => {
                    const hasDue = invoice.balance > 0;
                    const isReadyToDeliver = invoice.status === "Ready to Deliver";
                    const showDuePayment = isReadyToDeliver && hasDue;
                    
                    return (
                      <tr
                        key={invoice.iid}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                          #{invoice.iid}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {formatDate(invoice.date)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {invoice.customerName || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {invoice.customerContactNo || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                          {formatPrice(invoice.grandTotal)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {formatPrice(invoice.paid)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className={`text-sm font-semibold ${
                              hasDue ? "text-red-600" : "text-green-600"
                            }`}>
                              {formatPrice(invoice.balance)}
                            </span>
                            {showDuePayment && (
                              <span className="text-xs text-red-600 font-medium mt-1">
                                Due: {formatPrice(invoice.balance)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                              invoice.status
                            )}`}
                          >
                            {invoice.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-2">
                            <select
                              value={invoice.status || "Pending"}
                              onChange={(e) =>
                                handleStatusChange(invoice.iid!, e.target.value)
                              }
                              className="px-3 py-1 text-xs font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900 bg-white"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Ready to Deliver">Ready to Deliver</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                            {showDuePayment && (
                              <button
                                onClick={() => handleLoadForPayment(invoice)}
                                className="px-3 py-1 text-xs font-medium text-white bg-orange-600 border border-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                              >
                                Pay Due
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

