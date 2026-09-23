import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

import { PageHeader } from '@/components/layout/PageHeader';
import { 
  Search, ShoppingCart, 
  User, CreditCard, 
  RefreshCw, Minus, Plus, Trash2, Banknote, HandCoins, Info,
  Tag, Loader2, CheckCircle2
} from 'lucide-react';
import { Customer } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

interface POSMedicine {
  medicine_id: number;
  medicine_name: string;
  batch_id: number;
  batch_no: string;
  stock: number;
  selling_price: number;
  expiry_date: string;
}

interface CartItem extends POSMedicine {
  quantity: number;
}

export const PosPage = () => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastGeneratedSale, setLastGeneratedSale] = useState<any>(null);
  
  // Customer Flow State
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [debouncedPhone, setDebouncedPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isWalkin, setIsWalkin] = useState(false);
  
  // Add Customer Modal State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [isClearBillModalOpen, setIsClearBillModalOpen] = useState(false);
  
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'credit'>('cash');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const paymentRef = useRef<HTMLButtonElement>(null);
  const quantityRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();




  // Debounce phone input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPhone(customerPhoneInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [customerPhoneInput]);

  const cleanPhoneLength = debouncedPhone.replace(/[^\d]/g, '').length;
  const isSearching = cleanPhoneLength >= 10 && !selectedCustomer && !isWalkin;

  const { data: searchedCustomer, isLoading: isSearchingCustomer } = useQuery({
    queryKey: ['customer', 'search', debouncedPhone],
    queryFn: async () => {
      if (cleanPhoneLength < 10) return null;
      try {
        const response = await apiClient.get(`/customers/search`, { params: { phone: debouncedPhone } });
        return response.data as Customer;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: isSearching,
    retry: false
  });

  // Auto-select if found
  useEffect(() => {
    if (searchedCustomer && !selectedCustomer && !isWalkin) {
      setSelectedCustomer(searchedCustomer);
    }
  }, [searchedCustomer, selectedCustomer, isWalkin]);

  const handleChangeCustomer = () => {
    setSelectedCustomer(null);
    setIsWalkin(false);
    setCustomerPhoneInput('');
    setDebouncedPhone('');
  };

  const createCustomerMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: newCustomerName,
        phone: customerPhoneInput,
        email: newCustomerEmail,
        address: newCustomerAddress
      };
      const response = await apiClient.post('/customers/', payload);
      return response.data as Customer;
    },
    onSuccess: (data) => {
      setSelectedCustomer(data);
      setIsCustomerModalOpen(false);
      toast({ title: 'Customer created successfully' });
      // clear modal state
      setNewCustomerName('');
      setNewCustomerEmail('');
      setNewCustomerAddress('');
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create customer', description: error.response?.data?.detail || 'Error', variant: 'destructive' });
    }
  });

  // Data Fetching
  const { data: posMedicines, isLoading: isMedicinesLoading } = useQuery({
    queryKey: ['posMedicines'],
    queryFn: async () => {
      const response = await apiClient.get('/sales/pos/medicines');
      return response.data.data.items as POSMedicine[];
    },
  });

  // Derived State
  const filteredMedicines = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return posMedicines?.filter(m => 
      (m.medicine_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (m.batch_no?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ) || [];
  }, [posMedicines, searchTerm]);
  
  const subtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  const discountAmount = subtotal * (Number(discountPercent) || 0) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // Cart Handlers
  const addToCart = (med: POSMedicine) => {
    if (med.stock <= 0) {
      toast({ title: 'Out of stock', variant: 'destructive' });
      return;
    }
    const existing = cart.find(c => c.batch_id === med.batch_id);
    if (existing) {
      if (existing.quantity >= med.stock) {
        toast({ title: 'Stock limit reached', variant: 'destructive' });
        return;
      }
      setCart(cart.map(c => c.batch_id === med.batch_id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...med, quantity: 1 }]);
    }
    setSearchTerm('');
    
    // Focus quantity input for this row after a short delay
    setTimeout(() => {
      quantityRefs.current[med.batch_id]?.focus();
      quantityRefs.current[med.batch_id]?.select();
    }, 50);
  };

  const removeFromCart = (batchId: number) => {
    setCart(cart.filter(c => c.batch_id !== batchId));
  };

  const updateQuantity = (batchId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(batchId);
      return;
    }
    const item = cart.find(c => c.batch_id === batchId);
    if (item && qty > item.stock) {
      toast({ title: 'Quantity exceeds available stock', variant: 'destructive' });
      return;
    }
    setCart(cart.map(c => c.batch_id === batchId ? { ...c, quantity: qty } : c));
  };

  const resetPos = () => {
    setCart([]);
    setSelectedCustomer(null);
    setIsWalkin(false);
    setCustomerPhoneInput('');
    setDebouncedPhone('');
    setDiscountPercent(0);
    setPaymentMethod('cash');
    setSearchTerm('');
  };

  // API Handlers
  const handleDownloadInvoiceDirectly = async (sale: any) => {
    try {
      const response = await apiClient.get(`/invoice/sale/${sale.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${sale.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({ title: 'Invoice Error', description: 'Failed to download invoice.', variant: 'destructive' });
    }
  };

  const createSaleMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        discount_amount: Math.round(discountAmount * 100) / 100,
        payment_method: paymentMethod,
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
      toast({ title: 'Sale Completed', description: 'Transaction processed successfully.' });
      queryClient.invalidateQueries({ queryKey: ['sales_history'] });
      queryClient.invalidateQueries({ queryKey: ['posMedicines'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardTotals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardToday'] });
      
      resetPos();
      setTimeout(() => searchInputRef.current?.focus(), 100);
      
      setLastGeneratedSale(data.data);
      setTimeout(() => {
        handleDownloadInvoiceDirectly(data.data);
      }, 500);
    },
    onError: (error: any) => {
      toast({ title: 'Transaction Failed', description: error.response?.data?.detail || 'Failed to complete sale', variant: 'destructive' });
    }
  });

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: New Bill / Reset
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) {
            setIsClearBillModalOpen(true);
        } else {
            resetPos();
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      }
      // F3: Medicine Search
      if (e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setTimeout(() => searchInputRef.current?.select(), 10);
      }
      // F4: Customer Search
      if (e.key === 'F4') {
        e.preventDefault();
        customerInputRef.current?.focus();
        setTimeout(() => customerInputRef.current?.select(), 10);
      }
      // F8: Payment
      if (e.key === 'F8') {
        e.preventDefault();
        paymentRef.current?.focus();
      }
      // F9 or Ctrl+Enter: Complete Bill
      if (e.key === 'F9' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
        e.preventDefault();
        if (cart.length > 0 && !createSaleMutation.isPending) {
          createSaleMutation.mutate();
        }
      }
      // F10: Print Invoice
      if (e.key === 'F10') {
        e.preventDefault();
        if (lastGeneratedSale) {
          handleDownloadInvoiceDirectly(lastGeneratedSale);
        } else {
          toast({ title: 'No invoice available', description: 'Complete a sale first to print.' });
        }
      }
      // Esc: Close dropdown
      if (e.key === 'Escape') {
        setSearchTerm('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, createSaleMutation, lastGeneratedSale, resetPos]);

  return (
    <div className="w-full">
      <PageHeader
        title="Point of sale"
        description="Create and complete pharmacy sales"
        icon={ShoppingCart}
        actions={
          <Button variant="outline" className="bg-white rounded-xl text-slate-700 font-semibold border-slate-200" onClick={resetPos}>
            <RefreshCw className="w-4 h-4 mr-2 text-slate-400" /> Reset
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        
        {/* LEFT COLUMN: Search & Cart */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search medicine, SKU, or batch..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setSearchSelectedIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSearchSelectedIndex((prev) => Math.min(prev + 1, filteredMedicines.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSearchSelectedIndex((prev) => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredMedicines[searchSelectedIndex] && filteredMedicines[searchSelectedIndex].stock > 0) {
                    addToCart(filteredMedicines[searchSelectedIndex]);
                  }
                }
              }}
              className="w-full bg-white border border-slate-200 shadow-sm rounded-xl py-3 pl-12 pr-16 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-500 font-medium">
                Ctrl K
              </kbd>
            </div>

            {/* Search Dropdown */}
            {searchTerm && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                {isMedicinesLoading ? (
                  <div className="p-4 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
                ) : filteredMedicines.length > 0 ? (
                  filteredMedicines.map((med, index) => (
                    <div 
                      key={med.batch_id} 
                      className={`p-3 border-b border-slate-100 flex items-center justify-between cursor-pointer transition-colors ${
                        med.stock > 0 
                          ? (index === searchSelectedIndex ? 'bg-slate-100 ring-2 ring-primary/50' : 'hover:bg-slate-50') 
                          : 'opacity-60 bg-slate-50'
                      }`}
                      ref={(el) => {
                        if (index === searchSelectedIndex && el) el.scrollIntoView({ block: 'nearest' });
                      }}
                      onClick={() => med.stock > 0 && addToCart(med)}
                    >
                      <div>
                        <h4 className="font-semibold text-slate-800">{med.medicine_name}</h4>
                        <div className="text-xs text-slate-500 flex gap-3 mt-1">
                          <span>Batch: {med.batch_no}</span>
                          <span className={med.stock < 10 ? 'text-red-500 font-medium' : ''}>Stock: {med.stock}</span>
                          <span>Exp: {med.expiry_date}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">₹{med.selling_price.toFixed(2)}</div>
                        {med.stock <= 0 && <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 mt-1">Out of Stock</Badge>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-500">No medicines found matching "{searchTerm}"</div>
                )}
              </div>
            )}
          </div>

          {/* Current Cart */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <h2 className="text-lg font-bold text-[#0B3B2C]">Current cart</h2>
              <Badge variant="outline" className="bg-slate-50 text-slate-600 font-medium border-slate-200">
                {cart.length} items
              </Badge>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Your cart is empty</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Search for a medicine above to start a new sale.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1 bg-white">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 font-medium">Item</th>
                      <th className="px-5 py-3 font-medium text-center">Qty</th>
                      <th className="px-5 py-3 font-medium text-right">Price</th>
                      <th className="px-5 py-3 font-medium text-right">Total</th>
                      <th className="px-5 py-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.batch_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">{item.medicine_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Batch: {item.batch_no} <span className="mx-1">•</span> Stock: {item.quantity}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7 rounded-md border-slate-200 hover:bg-slate-100"
                              onClick={() => updateQuantity(item.batch_id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input 
                              ref={(el) => { quantityRefs.current[item.batch_id] = el; }}
                              type="number"
                              min="1"
                              max={item.stock}
                              className="w-16 h-8 text-center font-medium p-1 bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.batch_id, parseInt(e.target.value) || 0)}
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  searchInputRef.current?.focus();
                                }
                              }}
                            />
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7 rounded-md border-slate-200 hover:bg-slate-100"
                              onClick={() => updateQuantity(item.batch_id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-medium">
                          ₹{item.selling_price.toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-slate-800">
                          ₹{(item.selling_price * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors focus:ring-2 focus:ring-red-200 focus:outline-none"
                            onClick={() => removeFromCart(item.batch_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar (Customer, Payment, Totals) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            
            <div className="p-5 flex-1 space-y-6">
              
              {/* Customer Section */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase">Customer</h3>
                </div>
                
                {selectedCustomer ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <h4 className="font-bold text-slate-800">{selectedCustomer.name}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{selectedCustomer.phone}</p>
                      </div>
                      <Badge variant="outline" className="bg-white border-primary/20 text-primary text-[10px]">
                        Existing
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/60">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Points</p>
                        <p className="text-sm font-bold text-slate-700">{selectedCustomer.total_points}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Orders</p>
                        <p className="text-sm font-bold text-slate-700">{selectedCustomer.total_orders}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Spent</p>
                        <p className="text-sm font-bold text-slate-700">₹{selectedCustomer.total_purchase_amount.toFixed(0)}</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4 bg-white hover:bg-slate-100 text-slate-600 border-slate-200 text-xs"
                      onClick={handleChangeCustomer}
                    >
                      Change Customer
                    </Button>
                  </div>
                ) : isWalkin ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 bg-slate-200/50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <h4 className="font-bold text-slate-700">Walk-in Customer</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Sale will not earn loyalty points.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full bg-white hover:bg-slate-100 text-slate-600 border-slate-200 text-xs"
                      onClick={handleChangeCustomer}
                    >
                      Change Customer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Mobile Number</Label>
                      <div className="relative">
                        <Input 
                          placeholder="e.g. 9876543210" 
                          ref={customerInputRef}
                          value={customerPhoneInput} 
                          onChange={e => setCustomerPhoneInput(e.target.value)}
                          className="rounded-lg bg-white border-slate-200 font-medium"
                          maxLength={15}
                        />
                        {isSearchingCustomer && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!isSearchingCustomer && cleanPhoneLength >= 10 && !searchedCustomer && (
                      <div className="animate-in fade-in slide-in-from-top-1 bg-red-50 border border-red-100 p-3 rounded-lg flex flex-col gap-3">
                        <div className="flex gap-2">
                          <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700 font-medium leading-tight">Customer not found.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1 text-xs h-8 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                            onClick={() => setIsWalkin(true)}
                          >
                            Walk-in
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1 text-xs h-8 bg-primary hover:bg-primary/90 text-white"
                            onClick={() => setIsCustomerModalOpen(true)}
                          >
                            + Add Customer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <hr className="border-slate-100 border-dashed" />

              {/* Discount Section */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase">Discount (%)</h3>
                </div>
                <div className="relative">
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="0"
                    value={discountPercent || ''} 
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setDiscountPercent(Math.min(100, Math.max(0, val)));
                    }}
                    className="rounded-lg bg-white border-slate-200 pr-8"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-sm font-semibold text-slate-400">%</span>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100 border-dashed" />

              {/* Payment Method */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase">Payment Method</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
                    { id: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
                    { id: 'upi', label: 'UPI', icon: <span className="font-bold text-xs tracking-wider">UPI</span> },
                    { id: 'credit', label: 'Credit', icon: <HandCoins className="w-4 h-4" /> }
                  ].map((method, idx) => (
                    <Button
                      key={method.id}
                      ref={idx === 0 ? paymentRef : undefined}
                      variant="outline"
                      className={`rounded-lg justify-center gap-2 transition-colors focus:ring-2 focus:ring-primary/40 focus:outline-none ${paymentMethod === method.id ? 'bg-[#E8F0EB] text-primary border-primary/30 ring-2 ring-primary/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      onClick={() => setPaymentMethod(method.id as any)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setPaymentMethod(method.id as any);
                        } else if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
                          e.preventDefault();
                          const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
                          if (buttons) {
                            let nextIdx = idx;
                            if (e.key === 'ArrowRight') nextIdx = idx + 1;
                            if (e.key === 'ArrowLeft') nextIdx = idx - 1;
                            if (e.key === 'ArrowDown') nextIdx = idx + 2;
                            if (e.key === 'ArrowUp') nextIdx = idx - 2;
                            if (nextIdx >= 0 && nextIdx < buttons.length) {
                                (buttons[nextIdx] as HTMLElement).focus();
                            }
                          }
                        }
                      }}
                    >
                      {method.icon} {method.label !== 'UPI' ? method.label : ''}
                    </Button>
                  ))}
                </div>
              </section>

            </div>

            {/* Totals & Submit */}
            <div className="bg-slate-50 p-5 border-t border-slate-200">
              <div className="space-y-2 mb-4 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-b border-dashed border-slate-300 my-2"></div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-bold text-slate-800 tracking-wider text-xs">TOTAL</span>
                  <span className="text-3xl font-bold text-[#0B3B2C]">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                className="w-full h-14 rounded-xl bg-[#0B3B2C] hover:bg-[#07261d] text-white font-bold text-lg shadow-sm"
                disabled={cart.length === 0 || createSaleMutation.isPending}
                onClick={() => createSaleMutation.mutate()}
              >
                {createSaleMutation.isPending ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                ) : (
                  <>Complete sale</>
                )}
              </Button>
            </div>
            
          </div>
        </div>

      </div>

      {/* Add Customer Modal */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Mobile Number</Label>
              <Input 
                value={customerPhoneInput} 
                disabled 
                className="bg-slate-50 text-slate-500 font-medium"
              />
            </div>
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input 
                value={newCustomerName} 
                onChange={(e) => setNewCustomerName(e.target.value)} 
                placeholder="Customer Name"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label>Email (Optional)</Label>
              <Input 
                type="email"
                value={newCustomerEmail} 
                onChange={(e) => setNewCustomerEmail(e.target.value)} 
                placeholder="customer@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Address (Optional)</Label>
              <Input 
                value={newCustomerAddress} 
                onChange={(e) => setNewCustomerAddress(e.target.value)} 
                placeholder="Customer Address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomerModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createCustomerMutation.mutate()}
              disabled={!newCustomerName.trim() || createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending ? 'Saving...' : 'Save Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isClearBillModalOpen} onOpenChange={setIsClearBillModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear the current bill? This will remove all items from the cart.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsClearBillModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                resetPos();
                setIsClearBillModalOpen(false);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
            >
              Clear Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
