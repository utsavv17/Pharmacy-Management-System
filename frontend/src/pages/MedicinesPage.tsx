import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Medicine } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Search, Pill, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

export const MedicinesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: medicines, isLoading } = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      const response = await apiClient.get('/medicines/');
      return response.data.data.items as Medicine[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newMedicine: Partial<Medicine>) => {
      const response = await apiClient.post('/medicines/', newMedicine);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
      closeDialog();
      toast({ title: 'Success', description: 'Medicine created successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to create medicine', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Medicine> }) => {
      const response = await apiClient.put(`/medicines/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
      closeDialog();
      toast({ title: 'Success', description: 'Medicine updated successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to update medicine', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/medicines/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
      toast({ title: 'Success', description: 'Medicine deleted successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete medicine', variant: 'destructive' });
    }
  });

  const filteredMedicines = medicines?.filter(m => 
    (m.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (m.generic_name && m.generic_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingMedicine(null);
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setIsDialogOpen(true);
  };

  const handleDelete = (medicine: Medicine) => {
    if (window.confirm(`Are you sure you want to delete "${medicine.name}"?`)) {
      deleteMutation.mutate(medicine.id);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      generic_name: formData.get('generic_name') as string,
      brand: formData.get('brand') as string,
      category: formData.get('category') as string,
      unit: formData.get('unit') as string,
      strength: formData.get('strength') as string,
      barcode: formData.get('barcode') as string,
      minimum_stock_level: parseInt(formData.get('minimum_stock_level') as string) || 20,
    };

    if (editingMedicine) {
      updateMutation.mutate({ id: editingMedicine.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Medicines Master"
        description="Manage your product catalog and minimum stock levels"
        icon={Pill}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) closeDialog();
            else setIsDialogOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#1A5F50] hover:bg-[#144d40] text-white rounded-xl font-semibold shadow-sm" onClick={() => { setEditingMedicine(null); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4" key={editingMedicine?.id || 'new'}>
                <div className="space-y-2">
                  <Label htmlFor="name">Medicine Name *</Label>
                  <Input id="name" name="name" required defaultValue={editingMedicine?.name || ''} className="rounded-lg bg-white border-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="generic_name">Generic Name</Label>
                    <Input id="generic_name" name="generic_name" defaultValue={editingMedicine?.generic_name || ''} className="rounded-lg bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input id="brand" name="brand" defaultValue={editingMedicine?.brand || ''} className="rounded-lg bg-white border-slate-200" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" defaultValue={editingMedicine?.category || ''} className="rounded-lg bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit (e.g. Tab, ml)</Label>
                    <Input id="unit" name="unit" defaultValue={editingMedicine?.unit || ''} className="rounded-lg bg-white border-slate-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strength">Strength (e.g. 500mg)</Label>
                  <Input id="strength" name="strength" defaultValue={editingMedicine?.strength || ''} className="rounded-lg bg-white border-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input id="barcode" name="barcode" defaultValue={editingMedicine?.barcode || ''} className="rounded-lg bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimum_stock_level">Min Stock Level</Label>
                    <Input id="minimum_stock_level" name="minimum_stock_level" type="number" min="0" defaultValue={editingMedicine?.minimum_stock_level ?? 20} required className="rounded-lg bg-white border-slate-200" />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[#1A5F50] hover:bg-[#144d40] text-white rounded-xl" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingMedicine ? 'Update Medicine' : 'Save Medicine'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl w-full" 
              placeholder="Search medicines..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="font-semibold text-slate-600">Name</TableHead>
                <TableHead className="font-semibold text-slate-600">Generic Name</TableHead>
                <TableHead className="font-semibold text-slate-600">Brand</TableHead>
                <TableHead className="font-semibold text-slate-600">Category</TableHead>
                <TableHead className="font-semibold text-slate-600">Strength</TableHead>
                <TableHead className="font-semibold text-slate-600 text-center">Min Stock</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredMedicines?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    No medicines found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMedicines?.map((medicine) => (
                  <TableRow key={medicine.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-800">{medicine.name}</TableCell>
                    <TableCell className="text-slate-600">{medicine.generic_name || '-'}</TableCell>
                    <TableCell className="text-slate-600">{medicine.brand || '-'}</TableCell>
                    <TableCell className="text-slate-600">
                      {medicine.category ? (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">{medicine.category}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-slate-600">{medicine.strength || '-'}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{medicine.minimum_stock_level}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(medicine)} className="text-slate-400 hover:text-primary hover:bg-[#E8F0EB]">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(medicine)} className="text-slate-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
