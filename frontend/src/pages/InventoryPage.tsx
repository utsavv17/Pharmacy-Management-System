import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Activity, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/PageHeader';

interface BatchInventoryItem {
  batch_id: number;
  medicine_id: number;
  medicine_name: string;
  generic_name: string | null;
  batch_no: string;
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
      case 'OUT_OF_STOCK': return <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">Out of Stock</Badge>;
      case 'EXPIRED': return <Badge variant="outline" className="text-red-900 border-red-300 bg-red-100">Expired</Badge>;
      case 'NEAR_EXPIRY': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Near Expiry</Badge>;
      case 'LOW_STOCK': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Low Stock</Badge>;
      default: return <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">Normal</Badge>;
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
      (i.medicine_name?.toLowerCase() || '').includes(s) ||
      (i.generic_name && i.generic_name.toLowerCase().includes(s)) ||
      (i.batch_no?.toLowerCase() || '').includes(s)
    );
  }

  return (
    <div className="w-full space-y-6 pb-10">
      <PageHeader
        title="Inventory Manager"
        description="Track active stock batches and monitor expiring items"
        icon={Package}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Stock</div>
          <div className="text-3xl font-bold text-[#0B3B2C]">{totalStock}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Low Stock</div>
          <div className="text-3xl font-bold text-orange-500">{lowStockCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Near Expiry</div>
          <div className="text-3xl font-bold text-amber-500">{nearExpiryCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expired</div>
          <div className="text-3xl font-bold text-red-800">{expiredCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Out of Stock</div>
          <div className="text-3xl font-bold text-red-600">{outOfStockCount}</div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Filters & Search Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'NORMAL', 'LOW_STOCK', 'NEAR_EXPIRY', 'EXPIRED', 'OUT_OF_STOCK'].map(f => (
              <button 
                key={f}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${filter === f ? 'bg-[#E8F0EB] text-[#1A5F50] border-[#1A5F50]/30' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                onClick={() => setFilter(f)}
              >
                {f.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl w-full" 
              placeholder="Search medicine, generic, batch..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="font-semibold text-slate-600">Medicine</TableHead>
                <TableHead className="font-semibold text-slate-600">Generic Name</TableHead>
                <TableHead className="font-semibold text-slate-600">Batch</TableHead>
                <TableHead className="font-semibold text-slate-600">Expiry</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Qty</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Purchase</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Selling</TableHead>
                <TableHead className="font-semibold text-slate-600">Status</TableHead>
                <TableHead className="font-semibold text-slate-600 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                    No inventory found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((item) => (
                  <TableRow key={item.batch_id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-800">{item.medicine_name}</TableCell>
                    <TableCell className="text-slate-600">{item.generic_name || '-'}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">{item.batch_no}</TableCell>
                    <TableCell className="text-slate-600">{item.expiry_date}</TableCell>
                    <TableCell className="text-right font-bold text-slate-800">{item.available_quantity}</TableCell>
                    <TableCell className="text-right text-slate-600">₹{item.purchase_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium text-slate-800">₹{item.selling_price.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => setMovementBatchId(item.batch_id)} className="text-primary hover:bg-[#E8F0EB]">
                        <Activity className="w-4 h-4 mr-2" />
                        History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
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
                        <TableCell className="text-slate-600">{m.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={m.type === 'PURCHASE' ? 'text-green-700 border-green-200 bg-green-50' : 'text-blue-700 border-blue-200 bg-blue-50'}>
                            {m.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-500">{m.reference}</TableCell>
                        <TableCell className={`text-right font-semibold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {m.quantity > 0 ? '+' : ''}{m.quantity}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-800">{m.balance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500">No movement history found.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};
