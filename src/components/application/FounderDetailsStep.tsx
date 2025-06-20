
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface FounderDetailsStepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
}

const FounderDetailsStep = ({ data, updateData, onNext }: FounderDetailsStepProps) => {
  const validateStep = () => {
    if (!data.founderName?.trim()) {
      toast({
        title: "Error",
        description: "Please enter founder name",
        variant: "destructive",
      });
      return false;
    }

    if (!data.startupName?.trim()) {
      toast({
        title: "Error",
        description: "Please enter startup name",
        variant: "destructive",
      });
      return false;
    }

    if (!data.email?.trim()) {
      toast({
        title: "Error",
        description: "Please enter email address",
        variant: "destructive",
      });
      return false;
    }

    if (!data.phone?.trim()) {
      toast({
        title: "Error",
        description: "Please enter phone number",
        variant: "destructive",
      });
      return false;
    }

    if (!data.companyType) {
      toast({
        title: "Error",
        description: "Please select company type",
        variant: "destructive",
      });
      return false;
    }

    if (!data.teamSize) {
      toast({
        title: "Error",
        description: "Please select team size",
        variant: "destructive",
      });
      return false;
    }

    if (!data.source) {
      toast({
        title: "Error",
        description: "Please select how you heard about us",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep()) {
      onNext();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Founder Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleNext} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="founderName">Founder Name *</Label>
              <Input
                id="founderName"
                value={data.founderName || ''}
                onChange={(e) => updateData({ founderName: e.target.value })}
                placeholder="Enter founder name"
                required
              />
            </div>

            <div>
              <Label htmlFor="startupName">Startup Name *</Label>
              <Input
                id="startupName"
                value={data.startupName || ''}
                onChange={(e) => updateData({ startupName: e.target.value })}
                placeholder="Enter startup name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={data.email || ''}
                onChange={(e) => updateData({ email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={data.phone || ''}
                onChange={(e) => updateData({ phone: e.target.value })}
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="companyType">Company Type *</Label>
              <Select value={data.companyType || ''} onValueChange={(value) => updateData({ companyType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Private Limited">Private Limited</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Proprietorship">Proprietorship</SelectItem>
                  <SelectItem value="LLP">LLP</SelectItem>
                  <SelectItem value="Not Registered">Not Registered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="teamSize">Team Size *</Label>
              <Select value={data.teamSize || ''} onValueChange={(value) => updateData({ teamSize: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (Solo Founder)</SelectItem>
                  <SelectItem value="2-5">2-5 Members</SelectItem>
                  <SelectItem value="6-10">6-10 Members</SelectItem>
                  <SelectItem value="11-20">11-20 Members</SelectItem>
                  <SelectItem value="20+">20+ Members</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="source">How did you hear about us? *</Label>
            <Select value={data.source || ''} onValueChange={(value) => updateData({ source: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Social Media">Social Media</SelectItem>
                <SelectItem value="Google Search">Google Search</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Event/Workshop">Event/Workshop</SelectItem>
                <SelectItem value="News/Media">News/Media</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
            <Input
              id="couponCode"
              value={data.couponCode || ''}
              onChange={(e) => updateData({ couponCode: e.target.value })}
              placeholder="Enter coupon code if you have one"
            />
            <p className="text-sm text-gray-600 mt-1">
              If you don't have a coupon code, <a href="mailto:support@dreamersincubation.com" className="text-blue-600 hover:underline">reach us</a>?
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="px-8">
              Next Step
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default FounderDetailsStep;
