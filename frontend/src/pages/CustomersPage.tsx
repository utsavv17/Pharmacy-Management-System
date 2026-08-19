import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Search, Plus, MapPin, Phone, Mail, Award, History } from 'lucide-react';

export const CustomersPage = () => {
  const [search, setSearch] = useState('');

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const { data } = await apiClient.get('/customers', { params: { search } });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage pharmacy customers and loyalty points</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <div className="flex items-center space-x-2 bg-card p-4 rounded-lg border shadow-sm">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search by name or phone..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 focus-visible:ring-0 shadow-none"
        />
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Loyalty Points</TableHead>
              <TableHead>Total Purchases</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">Loading customers...</TableCell>
              </TableRow>
            ) : customersData?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No customers found.</TableCell>
              </TableRow>
            ) : (
              customersData?.items?.map((customer: any) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mr-3">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      {customer.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm mb-1">
                      <Phone className="w-3 h-3 mr-1 text-muted-foreground" /> {customer.phone}
                    </div>
                    {customer.email && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="w-3 h-3 mr-1" /> {customer.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-primary font-bold">
                      <Award className="w-4 h-4 mr-1" /> {customer.total_points}
                    </div>
                  </TableCell>
                  <TableCell>₹{customer.total_purchase_amount.toFixed(2)}</TableCell>
                  <TableCell>{customer.total_orders}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
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
  );
};
