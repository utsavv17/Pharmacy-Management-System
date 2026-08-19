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
import { Loader2, Plus, Search, Trash2, Eye, ArrowLeft } from 'lucide-react';

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
  const [supplierName, setSupplierName] = useState('');
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
    
    if (!supplierName) {
      toast({ title: 'Validation Error', description: 'Please select a supplier', variant: 'destructive' });
      return;
    }
    
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
      supplier_name: supplierName,
      purchase_date: purchaseDate,
      items: items
    });
  };

  if (view === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setView('list')} disabled={createMutation.isPending}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">New Purchase</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-background p-6 rounded-lg border">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                required
              >
                <option value="">Select a supplier...</option>
                {suppliers?.map(s => (
                  <option key={s.id} value={s.name}>{s.name} {s.company_name ? `(${s.company_name})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Purchase Date *</Label>
              <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required />
            </div>
          </div>

          <div className="bg-background p-6 rounded-lg border space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Purchase Items</h2>
              <Button type="button" onClick={handleAddItem} variant="secondary">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>
            
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Medicine *</TableHead>
                    <TableHead>Batch *</TableHead>
                    <TableHead>Expiry *</TableHead>
                    <TableHead className="w-24">Qty *</TableHead>
                    <TableHead className="w-32">Cost (₹) *</TableHead>
                    <TableHead className="w-32">Selling (₹)</TableHead>
                    <TableHead className="w-32 text-right">Total (₹)</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        No items added yet. Click "Add Item" to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                        <TableCell><Input required value={item.batch_no || ''} onChange={e => handleItemChange(index, 'batch_no', e.target.value)} /></TableCell>
                        <TableCell><Input type="date" required value={item.expiry_date || ''} onChange={e => handleItemChange(index, 'expiry_date', e.target.value)} /></TableCell>
                        <TableCell><Input type="number" min="1" required value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} /></TableCell>
                        <TableCell><Input type="number" min="0" step="0.01" required value={item.purchase_price || ''} onChange={e => handleItemChange(index, 'purchase_price', parseFloat(e.target.value))} /></TableCell>
                        <TableCell><Input type="number" min="0" step="0.01" value={item.selling_price || ''} onChange={e => handleItemChange(index, 'selling_price', parseFloat(e.target.value))} /></TableCell>
                        <TableCell className="text-right align-middle">
                          ₹{((item.purchase_price || 0) * (item.quantity || 0)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between font-medium">
                  <span>Grand Total:</span>
                  <span>₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || items.length === 0}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
        <Button onClick={() => {
          setSupplierName('');
          setPurchaseDate(new Date().toISOString().split('T')[0]);
          setItems([]);
          setView('create');
        }}>
          <Plus className="w-4 h-4 mr-2" /> New Purchase
        </Button>
      </div>

      <div className="flex items-center space-x-2 bg-background border rounded-md px-3 py-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input 
          className="flex-1 bg-transparent border-none outline-none text-sm" 
          placeholder="Search by invoice or supplier..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total Amount (₹)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingPurchases ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredPurchases?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No purchases found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPurchases?.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">{purchase.invoice_number}</TableCell>
                  <TableCell>{purchase.supplier_name}</TableCell>
                  <TableCell>{purchase.purchase_date}</TableCell>
                  <TableCell className="text-right font-medium">₹{purchase.total_amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setViewingPurchase(purchase)}>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={!!viewingPurchase} onOpenChange={(open) => { if (!open) setViewingPurchase(null) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Details - {viewingPurchase?.invoice_number}</DialogTitle>
          </DialogHeader>
          {viewingPurchase && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                <div><span className="text-muted-foreground">Supplier:</span> <span className="font-medium">{viewingPurchase.supplier_name}</span></div>
                <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{viewingPurchase.purchase_date}</span></div>
                <div><span className="text-muted-foreground">Created At:</span> <span className="font-medium">{new Date(viewingPurchase.created_at).toLocaleString()}</span></div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine ID</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Cost (₹)</TableHead>
                        <TableHead className="text-right">Total (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingPurchase.items?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.medicine_id}</TableCell>
                          <TableCell>{item.batch_no}</TableCell>
                          <TableCell>{item.expiry_date}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.purchase_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{(item.purchase_price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="flex justify-end text-lg font-bold">
                Grand Total: ₹{viewingPurchase.total_amount.toFixed(2)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
