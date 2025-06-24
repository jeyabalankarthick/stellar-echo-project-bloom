
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  applicationId: string;
  email: string;
  founderName: string;
  startupName: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 CONFIRMATION EMAIL: Function started");

    // Check if Resend API key exists
    if (!RESEND_API_KEY) {
      console.error("❌ CONFIRMATION EMAIL: RESEND_API_KEY is missing");
      return new Response(
        JSON.stringify({ error: "Email service not configured - missing API key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ CONFIRMATION EMAIL: RESEND_API_KEY found");

    const requestBody = await req.json();
    console.log("📧 CONFIRMATION EMAIL: Request body:", requestBody);

    const { applicationId, email, founderName, startupName }: ConfirmationEmailRequest = requestBody;

    if (!applicationId || !email || !founderName || !startupName) {
      console.error("❌ CONFIRMATION EMAIL: Missing required fields:", {
        applicationId: !!applicationId,
        email: !!email,
        founderName: !!founderName,
        startupName: !!startupName
      });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📨 CONFIRMATION EMAIL: Preparing to send to ${email}`);

    const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Submitted Successfully</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10B981; font-size: 28px; margin: 0;">🎉 Application Submitted!</h1>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Application Details:</h3>
              <p><strong>Startup Name:</strong> ${startupName}</p>
              <p><strong>Founder:</strong> ${founderName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Application ID:</strong> ${applicationId}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="color: #6b7280; line-height: 1.6;">
              <p>Dear ${founderName},</p>
              <p>Thank you for submitting your application to the Dreamers Incubation Program!</p>
              <p>We have successfully received your application for <strong>${startupName}</strong>. Our team will review your submission and notify you once a decision has been made.</p>
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px;">
              <p>© 2025 Dreamers Incubation Program</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
    `;

    console.log("📤 CONFIRMATION EMAIL: Attempting to send via Resend");

    const emailResult = await resend.emails.send({
      from: "Dreamers Incubation <noreply@resend.dev>",
      to: [email],
      subject: "🎉 Application Submitted Successfully - Dreamers Incubation",
      html: emailHtml,
    });

    console.log("📧 CONFIRMATION EMAIL: Resend response:", emailResult);

    if (emailResult.error) {
      console.error("❌ CONFIRMATION EMAIL: Resend error:", emailResult.error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send confirmation email", 
          details: emailResult.error,
          resendError: true 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ CONFIRMATION EMAIL: Successfully sent to ${email}, Message ID: ${emailResult.data?.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Confirmation email sent successfully to ${email}`,
        messageId: emailResult.data?.id,
        email: email
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("💥 CONFIRMATION EMAIL: Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
