-- Sample data for Purchase Orders with enhanced fields

-- Insert sample suppliers (using existing users table)
INSERT INTO users (id, email, name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'techsupplies@example.com', 'Tech Supplies Inc.', 'user'),
('22222222-2222-2222-2222-222222222222', 'officedepot@example.com', 'Office Depot', 'user'),
('33333333-3333-3333-3333-333333333333', 'printsolutions@example.com', 'Print Solutions', 'user'),
('44444444-4444-4444-4444-444444444444', 'globalelectronics@example.com', 'Global Electronics', 'user')
ON CONFLICT (id) DO NOTHING;

-- Insert sample purchase orders
INSERT INTO purchase_orders (id, po_number, po_date, supplier_name, po_type, shopify_id, total_amount, total_quantity, status, description, expected_delivery_date, created_by) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'PO-2024-001',
    '2024-01-15',
    'Tech Supplies Inc.',
    'Wholesale',
    'shopify_12345',
    2500.00,
    100,
    'Approved',
    'Electronics components for Q1 inventory restock. This order includes various electronic components needed for our manufacturing process.',
    '2024-01-30',
    '11111111-1111-1111-1111-111111111111'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'PO-2024-002',
    '2024-01-20',
    'Office Depot',
    'Restock',
    'shopify_67890',
    1500.00,
    50,
    'Submitted',
    'Office supplies restock for the new quarter. Includes paper, pens, and other essential office materials.',
    '2024-02-05',
    '11111111-1111-1111-1111-111111111111'
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'PO-2024-003',
    '2024-01-25',
    'Print Solutions',
    'Retail',
    'shopify_11111',
    800.00,
    25,
    'Draft',
    'Marketing materials for upcoming campaign. Includes brochures, business cards, and promotional items.',
    NULL,
    '11111111-1111-1111-1111-111111111111'
),
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'PO-2024-004',
    '2024-02-01',
    'Global Electronics',
    'Return',
    'shopify_22222',
    1200.00,
    30,
    'Cancelled',
    'Return of defective electronic components. Items were found to be non-functional upon testing.',
    NULL,
    '11111111-1111-1111-1111-111111111111'
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'PO-2024-005',
    '2024-02-10',
    'Tech Supplies Inc.',
    'Wholesale',
    'shopify_33333',
    3200.00,
    150,
    'Received',
    'Bulk order of microcontrollers and sensors for production line. High priority order for manufacturing.',
    '2024-02-25',
    '11111111-1111-1111-1111-111111111111'
);

-- Insert purchase order items for PO-2024-001
INSERT INTO purchase_order_items (id, purchase_order_id, item_name, item_description, quantity, total_price, line_number) VALUES
(
    'item-001-001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Microcontroller Boards',
    'Arduino Uno R3 compatible boards',
    50,
    750.00,
    1
),
(
    'item-001-002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'LED Strips',
    'RGB LED strips, 5V, 60 LEDs/meter',
    25,
    300.00,
    2
),
(
    'item-001-003',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Sensors Kit',
    'Assorted sensors including temperature, humidity, and motion',
    25,
    1450.00,
    3
);

-- Insert purchase order items for PO-2024-002
INSERT INTO purchase_order_items (id, purchase_order_id, item_name, item_description, quantity, total_price, line_number) VALUES
(
    'item-002-001',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Copy Paper',
    'A4 white copy paper, 80gsm, 500 sheets per ream',
    20,
    170.00,
    1
),
(
    'item-002-002',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Ballpoint Pens',
    'Blue ballpoint pens, pack of 12',
    15,
    75.00,
    2
),
(
    'item-002-003',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Stapler',
    'Heavy-duty stapler with 20-sheet capacity',
    10,
    255.00,
    3
),
(
    'item-002-004',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'File Folders',
    'Manila file folders, letter size, pack of 100',
    5,
    100.00,
    4
);

-- Insert purchase order items for PO-2024-003
INSERT INTO purchase_order_items (id, purchase_order_id, item_name, item_description, quantity, total_price, line_number) VALUES
(
    'item-003-001',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Business Cards',
    'Premium business cards, 350gsm, full color',
    10,
    450.00,
    1
),
(
    'item-003-002',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Brochures',
    'Tri-fold brochures, A4 size, full color printing',
    15,
    350.00,
    2
);

-- Insert purchase order items for PO-2024-004
INSERT INTO purchase_order_items (id, purchase_order_id, item_name, item_description, quantity, total_price, line_number) VALUES
(
    'item-004-001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Defective Sensors',
    'Temperature sensors - returned due to calibration issues',
    20,
    700.00,
    1
),
(
    'item-004-002',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Faulty Controllers',
    'Motor controllers - returned due to manufacturing defects',
    10,
    500.00,
    2
);

-- Insert purchase order items for PO-2024-005
INSERT INTO purchase_order_items (id, purchase_order_id, item_name, item_description, quantity, total_price, line_number) VALUES
(
    'item-005-001',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Raspberry Pi Boards',
    'Raspberry Pi 4 Model B, 4GB RAM',
    50,
    2250.00,
    1
),
(
    'item-005-002',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Power Supplies',
    '5V 3A power supplies for Raspberry Pi',
    50,
    400.00,
    2
),
(
    'item-005-003',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'SD Cards',
    '32GB Class 10 microSD cards',
    50,
    350.00,
    3
),
(
    'item-005-004',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Cooling Fans',
    '40mm cooling fans for Raspberry Pi',
    50,
    200.00,
    4
);

-- Verify the data
SELECT 
    po.po_number,
    po.po_type,
    po.shopify_id,
    po.total_amount,
    po.total_quantity,
    po.status,
    po.supplier_name,
    COUNT(poi.id) as item_count
FROM purchase_orders po
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
GROUP BY po.id, po.po_number, po.po_type, po.shopify_id, po.total_amount, po.total_quantity, po.status, po.supplier_name
ORDER BY po.po_date;
