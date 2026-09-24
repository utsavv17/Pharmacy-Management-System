import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  LayoutDashboard, 
  Pill, 
  ShoppingCart, 
  Users, 
  Package, 
  Receipt,
  Truck,
  PackagePlus,
  TrendingUp,
  Building,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import MyMedicalIcon from '@/assets/my-medical-icon.svg';
import { Button } from '@/components/ui/button';

export const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { currentOrganization } = useOrganization();
  const isDummyOrg = currentOrganization?.id === 0;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, orgSpecific: false },
    { name: 'POS / Billing', href: '/pos', icon: ShoppingCart, orgSpecific: true },
    { name: 'Inventory', href: '/inventory', icon: Package, orgSpecific: true },
    { name: 'Medicines', href: '/medicines', icon: Pill, orgSpecific: true },
    { name: 'Purchases', href: '/purchases', icon: PackagePlus, orgSpecific: true },
    { name: 'Suppliers', href: '/suppliers', icon: Truck, orgSpecific: true },
    { name: 'Customers', href: '/customers', icon: Users, orgSpecific: true },
    { name: 'Sales & Reports', href: '/reports', icon: TrendingUp, orgSpecific: true },
  ];

  let activeNavigation = navigation;
  if (isDummyOrg) {
    activeNavigation = navigation.filter(item => !item.orgSpecific);
  }

  if (user?.role === 'super_admin') {
    activeNavigation.push(
      { name: 'Organizations', href: '/organizations', icon: Building, orgSpecific: false },
      { name: 'Plans', href: '/plans', icon: CreditCard, orgSpecific: false }
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      
      {/* Desktop Sidebar */}
      <div 
        className={`hidden md:flex flex-col bg-primary shadow-lg z-20 transition-all duration-300 ease-in-out relative ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`flex items-center h-16 border-b border-white/10 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 justify-between'}`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center overflow-hidden">
              <img src={MyMedicalIcon} alt="My Medical Logo" className="w-8 h-8 mr-2 flex-shrink-0 bg-white rounded-md p-1" />
              <span className="text-lg font-bold truncate text-white tracking-tight" title="My Medical">
                My Medical
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg w-8 h-8 flex-shrink-0"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-5">
          <nav className={`space-y-1.5 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
            {activeNavigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={isSidebarCollapsed ? item.name : undefined}
                  className={`group flex items-center py-2.5 font-semibold rounded-lg transition-all duration-200 ${
                    isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
                  } ${
                    isActive
                      ? 'bg-[#E8F0EB] text-primary'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                      !isSidebarCollapsed && 'mr-3'
                    } ${
                      isActive ? 'text-primary' : 'text-white/70 group-hover:text-white'
                    }`}
                  />
                  {!isSidebarCollapsed && item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Collapse Toggle Button removed from here */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-background flex flex-col">
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};
