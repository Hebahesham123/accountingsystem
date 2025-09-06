-- Fix Purchase Orders table schema - Add missing columns if they don't exist

-- Check if po_date column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' 
        AND column_name = 'po_date'
    ) THEN
        ALTER TABLE purchase_orders ADD COLUMN po_date DATE;
    END IF;
END $$;

-- Check if supplier_name column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' 
        AND column_name = 'supplier_name'
    ) THEN
        ALTER TABLE purchase_orders ADD COLUMN supplier_name VARCHAR(255);
    END IF;
END $$;

-- Check if po_type column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' 
        AND column_name = 'po_type'
    ) THEN
        ALTER TABLE purchase_orders ADD COLUMN po_type VARCHAR(100);
    END IF;
END $$;

-- Check if shopify_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' 
        AND column_name = 'shopify_id'
    ) THEN
        ALTER TABLE purchase_orders ADD COLUMN shopify_id VARCHAR(100);
    END IF;
END $$;

-- Check if total_amount column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE purchase_orders ADD COLUMN total_amount DECIMAL(15,2) DEFAULT 0;
    END IF;
END $$;

-- Check if total_quantity column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' 
        AND column_name = 'total_quantity'
    ) THEN
        ALTER TABLE purchase_orders ADD COLUMN total_quantity INTEGER DEFAULT 0;
    END IF;
END $$;

-- Check if status column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE purchase_orders ADD COLUMN status VARCHAR(50) DEFAULT 'Draft';
    END IF;
END $$;

-- Check if description column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE purchase_orders ADD COLUMN description TEXT;
    END IF;
END $$;

-- Check if expected_delivery_date column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' 
        AND column_name = 'expected_delivery_date'
    ) THEN
        ALTER TABLE purchase_orders ADD COLUMN expected_delivery_date DATE;
    END IF;
END $$;

-- Check if created_by column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE purchase_orders ADD COLUMN created_by UUID;
    END IF;
END $$;

-- Check if updated_at column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE purchase_orders ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
    -- Add status constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'purchase_orders_status_check'
    ) THEN
        ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_status_check 
        CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Received', 'Cancelled'));
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(po_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_type ON purchase_orders(po_type);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shopify ON purchase_orders(shopify_id);

-- Create purchase_order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    quantity INTEGER NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    line_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);

-- Add trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_po_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the purchase order totals
    UPDATE purchase_orders 
    SET 
        total_amount = (
            SELECT COALESCE(SUM(total_price), 0) 
            FROM purchase_order_items 
            WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
        ),
        total_quantity = (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM purchase_order_items 
            WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DROP TRIGGER IF EXISTS trigger_update_po_totals_insert ON purchase_order_items;
CREATE TRIGGER trigger_update_po_totals_insert
    AFTER INSERT ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_po_totals();

DROP TRIGGER IF EXISTS trigger_update_po_totals_update ON purchase_order_items;
CREATE TRIGGER trigger_update_po_totals_update
    AFTER UPDATE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_po_totals();

DROP TRIGGER IF EXISTS trigger_update_po_totals_delete ON purchase_order_items;
CREATE TRIGGER trigger_update_po_totals_delete
    AFTER DELETE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_po_totals();

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_orders' 
ORDER BY ordinal_position;
