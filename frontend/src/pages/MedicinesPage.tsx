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
import { Loader2, Plus, Search } from 'lucide-react';

export const MedicinesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
      setIsCreateOpen(false);
      toast({ title: 'Success', description: 'Medicine created successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to create medicine', variant: 'destructive' });
    }
  });

  const filteredMedicines = medicines?.filter(m => 
    (m.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (m.generic_name && m.generic_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Medicines</h1>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Medicine</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Medicine</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="generic_name">Generic Name</Label>
                  <Input id="generic_name" name="generic_name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" name="brand" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit (e.g. Tab, ml)</Label>
                  <Input id="unit" name="unit" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="strength">Strength (e.g. 500mg)</Label>
                <Input id="strength" name="strength" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" name="barcode" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_stock_level">Min Stock Level</Label>
                  <Input id="minimum_stock_level" name="minimum_stock_level" type="number" min="0" defaultValue="20" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save Medicine'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2 bg-background border rounded-md px-3 py-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input 
          className="flex-1 bg-transparent border-none outline-none text-sm" 
          placeholder="Search medicines..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Generic Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Strength</TableHead>
              <TableHead>Min Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredMedicines?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No medicines found.
                </TableCell>
              </TableRow>
            ) : (
              filteredMedicines?.map((medicine) => (
                <TableRow key={medicine.id}>
                  <TableCell className="font-medium">{medicine.name}</TableCell>
                  <TableCell>{medicine.generic_name || '-'}</TableCell>
                  <TableCell>{medicine.brand || '-'}</TableCell>
                  <TableCell>{medicine.category || '-'}</TableCell>
                  <TableCell>{medicine.strength || '-'}</TableCell>
                  <TableCell>{medicine.minimum_stock_level}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
