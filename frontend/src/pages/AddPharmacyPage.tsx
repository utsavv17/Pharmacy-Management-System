import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
      // Find the "Basic" plan ID (for demo purposes, we will hardcode it or just leave it null)
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/organizations')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Add New Pharmacy</h1>
          <p className="text-muted-foreground mt-1">Provision a new organization tenant.</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</div>
          <span className="text-sm font-medium mt-2">Basic Info</span>
        </div>
        <div className={`flex-1 h-1 mx-4 rounded ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
          <span className="text-sm font-medium mt-2">Owner Credentials</span>
        </div>
        <div className={`flex-1 h-1 mx-4 rounded ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3</div>
          <span className="text-sm font-medium mt-2">Legal & Address</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Basic Information"}
            {step === 2 && "Owner Credentials"}
            {step === 3 && "Legal Details & Address"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Provide the name and contact details for the pharmacy."}
            {step === 2 && "Setup the default administrator account for this tenant."}
            {step === 3 && "Complete the registration with legal documentation."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Pharmacy Name *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="name" name="name" required className="pl-9" value={formData.name} onChange={handleChange} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Contact Phone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" name="phone" required className="pl-9" value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Credentials */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="owner_name">Owner Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="owner_name" name="owner_name" required className="pl-9" value={formData.owner_name} onChange={handleChange} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Login Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" required className="pl-9" value={formData.email} onChange={handleChange} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Login Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="password" name="password" type="password" required className="pl-9" value={formData.password} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Legal & Address */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="gst_number">GST Number</Label>
                    <Input id="gst_number" name="gst_number" value={formData.gst_number} onChange={handleChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="drug_license_number">Drug License Number</Label>
                    <Input id="drug_license_number" name="drug_license_number" value={formData.drug_license_number} onChange={handleChange} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="address" name="address" className="pl-9" value={formData.address} onChange={handleChange} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" value={formData.state} onChange={handleChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button type="button" variant="outline" onClick={handlePrev} disabled={step === 1 || loading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              {step < 3 ? (
                <Button type="submit" disabled={loading}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Provision Pharmacy'}
                  {!loading && <Save className="ml-2 h-4 w-4" />}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
