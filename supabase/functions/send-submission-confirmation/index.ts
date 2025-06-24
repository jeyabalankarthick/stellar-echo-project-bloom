
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
    const { applicationId, email, founderName, startupName }: ConfirmationEmailRequest = await req.json();

    console.log(`SUBMISSION EMAIL: Sending confirmation to registered user: ${email} for application ${applicationId}`);

    const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Submitted Successfully - Dreamers Incubation</title>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 40px 20px; 
          }
          .card { 
            background: #fff; 
            border-radius: 20px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
            overflow: hidden; 
          }
          .header { 
            background: #10B981; 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header .icon { 
            font-size: 48px; 
            margin-bottom: 20px; 
            display: block; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .status-badge { 
            display: inline-block; 
            background: #10B981; 
            color: white; 
            padding: 8px 20px; 
            border-radius: 25px; 
            font-weight: 600; 
            font-size: 14px; 
            margin-bottom: 20px; 
          }
          .details { 
            background: #f8fafc; 
            border-radius: 12px; 
            padding: 25px; 
            margin: 20px 0; 
          }
          .detail-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #e2e8f0; 
          }
          .detail-item:last-child { 
            border-bottom: none; 
          }
          .detail-label { 
            font-weight: 600; 
            color: #475569; 
          }
          .detail-value { 
            color: #1e293b; 
            text-align: right; 
          }
          .message { 
            line-height: 1.6; 
            color: #475569; 
            margin: 20px 0; 
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #64748b; 
            font-size: 14px; 
            border-top: 1px solid #e2e8f0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <span class="icon">📧</span>
              <h1>Your Application Submitted Successfully!</h1>
            </div>
            <div class="content">
              <div class="status-badge">SUBMITTED</div>
              <div class="details">
                <div class="detail-item">
                  <span class="detail-label">Startup Name:</span>
                  <span class="detail-value">${startupName}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Founder:</span>
                  <span class="detail-value">${founderName}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Application ID:</span>
                  <span class="detail-value">${applicationId}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Registered Email:</span>
                  <span class="detail-value">${email}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Submitted On:</span>
                  <span class="detail-value">${new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <div class="message">
                <p><strong>Thank you for your application!</strong> We have successfully received your application for the Dreamers Incubation Program at your registered email address: <strong>${email}</strong></p>
                <p>Our team will review your application and you will receive another email at this same registered address once a decision has been made regarding your application status.</p>
                <p>If you have any questions, please don't hesitate to contact our support team.</p>
              </div>
            </div>
            <div class="footer">
              <p>© 2025 Dreamers Incubation. All rights reserved.</p>
              <p>Email: support@dreamersincubation.com</p>
            </div>
          </div>
        </div>
      </body>
    </html>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Dreamers Incubation <noreply@resend.dev>",
      to: [email],
      subject: "📧 Your Application Submitted Successfully - Dreamers Incubation",
      html: emailHtml,
    });

    if (emailError) {
      console.error("SUBMISSION EMAIL: Resend error:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send confirmation email to registered address" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SUBMISSION EMAIL: Confirmation email sent successfully to:", email, "Message ID:", emailData.id);

    return new Response(
      JSON.stringify({ success: true, message: `Confirmation email sent to registered address: ${email}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("SUBMISSION EMAIL: Error in send-submission-confirmation function:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
