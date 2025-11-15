/**
 * Database-related TypeScript types and interfaces
 */

export interface DatabaseConnectionResult {
  success: boolean;
  message: string;
  timestamp?: Date | string;
  error?: string;
  errorCode?: string;
}

export interface DatabaseConfig {
  connectionString: string;
  max?: number;
  min?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export interface User {
  id?: number;
  nic: string;
  contactNo: string;
  firstName: string;
  lastName: string;
  branch: string;
  isActive: boolean;
  financePrevilage: boolean;
  username: string;
  password?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Product {
  id?: number;
  productName: string;
  productSearchId: string; // Barcode
  productExpDate: string; // Date string
  productStockCount: number;
  productLowStockAlert: number; // Threshold for low stock alert
  productPrice: number;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Invoice {
  iid?: number;
  date: string; // Date string
  time: string; // Time string
  userId: number;
  customerName?: string;
  customerContactNo?: string;
  customerNIC?: string;
  total: number;
  grandTotal: number;
  discount: number;
  paid: number;
  balance: number;
  specialNote?: string;
  status?: "Pending" | "Ready to Deliver" | "Delivered";
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface InvoiceProduct {
  id?: number;
  invIid: number;
  pid: number; // Product ID
  qty: number;
  unitPrice: number;
  date: string; // Date string
  time: string; // Time string
  createdAt?: Date | string;
}

