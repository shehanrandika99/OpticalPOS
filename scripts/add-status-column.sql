-- Add status column to invoice table if it doesn't exist
-- Run this if your invoice table was created before the status column was added

-- Check if column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoice' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE invoice 
        ADD COLUMN status VARCHAR(20) DEFAULT 'Pending';
        
        -- Update existing invoices to have 'Pending' status
        UPDATE invoice 
        SET status = 'Pending' 
        WHERE status IS NULL;
        
        RAISE NOTICE 'Status column added successfully';
    ELSE
        RAISE NOTICE 'Status column already exists';
    END IF;
END $$;

