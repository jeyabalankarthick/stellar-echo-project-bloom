
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

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 ADMIN EMAIL: Function started");

    if (!RESEND_API_KEY) {
      console.error("❌ ADMIN EMAIL: RESEND_API_KEY is missing");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { applicationId } = await req.json();
    console.log(`📋 ADMIN EMAIL: Processing application ID: ${applicationId}`);

    if (!applicationId) {
      console.error("❌ ADMIN EMAIL: Missing applicationId");
      return new Response(
        JSON.stringify({ error: "Missing applicationId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.error("❌ ADMIN EMAIL: Failed to fetch application:", appError);
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📄 ADMIN EMAIL: Application found for ${application.startup_name}`);

    // Get the incubation centre admin email
    const { data: incubationCentre, error: centreError } = await supabase
      .from('incubation_centres')
      .select('admin_email, name')
      .eq('name', application.incubation_centre)
      .single();

    if (centreError || !incubationCentre) {
      console.error("❌ ADMIN EMAIL: Failed to fetch incubation centre:", centreError);
      return new Response(
        JSON.stringify({ error: "Incubation centre not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminEmail = incubationCentre.admin_email;
    console.log(`👤 ADMIN EMAIL: Admin email found: ${adminEmail}`);

    // Generate approval tokens
    const approveToken = crypto.randomUUID();
    const rejectToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    console.log("🔑 ADMIN EMAIL: Generating approval tokens");

    // Store tokens in database
    const { error: tokenError } = await supabase
      .from('approval_tokens')
      .insert([
        {
          token: approveToken,
          application_id: applicationId,
          action: 'approve',
          expires_at: expiresAt.toISOString(),
          used: false
        },
        {
          token: rejectToken,
          application_id: applicationId,
          action: 'reject',
          expires_at: expiresAt.toISOString(),
          used: false
        }
      ]);

    if (tokenError) {
      console.error("❌ ADMIN EMAIL: Failed to store tokens:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to generate approval tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ ADMIN EMAIL: Tokens stored successfully");

    // Create approval URLs
    const baseUrl = SUPABASE_URL.replace('/rest/v1', '');
    const approveUrl = `${baseUrl}/functions/v1/handle-approval?token=${approveToken}`;
    const rejectUrl = `${baseUrl}/functions/v1/handle-approval?token=${rejectToken}`;

    console.log("🔗 ADMIN EMAIL: Approval URLs generated");

    const adminEmailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Application Review Required</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; font-size: 28px; margin: 0;">📋 New Application Review</h1>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Application Details:</h3>
              <p><strong>Startup Name:</strong> ${application.startup_name}</p>
              <p><strong>Founder:</strong> ${application.founder_name}</p>
              <p><strong>Email:</strong> ${application.email}</p>
              <p><strong>Phone:</strong> ${application.phone}</p>
              <p><strong>Company Type:</strong> ${application.company_type}</p>
              <p><strong>Team Size:</strong> ${application.team_size}</p>
              <p><strong>Incubation Centre:</strong> ${application.incubation_centre}</p>
              <p><strong>Applied On:</strong> ${new Date(application.created_at).toLocaleDateString()}</p>
            </div>
            
            <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #92400e; margin-top: 0;">Startup Idea:</h4>
              <p style="color: #451a03;">${application.idea_description}</p>
              
              <h4 style="color: #92400e;">Expectations:</h4>
              <p style="color: #451a03;">${application.expectations?.join(', ') || 'Not specified'}</p>
              
              ${application.challenges ? `
                <h4 style="color: #92400e;">Challenges:</h4>
                <p style="color: #451a03;">${application.challenges}</p>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <h3 style="color: #374151;">Review This Application:</h3>
              <div style="margin: 20px 0;">
                <a href="${approveUrl}" style="display: inline-block; background: #10B981; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 0 10px;">
                  ✅ APPROVE APPLICATION
                </a>
                <a href="${rejectUrl}" style="display: inline-block; background: #EF4444; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 0 10px;">
                  ❌ REJECT APPLICATION
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Click one of the buttons above to approve or reject this application. The applicant will be automatically notified of your decision.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px;">
              <p>© 2025 Dreamers Incubation Program</p>
              <p>This email was sent to: ${adminEmail}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
    `;

    console.log(`📤 ADMIN EMAIL: Sending to admin: ${adminEmail}`);

    const emailResult = await resend.emails.send({
      from: "Dreamers Incubation <noreply@resend.dev>",
      to: [adminEmail],
      subject: `📋 New Application Review Required - ${application.startup_name}`,
      html: adminEmailHtml,
    });

    console.log("📧 ADMIN EMAIL: Resend response:", emailResult);

    if (emailResult.error) {
      console.error("❌ ADMIN EMAIL: Failed to send:", emailResult.error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send admin notification email", 
          details: emailResult.error 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ ADMIN EMAIL: Successfully sent to ${adminEmail}, Message ID: ${emailResult.data?.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Admin notification sent to ${adminEmail}`,
        messageId: emailResult.data?.id,
        adminEmail: adminEmail
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("💥 ADMIN EMAIL: Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
