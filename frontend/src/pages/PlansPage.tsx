import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/layout/PageHeader';

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  max_users: number;
  max_products: number;
  max_monthly_transactions: number;
  is_active: boolean;
}

export const PlansPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/plans/');
      setPlans(response.data);
    } catch (error) {
      toast({
        title: "Error fetching plans",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-10">
      <PageHeader
        title="Subscription Plans"
        description="Manage platform billing tiers and feature limits"
        icon={CreditCard}
        actions={
          <Button className="bg-[#1A5F50] hover:bg-[#144d40] text-white rounded-xl font-semibold shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Create Plan
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 border-dashed rounded-2xl">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No plans found</h3>
          <p className="text-sm text-slate-500 mb-6">Get started by creating a subscription plan.</p>
          <Button className="bg-[#1A5F50] hover:bg-[#144d40] text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Create Plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col ${plan.name === 'Pro' ? 'border-[#0B3B2C] ring-1 ring-[#0B3B2C]/20 shadow-md scale-[1.02]' : 'border-slate-200'}`}>
              
              {plan.name === 'Pro' && (
                <div className="bg-[#0B3B2C] text-white text-xs font-bold text-center py-1.5 uppercase tracking-widest">
                  Most Popular
                </div>
              )}

              <div className="p-6 border-b border-slate-100 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-slate-800">{plan.name}</h3>
                <p className="text-sm font-medium text-slate-500 mt-2 min-h-[40px]">{plan.description}</p>
                
                <div className="mt-6 flex items-baseline text-4xl font-extrabold text-[#0B3B2C]">
                  ${plan.price}
                  <span className="ml-1 text-xl font-bold text-slate-400">/{plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                
                <div className="mt-8 space-y-4 flex-1">
                  <div className="flex items-center text-sm font-medium text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-[#E8F0EB] flex items-center justify-center mr-3 shrink-0">
                      <Check className="h-3.5 w-3.5 text-[#1A5F50]" />
                    </div>
                    Up to {plan.max_users} users
                  </div>
                  <div className="flex items-center text-sm font-medium text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-[#E8F0EB] flex items-center justify-center mr-3 shrink-0">
                      <Check className="h-3.5 w-3.5 text-[#1A5F50]" />
                    </div>
                    Up to {plan.max_products} products
                  </div>
                  <div className="flex items-center text-sm font-medium text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-[#E8F0EB] flex items-center justify-center mr-3 shrink-0">
                      <Check className="h-3.5 w-3.5 text-[#1A5F50]" />
                    </div>
                    {plan.max_monthly_transactions} monthly transactions
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50/50">
                <Button className={`w-full h-12 rounded-xl font-bold text-base ${plan.name === 'Pro' ? 'bg-[#0B3B2C] hover:bg-[#07261d] text-white shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'}`}>
                  Edit Plan
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
