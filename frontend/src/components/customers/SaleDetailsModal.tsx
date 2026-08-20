import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Printer } from 'lucide-react';

export const SaleDetailsModal = ({ saleId, onClose, onDownload }: { saleId: number, onClose: () => void, onDownload: () => void }) => {
  const { data: saleData, isLoading } = useQuery({
    queryKey: ['sale_details', saleId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/sales/${saleId}`);
      return data.data;
    },
    enabled: !!saleId,
  });

  const handlePrint = () => {
    // We can use the same download logic but open in new window for printing if possible,
    // For now, triggering download is the best robust fallback, or we can fetch Blob and use an iframe to print.
    onDownload();
  };

  return (
    <Dialog open={!!saleId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sale Details {saleData ? `- ${saleData.invoice_number}` : ''}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : saleData ? (
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm text-slate-500 mb-1">Invoice</p>
                <p className="font-semibold text-slate-800">{saleData.invoice_number}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Date</p>
                <p className="font-semibold text-slate-800">
                  {new Date(saleData.created_at).toLocaleString('en-GB', { 
                    day: '2-digit', month: 'short', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Customer</p>
                <p className="font-semibold text-slate-800">{saleData.customer_name || 'Walk-in Customer'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Amount</p>
                <p className="font-bold text-[#0B3B2C]">₹{saleData.total_amount?.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-700 mb-3">Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saleData.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.medicine_name || `Medicine ID: ${item.medicine_id}`}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.selling_price?.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">₹{(item.quantity * item.selling_price)?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" className="rounded-xl border-slate-200" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button className="rounded-xl bg-[#1A5F50] hover:bg-[#144d40] text-white" onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" /> Download Invoice
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500">
            Sale details could not be loaded.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
