-- Add 'due' column to invoice table
-- This column stores the amount the customer owes (grandTotal - paid, if grandTotal > paid)

ALTER TABLE invoice 
ADD COLUMN IF NOT EXISTS due DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- Update existing records to calculate due
-- Due = grandTotal - paid (only if grandTotal > paid, else 0)
UPDATE invoice 
SET due = GREATEST(0, grandtotal - paid);

-- Update balance for existing records
-- Balance = paid - grandTotal (only if paid > grandTotal, else 0)
UPDATE invoice 
SET balance = GREATEST(0, paid - grandtotal);

