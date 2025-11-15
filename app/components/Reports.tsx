"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DailyBreakdown {
  date: string;
  invoiceCount: number;
  dailyIncome: number;
  dailyPaid: number;
  dailyBalance: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  total: number;
}

interface IncomeReport {
  startDate: string;
  endDate: string;
  totalInvoices: number;
  totalIncome: number;
  totalPaid: number;
  totalBalance: number;
  totalDiscount: number;
  dailyBreakdown: DailyBreakdown[];
  statusBreakdown: StatusBreakdown[];
}

export default function Reports() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [report, setReport] = useState<IncomeReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Set default date range (current month)
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
  }, []);

  // Fetch report when dates change
  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [startDate, endDate]);

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/reports/income?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();

      if (response.ok) {
        setReport(data.report);
      } else {
        setError(data.error || "Failed to fetch report");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      setError("An error occurred while fetching the report");
    } finally {
      setLoading(false);
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
      return date.toLocaleDateString("en-LK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Income Reports</h1>
            <p className="text-gray-600 mt-1">View income and revenue statistics</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Date Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="flex items-end">
              <button
                onClick={fetchReport}
                disabled={loading || !startDate || !endDate}
                className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                  loading || !startDate || !endDate
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                {loading ? "Loading..." : "Generate Report"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-100 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading report...</p>
          </div>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Income Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-green-100 mb-1">
                  Total Income
                </h3>
                <p className="text-3xl font-bold">{formatPrice(report.totalIncome)}</p>
                <p className="text-xs text-green-100 mt-2">
                  {report.totalInvoices} invoices
                </p>
              </div>

              {/* Total Paid Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-blue-100 mb-1">
                  Total Paid
                </h3>
                <p className="text-3xl font-bold">{formatPrice(report.totalPaid)}</p>
                <p className="text-xs text-blue-100 mt-2">
                  {((report.totalPaid / report.totalIncome) * 100 || 0).toFixed(1)}% of income
                </p>
              </div>

              {/* Total Balance Card */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-orange-100 mb-1">
                  Total Balance
                </h3>
                <p className="text-3xl font-bold">{formatPrice(report.totalBalance)}</p>
                <p className="text-xs text-orange-100 mt-2">
                  Outstanding amount
                </p>
              </div>

              {/* Total Discount Card */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-purple-100 mb-1">
                  Total Discount
                </h3>
                <p className="text-3xl font-bold">{formatPrice(report.totalDiscount)}</p>
                <p className="text-xs text-purple-100 mt-2">
                  Discounts given
                </p>
              </div>
            </div>

            {/* Daily Breakdown */}
            {report.dailyBreakdown.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Daily Breakdown
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Invoices
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Daily Income
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Paid
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.dailyBreakdown.map((day, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {formatDate(day.date)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {day.invoiceCount}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">
                            {formatPrice(day.dailyIncome)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 text-right">
                            {formatPrice(day.dailyPaid)}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">
                            {formatPrice(day.dailyBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Status Breakdown */}
            {report.statusBreakdown.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Status Breakdown
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.statusBreakdown.map((status, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          {status.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {status.count} invoices
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(status.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.totalInvoices === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-100 text-center">
                <p className="text-gray-500 text-lg">
                  No invoices found for the selected date range
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-100 text-center">
            <p className="text-gray-500 text-lg">
              Select a date range and click "Generate Report" to view income statistics
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

