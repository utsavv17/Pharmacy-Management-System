import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Loader2, Plus, Trash2, Receipt, ShoppingCart, Award } from 'lucide-react';
import { Customer } from '@/types';

interface POSMedicine {
  medicine_id: number;
  medicine_name: string;
  batch_id: number;
  batch_number: string;
  stock: number;
  selling_price: number;
  expiry_date: string;
}

interface CartItem extends POSMedicine {
  quantity: number;
}

export const PosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [pointsRedeemed, setPointsRedeemed] = useState<number>(0);
  const POINT_VALUE = 0.1; // Rs 0.1 per point based on backend defaults
  
  const { toast } = useToast();

  const { data: posMedicines, isLoading } = useQuery({
    queryKey: ['posMedicines'],
    queryFn: async () => {
      const response = await apiClient.get('/sales/pos/medicines');
      return response.data.data.items as POSMedicine[];
    },
  });
  
  const { data: customersData } = useQuery({
    queryKey: ['customers', 'active'],
    queryFn: async () => {
      const response = await apiClient.get('/customers', { params: { active_only: true, limit: 1000 } });
      return response.data.items as Customer[];
    },
  });

  const filteredMedicines = useMemo(() => {
    if (!searchTerm) return [];
    return posMedicines?.filter(m => 
      m.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [posMedicines, searchTerm]);
  
  const selectedCustomer = useMemo(() => {
    if (!customerId) return null;
    return customersData?.find(c => c.id.toString() === customerId) || null;
  }, [customerId, customersData]);

  const addToCart = (med: POSMedicine) => {
    const existing = cart.find(c => c.batch_id === med.batch_id);
    if (existing) {
      if (existing.quantity >= med.stock) {
        toast({ title: 'Stock limit reached', variant: 'destructive' });
        return;
      }
      setCart(cart.map(c => c.batch_id === med.batch_id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      if (med.stock <= 0) {
        toast({ title: 'Out of stock', variant: 'destructive' });
        return;
      }
      setCart([...cart, { ...med, quantity: 1 }]);
    }
  };

  const removeFromCart = (batchId: number) => {
    setCart(cart.filter(c => c.batch_id !== batchId));
  };

  const updateQuantity = (batchId: number, qty: number) => {
    if (qty <= 0) return;
    const item = cart.find(c => c.batch_id === batchId);
    if (item && qty > item.stock) {
      toast({ title: 'Quantity exceeds available stock', variant: 'destructive' });
      return;
    }
    setCart(cart.map(c => c.batch_id === batchId ? { ...c, quantity: qty } : c));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  const loyaltyDiscount = pointsRedeemed * POINT_VALUE;
  const grandTotal = Math.max(0, subtotal - discountAmount - loyaltyDiscount);

  const [completedSale, setCompletedSale] = useState<{ id: number; invoice_number: string; total_amount: number; points_earned: number } | null>(null);

  const createSaleMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customer_id: customerId ? parseInt(customerId) : null,
        customer_name: !customerId ? customerName : null,
        discount_amount: discountAmount,
        points_redeemed: pointsRedeemed,
        items: cart.map(item => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          batch_id: item.batch_id,
        })),
      };
      const response = await apiClient.post('/sales/create', payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast({ title: 'Success', description: 'Sale completed successfully.' });
      setCompletedSale(data.data);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.detail || error.response?.data?.message || 'Failed to complete sale', variant: 'destructive' });
    }
  });

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      return;
    }
    if (selectedCustomer && pointsRedeemed > selectedCustomer.total_points) {
      toast({ title: 'Invalid Points', description: 'Cannot redeem more points than available', variant: 'destructive' });
      return;
    }
    createSaleMutation.mutate();
  };

  const handleNewSale = () => {
    setCart([]);
    setCustomerId('');
    setCustomerName('');
    setDiscountAmount(0);
    setPointsRedeemed(0);
    setSearchTerm('');
    setCompletedSale(null);
  };

  const handleDownloadInvoice = async () => {
    if (!completedSale) return;
    try {
      const response = await apiClient.get(`/invoice/sale/${completedSale.id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${completedSale.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate invoice.', variant: 'destructive' });
    }
  };

  if (completedSale) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] space-y-6">
        <div className="bg-green-100 p-6 rounded-full">
          <Receipt className="w-16 h-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold">Sale Completed Successfully</h1>
        <div className="text-center space-y-2 text-lg">
          <p className="text-muted-foreground">Invoice: <span className="font-mono font-medium text-foreground">{completedSale.invoice_number}</span></p>
          <p className="text-muted-foreground">Total: <span className="font-bold text-foreground">₹{completedSale.total_amount.toFixed(2)}</span></p>
          {completedSale.points_earned > 0 && (
            <p className="text-primary font-medium flex items-center justify-center mt-2">
              <Award className="w-5 h-5 mr-2" /> Earned {completedSale.points_earned} loyalty points!
            </p>
          )}
        </div>
        <div className="flex gap-4 pt-6">
          <Button size="lg" variant="outline" onClick={handleDownloadInvoice}>
            Download Invoice
          </Button>
          <Button size="lg" onClick={handleNewSale}>
            New Sale
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Left side: Search and Items */}
      <div className="flex-1 flex flex-col space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9 h-12 text-lg" 
            placeholder="Search medicine or batch to add..." 
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
          />
        </div>

        {searchTerm && (
          <Card className="max-h-64 overflow-y-auto z-10 relative">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /></div>
              ) : filteredMedicines.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No matches found.</div>
              ) : (
                <Table>
                  <TableBody>
                    {filteredMedicines.map(med => (
                      <TableRow key={med.batch_id} className="cursor-pointer hover:bg-muted" onClick={() => addToCart(med)}>
                        <TableCell className="font-medium">{med.medicine_name}</TableCell>
                        <TableCell>Batch: {med.batch_number}</TableCell>
                        <TableCell>Stock: {med.stock}</TableCell>
                        <TableCell>₹{med.selling_price}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost"><Plus className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="bg-muted/50 py-3">
            <CardTitle className="text-lg flex items-center"><ShoppingCart className="w-5 h-5 mr-2" /> Current Cart</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Cart is empty. Search to add medicines.
                    </TableCell>
                  </TableRow>
                ) : (
                  cart.map(item => (
                    <TableRow key={item.batch_id}>
                      <TableCell>
                        <div className="font-medium">{item.medicine_name}</div>
                        <div className="text-xs text-muted-foreground">Batch: {item.batch_number}</div>
                      </TableCell>
                      <TableCell>₹{item.selling_price}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min={1} 
                          max={item.stock} 
                          value={item.quantity}
                          onChange={(e: any) => updateQuantity(item.batch_id, parseInt(e.target.value) || 1)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>₹{(item.selling_price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.batch_id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Right side: Summary and Checkout */}
      <div className="w-full lg:w-96 flex flex-col space-y-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Checkout Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Customer Profile</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setPointsRedeemed(0);
                }}
              >
                <option value="">-- Walk-in Customer --</option>
                {customersData?.map(c => (
                  <option key={c.id} value={c.id.toString()}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>
            
            {!customerId && (
              <div className="space-y-2">
                <Label>Walk-in Name (Optional)</Label>
                <Input 
                  placeholder="Enter name" 
                  value={customerName}
                  onChange={(e: any) => setCustomerName(e.target.value)}
                />
              </div>
            )}
            
            {selectedCustomer && (
              <div className="bg-primary/5 p-3 rounded-md border border-primary/20 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium flex items-center"><Award className="w-4 h-4 mr-1 text-primary"/> Available Points</span>
                  <span className="font-bold">{selectedCustomer.total_points} pts</span>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Redeem Points (Max 1000)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={Math.min(selectedCustomer.total_points, 1000)}
                    value={pointsRedeemed || ''}
                    onChange={(e: any) => setPointsRedeemed(parseInt(e.target.value) || 0)}
                    className="h-8 text-sm"
                  />
                  {pointsRedeemed > 0 && (
                    <p className="text-xs text-primary text-right">
                      -₹{(pointsRedeemed * POINT_VALUE).toFixed(2)} savings
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2 pt-2">
              <Label>Manual Discount (₹)</Label>
              <Input 
                type="number" 
                min={0}
                value={discountAmount || ''}
                onChange={(e: any) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-destructive">
                <span>Manual Discount</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Loyalty Discount</span>
                  <span>-₹{loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl pt-3 border-t">
                <span>Grand Total</span>
                <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full h-12 text-lg" 
              onClick={handleCheckout} 
              disabled={cart.length === 0 || createSaleMutation.isPending}
            >
              {createSaleMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Receipt className="w-5 h-5 mr-2" />
              )}
              Complete Sale
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

