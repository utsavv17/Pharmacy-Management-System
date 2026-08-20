import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Receipt, Loader2, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SaleDetailsModal } from './SaleDetailsModal';

export const CustomerHistoryModal = ({ customer, onClose }: { customer: any, onClose: () => void }) => {
  const { toast } = useToast();
  const [selectedSale, setSelectedSale] = useState<any>(null);

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['customer_sales', customer?.id],
    queryFn: async () => {
      if (!customer) return null;
      const { data } = await apiClient.get(`/customers/${customer.id}/sales`);
      return data;
    },
    enabled: !!customer,
  });

  const handleDownloadInvoice = async (saleId: number, invoiceNum: string) => {
    try {
      const response = await apiClient.get(`/invoice/sale/${saleId}`, { responseType: 'blob' });
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
    <>
      <Dialog open={!!customer} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Purchase History: {customer?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 mt-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="font-semibold text-slate-600">Invoice</TableHead>
                  <TableHead className="font-semibold text-slate-600">Date</TableHead>
                  <TableHead className="font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-right">Total Amount</TableHead>
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
                ) : salesData?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      No purchase history found for this customer.
                    </TableCell>
                  </TableRow>
                ) : (
                  salesData?.items?.map((sale: any) => (
                    <TableRow key={sale.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedSale(sale)}>
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
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      <TableCell className="text-right font-bold text-[#0B3B2C]">₹{sale.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedSale(sale); }} className="rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary">
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </Button>
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(sale.id, sale.invoice_number); }} className="rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      {selectedSale && (
        <SaleDetailsModal saleId={selectedSale.id} onClose={() => setSelectedSale(null)} onDownload={() => handleDownloadInvoice(selectedSale.id, selectedSale.invoice_number)} />
      )}
    </>
  );
};
