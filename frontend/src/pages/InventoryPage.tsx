import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BatchInventoryItem {
  batch_id: number;
  medicine_id: number;
  medicine_name: string;
  generic_name: string | null;
  batch_number: string;
  expiry_date: string;
  available_quantity: number;
  purchase_price: number;
  selling_price: number;
  minimum_stock_level: number;
}

export const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, NORMAL, LOW_STOCK, NEAR_EXPIRY, EXPIRED, OUT_OF_STOCK
  
  const [movementBatchId, setMovementBatchId] = useState<number | null>(null);

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/');
      return response.data.data.items as BatchInventoryItem[];
    },
  });

  const { data: movementData, isLoading: isLoadingMovement } = useQuery({
    queryKey: ['inventory-movement', movementBatchId],
    queryFn: async () => {
      if (!movementBatchId) return null;
      const response = await apiClient.get(`/inventory/batch/${movementBatchId}/movement`);
      return response.data.data;
    },
    enabled: !!movementBatchId
  });

  // Helper functions for status
  const getStatus = (item: BatchInventoryItem) => {
    const today = new Date();
    const expiry = new Date(item.expiry_date);
    const diffTime = Math.abs(expiry.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (item.available_quantity <= 0) return 'OUT_OF_STOCK';
    if (expiry < today) return 'EXPIRED';
    if (diffDays <= 30) return 'NEAR_EXPIRY';
    if (item.available_quantity <= item.minimum_stock_level) return 'LOW_STOCK';
    return 'NORMAL';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK': return <Badge variant="destructive">Out of Stock</Badge>;
      case 'EXPIRED': return <Badge variant="destructive" className="bg-red-800">Expired</Badge>;
      case 'NEAR_EXPIRY': return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Near Expiry</Badge>;
      case 'LOW_STOCK': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
      default: return <Badge variant="outline" className="text-green-600 border-green-600">Normal</Badge>;
    }
  };

  const processedInventory = inventory?.map(item => ({
    ...item,
    status: getStatus(item)
  })) || [];

  // Summary stats
  const totalStock = processedInventory.reduce((acc, curr) => acc + curr.available_quantity, 0);
  const lowStockCount = processedInventory.filter(i => i.status === 'LOW_STOCK').length;
  const nearExpiryCount = processedInventory.filter(i => i.status === 'NEAR_EXPIRY').length;
  const expiredCount = processedInventory.filter(i => i.status === 'EXPIRED').length;
  const outOfStockCount = processedInventory.filter(i => i.status === 'OUT_OF_STOCK').length;

  // Filter
  let filteredList = processedInventory;
  if (filter !== 'ALL') {
    filteredList = filteredList.filter(i => i.status === filter);
  }

  // Search
  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    filteredList = filteredList.filter(i => 
      i.medicine_name.toLowerCase().includes(s) ||
      (i.generic_name && i.generic_name.toLowerCase().includes(s)) ||
      i.batch_number.toLowerCase().includes(s)
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="border rounded-xl p-4 bg-card">
          <div className="text-sm font-medium text-muted-foreground">Total Stock Units</div>
          <div className="text-2xl font-bold mt-1">{totalStock}</div>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <div className="text-sm font-medium text-muted-foreground">Low Stock</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">{lowStockCount}</div>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <div className="text-sm font-medium text-muted-foreground">Near Expiry</div>
          <div className="text-2xl font-bold mt-1 text-orange-600">{nearExpiryCount}</div>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <div className="text-sm font-medium text-muted-foreground">Expired</div>
          <div className="text-2xl font-bold mt-1 text-red-800">{expiredCount}</div>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <div className="text-sm font-medium text-muted-foreground">Out of Stock</div>
          <div className="text-2xl font-bold mt-1 text-red-600">{outOfStockCount}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'NORMAL', 'LOW_STOCK', 'NEAR_EXPIRY', 'EXPIRED', 'OUT_OF_STOCK'].map(f => (
            <Badge 
              key={f}
              variant={filter === f ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilter(f)}
            >
              {f.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center space-x-2 bg-background border rounded-md px-3 py-2 w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input 
            className="flex-1 bg-transparent border-none outline-none text-sm" 
            placeholder="Search medicine, generic, batch..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine</TableHead>
              <TableHead>Generic Name</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  No inventory found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((item) => (
                <TableRow key={item.batch_id}>
                  <TableCell className="font-medium">{item.medicine_name}</TableCell>
                  <TableCell>{item.generic_name || '-'}</TableCell>
                  <TableCell>{item.batch_number}</TableCell>
                  <TableCell>{item.expiry_date}</TableCell>
                  <TableCell className="text-right font-semibold">{item.available_quantity}</TableCell>
                  <TableCell className="text-right">₹{item.purchase_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{item.selling_price.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => setMovementBatchId(item.batch_id)}>
                      <Activity className="w-4 h-4 mr-2 text-primary" />
                      History
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Movement Modal */}
      <Dialog open={!!movementBatchId} onOpenChange={(open) => !open && setMovementBatchId(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Movement History</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isLoadingMovement ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : movementData && movementData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementData.map((m: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{m.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={m.type === 'PURCHASE' ? 'text-green-600 border-green-600' : 'text-blue-600 border-blue-600'}>
                          {m.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{m.reference}</TableCell>
                      <TableCell className={`text-right font-semibold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </TableCell>
                      <TableCell className="text-right font-bold">{m.balance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-10 text-center text-muted-foreground">No movement history found.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};
