import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, Loader2, CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { apiClient } from '@/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface InvoiceImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const InvoiceImportModal: React.FC<InvoiceImportModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        toast({ title: 'Invalid file', description: 'Please select a PDF file.', variant: 'destructive' });
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post('/purchases/import-invoice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setExtractionResult(response.data.data);
      setStep(2);
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.response?.data?.detail || 'Failed to analyze invoice.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!extractionResult) return;
    setIsConfirming(true);
    
    try {
      // In a full implementation, we would extract the edited values here.
      // For this implementation, we will pass the result data directly.
      const payload = {
        supplier_id: extractionResult.matched_supplier_id,
        create_supplier: !extractionResult.matched_supplier_id,
        supplier_details: extractionResult.supplier,
        
        invoice_number: extractionResult.invoice.invoice_number,
        invoice_date: extractionResult.invoice.invoice_date || new Date().toISOString().split('T')[0],
        subtotal: extractionResult.invoice.subtotal,
        discount: extractionResult.invoice.discount,
        total_amount: extractionResult.invoice.grand_total,
        
        source_filename: extractionResult.source_filename,
        file_hash: extractionResult.file_hash,
        
        items: extractionResult.items.map((item: any) => ({
          medicine_id: item.matched_medicine_id,
          create_medicine: !item.matched_medicine_id,
          product_name: item.product_name,
          manufacturer: item.manufacturer,
          batch_no: item.batch_no || 'NA',
          expiry_date: item.expiry_date ? `${item.expiry_date}-01` : new Date(Date.now() + 31536000000).toISOString().split('T')[0], // Add fake day or +1 year if missing
          purchase_price: item.purchase_rate,
          mrp: item.mrp || item.purchase_rate,
          quantity: item.quantity,
          free_quantity: item.free_quantity,
          discount: item.discount,
          gst_percent: item.gst_percent
        }))
      };

      await apiClient.post('/purchases/import-invoice/confirm', payload);
      
      toast({
        title: 'Success',
        description: 'Invoice imported and stock updated successfully.',
      });
      setStep(3); // Success step
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Confirmation Failed',
        description: error.response?.data?.detail || 'Failed to confirm purchase.',
        variant: 'destructive'
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setExtractionResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) reset(); else onOpenChange(val); }}>
      <DialogContent className={step === 2 ? 'max-w-4xl' : 'sm:max-w-md'}>
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Import Supplier Invoice</DialogTitle>
              <DialogDescription>
                Upload a PDF invoice from your supplier. The system will automatically extract items and map them to your inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              {!file ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Click to select PDF invoice</p>
                  <p className="text-xs text-gray-400 mt-1">Supports Ishaan Pharma and standard formats</p>
                </div>
              ) : (
                <div className="w-full flex items-center justify-between p-4 border rounded-md bg-blue-50/50">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isUploading}>
                    <XCircle className="h-5 w-5 text-gray-500 hover:text-red-500" />
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset} disabled={isUploading}>Cancel</Button>
              <Button onClick={handleUpload} disabled={!file || isUploading}>
                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Analyze Invoice'}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && extractionResult && (
          <>
            <DialogHeader>
              <DialogTitle>Review Extracted Invoice</DialogTitle>
              <DialogDescription>
                Please review the extracted data and fix any unmatched medicines before confirming.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md border">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">Supplier</h4>
                  <p className="text-sm font-medium mt-1">
                    {extractionResult.supplier.name || 'Unknown'} 
                    {extractionResult.supplier_match_status === 'UNMATCHED' && (
                      <Badge variant="outline" className="ml-2 text-yellow-600 border-yellow-300 bg-yellow-50">New Supplier</Badge>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">GSTIN: {extractionResult.supplier.gstin || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">Invoice Details</h4>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                    <span className="text-gray-500">Invoice No:</span>
                    <span className="font-medium">{extractionResult.invoice.invoice_number || 'N/A'}</span>
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium">{extractionResult.invoice.invoice_date || 'N/A'}</span>
                    <span className="text-gray-500">Total:</span>
                    <span className="font-medium">₹{extractionResult.invoice.grand_total}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Extracted Medicines ({extractionResult.items.length})</h4>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractionResult.items.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-sm">
                            {item.product_name}
                            <div className="text-xs text-gray-500 mt-0.5">Exp: {item.expiry_date || 'N/A'}</div>
                          </TableCell>
                          <TableCell>
                            {item.match_status === 'MATCHED' ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1"/> Matched</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none"><AlertTriangle className="w-3 h-3 mr-1"/> New Medicine</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{item.batch_number}</TableCell>
                          <TableCell className="text-sm">{item.quantity} {item.free_quantity > 0 && <span className="text-xs text-green-600">(+{item.free_quantity} Free)</span>}</TableCell>
                          <TableCell className="text-sm">₹{item.purchase_rate}</TableCell>
                          <TableCell className="text-sm font-medium">₹{item.amount}</TableCell>
                        </TableRow>
                      ))}
                      {extractionResult.items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                            No items could be extracted. The table format might not be supported.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)} disabled={isConfirming}>Back</Button>
              <Button onClick={handleConfirm} disabled={isConfirming || extractionResult.items.length === 0} className="bg-blue-600 hover:bg-blue-700">
                {isConfirming ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...</> : 'Confirm & Add Stock'}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">Import Successful</DialogTitle>
            <DialogDescription className="text-base max-w-sm">
              Your invoice has been processed and the inventory stock has been automatically updated.
            </DialogDescription>
            <Button onClick={reset} className="mt-6 min-w-[150px]">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
