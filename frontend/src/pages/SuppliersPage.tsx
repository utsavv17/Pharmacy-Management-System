import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Supplier } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Search, Trash2, Edit, Truck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Pagination } from '@/components/ui/pagination';
import { useDebounce } from '@/hooks/use-debounce';

export const SuppliersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteSupplierId, setDeleteSupplierId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers', page, limit, debouncedSearch],
    queryFn: async () => {
      const response = await apiClient.get(`/suppliers/?page=${page}&limit=${limit}${debouncedSearch ? `&search=${debouncedSearch}` : ''}`);
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newSupplier: Partial<Supplier>) => {
      const response = await apiClient.post('/suppliers/create', newSupplier);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsDialogOpen(false);
      setEditingSupplier(null);
      toast({ title: 'Success', description: 'Supplier created successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to create supplier', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Supplier> }) => {
      const response = await apiClient.put(`/suppliers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsDialogOpen(false);
      setEditingSupplier(null);
      toast({ title: 'Success', description: 'Supplier updated successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to update supplier', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/suppliers/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Success', description: 'Supplier deleted successfully.' });
      setDeleteSupplierId(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete supplier', variant: 'destructive' });
    }
  });

  const filteredSuppliers = suppliersData?.items as Supplier[] || [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      company_name: formData.get('company_name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
    };

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteSupplierId(id);
  };

  const confirmDelete = () => {
    if (deleteSupplierId) {
      deleteMutation.mutate(deleteSupplierId);
    }
  };

  const openCreateDialog = () => {
    setEditingSupplier(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="w-full space-y-6 pb-10">
      <PageHeader
        title="Suppliers"
        description="Manage your distributors and wholesale contacts"
        icon={Truck}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) setEditingSupplier(null);
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-[#1A5F50] hover:bg-[#144d40] text-white rounded-xl font-semibold shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Contact Person Name *</Label>
                  <Input id="name" name="name" required defaultValue={editingSupplier?.name || ''} className="rounded-lg bg-white border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input id="company_name" name="company_name" defaultValue={editingSupplier?.company_name || ''} className="rounded-lg bg-white border-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" defaultValue={editingSupplier?.phone || ''} className="rounded-lg bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={editingSupplier?.email || ''} className="rounded-lg bg-white border-slate-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" defaultValue={editingSupplier?.address || ''} className="rounded-lg bg-white border-slate-200" />
                </div>
                <Button type="submit" className="w-full bg-[#1A5F50] hover:bg-[#144d40] text-white rounded-xl" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Supplier'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl w-full" 
              placeholder="Search suppliers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="font-semibold text-slate-600">Contact Person</TableHead>
                <TableHead className="font-semibold text-slate-600">Company</TableHead>
                <TableHead className="font-semibold text-slate-600">Phone</TableHead>
                <TableHead className="font-semibold text-slate-600">Email</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredSuppliers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    No suppliers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers?.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-800">{supplier.name}</TableCell>
                    <TableCell className="font-medium text-slate-700">{supplier.company_name || '-'}</TableCell>
                    <TableCell className="text-slate-600">{supplier.phone || '-'}</TableCell>
                    <TableCell className="text-slate-600">{supplier.email || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)} className="text-slate-400 hover:text-primary hover:bg-[#E8F0EB]">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50">
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
        {suppliersData?.pagination && (
          <div className="border-t border-slate-100">
            <Pagination
              page={suppliersData.pagination.page}
              totalPages={suppliersData.pagination.pages}
              total={suppliersData.pagination.total}
              limit={suppliersData.pagination.limit}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      <Dialog open={!!deleteSupplierId} onOpenChange={(open) => !open && setDeleteSupplierId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this supplier? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteSupplierId(null)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
