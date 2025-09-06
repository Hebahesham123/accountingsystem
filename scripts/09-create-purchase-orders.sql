-- Create Purchase Orders table with enhanced fields for Shopify integration

-- Purchase Orders header table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    po_date DATE NOT NULL,
    supplier_id UUID REFERENCES users(id),
    po_type VARCHAR(50) NOT NULL CHECK (po_type IN ('Wholesale', 'Retail', 'Restock', 'Return')),
    shopify_id VARCHAR(100),
    total_amount DECIMAL(15,2) DEFAULT 0,
    total_quantity INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Received', 'Cancelled')),
    description TEXT,
    expected_delivery_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Order Items (detail)
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    line_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(po_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_type ON purchase_orders(po_type);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shopify ON purchase_orders(shopify_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);

-- Add trigger to update total_amount and total_quantity when items are modified
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

-- Create triggers for purchase order items
CREATE TRIGGER trigger_update_po_totals_insert
    AFTER INSERT ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_po_totals();

CREATE TRIGGER trigger_update_po_totals_update
    AFTER UPDATE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_po_totals();

CREATE TRIGGER trigger_update_po_totals_delete
    AFTER DELETE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_po_totals();
