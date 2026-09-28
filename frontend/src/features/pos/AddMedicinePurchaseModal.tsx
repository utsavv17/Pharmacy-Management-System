import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Supplier, Medicine } from '@/types';
import { Loader2 } from 'lucide-react';

interface POSMedicine {
  medicine_id: number;
  medicine_name: string;
  batch_id: number;
  batch_number: string;
  stock: number;
  selling_price: number;
  expiry_date: string;
  barcode: string | null;
}

interface AddMedicinePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMedicineName: string;
  onSuccess: (medicine: POSMedicine) => void;
}

export const AddMedicinePurchaseModal: React.FC<AddMedicinePurchaseModalProps> = ({
  isOpen,
  onClose,
  initialMedicineName,
  onSuccess
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await apiClient.get('/suppliers/');
      return response.data.data.items as Supplier[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiClient.post('/sales/pos/create-medicine-purchase', payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast({ title: 'Success', description: 'Medicine and stock created successfully.' });
      onSuccess(data.data as POSMedicine);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to create medicine', 
        variant: 'destructive' 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Medicine properties
    const medicine = {
      name: formData.get('name') as string,
      generic_name: formData.get('generic_name') as string,
      brand: formData.get('brand') as string,
      category: formData.get('category') as string,
      unit: formData.get('unit') as string,
      strength: formData.get('strength') as string,
      barcode: formData.get('barcode') as string,
      minimum_stock_level: parseInt(formData.get('minimum_stock_level') as string) || 20,
    };

    // Purchase properties
    const supplierIdStr = formData.get('supplier_id') as string;
    const selectedSupplier = suppliers?.find(s => s.id === parseInt(supplierIdStr));
    
    const purchase = {
      supplier_id: parseInt(supplierIdStr),
      supplier_name: selectedSupplier?.name || '',
      purchase_date: new Date().toISOString().split('T')[0],
      batch_no: formData.get('batch_no') as string,
      expiry_date: formData.get('expiry_date') as string,
      purchase_price: parseFloat(formData.get('purchase_price') as string),
      selling_price: parseFloat(formData.get('selling_price') as string),
      quantity: parseInt(formData.get('quantity') as string),
    };

    if (purchase.quantity <= 0 || purchase.purchase_price < 0 || purchase.selling_price < 0) {
      toast({ title: 'Validation Error', description: 'Please enter valid amounts.', variant: 'destructive' });
      return;
    }

    createMutation.mutate({ medicine, purchase });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !createMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Medicine & Purchase</DialogTitle>
          <DialogDescription>
            Create a new medicine in the catalog and simultaneously record its initial stock.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Medicine Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#0B3B2C] border-b pb-2">Medicine Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name *</Label>
                <Input id="name" name="name" required defaultValue={initialMedicineName} className="rounded-lg bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" name="brand" className="rounded-lg bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="generic_name">Generic Name</Label>
                <Input id="generic_name" name="generic_name" className="rounded-lg bg-white border-slate-200" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" className="rounded-lg bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit (e.g. Tab, ml)</Label>
                <Input id="unit" name="unit" className="rounded-lg bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strength">Strength (e.g. 500mg)</Label>
                <Input id="strength" name="strength" className="rounded-lg bg-white border-slate-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" name="barcode" className="rounded-lg bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum_stock_level">Min Stock Level *</Label>
                <Input id="minimum_stock_level" name="minimum_stock_level" type="number" min="0" defaultValue={20} required className="rounded-lg bg-white border-slate-200" />
              </div>
            </div>
          </div>

          {/* Purchase / Stock Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#0B3B2C] border-b pb-2">Purchase / Stock Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier *</Label>
                <select 
                  id="supplier_id"
                  name="supplier_id"
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  required
                >
                  <option value="">Select a supplier...</option>
                  {!isLoadingSuppliers && suppliers?.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.company_name ? `(${s.company_name})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch_no">Batch Number *</Label>
                <Input id="batch_no" name="batch_no" required className="rounded-lg bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date *</Label>
                <Input id="expiry_date" name="expiry_date" type="date" required className="rounded-lg bg-white border-slate-200" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input id="quantity" name="quantity" type="number" min="1" required className="rounded-lg bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price *</Label>
                <Input id="purchase_price" name="purchase_price" type="number" step="0.01" min="0" required className="rounded-lg bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selling_price">Selling Price (MRP) *</Label>
                <Input id="selling_price" name="selling_price" type="number" step="0.01" min="0" required className="rounded-lg bg-white border-slate-200" />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full bg-[#1A5F50] hover:bg-[#144d40] text-white rounded-xl h-12 text-lg" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</>
            ) : (
              'Save Medicine & Add to Bill'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
