'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Printer, Download } from 'lucide-react';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

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
  po_type: string;
  shopify_id?: string;
  total_amount: number;
  total_quantity: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Received' | 'Cancelled';
  description?: string;
  expected_delivery_date?: string;
  supplier_name?: string;
  supplier_email?: string;
  supplier_phone?: string;
  items: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage first
    const savedOrders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
    const savedOrder = savedOrders.find((order: any) => order.id === params.id);
    
    if (savedOrder) {
      setPurchaseOrder(savedOrder);
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
      description: 'Electronics components for Q1 inventory restock. This order includes various electronic components needed for our manufacturing process.',
      expected_delivery_date: '2024-01-30',
      supplier_name: 'Tech Supplies Inc.',
      supplier_email: 'orders@techsupplies.com',
      supplier_phone: '+1 (555) 123-4567',
             items: [
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
       ],
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-16T14:20:00Z'
    };

    setPurchaseOrder(mockData);
    setLoading(false);
  }, [params.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Submitted': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Received': return 'bg-purple-100 text-purple-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Wholesale': return 'bg-blue-100 text-blue-800';
      case 'Retail': return 'bg-green-100 text-green-800';
      case 'Restock': return 'bg-orange-100 text-orange-800';
      case 'Return': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <Link href="/purchase-orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Purchase Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{purchaseOrder.po_number}</h1>
            <p className="text-gray-600">Purchase Order Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/purchase-orders/${purchaseOrder.id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">PO Number</Label>
                    <p className="text-lg font-semibold">{purchaseOrder.po_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">PO Date</Label>
                    <p>{formatDate(purchaseOrder.po_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type</Label>
                    <Badge className={getTypeColor(purchaseOrder.po_type)}>
                      {purchaseOrder.po_type}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge className={getStatusColor(purchaseOrder.status)}>
                      {purchaseOrder.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(purchaseOrder.total_amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Quantity</Label>
                    <p className="text-lg font-semibold">{purchaseOrder.total_quantity.toLocaleString()} units</p>
                  </div>
                  {purchaseOrder.shopify_id && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Shopify ID</Label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">{purchaseOrder.shopify_id}</p>
                    </div>
                  )}
                  
                </div>
              </div>

              {purchaseOrder.description && (
                <div className="mt-6 pt-6 border-t">
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="mt-2 text-gray-700">{purchaseOrder.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Supplier Name</Label>
                  <p className="text-lg font-semibold">{purchaseOrder.supplier_name}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p>{purchaseOrder.supplier_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone</Label>
                    <p>{purchaseOrder.supplier_phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items ({purchaseOrder.items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchaseOrder.items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4">
                                         <div className="flex justify-between items-start mb-3">
                       <div>
                         <h4 className="font-semibold">{item.item_description}</h4>
                       </div>
                       <Badge variant="outline">Item {index + 1}</Badge>
                     </div>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                       <div>
                         <Label className="text-gray-600">Quantity</Label>
                         <p className="font-medium">{item.quantity.toLocaleString()}</p>
                       </div>
                       <div>
                         <Label className="text-gray-600">Total Price</Label>
                         <p className="font-medium text-green-600">{formatCurrency(item.total_price)}</p>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Items:</span>
                <span className="font-medium">{purchaseOrder.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Quantity:</span>
                <span className="font-medium">{purchaseOrder.total_quantity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="font-medium text-lg text-green-600">{formatCurrency(purchaseOrder.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Purchase Order Created</p>
                    <p className="text-sm text-gray-600">{formatDateTime(purchaseOrder.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p className="text-sm text-gray-600">{formatDateTime(purchaseOrder.updated_at)}</p>
                  </div>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
