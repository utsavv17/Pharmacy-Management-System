import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { 
  LayoutDashboard, 
  Pill, 
  ShoppingCart, 
  Users, 
  Package, 
  LogOut,
  Menu,
  Receipt,
  Truck,
  PackagePlus,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
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

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-card border-r shadow-sm">
        <div className="flex items-center h-16 px-4 border-b">
          <Pill className="w-6 h-6 text-primary mr-2" />
          <span className="text-lg font-bold">PharmaSys</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mr-3">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between h-16 px-4 bg-card border-b shadow-sm">
          <div className="flex items-center">
            <Pill className="w-6 h-6 text-primary mr-2" />
            <span className="text-lg font-bold">PharmaSys</span>
          </div>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        {/* Main section */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
};
