
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
    // Get and validate token
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response("Missing token", { status: 400, headers: corsHeaders });
    }

    const { data: tokenRecord, error: tokErr } = await supabase
      .from("approval_tokens")
      .select("application_id, action, expires_at, used")
      .eq("token", token)
      .single();

    if (tokErr || !tokenRecord) {
      return new Response("Invalid or expired link", { status: 400, headers: corsHeaders });
    }

    if (tokenRecord.used) {
      return new Response("This link has already been used.", { status: 400, headers: corsHeaders });
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return new Response("This link has expired.", { status: 400, headers: corsHeaders });
    }

    // Fetch the application
    const { data: application, error: appErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", tokenRecord.application_id)
      .single();

    if (appErr || !application) {
      return new Response("Application not found", { status: 404, headers: corsHeaders });
    }

    // Update status
    const isApproved = tokenRecord.action === "approve";
    const newStatus = isApproved ? "approved" : "rejected";
    await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", application.id);

    // Mark token used
    await supabase
      .from("approval_tokens")
      .update({ used: true })
      .eq("token", token);

    // Send email to the registered user email address
    const statusText = isApproved ? "Approved" : "Rejected";
    const registeredEmail = application.email;
    console.log(`${statusText.toUpperCase()} EMAIL: Sending ${statusText} notification to registered email: ${registeredEmail}`);
    
    const subject = isApproved 
      ? `🎉 Congratulations! Your application has been approved - Dreamers Incubation`
      : `😔 Application Status Update - Dreamers Incubation`;
      
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application ${statusText} - Dreamers Incubation</title>
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
              background: ${isApproved ? '#10B981' : '#EF4444'}; 
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
              background: ${isApproved ? '#10B981' : '#EF4444'}; 
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
            .cta-button { 
              display: inline-block; 
              background: ${isApproved ? '#10B981' : '#6B7280'}; 
              color: white; 
              padding: 15px 30px; 
              border-radius: 8px; 
              text-decoration: none; 
              font-weight: 600; 
              margin: 20px 0; 
              transition: all .3s ease; 
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
                <span class="icon">${isApproved ? "🎉" : "😔"}</span>
                <h1>Application ${statusText}!</h1>
              </div>
              <div class="content">
                <div class="status-badge">${statusText.toUpperCase()}</div>
                <div class="details">
                  <div class="detail-item">
                    <span class="detail-label">Startup Name:</span>
                    <span class="detail-value">${application.startup_name}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Founder:</span>
                    <span class="detail-value">${application.founder_name}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Incubation Centre:</span>
                    <span class="detail-value">${application.incubation_centre}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Registered Email:</span>
                    <span class="detail-value">${registeredEmail}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Applied On:</span>
                    <span class="detail-value">${new Date(application.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div class="message">
                  ${
                    isApproved
                      ? `<p><strong>🎉 Congratulations!</strong> Your application has been approved by ${application.incubation_centre}. You now have access to all the benefits of the incubation program. This notification was sent to your registered email address: <strong>${registeredEmail}</strong></p>`
                      : `<p><strong>😔 We're sorry to inform you that your application was not approved at this time.</strong> Please feel free to reach out for feedback or consider reapplying in the future. This notification was sent to your registered email address: <strong>${registeredEmail}</strong></p>`
                  }
                </div>
                ${
                  isApproved
                    ? `<a href="${SUPABASE_URL.replace("/functions/v1", "")}" class="cta-button">Access Your Benefits →</a>`
                    : `<a href="mailto:support@dreamersincubation.com" class="cta-button">Contact Support</a>`
                }
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

    const { data: emailData, error: emailErr } = await resend.emails.send({
      from: "Dreamers Incubation <noreply@resend.dev>",
      to: [registeredEmail],
      subject,
      html: emailHtml,
    });

    if (emailErr) {
      console.error(`${statusText.toUpperCase()} EMAIL: Error sending email to registered user:`, emailErr);
    } else {
      console.log(`${statusText.toUpperCase()} EMAIL: Notification sent successfully to registered email:`, registeredEmail, "Message ID:", emailData.id);
    }

    // Return confirmation page
    const pageHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width">
          <title>Application ${statusText}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 40px 20px;
              background: linear-gradient(135deg, #667eea, #764ba2);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center; 
            }
            .container { 
              background: #fff;
              padding: 40px;
              border-radius: 20px;
              text-align: center;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .icon { 
              font-size: 64px;
              margin-bottom: 20px;
            }
            .status-badge { 
              display: inline-block;
              padding: 8px 20px;
              border-radius: 25px;
              background: ${isApproved ? '#10B981' : '#EF4444'};
              color: white;
              font-weight: 600;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">${isApproved ? "🎉" : "😔"}</div>
            <h1>Application ${statusText}!</h1>
            <div class="status-badge">${statusText.toUpperCase()}</div>
            <p>The applicant has been notified via email at: <strong>${registeredEmail}</strong></p>
          </div>
        </body>
      </html>
    `;

    return new Response(pageHtml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html" }
    });

  } catch (err) {
    console.error("APPROVAL/REJECTION EMAIL: Error in handle-approval function:", err);
    return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
  }
});
