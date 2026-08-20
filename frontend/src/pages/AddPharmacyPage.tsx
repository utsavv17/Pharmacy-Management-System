import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building, User, Mail, Phone, MapPin, Lock, ArrowLeft, ArrowRight, Save } from 'lucide-react';

export const AddPharmacyPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    owner_name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst_number: '',
    drug_license_number: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const dataToSubmit = {
        ...formData
      };
      
      await apiClient.post('/organizations/', dataToSubmit);
      
      toast({
        title: "Pharmacy Added Successfully",
        description: `${formData.name} has been provisioned.`,
        variant: "default"
      });
      
      navigate('/organizations');
    } catch (error: any) {
      toast({
        title: "Failed to add pharmacy",
        description: error.response?.data?.detail || "Please check the form and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-10">
      
      {/* Custom Header for Wizard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="w-12 h-12 rounded-xl border-slate-200 text-slate-500 hover:text-[#1A5F50] hover:bg-[#E8F0EB] shrink-0" onClick={() => navigate('/organizations')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Add New Pharmacy</h1>
            <p className="text-sm text-slate-500">Provision a new organization tenant</p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        
        {/* Progress Line Background */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
        
        {/* Progress Line Active */}
        <div 
          className="absolute top-1/2 left-0 h-1 bg-[#0B3B2C] -translate-y-1/2 z-0 transition-all duration-300"
          style={{ width: step === 1 ? '10%' : step === 2 ? '50%' : '90%' }}
        ></div>

        <div className="flex flex-col items-center relative z-10 w-24">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= 1 ? 'bg-[#0B3B2C] text-white shadow-md' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>1</div>
          <span className={`text-xs font-bold uppercase tracking-wider mt-3 text-center ${step >= 1 ? 'text-[#0B3B2C]' : 'text-slate-400'}`}>Basic Info</span>
        </div>
        
        <div className="flex flex-col items-center relative z-10 w-24">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= 2 ? 'bg-[#0B3B2C] text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}>2</div>
          <span className={`text-xs font-bold uppercase tracking-wider mt-3 text-center ${step >= 2 ? 'text-[#0B3B2C]' : 'text-slate-400'}`}>Credentials</span>
        </div>
        
        <div className="flex flex-col items-center relative z-10 w-24">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= 3 ? 'bg-[#0B3B2C] text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}>3</div>
          <span className={`text-xs font-bold uppercase tracking-wider mt-3 text-center ${step >= 3 ? 'text-[#0B3B2C]' : 'text-slate-400'}`}>Legal</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {step === 1 && "Basic Information"}
            {step === 2 && "Owner Credentials"}
            {step === 3 && "Legal Details & Address"}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {step === 1 && "Provide the name and contact details for the pharmacy."}
            {step === 2 && "Setup the default administrator account for this tenant."}
            {step === 3 && "Complete the registration with legal documentation."}
          </p>
        </div>
        
        <div className="p-6">
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-600 font-semibold">Pharmacy Name *</Label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input id="name" name="name" required className="h-12 pl-12 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20" value={formData.name} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-600 font-semibold">Contact Phone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input id="phone" name="phone" required className="h-12 pl-12 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20" value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Credentials */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="owner_name" className="text-slate-600 font-semibold">Owner Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input id="owner_name" name="owner_name" required className="h-12 pl-12 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20" value={formData.owner_name} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-600 font-semibold">Login Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input id="email" name="email" type="email" required className="h-12 pl-12 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20" value={formData.email} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-600 font-semibold">Login Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input id="password" name="password" type="password" required className="h-12 pl-12 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20" value={formData.password} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Legal & Address */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="gst_number" className="text-slate-600 font-semibold">GST Number</Label>
                    <Input id="gst_number" name="gst_number" className="h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20" value={formData.gst_number} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="drug_license_number" className="text-slate-600 font-semibold">Drug License Number</Label>
                    <Input id="drug_license_number" name="drug_license_number" className="h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20" value={formData.drug_license_number} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-slate-600 font-semibold">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input id="address" name="address" className="h-12 pl-12 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20" value={formData.address} onChange={handleChange} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-slate-600 font-semibold">City</Label>
                    <Input id="city" name="city" className="h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20" value={formData.city} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-slate-600 font-semibold">State</Label>
                    <Input id="state" name="state" className="h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20" value={formData.state} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode" className="text-slate-600 font-semibold">Pincode</Label>
                    <Input id="pincode" name="pincode" className="h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20" value={formData.pincode} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
              <Button type="button" variant="outline" className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-semibold" onClick={handlePrev} disabled={step === 1 || loading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              {step < 3 ? (
                <Button type="submit" className="h-12 px-8 rounded-xl bg-[#0B3B2C] hover:bg-[#07261d] text-white font-bold" disabled={loading}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="h-12 px-8 rounded-xl bg-[#0B3B2C] hover:bg-[#07261d] text-white font-bold" disabled={loading}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : <Save className="mr-2 h-5 w-5" />}
                  {loading ? 'Provisioning...' : 'Provision Pharmacy'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
