import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm, SubmitHandler } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ApplicationData {
  founderName: string;
  startupName: string;
  email: string;
  phone: string;
  companyType: string;
  teamSize: string;
  incubationCentre: string;
  website?: string;
  ideaDescription: string;
  expectations: string[];
  challenges?: string;
}

const Application = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incubationCentres, setIncubationCentres] = useState<{ id: string; name: string }[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationData>();

  useEffect(() => {
    // Fetch incubation centres on component mount
    const fetchIncubationCentres = async () => {
      try {
        const { data, error } = await supabase
          .from('incubation_centres')
          .select('id, name');

        if (error) {
          console.error('Error fetching incubation centres:', error);
          toast({
            title: "Error",
            description: "Failed to load incubation centres.",
            variant: "destructive",
          });
          return;
        }

        setIncubationCentres(data || []);
      } catch (error) {
        console.error('Error fetching incubation centres:', error);
        toast({
          title: "Error",
          description: "Failed to load incubation centres.",
          variant: "destructive",
        });
      }
    };

    fetchIncubationCentres();
  }, []);

  const submitApplication = async (data: ApplicationData) => {
    try {
      setIsSubmitting(true);
      
      // Insert the application
      const { data: applicationData, error } = await supabase
        .from('applications')
        .insert([{
          founder_name: data.founderName,
          startup_name: data.startupName,
          email: data.email,
          phone: data.phone,
          company_type: data.companyType,
          team_size: data.teamSize,
          incubation_centre: data.incubationCentre,
          website: data.website,
          idea_description: data.ideaDescription,
          expectations: data.expectations,
          challenges: data.challenges,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error submitting application:', error);
        toast({
          title: "Error",
          description: "Failed to submit application. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Application submitted successfully:', applicationData);

      // Send completion email to user
      try {
        const { error: completionEmailError } = await supabase.functions.invoke('send-completion-email', {
          body: { applicationId: applicationData.id }
        });

        if (completionEmailError) {
          console.error('Error sending completion email:', completionEmailError);
        }
      } catch (emailError) {
        console.error('Error with completion email function:', emailError);
      }

      // Send approval email to incubation center admin
      try {
        const { error: approvalEmailError } = await supabase.functions.invoke('send-approval-email', {
          body: { applicationId: applicationData.id }
        });

        if (approvalEmailError) {
          console.error('Error sending approval email:', approvalEmailError);
        }
      } catch (emailError) {
        console.error('Error with approval email function:', emailError);
      }

      setShowSuccess(true);
      setIsSubmitting(false);
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full p-8">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Application Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-center text-gray-600">
              Your application has been submitted successfully.
            </p>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Startup Incubation Application</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(submitApplication)} className="grid gap-4">
              <div>
                <Label htmlFor="founderName">Founder Name</Label>
                <Input
                  id="founderName"
                  placeholder="Enter your name"
                  {...register("founderName", { required: 'Founder name is required' })}
                  aria-invalid={errors.founderName ? "true" : "false"}
                />
                {errors.founderName && (
                  <p className="text-red-500 text-sm">{errors.founderName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="startupName">Startup Name</Label>
                <Input
                  id="startupName"
                  placeholder="Enter startup name"
                  {...register("startupName", { required: 'Startup name is required' })}
                  aria-invalid={errors.startupName ? "true" : "false"}
                />
                {errors.startupName && (
                  <p className="text-red-500 text-sm">{errors.startupName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register("email", {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  {...register("phone", { required: 'Phone number is required' })}
                  aria-invalid={errors.phone ? "true" : "false"}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="companyType">Company Type</Label>
                <Input
                  id="companyType"
                  placeholder="Enter company type"
                  {...register("companyType", { required: 'Company type is required' })}
                  aria-invalid={errors.companyType ? "true" : "false"}
                />
                {errors.companyType && (
                  <p className="text-red-500 text-sm">{errors.companyType.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="teamSize">Team Size</Label>
                <Input
                  id="teamSize"
                  type="number"
                  placeholder="Enter team size"
                  {...register("teamSize", {
                    required: 'Team size is required',
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: "Team size must be at least 1",
                    },
                  })}
                  aria-invalid={errors.teamSize ? "true" : "false"}
                />
                {errors.teamSize && (
                  <p className="text-red-500 text-sm">{errors.teamSize.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="incubationCentre">Incubation Centre</Label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an incubation centre" />
                  </SelectTrigger>
                  <SelectContent>
                    {incubationCentres.map((centre) => (
                      <SelectItem key={centre.id} value={centre.name}>
                        {centre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="incubationCentre"
                  type="hidden"
                  {...register("incubationCentre", { required: 'Incubation Centre is required' })}
                />
                {errors.incubationCentre && (
                  <p className="text-red-500 text-sm">{errors.incubationCentre.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="Enter website URL"
                  {...register("website")}
                  aria-invalid={errors.website ? "true" : "false"}
                />
                {errors.website && (
                  <p className="text-red-500 text-sm">{errors.website.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="ideaDescription">Idea Description</Label>
                <Textarea
                  id="ideaDescription"
                  placeholder="Describe your startup idea"
                  {...register("ideaDescription", { required: 'Idea description is required' })}
                  aria-invalid={errors.ideaDescription ? "true" : "false"}
                />
                {errors.ideaDescription && (
                  <p className="text-red-500 text-sm">{errors.ideaDescription.message}</p>
                )}
              </div>
              <div>
                <Label>Expectations from Incubation</Label>
                <div className="flex flex-col gap-2">
                  <div>
                    <Label htmlFor="expectation1" className="inline-flex items-center space-x-2">
                      <Checkbox id="expectation1" value="Funding" {...register("expectations")} />
                      <span>Funding</span>
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor="expectation2" className="inline-flex items-center space-x-2">
                      <Checkbox id="expectation2" value="Mentorship" {...register("expectations")} />
                      <span>Mentorship</span>
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor="expectation3" className="inline-flex items-center space-x-2">
                      <Checkbox id="expectation3" value="Networking" {...register("expectations")} />
                      <span>Networking</span>
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor="expectation4" className="inline-flex items-center space-x-2">
                      <Checkbox id="expectation4" value="Resources" {...register("expectations")} />
                      <span>Resources</span>
                    </Label>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="challenges">Challenges (Optional)</Label>
                <Textarea
                  id="challenges"
                  placeholder="Describe any challenges you're facing"
                  {...register("challenges")}
                  aria-invalid={errors.challenges ? "true" : "false"}
                />
                {errors.challenges && (
                  <p className="text-red-500 text-sm">{errors.challenges.message}</p>
                )}
              </div>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Application;
