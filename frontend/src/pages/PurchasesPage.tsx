import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Purchase, PurchaseItem, Supplier, Medicine } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Search, Trash2, Eye, ArrowLeft, Download, ShoppingBag } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

export const PurchasesPage = () => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: purchases, isLoading: isLoadingPurchases } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const response = await apiClient.get('/purchases/');
      return response.data.data.items as Purchase[];
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await apiClient.get('/suppliers/');
      return response.data.data.items as Supplier[];
    },
  });

  const { data: medicines } = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      const response = await apiClient.get('/medicines/');
      return response.data.data.items as Medicine[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newPurchase: any) => {
      const response = await apiClient.post('/purchases/create', newPurchase);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      setView('list');
      toast({ title: 'Success', description: 'Purchase and stock recorded successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to record purchase', variant: 'destructive' });
    }
  });

  // Create Form State
  const [supplierId, setSupplierId] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<Partial<PurchaseItem>[]>([]);

  const filteredPurchases = purchases?.filter(p => 
    (p.invoice_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (p.supplier_name && p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddItem = () => {
    setItems([...items, {
      medicine_id: 0,
      batch_no: '',
      expiry_date: '',
      purchase_price: 0,
      selling_price: 0,
      quantity: 1
    }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + ((item.purchase_price || 0) * (item.quantity || 0)), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplierId) {
      toast({ title: 'Validation Error', description: 'Please select a supplier', variant: 'destructive' });
      return;
    }
    const selectedSupplier = suppliers?.find(s => s.id === parseInt(supplierId));
    
    if (items.length === 0) {
      toast({ title: 'Validation Error', description: 'Please add at least one item', variant: 'destructive' });
      return;
    }

    const invalidItems = items.filter(i => !i.medicine_id || !i.batch_no || !i.expiry_date || !i.quantity || (i.quantity <= 0) || (i.purchase_price === undefined || i.purchase_price < 0));
    if (invalidItems.length > 0) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields for items with valid amounts', variant: 'destructive' });
      return;
    }

    createMutation.mutate({
      supplier_id: parseInt(supplierId),
      supplier_name: selectedSupplier?.name || '',
      purchase_date: purchaseDate,
      items: items
    });
  };

  if (view === 'create') {
    return (
      <div className="w-full space-y-6 pb-10">
        <PageHeader
          title="New Purchase"
          description="Record incoming stock and supplier invoices"
          icon={Download}
          actions={
            <Button variant="outline" className="bg-white rounded-xl text-slate-700 font-semibold border-slate-200" onClick={() => setView('list')} disabled={createMutation.isPending}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
            </Button>
          }
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="space-y-2">
              <Label className="text-slate-600 font-semibold">Supplier *</Label>
              <select 
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                required
              >
                <option value="">Select a supplier...</option>
                {suppliers?.map(s => (
                  <option key={s.id} value={s.id}>{s.name} {s.company_name ? `(${s.company_name})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 font-semibold">Purchase Date *</Label>
              <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required className="h-11 rounded-xl bg-slate-50 border-slate-200" />
            </div>
          </div>

          <div className="bg-white p-0 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-lg font-bold text-[#0B3B2C]">Purchase Items</h2>
              <Button type="button" onClick={handleAddItem} variant="outline" className="rounded-xl border-slate-200 font-semibold text-slate-700">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="min-w-[200px] font-semibold text-slate-600">Medicine *</TableHead>
                    <TableHead className="font-semibold text-slate-600">Batch *</TableHead>
                    <TableHead className="font-semibold text-slate-600">Expiry *</TableHead>
                    <TableHead className="w-24 font-semibold text-slate-600">Qty *</TableHead>
                    <TableHead className="w-32 font-semibold text-slate-600">Cost (₹) *</TableHead>
                    <TableHead className="w-32 font-semibold text-slate-600">Selling (₹)</TableHead>
                    <TableHead className="w-32 font-semibold text-slate-600 text-right">Total (₹)</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                        No items added yet. Click "Add Item" to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={index} className="hover:bg-slate-50/50">
                        <TableCell>
                          <select 
                            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={item.medicine_id || ''}
                            onChange={e => handleItemChange(index, 'medicine_id', parseInt(e.target.value))}
                            required
                          >
                            <option value="">Select medicine...</option>
                            {medicines?.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell><Input required value={item.batch_no || ''} onChange={e => handleItemChange(index, 'batch_no', e.target.value)} className="rounded-lg bg-white border-slate-200 h-10" /></TableCell>
                        <TableCell><Input type="date" required value={item.expiry_date || ''} onChange={e => handleItemChange(index, 'expiry_date', e.target.value)} className="rounded-lg bg-white border-slate-200 h-10" /></TableCell>
                        <TableCell><Input type="number" min="1" required value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} className="rounded-lg bg-white border-slate-200 h-10" /></TableCell>
                        <TableCell><Input type="number" min="0" step="0.01" required value={item.purchase_price || ''} onChange={e => handleItemChange(index, 'purchase_price', parseFloat(e.target.value))} className="rounded-lg bg-white border-slate-200 h-10" /></TableCell>
                        <TableCell><Input type="number" min="0" step="0.01" value={item.selling_price || ''} onChange={e => handleItemChange(index, 'selling_price', parseFloat(e.target.value))} className="rounded-lg bg-white border-slate-200 h-10" /></TableCell>
                        <TableCell className="text-right align-middle font-bold text-slate-800">
                          ₹{((item.purchase_price || 0) * (item.quantity || 0)).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-slate-400 hover:text-red-500 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <div className="w-full max-w-sm space-y-4">
                <div className="flex justify-between font-bold text-lg text-slate-800 pb-2 border-b border-dashed border-slate-300">
                  <span>Grand Total</span>
                  <span className="text-[#0B3B2C]">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl bg-[#0B3B2C] hover:bg-[#07261d] text-white text-base font-bold shadow-sm" disabled={createMutation.isPending || items.length === 0}>
                  {createMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                  Submit Purchase & Stock
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-10">
      <PageHeader
        title="Purchases"
        description="View past stock purchases and supplier invoices"
        icon={ShoppingBag}
        actions={
          <Button className="bg-[#1A5F50] hover:bg-[#144d40] text-white rounded-xl font-semibold shadow-sm" onClick={() => {
            setSupplierId('');
            setPurchaseDate(new Date().toISOString().split('T')[0]);
            setItems([]);
            setView('create');
          }}>
            <Plus className="w-4 h-4 mr-2" /> New Purchase
          </Button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl w-full" 
              placeholder="Search by invoice or supplier..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="font-semibold text-slate-600">Reference Number</TableHead>
                <TableHead className="font-semibold text-slate-600">Supplier</TableHead>
                <TableHead className="font-semibold text-slate-600">Date</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Total Amount</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPurchases ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredPurchases?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    No purchases found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases?.map((purchase) => (
                  <TableRow key={purchase.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-mono text-sm font-semibold text-slate-700">{purchase.invoice_number}</TableCell>
                    <TableCell className="font-medium text-slate-800">{purchase.supplier_name}</TableCell>
                    <TableCell className="text-slate-600">{purchase.purchase_date}</TableCell>
                    <TableCell className="text-right font-bold text-[#0B3B2C]">₹{purchase.total_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setViewingPurchase(purchase)} className="text-slate-400 hover:text-primary hover:bg-[#E8F0EB]">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={!!viewingPurchase} onOpenChange={(open) => { if (!open) setViewingPurchase(null) }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 border-b border-slate-100 bg-white">
            <DialogTitle className="text-xl font-bold text-[#0B3B2C]">Purchase Details - <span className="font-mono text-slate-500">{viewingPurchase?.invoice_number}</span></DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto p-6 bg-slate-50 flex-1">
            {viewingPurchase && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div><span className="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Supplier</span> <span className="font-bold text-slate-800 text-base">{viewingPurchase.supplier_name}</span></div>
                  <div><span className="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Date</span> <span className="font-medium text-slate-700 text-base">{viewingPurchase.purchase_date}</span></div>
                  <div><span className="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Created At</span> <span className="font-medium text-slate-700 text-base">{new Date(viewingPurchase.created_at).toLocaleString()}</span></div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Items Received</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold text-slate-600">Medicine ID</TableHead>
                          <TableHead className="font-semibold text-slate-600">Batch</TableHead>
                          <TableHead className="font-semibold text-slate-600">Expiry</TableHead>
                          <TableHead className="text-right font-semibold text-slate-600">Qty</TableHead>
                          <TableHead className="text-right font-semibold text-slate-600">Cost</TableHead>
                          <TableHead className="text-right font-semibold text-slate-600">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingPurchase.items?.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-slate-600">{item.medicine_id}</TableCell>
                            <TableCell className="font-mono text-xs text-slate-600">{item.batch_no}</TableCell>
                            <TableCell className="text-slate-600">{item.expiry_date}</TableCell>
                            <TableCell className="text-right font-bold text-slate-800">{item.quantity}</TableCell>
                            <TableCell className="text-right text-slate-600">₹{item.purchase_price.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-bold text-slate-800">₹{(item.purchase_price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm min-w-[300px] flex justify-between items-center">
                     <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">Grand Total</span>
                     <span className="text-2xl font-bold text-[#0B3B2C]">₹{viewingPurchase.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
