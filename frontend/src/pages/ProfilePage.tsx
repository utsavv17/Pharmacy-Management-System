import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { User, Shield, KeyRound, Loader2, Eye, EyeOff, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast({ title: 'Validation Error', description: 'Full Name is required.', variant: 'destructive' });
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await apiClient.patch('/users/me', { full_name: fullName });
      updateUser(response.data.data);
      toast({ title: 'Success', description: 'Profile updated successfully.' });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to update profile.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast({ title: 'Validation Error', description: 'Current password is required.', variant: 'destructive' });
      return;
    }
    if (!newPassword) {
      toast({ title: 'Validation Error', description: 'New password is required.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Validation Error', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }

    setIsSavingPassword(true);
    try {
      await apiClient.post('/users/me/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast({ title: 'Success', description: 'Password changed successfully.' });
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail?.message || 'Failed to change password.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const getRoleDisplayName = (role: string = '') => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="w-full space-y-6 pb-10">
      <PageHeader
        title="My Profile"
        description="Manage your personal information and security settings"
        icon={User}
      />
      
      {/* Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-[#E8F0EB] border border-[#1A5F50]/20 flex items-center justify-center text-[#1A5F50] font-bold text-4xl shadow-inner shrink-0">
          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{user?.full_name}</h1>
          <p className="text-slate-500 font-medium">{getRoleDisplayName(user?.role)}</p>
          <div className="mt-3 inline-flex px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md border border-slate-200">
            {currentOrganization?.name || 'Platform Administrator'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Personal Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" />
              <h2 className="font-bold text-slate-800">Personal Information</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-600 font-semibold">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  placeholder="Enter your full name" 
                  className="h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-600 font-semibold">Email Address <span className="text-slate-400 font-normal ml-1">(Read-only)</span></Label>
                <Input 
                  id="email" 
                  value={user?.email || ''} 
                  readOnly 
                  className="h-11 rounded-xl bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed focus-visible:ring-0" 
                />
              </div>
              <div className="pt-2 border-t border-slate-100 mt-6 pt-6">
                <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="h-11 px-6 rounded-xl bg-[#0B3B2C] hover:bg-[#07261d] text-white font-bold">
                  {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-400" />
              <h2 className="font-bold text-slate-800">Security</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Keep your account secure by regularly updating your password.
              </p>
              <Button variant="outline" className="w-full h-11 rounded-xl border-slate-200 font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setIsPasswordModalOpen(true)}>
                <KeyRound className="w-4 h-4 mr-2 text-slate-400" /> Change Password
              </Button>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800">Account Status</h2>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 border-dashed">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</span>
                <span className="font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-md text-xs uppercase tracking-wider">Active</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 border-dashed">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Role</span>
                <span className="font-bold text-slate-800">{getRoleDisplayName(user?.role)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Organization</span>
                <span className="font-bold text-slate-800 text-right max-w-[140px] truncate" title={currentOrganization?.name}>
                  {currentOrganization?.name || 'Global'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-800">Change Password</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Enter your current password and a new secure password.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <div className="space-y-2 relative">
              <Label htmlFor="current-password" className="text-slate-600 font-semibold">Current Password</Label>
              <div className="relative">
                <Input 
                  id="current-password" 
                  type={showCurrentPassword ? 'text' : 'password'} 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                  className="h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20 pr-10"
                />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="new-password" className="text-slate-600 font-semibold">New Password</Label>
              <div className="relative">
                <Input 
                  id="new-password" 
                  type={showNewPassword ? 'text' : 'password'} 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  className="h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20 pr-10"
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="confirm-password" className="text-slate-600 font-semibold">Confirm New Password</Label>
              <div className="relative">
                <Input 
                  id="confirm-password" 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  className="h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20 pr-10"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" className="h-11 rounded-xl border-slate-200 font-semibold" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword} className="h-11 rounded-xl bg-[#0B3B2C] hover:bg-[#07261d] text-white font-bold shadow-sm">
              {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSavingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
