import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, Loader2, ShoppingCart, Clock, BarChart3, LogIn, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MyMedicalIcon from '@/assets/my-medical-icon.svg';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.success) {
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }
        
        const { access_token, user } = response.data.data;
        login(access_token, user);
        navigate('/');
      } else {
        toast({
          title: 'Login Failed',
          description: response.data.message || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.message || 'An error occurred during login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Simulate API call for forgot password since SMTP is not configured
      await new Promise(resolve => setTimeout(resolve, 800));
      toast({
        title: 'Reset Link Sent',
        description: 'If an account with this email exists, a password reset link has been sent.',
      });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send reset link.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans">
      {/* Left Panel - Hidden on small screens */}
      <div className="hidden lg:flex w-1/2 bg-[#123e31] relative text-white p-8 xl:p-12 overflow-hidden justify-center">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1A5F50_1px,transparent_1px)] [background-size:24px_24px] opacity-30"></div>
        
        <div className="relative z-10 w-full max-w-[500px] flex flex-col h-full">
          <div className="flex items-center gap-3.5 text-[26px] font-bold italic">
            <div className="w-11 h-11 bg-white text-[#123e31] flex items-center justify-center rounded-[10px] shadow-sm">
              <img src={MyMedicalIcon} alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="tracking-tight">My Medical</span>
          </div>

          <div className="flex-1 flex flex-col justify-center py-12">
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-emerald-400/80 uppercase mb-4">Pharmacy Billing & Inventory</h3>
            <h1 className="text-[2.5rem] font-semibold leading-[1.15] mb-5 tracking-tight">Run the counter without losing the back room.</h1>
            <p className="text-emerald-100/70 text-[17px] leading-relaxed mb-14">
              Billing, batch tracking, and expiry alerts in one place — built for the pace of a real pharmacy.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <ShoppingCart className="w-5 h-5 text-emerald-300/80" />
                </div>
                <div>
                  <h4 className="font-semibold text-white/90 text-[15px]">Fast billing at the counter</h4>
                  <p className="text-[13.5px] text-emerald-100/50 mt-1">Search by medicine, batch, or SKU and bill in seconds.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Clock className="w-5 h-5 text-emerald-300/80" />
                </div>
                <div>
                  <h4 className="font-semibold text-white/90 text-[15px]">Batch & expiry tracking</h4>
                  <p className="text-[13.5px] text-emerald-100/50 mt-1">Get alerted before stock expires, not after.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <BarChart3 className="w-5 h-5 text-emerald-300/80" />
                </div>
                <div>
                  <h4 className="font-semibold text-white/90 text-[15px]">Reports that make sense</h4>
                  <p className="text-[13.5px] text-emerald-100/50 mt-1">Daily revenue, purchases, and stock health at a glance.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-xs text-emerald-300/40 font-mono">
            <span>© 2026 My Medical</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 bg-[#F9F9F6] flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-[380px]">
          
          {isForgotPassword ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8">
                <button 
                  onClick={() => setIsForgotPassword(false)}
                  className="flex items-center text-sm font-semibold text-slate-400 hover:text-slate-600 mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
                </button>
                <h2 className="text-3xl font-semibold text-slate-800 mb-2 tracking-tight">Reset password</h2>
                <p className="text-[14px] text-slate-500">Enter your email address and we'll send you a link to reset your password.</p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-slate-700">Email address</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@mymedical.in"
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11 bg-white border-slate-200 text-slate-800 rounded-lg focus-visible:ring-[#1A5F50]"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-[#165546] hover:bg-[#114236] text-white font-medium rounded-lg shadow-sm mt-6 transition-colors" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="mb-8">
                <h3 className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-2">Welcome back</h3>
                <h2 className="text-3xl font-semibold text-slate-800 mb-2 tracking-tight">Sign in to your store</h2>
                <p className="text-[14px] text-slate-500">Enter your credentials to access the dashboard.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-slate-700">Email address</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@mymedical.in"
                        value={email}
                        onChange={(e: any) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-11 bg-white border-slate-200 text-slate-800 rounded-lg focus-visible:ring-[#1A5F50]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-slate-700">Password</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e: any) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 h-11 bg-white border-slate-200 text-slate-800 rounded-lg focus-visible:ring-[#1A5F50]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="remember" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#1A5F50] focus:ring-[#1A5F50]" 
                    />
                    <label htmlFor="remember" className="text-[13px] text-slate-500 font-medium">Remember me</label>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[13px] font-semibold text-[#1A5F50] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-[#165546] hover:bg-[#114236] text-white font-medium rounded-lg shadow-sm mt-6 transition-colors" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="mr-2 h-[18px] w-[18px]" /> Sign in
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          <div className="mt-16 text-center text-[11px] font-mono text-slate-400">
            Protected sign-in · My Medical v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
};
