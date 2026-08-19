import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useOrganization, Organization } from '@/contexts/OrganizationContext';
import { apiClient } from '@/api/client';
import { Building2 } from "lucide-react"

export function OrganizationSwitcher() {
  const { user } = useAuth();
  const { currentOrganization, setCurrentOrganization, isLoading } = useOrganization();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      const fetchOrganizations = async () => {
        setLoadingOrgs(true);
        try {
          const response = await apiClient.get('/organizations/');
          setOrganizations(response.data);
        } catch (error) {
          console.error("Failed to fetch organizations", error);
        } finally {
          setLoadingOrgs(false);
        }
      };
      fetchOrganizations();
    }
  }, [user]);

  if (isLoading || !currentOrganization) {
    return <div className="animate-pulse h-10 bg-muted rounded-md w-full"></div>;
  }

  // Only super_admin can switch organizations
  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center px-3 py-2 text-sm font-medium border rounded-md bg-muted/50">
        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
        <span className="truncate">{currentOrganization.name}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </div>
      <select
        className="block w-full pl-10 pr-10 py-2 text-sm border-input border rounded-md bg-background focus:ring-primary focus:border-primary disabled:opacity-50"
        value={currentOrganization.id}
        onChange={(e) => {
          const selectedId = parseInt(e.target.value);
          const selectedOrg = organizations.find(org => org.id === selectedId);
          if (selectedOrg) {
            setCurrentOrganization(selectedOrg);
          }
        }}
        disabled={loadingOrgs}
      >
        {organizations.map(org => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </div>
  )
}
