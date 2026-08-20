import React, { useState } from 'react';

import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Pill, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import MyMedicalLogo from '@/assets/my-medical-logo.svg';
import { useToast } from '@/hooks/use-toast';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.success) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-[420px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-none rounded-2xl bg-white pb-2 pt-8 px-2">
        <CardHeader className="space-y-4 text-center pb-8">
          {/* Logo Header */}
          <div className="flex flex-col items-center justify-center space-y-6">
            <img src={MyMedicalLogo} alt="My Medical Logo" className="h-[52px] w-auto" />
            <div className="text-center space-y-1.5">
              <h1 className="text-[22px] font-bold tracking-tight text-[#0a2540]">Welcome Back</h1>
              <p className="text-[13.5px] text-gray-500 font-medium">
                Sign in to your account
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-[18px] w-[18px] text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 bg-white border-gray-200 text-[#0a2540] placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#0879D1] focus-visible:border-[#0879D1] rounded-lg transition-all"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-[18px] w-[18px] text-gray-400" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-11 bg-white border-gray-200 text-[#0a2540] placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#0879D1] focus-visible:border-[#0879D1] rounded-lg transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-[#0879D1] to-[#16A34A] hover:from-[#0665af] hover:to-[#12863c] text-white font-medium rounded-lg shadow-sm border-0 transition-all active:scale-[0.98]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-[13px] font-medium text-[#0a2540] pt-6 pb-2">
          <div className="flex items-center gap-2">
            <span>Manage</span>
            <span className="text-[#0879D1] font-bold">&bull;</span>
            <span>Track</span>
            <span className="text-[#0879D1] font-bold">&bull;</span>
            <span>Grow</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
