import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CreditCard, Plus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Subscription Plans</h1>
          <p className="text-muted-foreground mt-1">Manage platform billing tiers and feature limits.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Plan
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : plans.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 bg-muted/20 border-dashed">
          <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No plans found</h3>
          <p className="text-sm text-muted-foreground mb-4">Get started by creating a subscription plan.</p>
          <Button variant="outline">
            Create Plan
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`flex flex-col ${plan.name === 'Pro' ? 'border-primary shadow-md' : 'hover:border-primary/50'} transition-all`}>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
                <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                  ${plan.price}
                  <span className="ml-1 text-xl font-medium text-muted-foreground">/{plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    Up to {plan.max_users} users
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    Up to {plan.max_products} products
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    {plan.max_monthly_transactions} monthly transactions
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.name === 'Pro' ? 'default' : 'outline'}>
                  Edit Plan
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
