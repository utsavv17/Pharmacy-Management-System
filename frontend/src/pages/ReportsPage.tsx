import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, IndianRupee, TrendingUp, Calendar as CalendarIcon, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const ReportsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Fetch Daily Summary
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['reports-today'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/today');
      return response.data.data;
    }
  });

  // Fetch Monthly Summary
  const { data: monthData, isLoading: monthLoading } = useQuery({
    queryKey: ['reports-month', currentYear, currentMonth],
    queryFn: async () => {
      const response = await apiClient.get(`/reports/sales/monthly?year=${currentYear}&month=${currentMonth}`);
      return response.data.data;
    }
  });

  // Fetch 7 Days Data for Chart
  const { data: weekData, isLoading: weekLoading } = useQuery({
    queryKey: ['reports-7-days'],
    queryFn: async () => {
      const response = await apiClient.get('/reports/sales/sales-7-days');
      return response.data.data; // [{date, amount}]
    }
  });

  // Fetch Sales List
  const { data: salesList, isLoading: salesLoading } = useQuery({
    queryKey: ['reports-sales-list', searchTerm, page],
    queryFn: async () => {
      const response = await apiClient.get(`/reports/sales/?page=${page}&limit=20&search=${searchTerm}`);
      return response.data.data; // { items, pagination, year_summary }
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

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
      console.error('Failed to download invoice', error);
      alert('Failed to download invoice');
    }
  };

  // Build max value for chart scaling
  const maxChartValue = weekData ? Math.max(...weekData.map((d: any) => d.amount), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Sales & Reports</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {todayLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <div className="text-2xl font-bold">{formatCurrency(todayData?.today_revenue || 0)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {todayLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <div className="text-2xl font-bold">{todayData?.today_invoices || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Revenue</CardTitle>
            <CalendarIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {monthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <div className="text-2xl font-bold text-primary">{formatCurrency(monthData?.total_amount || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Year's Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {salesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <div className="text-2xl font-bold">{formatCurrency(salesList?.year_summary?.total_revenue || 0)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart (CSS Based) */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {weekLoading ? (
            <div className="h-48 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : weekData && weekData.length > 0 ? (
            <div className="flex items-end space-x-2 h-48 mt-4 pt-4 border-b">
              {weekData.map((d: any, idx: number) => {
                const heightPercent = Math.max((d.amount / maxChartValue) * 100, 2); // min 2% height for visibility
                const dayLabel = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white text-xs py-1 px-2 rounded transition-opacity whitespace-nowrap">
                      {formatCurrency(d.amount)}
                    </div>
                    <div 
                      className="w-full bg-primary/80 hover:bg-primary transition-all rounded-t-sm"
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                    <div className="text-xs text-muted-foreground mt-2">{dayLabel}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">No data available</div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Report */}
      <h2 className="text-xl font-semibold mt-8 border-b pb-2">Detailed Sales Report</h2>
      
      <div className="flex items-center space-x-2 bg-background border rounded-md px-3 py-2 w-full md:w-80">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input 
          className="flex-1 bg-transparent border-none outline-none text-sm" 
          placeholder="Search invoice or customer..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right font-bold">Total</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : salesList?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No sales found.
                </TableCell>
              </TableRow>
            ) : (
              salesList?.items?.map((sale: any) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium text-xs">{sale.invoice_number}</TableCell>
                  <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                  <TableCell>{sale.customer_name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sale.subtotal)}</TableCell>
                  <TableCell className="text-right text-red-500">{formatCurrency(sale.discount_amount)}</TableCell>
                  <TableCell className="text-right font-bold text-green-700">{formatCurrency(sale.total_amount)}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(sale.id, sale.invoice_number)}>
                      <Download className="w-4 h-4 mr-2" />
                      Invoice
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      {salesList?.pagination && salesList.pagination.total_pages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="text-sm">Page {page} of {salesList.pagination.total_pages}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(salesList.pagination.total_pages, p + 1))}
            disabled={page === salesList.pagination.total_pages}
          >
            Next
          </Button>
        </div>
      )}

    </div>
  );
};
