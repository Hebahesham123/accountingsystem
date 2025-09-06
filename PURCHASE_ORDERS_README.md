# Enhanced Purchase Order System

The Purchase Order (PO) section has been enhanced to capture additional details for better tracking and integration with Shopify. This document outlines the new features and functionality.

## Enhanced Fields

### 1. Type
Defines the nature of the purchase order with the following options:
- **Wholesale**: Bulk purchases for resale or manufacturing
- **Retail**: Direct consumer purchases
- **Restock**: Replenishment of existing inventory
- **Return**: Return of defective or unwanted items

### 2. Shopify ID
A unique identifier that links the purchase order to its corresponding Shopify record for synchronization and reference. This field enables seamless integration between the accounting system and Shopify e-commerce platform.

### 3. Total Amount
The overall value of the purchase order, representing the total monetary cost of all included items. This is automatically calculated based on the sum of all item line totals.

### 4. Total Quantity
The sum of all item quantities within the purchase order, providing an overview of the total units purchased. This is automatically calculated based on the sum of all item quantities.

## Database Schema

### Purchase Orders Table
```sql
CREATE TABLE purchase_orders (
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
```

### Purchase Order Items Table
```sql
CREATE TABLE purchase_order_items (
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
```

## Features

### 1. Purchase Order List View
- **Search and Filter**: Filter by status, type, and search across PO numbers, descriptions, suppliers, and Shopify IDs
- **Enhanced Display**: Shows all new fields including Type, Shopify ID, Total Amount, and Total Quantity
- **Status Indicators**: Color-coded badges for different statuses and types
- **Quick Actions**: View and edit buttons for each purchase order

### 2. Create New Purchase Order
- **Type Selection**: Dropdown to select from Wholesale, Retail, Restock, or Return
- **Shopify Integration**: Optional field for Shopify ID linking
- **Dynamic Totals**: Real-time calculation of total amount and quantity as items are added
- **Item Management**: Add, remove, and edit individual line items
- **Validation**: Ensures all required fields are completed before submission

### 3. Purchase Order Detail View
- **Comprehensive Information**: Displays all enhanced fields prominently
- **Item Breakdown**: Detailed view of all items with quantities, prices, and totals
- **Supplier Information**: Complete supplier details including contact information
- **Timeline**: Track the history of the purchase order
- **Actions**: Edit, print, and export functionality

### 4. Edit Purchase Order
- **Full Edit Capability**: Modify all fields including type, Shopify ID, and status
- **Item Management**: Add, remove, or modify individual items
- **Real-time Updates**: Automatic recalculation of totals when items are modified
- **Validation**: Ensures data integrity during updates

## Status Workflow

1. **Draft**: Initial state when creating a new purchase order
2. **Submitted**: Purchase order has been submitted for approval
3. **Approved**: Purchase order has been approved and can proceed
4. **Received**: Items have been received and order is complete
5. **Cancelled**: Purchase order has been cancelled

## Type Categories

### Wholesale
- Used for bulk purchases intended for resale
- Typically involves larger quantities and better pricing
- May include manufacturing components or inventory for retail

### Retail
- Direct consumer purchases
- Usually smaller quantities
- May include promotional items or customer-specific orders

### Restock
- Replenishment of existing inventory
- Regular operational purchases
- May be automated based on inventory levels

### Return
- Return of defective or unwanted items
- May involve credit notes or refunds
- Important for inventory and financial tracking

## Shopify Integration

The Shopify ID field enables:
- **Synchronization**: Link accounting records with Shopify orders
- **Reporting**: Generate reports that span both systems
- **Audit Trail**: Track orders from e-commerce platform to accounting system
- **Automation**: Potential for automated data exchange between systems

## Automatic Calculations

### Total Amount
- Automatically calculated as sum of all item total prices
- Updates in real-time as items are added, modified, or removed
- Maintains accuracy through database triggers

### Total Quantity
- Automatically calculated as sum of all item quantities
- Updates in real-time as items are added, modified, or removed
- Provides quick overview of order volume

## Database Triggers

The system includes automatic triggers that:
- Update total_amount when purchase order items are modified
- Update total_quantity when purchase order items are modified
- Maintain data consistency across the system

## Sample Data

The system includes comprehensive sample data demonstrating:
- All four purchase order types
- Various statuses across the workflow
- Different Shopify ID formats
- Multiple items per purchase order
- Realistic pricing and quantities

## Navigation

Purchase Orders are accessible through:
- Main navigation menu with shopping cart icon
- Direct URL: `/purchase-orders`
- Mobile-responsive navigation

## File Structure

```
app/purchase-orders/
├── page.tsx                    # Main purchase orders list
├── new/
│   └── page.tsx               # Create new purchase order
└── [id]/
    ├── page.tsx               # Purchase order detail view
    └── edit/
        └── page.tsx           # Edit purchase order
```

## SQL Scripts

- `scripts/09-create-purchase-orders.sql`: Database schema creation
- `scripts/10-sample-purchase-orders.sql`: Sample data population

## Future Enhancements

Potential future improvements include:
- **API Integration**: Real-time Shopify API integration
- **Automated Workflows**: Status transitions based on business rules
- **Reporting**: Advanced analytics and reporting features
- **Notifications**: Email notifications for status changes
- **Approval Workflows**: Multi-level approval processes
- **Inventory Integration**: Automatic inventory updates upon receipt
