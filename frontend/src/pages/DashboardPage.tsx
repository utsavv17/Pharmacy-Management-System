import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { DashboardTotals } from '@/types';
import { IndianRupee, TrendingUp, ShoppingCart, Pill, Users, FileText, AlertTriangle, Clock, XCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardTotals'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/');
      return response.data.data as DashboardTotals;
    },
  });

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['dashboardToday'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/today');
      return response.data.data;
    },
  });

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  if (isLoading || todayLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
        <div className="h-12 bg-slate-200 rounded w-72"></div>
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] || 'User';

  return (
    <div className="space-y-10 w-full pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm font-medium tracking-wide mb-1 uppercase">{formattedDate}</p>
          <h1 className="text-4xl font-bold text-[#0B3B2C] tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-semibold" onClick={() => navigate('/purchases')}>
            <Plus className="w-4 h-4 mr-2" /> Add stock
          </Button>
          <Button className="bg-[#1A5F50] hover:bg-[#144d40] text-white rounded-lg font-semibold border-none shadow-sm" onClick={() => navigate('/pos')}>
            <ShoppingCart className="w-4 h-4 mr-2" /> New sale
          </Button>
        </div>
      </div>

      {/* Today's Overview (Top Row) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Today's Revenue */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-[140px]">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-slate-500">Today's revenue</h3>
            <IndianRupee className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0B3B2C] mb-1">{formatCurrency(todayData?.today_revenue || 0)}</div>
            <p className="text-xs text-slate-400 font-medium">{todayData?.today_revenue ? 'Revenue recorded today' : 'No sales recorded yet today'}</p>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-[140px]">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-slate-500">Today's sales</h3>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0B3B2C] mb-1">{todayData?.today_sales_count || 0}</div>
            <p className="text-xs text-slate-400 font-medium">Invoices billed since 9:00 AM</p>
          </div>
        </div>

        {/* Avg Bill Value */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-[140px]">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-slate-500">Avg. bill value</h3>
            <IndianRupee className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0B3B2C] mb-1">
              {todayData?.today_sales_count ? formatCurrency(todayData.today_revenue / todayData.today_sales_count) : '—'}
            </div>
            <p className="text-xs text-slate-400 font-medium">Calculated after first sale</p>
          </div>
        </div>

        {/* Prescriptions Billed */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-[140px]">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-slate-500">Prescriptions billed</h3>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0B3B2C] mb-1">0</div>
            <p className="text-xs text-slate-400 font-medium">Rx-linked sales today</p>
          </div>
        </div>

      </div>

      {/* Grand Totals Section */}
      <div>
        <h2 className="text-xl font-bold text-[#0B3B2C] mb-4">Grand totals</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-[120px] relative overflow-hidden">
            <div className="absolute top-0 left-5 w-8 h-1 bg-[#0B3B2C] rounded-b-sm"></div>
            <div className="flex justify-between items-center mt-2">
              <h3 className="text-sm font-medium text-slate-500">Total sales revenue</h3>
              <IndianRupee className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-[#0B3B2C]">{formatCurrency(data?.total_sales || 0)}</div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-[120px] relative overflow-hidden">
            <div className="absolute top-0 left-5 w-8 h-1 bg-[#0B3B2C] rounded-b-sm"></div>
            <div className="flex justify-between items-center mt-2">
              <h3 className="text-sm font-medium text-slate-500">Total purchases</h3>
              <ShoppingCart className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-[#0B3B2C]">{formatCurrency(data?.total_purchases || 0)}</div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-[120px] relative overflow-hidden">
            <div className="absolute top-0 left-5 w-8 h-1 bg-[#0B3B2C] rounded-b-sm"></div>
            <div className="flex justify-between items-center mt-2">
              <h3 className="text-sm font-medium text-slate-500">Total medicines</h3>
              <Pill className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-[#0B3B2C]">{data?.total_medicines || 0}</div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-[120px] relative overflow-hidden">
            <div className="absolute top-0 left-5 w-8 h-1 bg-[#0B3B2C] rounded-b-sm"></div>
            <div className="flex justify-between items-center mt-2">
              <h3 className="text-sm font-medium text-slate-500">Total customers</h3>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-[#0B3B2C]">{data?.total_customers || 0}</div>
          </div>

        </div>
      </div>

      {/* Action Required Section */}
      <div>
        <h2 className="text-xl font-bold text-[#B92B27] mb-4">Action required</h2>
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Low Stock Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 flex flex-col">
            <div className="mb-4">
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50/50 font-semibold px-2.5 py-0.5 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Low stock
              </Badge>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-[#0B3B2C] mb-1">0</div>
              <p className="text-sm text-slate-600 font-medium">medicines below minimum level</p>
            </div>
            <div className="mt-auto">
              <div className="border-t border-dashed border-slate-200 pt-6 pb-6 text-center">
                <p className="text-xs text-slate-400 px-4 leading-relaxed">
                  Nothing below minimum yet — add stock levels to start tracking.
                </p>
              </div>
              <Button className="w-full bg-[#B92B27] hover:bg-[#9a2420] text-white rounded-xl py-6 font-semibold shadow-sm" onClick={() => navigate('/inventory')}>
                Check inventory
              </Button>
            </div>
          </div>

          {/* Expiring Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 flex flex-col">
            <div className="mb-4">
              <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50/50 font-semibold px-2.5 py-0.5 rounded-md">
                <Clock className="w-3.5 h-3.5 mr-1.5" /> Expiring in 30 days
              </Badge>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-[#0B3B2C] mb-1">0</div>
              <p className="text-sm text-slate-600 font-medium">batches approaching expiry</p>
            </div>
            <div className="mt-auto">
              <div className="border-t border-dashed border-slate-200 pt-6 pb-6 text-center">
                <p className="text-xs text-slate-400 px-4 leading-relaxed">
                  Batch expiry tracking will appear here once stock is added.
                </p>
              </div>
              <Button className="w-full bg-[#B07D10] hover:bg-[#90660d] text-white rounded-xl py-6 font-semibold shadow-sm" onClick={() => navigate('/inventory')}>
                Plan clearance
              </Button>
            </div>
          </div>

          {/* Expired Stock Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-200/60 flex flex-col">
            <div className="mb-4">
              <Badge variant="outline" className="text-red-800 border-red-200 bg-red-100/50 font-semibold px-2.5 py-0.5 rounded-md">
                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Expired stock
              </Badge>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-[#0B3B2C] mb-1">0</div>
              <p className="text-sm text-slate-600 font-medium">batches blocked from sale</p>
            </div>
            <div className="mt-auto">
              <div className="border-t border-dashed border-slate-200 pt-6 pb-6 text-center">
                <p className="text-xs text-slate-400 px-4 leading-relaxed">
                  Expired batches are auto-blocked at billing to keep sales compliant.
                </p>
              </div>
              <Button className="w-full bg-[#9a2420] hover:bg-[#7e1c19] text-white rounded-xl py-6 font-semibold shadow-sm" onClick={() => navigate('/inventory')}>
                Review blocked items
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Recent Activity placeholder to match screenshot */}
      <div className="pt-4 border-t border-dashed border-slate-200">
        <h2 className="text-xl font-bold text-[#0B3B2C] mb-4">Recent activity</h2>
        <div className="text-sm text-slate-400 italic">Activity log will appear here...</div>
      </div>

    </div>
  );
};
