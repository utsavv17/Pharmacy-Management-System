import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, TrendingUp, Download, PieChart, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/PageHeader';

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
    <div className="w-full space-y-6 pb-10">
      <PageHeader
        title="Sales & Reports"
        description="Monitor performance, daily revenue, and historical trends"
        icon={PieChart}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Revenue</div>
            <IndianRupee className="h-4 w-4 text-slate-400" />
          </div>
          {todayLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : (
            <div className="text-3xl font-bold text-[#0B3B2C]">{formatCurrency(todayData?.today_revenue || 0)}</div>
          )}
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Sales</div>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          {todayLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : (
            <div className="text-3xl font-bold text-slate-800">{todayData?.today_invoices || 0}</div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm bg-gradient-to-br from-white to-[#F2F7F5]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold text-[#1A5F50] uppercase tracking-wider">This Month</div>
            <IndianRupee className="h-4 w-4 text-[#1A5F50]/50" />
          </div>
          {monthLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#1A5F50]" /> : (
            <div className="text-3xl font-bold text-[#1A5F50]">{formatCurrency(monthData?.total_amount || 0)}</div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">This Year</div>
            <IndianRupee className="h-4 w-4 text-slate-400" />
          </div>
          {salesLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : (
            <div className="text-3xl font-bold text-slate-800">{formatCurrency(salesList?.year_summary?.total_revenue || 0)}</div>
          )}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-6">Revenue (Last 7 Days)</h3>
        {weekLoading ? (
          <div className="h-48 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : weekData && weekData.length > 0 ? (
          <div className="flex items-end gap-2 h-48 mt-4 pt-4 border-b border-slate-100">
            {weekData.map((d: any, idx: number) => {
              const heightPercent = Math.max((d.amount / maxChartValue) * 100, 2); // min 2% height for visibility
              const dayLabel = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-[#0B3B2C] text-white text-xs font-bold py-1 px-2 rounded-lg transition-opacity whitespace-nowrap shadow-md">
                    {formatCurrency(d.amount)}
                  </div>
                  <div 
                    className="w-full bg-[#E8F0EB] hover:bg-[#1A5F50] transition-colors rounded-t-lg"
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3">{dayLabel}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 font-medium">No data available</div>
        )}
      </div>

      {/* Detailed Report */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-slate-800">Detailed Sales Report</h2>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl w-full" 
              placeholder="Search invoice or customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-semibold text-slate-600">Invoice #</TableHead>
                <TableHead className="font-semibold text-slate-600">Date</TableHead>
                <TableHead className="font-semibold text-slate-600">Customer</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Subtotal</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Discount</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Total</TableHead>
                <TableHead className="text-center font-semibold text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : salesList?.items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    No sales found.
                  </TableCell>
                </TableRow>
              ) : (
                salesList?.items?.map((sale: any) => (
                  <TableRow key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-mono text-sm font-semibold text-slate-700">{sale.invoice_number}</TableCell>
                    <TableCell className="text-slate-600">{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-slate-800">{sale.customer_name || 'Walk-in'}</TableCell>
                    <TableCell className="text-right text-slate-600">{formatCurrency(sale.subtotal)}</TableCell>
                    <TableCell className="text-right text-red-500">{formatCurrency(sale.discount_amount)}</TableCell>
                    <TableCell className="text-right font-bold text-[#0B3B2C]">{formatCurrency(sale.total_amount)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(sale.id, sale.invoice_number)} className="text-primary hover:bg-[#E8F0EB] rounded-lg">
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
          <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-100">
            <div className="text-sm font-medium text-slate-500">
              Page <span className="text-slate-800">{page}</span> of <span className="text-slate-800">{salesList.pagination.total_pages}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border-slate-200 bg-white"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(salesList.pagination.total_pages, p + 1))}
                disabled={page === salesList.pagination.total_pages}
                className="rounded-lg border-slate-200 bg-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
