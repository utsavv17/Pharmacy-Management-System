import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Receipt, Search, RotateCcw, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const SalesHistoryPage = () => {
  const [search, setSearch] = useState('');

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales_history', search],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales', { params: { search } });
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'PARTIALLY_RETURNED':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">Partial Return</Badge>;
      case 'FULLY_RETURNED':
        return <Badge variant="destructive">Fully Returned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales & Returns</h1>
          <p className="text-muted-foreground mt-1">View transaction history and process refunds</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-card p-4 rounded-lg border shadow-sm">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search by invoice number..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 focus-visible:ring-0 shadow-none"
        />
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">Loading sales...</TableCell>
              </TableRow>
            ) : salesData?.data?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No sales found.</TableCell>
              </TableRow>
            ) : (
              salesData?.data?.items?.map((sale: any) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Receipt className="w-4 h-4 mr-2 text-muted-foreground" />
                      {sale.invoice_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(sale.created_at).toLocaleDateString('en-GB', { 
                      day: '2-digit', month: 'short', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </TableCell>
                  <TableCell>{sale.customer_name || 'Walk-in Customer'}</TableCell>
                  <TableCell>{getStatusBadge(sale.status)}</TableCell>
                  <TableCell className="text-right font-bold">₹{sale.total_amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" disabled={sale.status === 'FULLY_RETURNED'}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Refund
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
