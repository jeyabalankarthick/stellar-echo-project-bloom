
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ApplicationSuccess from './ApplicationSuccess';

interface StartupIdeaStepProps {
  data: any;
  updateData: (data: any) => void;
  onPrev: () => void;
}

const StartupIdeaStep = ({ data, updateData, onPrev }: StartupIdeaStepProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const expectationOptions = [
    'Funding Support',
    'Mentorship',
    'Office Space',
    'Networking Opportunities',
    'Legal Support',
    'Marketing Support',
    'Technical Support',
    'Business Development'
  ];

  const handleExpectationChange = (expectation: string, checked: boolean) => {
    const currentExpectations = data.expectations || [];
    if (checked) {
      updateData({ expectations: [...currentExpectations, expectation] });
    } else {
      updateData({ expectations: currentExpectations.filter((e: string) => e !== expectation) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 SUBMISSION: Starting application submission');
    console.log('📋 SUBMISSION: Application data:', data);
    
    if (!data.ideaDescription?.trim()) {
      toast({
        title: "Error",
        description: "Please describe your startup idea",
        variant: "destructive",
      });
      return;
    }

    if (!data.expectations || data.expectations.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one expectation",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields from previous steps
    const requiredFields = {
      founderName: data.founderName,
      startupName: data.startupName,
      email: data.email,
      phone: data.phone,
      companyType: data.companyType,
      teamSize: data.teamSize,
      source: data.source,
      incubationCentre: data.incubationCentre
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    if (missingFields.length > 0) {
      console.error('❌ SUBMISSION: Missing required fields:', missingFields);
      toast({
        title: "Error",
        description: `Please complete all required fields: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      console.log('💾 SUBMISSION: Inserting application into database');
      
      const applicationData = {
        founder_name: data.founderName,
        startup_name: data.startupName,
        email: data.email,
        phone: data.phone,
        company_type: data.companyType,
        team_size: data.teamSize,
        source: data.source,
        coupon_code: data.couponCode || '',
        incubation_centre: data.incubationCentre,
        registration_certificate_url: data.registrationCertificate || null,
        incubation_letter_url: data.incubationLetter || null,
        website: data.website || null,
        idea_description: data.ideaDescription,
        expectations: data.expectations,
        challenges: data.challenges || '',
        status: 'pending'
      };

      console.log('📤 SUBMISSION: Database payload:', applicationData);

      const { data: insertedApplication, error: insertError } = await supabase
        .from('applications')
        .insert([applicationData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ SUBMISSION: Database error:', insertError);
        toast({
          title: "Database Error",
          description: `Failed to save application: ${insertError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ SUBMISSION: Application saved with ID:', insertedApplication.id);
      
      // Send confirmation email to user
      console.log('📧 SUBMISSION: Sending confirmation email to user');
      
      try {
        const confirmationPayload = {
          applicationId: insertedApplication.id,
          email: data.email,
          founderName: data.founderName,
          startupName: data.startupName
        };
        
        console.log('📤 SUBMISSION: Confirmation email payload:', confirmationPayload);
        
        const confirmationResponse = await supabase.functions.invoke('send-submission-confirmation', {
          body: confirmationPayload
        });

        console.log('📧 SUBMISSION: Confirmation email response:', confirmationResponse);

        if (confirmationResponse.error) {
          console.error('❌ SUBMISSION: Confirmation email failed:', confirmationResponse.error);
          console.log('⚠️ SUBMISSION: Application saved but email failed - showing partial success message');
        } else {
          console.log('✅ SUBMISSION: Confirmation email sent successfully');
        }
      } catch (emailError) {
        console.error('💥 SUBMISSION: Confirmation email exception:', emailError);
      }
      
      // Send admin notification email
      console.log('👤 SUBMISSION: Sending admin notification email');
      
      try {
        const adminResponse = await supabase.functions.invoke('send-approval-email', {
          body: { applicationId: insertedApplication.id }
        });

        console.log('👤 SUBMISSION: Admin email response:', adminResponse);

        if (adminResponse.error) {
          console.error('❌ SUBMISSION: Admin email failed:', adminResponse.error);
        } else {
          console.log('✅ SUBMISSION: Admin notification sent successfully');
        }
      } catch (adminEmailError) {
        console.error('💥 SUBMISSION: Admin email exception:', adminEmailError);
      }

      // Show success regardless of email status
      toast({
        title: "Success!",
        description: "Your application has been submitted successfully!",
      });

      setApplicationId(insertedApplication.id);
      setSubmitted(true);

    } catch (error) {
      console.error('💥 SUBMISSION: Unexpected error:', error);
      toast({
        title: "Submission Error",
        description: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Show success component if submitted
  if (submitted && applicationId) {
    return <ApplicationSuccess applicationId={applicationId} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Startup Idea & Expectations</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="ideaDescription">Describe your startup idea *</Label>
            <Textarea
              id="ideaDescription"
              placeholder="Tell us about your startup idea, the problem you're solving, and your solution..."
              value={data.ideaDescription || ''}
              onChange={(e) => updateData({ ideaDescription: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div>
            <Label className="text-base font-medium">What do you expect from the incubation program? *</Label>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {expectationOptions.map((expectation) => (
                <div key={expectation} className="flex items-center space-x-2">
                  <Checkbox
                    id={expectation}
                    checked={data.expectations?.includes(expectation) || false}
                    onCheckedChange={(checked) => handleExpectationChange(expectation, checked as boolean)}
                  />
                  <Label htmlFor={expectation} className="text-sm font-normal">
                    {expectation}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="challenges">What challenges are you currently facing? (Optional)</Label>
            <Textarea
              id="challenges"
              placeholder="Tell us about any challenges you're facing in your startup journey..."
              value={data.challenges || ''}
              onChange={(e) => updateData({ challenges: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onPrev}>
              Previous
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StartupIdeaStep;
