
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
    console.log("SUBMISSION EMAIL: Function called");

    if (!RESEND_API_KEY) {
      console.error("SUBMISSION EMAIL: RESEND_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { applicationId, email, founderName, startupName }: ConfirmationEmailRequest = await req.json();

    console.log(`SUBMISSION EMAIL: Processing request for ${email}, Application ID: ${applicationId}`);

    if (!applicationId || !email || !founderName || !startupName) {
      console.error("SUBMISSION EMAIL: Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Submitted Successfully - Dreamers Incubation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: #10B981; color: white; padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 20px;">📧</div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Your Application Submitted Successfully!</h1>
            </div>
            <div style="padding: 40px 30px;">
              <div style="display: inline-block; background: #10B981; color: white; padding: 8px 20px; border-radius: 25px; font-weight: 600; font-size: 14px; margin-bottom: 20px;">SUBMITTED</div>
              <div style="background: #f8fafc; border-radius: 12px; padding: 25px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="font-weight: 600; color: #475569;">Startup Name:</span>
                  <span style="color: #1e293b;">${startupName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="font-weight: 600; color: #475569;">Founder:</span>
                  <span style="color: #1e293b;">${founderName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="font-weight: 600; color: #475569;">Application ID:</span>
                  <span style="color: #1e293b;">${applicationId}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="font-weight: 600; color: #475569;">Email:</span>
                  <span style="color: #1e293b;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="font-weight: 600; color: #475569;">Submitted On:</span>
                  <span style="color: #1e293b;">${new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <div style="line-height: 1.6; color: #475569; margin: 20px 0;">
                <p><strong>Thank you for your application!</strong> We have successfully received your application for the Dreamers Incubation Program.</p>
                <p>Our team will review your application and you will receive another email once a decision has been made regarding your application status.</p>
                <p>If you have any questions, please don't hesitate to contact our support team.</p>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">
              <p>© 2025 Dreamers Incubation. All rights reserved.</p>
              <p>Email: support@dreamersincubation.com</p>
            </div>
          </div>
        </div>
      </body>
    </html>
    `;

    console.log("SUBMISSION EMAIL: Sending email via Resend");

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Dreamers Incubation <noreply@resend.dev>",
      to: [email],
      subject: "📧 Your Application Submitted Successfully - Dreamers Incubation",
      html: emailHtml,
    });

    if (emailError) {
      console.error("SUBMISSION EMAIL: Resend error:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send confirmation email", details: emailError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SUBMISSION EMAIL: Email sent successfully to:", email, "Message ID:", emailData?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Confirmation email sent successfully to ${email}`,
        messageId: emailData?.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("SUBMISSION EMAIL: Unexpected error:", err);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: err instanceof Error ? err.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
