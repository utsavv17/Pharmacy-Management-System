import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Building, Plus, MapPin, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Organization } from '@/contexts/OrganizationContext';
import { PageHeader } from '@/components/layout/PageHeader';

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

  const handleDeactivate = async (orgId: number, orgName: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${orgName}? This will prevent all users in this organization from logging in.`)) {
      return;
    }
    
    try {
      await apiClient.delete(`/organizations/${orgId}`);
      toast({
        title: "Organization Deactivated",
        description: `${orgName} has been successfully deactivated.`,
      });
      fetchOrganizations();
    } catch (error: any) {
      toast({
        title: "Error deactivating organization",
        description: error.response?.data?.detail || "Please try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full space-y-6 pb-10">
      <PageHeader
        title="Organizations"
        description="Manage pharmacies and medical stores across the platform"
        icon={Building}
        actions={
          <Button onClick={() => navigate('/organizations/add')} className="bg-[#1A5F50] hover:bg-[#144d40] text-white rounded-xl font-semibold shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Pharmacy
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : organizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 border-dashed rounded-2xl">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Building className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No organizations found</h3>
          <p className="text-sm text-slate-500 mb-6">Get started by creating a new pharmacy.</p>
          <Button onClick={() => navigate('/organizations/add')} className="bg-[#1A5F50] hover:bg-[#144d40] text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Add Pharmacy
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div key={org.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E8F0EB] flex items-center justify-center text-primary shrink-0">
                    <Building className="w-6 h-6" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    org.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-200' : 
                    org.status === 'SUSPENDED' ? 'bg-red-50 text-red-700 border border-red-200' : 
                    'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}>
                    {org.status}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-1 line-clamp-1">{org.name}</h3>
                <p className="text-sm font-medium text-slate-500 mb-4 line-clamp-1">Owner: {org.owner_name}</p>
                
                <div className="space-y-2.5">
                  <div className="flex items-center text-sm text-slate-600">
                    <Mail className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
                    <span className="truncate">{org.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Phone className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
                    <span>{org.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                {org.status === 'ACTIVE' && (
                  <Button variant="outline" size="sm" className="rounded-lg text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDeactivate(org.id, org.name)}>
                    Deactivate
                  </Button>
                )}
                <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-slate-700 font-semibold hover:bg-white" onClick={() => navigate(`/organizations/${org.id}`)}>
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
