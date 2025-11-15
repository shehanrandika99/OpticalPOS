-- Users table schema
-- Run this SQL script to create the users table in your database

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nic VARCHAR(20) NOT NULL UNIQUE,
  contact_no VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  finance_previlage BOOLEAN DEFAULT false,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create index on nic for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_nic ON users(nic);

-- Products table schema
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  product_search_id VARCHAR(100) NOT NULL UNIQUE,
  product_exp_date DATE,
  product_stock_count INTEGER NOT NULL DEFAULT 0,
  product_low_stock_alert INTEGER NOT NULL DEFAULT 0,
  product_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on product_search_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_search_id ON products(product_search_id);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Invoice table schema
CREATE TABLE IF NOT EXISTS invoice (
  iid SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  userid INTEGER NOT NULL,
  customer_name VARCHAR(255),
  customer_contactno VARCHAR(20),
  customer_nic VARCHAR(20),
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  grandtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  special_note TEXT,
  status VARCHAR(20) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice products table schema
CREATE TABLE IF NOT EXISTS inv_has_product (
  id SERIAL PRIMARY KEY,
  inv_iid INTEGER NOT NULL REFERENCES invoice(iid) ON DELETE CASCADE,
  pid INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL DEFAULT 1,
  unitprice DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for invoice table
CREATE INDEX IF NOT EXISTS idx_invoice_userid ON invoice(userid);
CREATE INDEX IF NOT EXISTS idx_invoice_date ON invoice(date);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoice(status);
CREATE INDEX IF NOT EXISTS idx_invoice_customer_name ON invoice(customer_name);

-- Create indexes for inv_has_product table
CREATE INDEX IF NOT EXISTS idx_inv_has_product_inv_iid ON inv_has_product(inv_iid);
CREATE INDEX IF NOT EXISTS idx_inv_has_product_pid ON inv_has_product(pid);

