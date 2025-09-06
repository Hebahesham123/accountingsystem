'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PurchaseOrderItem {
  id: string;
  item_description: string;
  quantity: number;
  total_price: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  po_date: string;
  po_type: 'Wholesale' | 'Retail' | 'Restock' | 'Return';
  shopify_id?: string;
  total_amount: number;
  total_quantity: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Received' | 'Cancelled';
  description?: string;
  expected_delivery_date?: string;
  supplier_id: string;
}

export default function EditPurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState({
    po_number: '',
    po_date: '',
    po_type: '',
    shopify_id: '',
    description: '',
    supplier_name: '',
    status: 'Draft'
  });

  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // No need for suppliers list since we're using text input

  useEffect(() => {
    // Load from localStorage first
    const savedOrders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
    const savedOrder = savedOrders.find((order: any) => order.id === params.id);
    
    if (savedOrder) {
      setPurchaseOrder(savedOrder);
             setFormData({
         po_number: savedOrder.po_number,
         po_date: savedOrder.po_date,
         po_type: savedOrder.po_type,
         shopify_id: savedOrder.shopify_id || '',
         description: savedOrder.description || '',
         supplier_name: savedOrder.supplier_name || '',
         status: savedOrder.status
       });
      setItems(savedOrder.items || []);
      setLoading(false);
      return;
    }

    // Fallback to mock data if not found in localStorage
    const mockData: PurchaseOrder = {
      id: params.id as string,
      po_number: 'PO-2024-001',
      po_date: '2024-01-15',
      po_type: 'Wholesale',
      shopify_id: 'shopify_12345',
      total_amount: 2500.00,
      total_quantity: 100,
      status: 'Approved',
      description: 'Electronics components for Q1 inventory restock',
      expected_delivery_date: '2024-01-30',
      supplier_id: '1'
    };

         const mockItems: PurchaseOrderItem[] = [
       {
         id: '1',
         item_description: 'Arduino Uno R3 compatible boards',
         quantity: 50,
         total_price: 750.00
       },
       {
         id: '2',
         item_description: 'RGB LED strips, 5V, 60 LEDs/meter',
         quantity: 25,
         total_price: 300.00
       },
       {
         id: '3',
         item_description: 'Assorted sensors including temperature, humidity, and motion',
         quantity: 25,
         total_price: 1450.00
       }
     ];

    setPurchaseOrder(mockData);
         setFormData({
       po_number: mockData.po_number,
       po_date: mockData.po_date,
       po_type: mockData.po_type,
       shopify_id: mockData.shopify_id || '',
       description: mockData.description || '',
       supplier_name: 'Tech Supplies Inc.',
       status: mockData.status
     });
    setItems(mockItems);
    setLoading(false);
  }, [params.id]);

  const addItem = () => {
    const newItem: PurchaseOrderItem = {
      id: Date.now().toString(),
      item_description: '',
      quantity: 1,
      total_price: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof PurchaseOrderItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    return { totalAmount, totalQuantity };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.po_number || !formData.po_type || !formData.supplier_name || items.length === 0) {
        alert('Please fill in all required fields and add at least one item.');
        return;
      }

      // Validate items
      const invalidItems = items.filter(item => !item.item_description || item.quantity <= 0 || item.total_price <= 0);
      if (invalidItems.length > 0) {
        alert('Please fill in all item details correctly.');
        return;
      }

      const { totalAmount, totalQuantity } = calculateTotals();

      const updatedPurchaseOrder = {
        ...purchaseOrder,
        ...formData,
        total_amount: totalAmount,
        total_quantity: totalQuantity,
        items: items,
        updated_at: new Date().toISOString()
      };

      // Update in localStorage
      const existingOrders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
      const updatedOrders = existingOrders.map((order: any) => 
        order.id === params.id ? updatedPurchaseOrder : order
      );
      localStorage.setItem('purchaseOrders', JSON.stringify(updatedOrders));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to purchase order detail
      router.push(`/purchase-orders/${params.id}`);
    } catch (error) {
      console.error('Error updating purchase order:', error);
      alert('Error updating purchase order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const { totalAmount, totalQuantity } = calculateTotals();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Purchase Order Not Found</h1>
          <Link href="/purchase-orders">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Purchase Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/purchase-orders/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Purchase Order
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Purchase Order</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="po_number">PO Number *</Label>
                     <Input
                       id="po_number"
                       value={formData.po_number}
                       disabled
                       className="bg-gray-50"
                     />
                   </div>
                   <div>
                     <Label htmlFor="po_date">PO Date *</Label>
                     <Input
                       id="po_date"
                       type="date"
                       value={formData.po_date}
                       onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                       required
                     />
                   </div>
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="po_type">Type *</Label>
                    <Input
                      id="po_type"
                      value={formData.po_type}
                      onChange={(e) => setFormData({ ...formData, po_type: e.target.value })}
                      placeholder="e.g., Wholesale, Retail, Restock, Return"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier_name">Supplier *</Label>
                    <Input
                      id="supplier_name"
                      value={formData.supplier_name}
                      onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                      placeholder="Enter supplier name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="shopify_id">Shopify ID</Label>
                  <Input
                    id="shopify_id"
                    value={formData.shopify_id}
                    onChange={(e) => setFormData({ ...formData, shopify_id: e.target.value })}
                    placeholder="shopify_12345"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter purchase order description..."
                    rows={3}
                  />
                </div>

                

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Received">Received</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Items</CardTitle>
                  <Button type="button" onClick={addItem} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No items added yet.</p>
                    <Button type="button" onClick={addItem} variant="outline" className="mt-2">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Item {index + 1}</h4>
                          <Button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                             <Label>Description *</Label>
                             <Input
                               value={item.item_description}
                               onChange={(e) => updateItem(item.id, 'item_description', e.target.value)}
                               placeholder="Enter item description"
                               required
                             />
                           </div>
                           <div>
                             <Label>Quantity *</Label>
                             <Input
                               type="number"
                               min="1"
                               value={item.quantity}
                               onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                               required
                             />
                           </div>
                         </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label>Total Price *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.total_price}
                              onChange={(e) => updateItem(item.id, 'total_price', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                        
                        
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Items:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Quantity:</span>
                  <span className="font-medium">{totalQuantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="font-medium text-lg">${totalAmount.toFixed(2)}</span>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant="outline">{formData.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Link href={`/purchase-orders/${params.id}`}>
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
