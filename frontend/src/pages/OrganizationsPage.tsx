import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building, Plus, Users, LayoutList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Organization } from '@/contexts/OrganizationContext';

export const OrganizationsPage = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/organizations/');
      setOrganizations(response.data);
    } catch (error) {
      toast({
        title: "Error fetching organizations",
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Organizations</h1>
          <p className="text-muted-foreground mt-1">Manage pharmacies and medical stores across the platform.</p>
        </div>
        <Button onClick={() => navigate('/organizations/add')} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Pharmacy
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : organizations.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 bg-muted/20 border-dashed">
          <Building className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No organizations found</h3>
          <p className="text-sm text-muted-foreground mb-4">Get started by creating a new pharmacy.</p>
          <Button onClick={() => navigate('/organizations/add')} variant="outline">
            Add Pharmacy
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-start">
                  <span className="truncate">{org.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    org.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                    org.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {org.status}
                  </span>
                </CardTitle>
                <CardDescription className="truncate">{org.owner_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <span className="truncate">{org.email}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <span>{org.phone}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/organizations/${org.id}`)}>
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
