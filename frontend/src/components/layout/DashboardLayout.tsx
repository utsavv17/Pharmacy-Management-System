import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
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
  CreditCard
} from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { Header } from './Header';
import { Footer } from './Footer';
import MyMedicalIcon from '@/assets/my-medical-icon.svg';

export const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'POS / Billing', href: '/pos', icon: ShoppingCart },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Medicines', href: '/medicines', icon: Pill },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Suppliers', href: '/suppliers', icon: Truck },
    { name: 'Purchases', href: '/purchases', icon: PackagePlus },
    { name: 'Sales & Returns', href: '/sales', icon: Receipt },
    { name: 'Reports', href: '/reports', icon: TrendingUp },
  ];

  if (user?.role === 'super_admin') {
    navigation.push(
      { name: 'Organizations', href: '/organizations', icon: Building },
      { name: 'Plans', href: '/plans', icon: CreditCard }
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-primary shadow-lg z-20">
        <div className="flex items-center h-16 px-5 border-b border-white/10">
          <img src={MyMedicalIcon} alt="My Medical Logo" className="w-8 h-8 mr-3 flex-shrink-0 bg-white rounded-md p-1" />
          <span className="text-xl font-bold truncate text-white tracking-tight" title="My Medical">
            My Medical
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-5">
          <nav className="space-y-1.5 px-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-[#E8F0EB] text-primary'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                      isActive ? 'text-primary' : 'text-white/70 group-hover:text-white'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
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

      <Toaster />
    </div>
  );
};
