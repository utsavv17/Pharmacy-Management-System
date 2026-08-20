import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Receipt, Search, RotateCcw, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/layout/PageHeader';

export const SalesHistoryPage = () => {
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales_history', search],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales', { params: { search } });
      return data;
    },
  });

  const handleDownloadInvoice = async (saleId: number, invoiceNum: string) => {
    try {
      const response = await apiClient.get(`/invoice/sale/${saleId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download invoice.', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 font-bold uppercase tracking-wider text-[10px]">Completed</Badge>;
      case 'PARTIALLY_RETURNED':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold uppercase tracking-wider text-[10px]">Partial Return</Badge>;
      case 'FULLY_RETURNED':
        return <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 font-bold uppercase tracking-wider text-[10px]">Fully Returned</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-600 border-slate-200 font-bold uppercase tracking-wider text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="w-full space-y-6 pb-10">
      <PageHeader
        title="Sales & Returns"
        description="View transaction history and process refunds"
        icon={Receipt}
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl w-full" 
              placeholder="Search by invoice number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="font-semibold text-slate-600">Invoice</TableHead>
                <TableHead className="font-semibold text-slate-600">Date</TableHead>
                <TableHead className="font-semibold text-slate-600">Customer</TableHead>
                <TableHead className="font-semibold text-slate-600">Status</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Total Amount</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : salesData?.data?.items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    No sales found.
                  </TableCell>
                </TableRow>
              ) : (
                salesData?.data?.items?.map((sale: any) => (
                  <TableRow key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3 border border-slate-100">
                          <Receipt className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="font-mono text-sm font-semibold text-slate-700">{sale.invoice_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(sale.created_at).toLocaleDateString('en-GB', { 
                        day: '2-digit', month: 'short', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </TableCell>
                    <TableCell className="font-medium text-slate-800">{sale.customer_name || 'Walk-in Customer'}</TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell className="text-right font-bold text-[#0B3B2C]">₹{sale.total_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(sale.id, sale.invoice_number)} className="rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary">
                          <Download className="w-4 h-4 mr-2" /> Invoice
                        </Button>
                        <Button variant="outline" size="sm" disabled={sale.status === 'FULLY_RETURNED'} className="rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600">
                          <RotateCcw className="w-4 h-4 mr-2" /> Refund
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
