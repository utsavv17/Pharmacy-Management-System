import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { User, LogOut, Menu, Search, Pill, Users, ShoppingCart, Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MyMedicalIcon from '@/assets/my-medical-icon.svg';
import { searchApi, GlobalSearchResponse } from '@/api/search';

export const Header = () => {
  const { user, logout } = useAuth();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GlobalSearchResponse | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.trim().length === 0) {
        setSearchResults(null);
        return;
      }
      setIsSearching(true);
      try {
        const results = await searchApi.globalSearch(debouncedQuery);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    };
    fetchResults();
  }, [debouncedQuery]);

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (path: string) => {
    navigate(path);
    setShowResults(false);
    setSearchQuery('');
  };

  const hasResults = searchResults && (
    searchResults.medicines.length > 0 ||
    searchResults.customers.length > 0 ||
    searchResults.batches.length > 0 ||
    searchResults.sales.length > 0 ||
    searchResults.suppliers.length > 0
  );

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b shadow-sm w-full">
      {/* Mobile Left */}
      <div className="flex md:hidden items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-slate-500">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center">
          <img src={MyMedicalIcon} alt="My Medical Logo" className="w-7 h-7 mr-2 flex-shrink-0" />
          <span className="text-lg font-bold text-[#193C6C] tracking-tight">
            My Medical
          </span>
        </div>
      </div>

      {/* Desktop Left Context (Super Admin) */}
      <div className="hidden md:flex flex-1 items-center">
        {user?.role === 'super_admin' && (
          <div className="w-72">
            <OrganizationSwitcher />
          </div>
        )}
      </div>

      {/* Desktop Center Context - Search Bar */}
      <div className="hidden md:flex flex-1 justify-center w-full max-w-xl mx-auto relative" ref={searchRef}>
        <div className="relative w-full">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          )}
          <input 
            type="text" 
            placeholder="Search medicine, batch, invoice, customer..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery.trim().length > 0) setShowResults(true); }}
            className="w-full bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 text-sm text-slate-700 py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
            {!isSearching && !hasResults ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div className="py-2">
                {searchResults?.medicines.length ? (
                  <div className="mb-2">
                    <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Medicines</div>
                    {searchResults.medicines.map(m => (
                      <div key={m.id} onClick={() => handleResultClick('/medicines')} className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between group">
                        <div className="flex items-center">
                          <Pill className="w-4 h-4 text-slate-400 mr-3 group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{m.name}</span>
                        </div>
                        {m.manufacturer && <span className="text-xs text-slate-400">{m.manufacturer}</span>}
                      </div>
                    ))}
                  </div>
                ) : null}

                {searchResults?.customers.length ? (
                  <div className="mb-2">
                    <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Customers</div>
                    {searchResults.customers.map(c => (
                      <div key={c.id} onClick={() => handleResultClick('/customers')} className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between group">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-slate-400 mr-3 group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{c.name}</span>
                        </div>
                        <span className="text-xs text-slate-400">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {searchResults?.batches.length ? (
                  <div className="mb-2">
                    <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Batches</div>
                    {searchResults.batches.map(b => (
                      <div key={b.id} onClick={() => handleResultClick('/inventory')} className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between group">
                        <div className="flex items-center">
                          <div className="w-4 h-4 flex items-center justify-center bg-slate-100 rounded mr-3">
                            <span className="text-[10px] font-bold text-slate-500">B</span>
                          </div>
                          <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{b.batch_no} <span className="text-slate-400 font-normal">({b.medicine_name})</span></span>
                        </div>
                        <span className="text-xs text-slate-400">Stock: {b.quantity}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {searchResults?.sales.length ? (
                  <div className="mb-2">
                    <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Sales (Invoices)</div>
                    {searchResults.sales.map(s => (
                      <div key={s.id} onClick={() => handleResultClick('/sales')} className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between group">
                        <div className="flex items-center">
                          <ShoppingCart className="w-4 h-4 text-slate-400 mr-3 group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{s.invoice_number}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-600">₹{s.total_amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {searchResults?.suppliers.length ? (
                  <div>
                    <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Suppliers</div>
                    {searchResults.suppliers.map(s => (
                      <div key={s.id} onClick={() => handleResultClick('/suppliers')} className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between group">
                        <div className="flex items-center">
                          <Truck className="w-4 h-4 text-slate-400 mr-3 group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{s.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-3 ml-auto flex-1 justify-end">
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="pl-1 pr-3 py-1 h-auto flex items-center space-x-2 rounded-full border-slate-200 hover:bg-slate-50 transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">{user?.full_name}</span>
                <span className="text-[9px] uppercase font-bold text-primary bg-[#E8F0EB] px-1.5 py-0.5 rounded-sm mt-0.5 tracking-wider leading-none">
                  {user?.role.replace('_', ' ')}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {user?.role.replace('_', ' ')}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
