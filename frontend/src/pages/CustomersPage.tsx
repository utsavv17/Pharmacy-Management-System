import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, Plus, Phone, Mail, Award, History, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CustomerHistoryModal } from '@/components/customers/CustomerHistoryModal';

export const CustomersPage = () => {
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const { data } = await apiClient.get('/customers', { params: { search } });
      return data;
    },
  });

  const addCustomerMutation = useMutation({
    mutationFn: async (newCustomer: typeof formData) => {
      const response = await apiClient.post('/customers', newCustomer);
      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Customer added successfully.' });
      setIsAddOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to add customer', 
        variant: 'destructive' 
      });
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast({ title: 'Validation Error', description: 'Name and Phone are required', variant: 'destructive' });
      return;
    }
    addCustomerMutation.mutate(formData);
  };

  return (
    <div className="w-full space-y-6 pb-10">
      <PageHeader
        title="Customers"
        description="Manage pharmacy customers and loyalty points"
        icon={Users}
        actions={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1A5F50] hover:bg-[#144d40] text-white rounded-xl font-semibold shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe" 
                    required
                    className="rounded-lg bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="1234567890" 
                    required
                    className="rounded-lg bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com" 
                    className="rounded-lg bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St" 
                    className="rounded-lg bg-white border-slate-200"
                  />
                </div>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" className="rounded-xl border-slate-200" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit" className="rounded-xl bg-[#1A5F50] hover:bg-[#144d40] text-white" disabled={addCustomerMutation.isPending}>
                    {addCustomerMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Customer
                  </Button>
                </DialogFooter>
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
              placeholder="Search by name or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="font-semibold text-slate-600">Customer</TableHead>
                <TableHead className="font-semibold text-slate-600">Contact</TableHead>
                <TableHead className="font-semibold text-slate-600">Loyalty Points</TableHead>
                <TableHead className="font-semibold text-slate-600">Total Purchases</TableHead>
                <TableHead className="font-semibold text-slate-600 text-center">Orders</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : customersData?.items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                customersData?.items?.map((customer: any) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-800">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-[#E8F0EB] text-[#1A5F50] flex items-center justify-center font-bold mr-3 shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        {customer.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm mb-1 text-slate-600">
                        <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center text-sm text-slate-500">
                          <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {customer.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-[#0B3B2C] font-bold">
                        <Award className="w-4 h-4 mr-1.5 text-amber-500" /> {customer.total_points}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">₹{customer.total_purchase_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{customer.total_orders}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-primary hover:bg-[#E8F0EB]" onClick={() => setSelectedHistoryCustomer(customer)}>
                        <History className="w-4 h-4 mr-2" /> History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {selectedHistoryCustomer && (
        <CustomerHistoryModal 
          customer={selectedHistoryCustomer} 
          onClose={() => setSelectedHistoryCustomer(null)} 
        />
      )}
    </div>
  );
};
