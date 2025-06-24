
import { useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ApplicationData {
  founderName: string;
  startupName: string;
  email: string;
  phone: string;
  companyType: string;
  teamSize: string;
  source: string;
  couponCode?: string;
  incubationCentre: string;
  registrationCertificate?: string | null;
  incubationLetter?: string | null;
  website?: string | null;
  ideaDescription: string;
  expectations: string[];
  challenges?: string;
}

export const useApplicationSubmission = () => {
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const validateRequiredFields = (data: ApplicationData) => {
    if (!data.ideaDescription?.trim()) {
      toast({
        title: "Error",
        description: "Please describe your startup idea",
        variant: "destructive",
      });
      return false;
    }

    if (!data.expectations || data.expectations.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one expectation",
        variant: "destructive",
      });
      return false;
    }

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
      return false;
    }

    return true;
  };

  const sendConfirmationEmail = async (data: ApplicationData, insertedApplication: any) => {
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
      } else {
        console.log('✅ SUBMISSION: Confirmation email sent successfully');
      }
    } catch (emailError) {
      console.error('💥 SUBMISSION: Confirmation email exception:', emailError);
    }
  };

  const sendAdminNotification = async (insertedApplication: any) => {
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
  };

  const submitApplication = async (data: ApplicationData) => {
    console.log('🚀 SUBMISSION: Starting application submission');
    console.log('📋 SUBMISSION: Application data:', data);
    
    if (!validateRequiredFields(data)) {
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
      
      // Send emails
      await sendConfirmationEmail(data, insertedApplication);
      await sendAdminNotification(insertedApplication);

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

  return {
    submitting,
    applicationId,
    submitted,
    submitApplication
  };
};
