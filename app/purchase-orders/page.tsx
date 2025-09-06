'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PurchaseOrderReview from '@/components/purchase-order-review';

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
    supplier_name?: string;
  }

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    // Load data from localStorage
    const savedOrders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
    
    // Combine with mock data for demo purposes
    const mockData: PurchaseOrder[] = [
             {
         id: '1',
         po_number: 'PO-2024-001',
         po_date: '2024-01-15',
         po_type: 'Wholesale',
         shopify_id: 'shopify_12345',
         total_amount: 2500.00,
         total_quantity: 100,
         status: 'Approved',
         description: 'Electronics components for Q1 inventory',
         supplier_name: 'Tech Supplies Inc.'
       },
       {
         id: '2',
         po_number: 'PO-2024-002',
         po_date: '2024-01-20',
         po_type: 'Restock',
         shopify_id: 'shopify_67890',
         total_amount: 1500.00,
         total_quantity: 50,
         status: 'Submitted',
         description: 'Office supplies restock',
         supplier_name: 'Office Depot'
       },
      {
        id: '3',
        po_number: 'PO-2024-003',
        po_date: '2024-01-25',
        po_type: 'Retail',
        shopify_id: 'shopify_11111',
        total_amount: 800.00,
        total_quantity: 25,
        status: 'Draft',
        description: 'Marketing materials',
        supplier_name: 'Print Solutions'
      }
    ];

    // Combine saved orders with mock data, avoiding duplicates
    const allOrders = [...savedOrders, ...mockData];
    const uniqueOrders = allOrders.filter((order, index, self) => 
      index === self.findIndex(o => o.id === order.id)
    );

    setPurchaseOrders(uniqueOrders);
    setFilteredOrders(uniqueOrders);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = purchaseOrders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shopify_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(order => order.po_type === typeFilter);
    }

    setFilteredOrders(filtered);
  }, [purchaseOrders, searchTerm, statusFilter, typeFilter]);

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
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <Link href="/purchase-orders/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Purchase Order
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search POs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Wholesale">Wholesale</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Restock">Restock</SelectItem>
                <SelectItem value="Return">Return</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-500 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              {filteredOrders.length} of {purchaseOrders.length} orders
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{order.po_number}</h3>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <Badge className={getTypeColor(order.po_type)}>
                      {order.po_type}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Date:</span> {formatDate(order.po_date)}
                    </div>
                    <div>
                      <span className="font-medium">Supplier:</span> {order.supplier_name}
                    </div>
                    <div>
                      <span className="font-medium">Total Amount:</span> {formatCurrency(order.total_amount)}
                    </div>
                    <div>
                      <span className="font-medium">Total Quantity:</span> {order.total_quantity.toLocaleString()}
                    </div>
                  </div>

                  {order.shopify_id && (
                    <div className="mt-2 text-sm text-gray-500">
                      <span className="font-medium">Shopify ID:</span> {order.shopify_id}
                    </div>
                  )}

                  {order.description && (
                    <p className="mt-2 text-sm text-gray-600">{order.description}</p>
                  )}

                  
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setIsReviewModalOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Review
                  </Button>
                  <Link href={`/purchase-orders/${order.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 mb-4">No purchase orders found</p>
              <Link href="/purchase-orders/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Purchase Order
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Purchase Order Review</DialogTitle>
          </DialogHeader>
          {selectedOrderId && (
            <PurchaseOrderReview 
              purchaseOrderId={selectedOrderId} 
              onClose={() => {
                setIsReviewModalOpen(false);
                setSelectedOrderId(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
