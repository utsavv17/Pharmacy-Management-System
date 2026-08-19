import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';

export interface Organization {
  id: number;
  name: string;
  status: string;
  owner_name?: string;
  email?: string;
  phone?: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization) => void;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // When the user logs in, they might have a default organization_id
    // Or we might have one stored in localStorage
    const storedOrgId = localStorage.getItem('organization_id');
    const storedOrgName = localStorage.getItem('organization_name');
    
    if (storedOrgId && storedOrgName) {
      setCurrentOrg({
        id: parseInt(storedOrgId),
        name: storedOrgName,
        status: 'ACTIVE'
      });
    } else if (user?.organization_id) {
      // If user has a default organization_id but it's not in localStorage yet
      setCurrentOrg({
        id: user.organization_id,
        name: 'My Pharmacy', // Will be fetched later, or we just rely on localStorage
        status: 'ACTIVE'
      });
      localStorage.setItem('organization_id', user.organization_id.toString());
      localStorage.setItem('organization_name', 'My Pharmacy');
    }
    
    setIsLoading(false);
  }, [user]);

  const setCurrentOrganization = (org: Organization) => {
    setCurrentOrg(org);
    localStorage.setItem('organization_id', org.id.toString());
    localStorage.setItem('organization_name', org.name);
    // Reload the page to reset all queries with the new organization context
    window.location.reload();
  };

  return (
    <OrganizationContext.Provider value={{ currentOrganization, setCurrentOrganization, isLoading }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
