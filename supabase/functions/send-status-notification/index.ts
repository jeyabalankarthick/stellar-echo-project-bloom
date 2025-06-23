import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusNotificationRequest {
  applicationId: string;
  status: 'approved' | 'rejected';
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, status }: StatusNotificationRequest = await req.json();

    // 1. Fetch application details
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("Application not found:", appError);
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Determine status specifics
    const isApproved = status === "approved";
    const statusText = isApproved ? "Approved" : "Rejected";
    const statusColor = isApproved ? "#10B981" : "#EF4444";
    const statusIcon = isApproved ? "🎉" : "😔";

    // 3. Build HTML email payload
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application ${statusText} - Dreamers Incubation</title>
          <style>
            body { margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); min-height:100vh; }
            .container { max-width:600px; margin:0 auto; padding:40px 20px; }
            .card { background:#fff; border-radius:20px; box-shadow:0 20px 40px rgba(0,0,0,0.1); overflow:hidden; }
            .header { background:${statusColor}; color:white; padding:40px 30px; text-align:center; }
            .header .icon { font-size:48px; margin-bottom:20px; display:block; }
            .header h1 { margin:0; font-size:28px; font-weight:700; }
            .content { padding:40px 30px; }
            .status-badge { display:inline-block; background:${statusColor}; color:white; padding:8px 20px; border-radius:25px; font-weight:600; font-size:14px; margin-bottom:20px; }
            .details { background:#f8fafc; border-radius:12px; padding:25px; margin:20px 0; }
            .detail-item { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e2e8f0; }
            .detail-item:last-child { border-bottom:none; }
            .detail-label { font-weight:600; color:#475569; }
            .detail-value { color:#1e293b; text-align:right; }
            .message { line-height:1.6; color:#475569; margin:20px 0; }
            .cta-button { display:inline-block; background:${statusColor}; color:white; padding:15px 30px; border-radius:8px; text-decoration:none; font-weight:600; margin:20px 0; transition:all .3s ease; }
            .footer { text-align:center; padding:20px; color:#64748b; font-size:14px; border-top:1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <span class="icon">${statusIcon}</span>
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
                    <span class="detail-label">Applied On:</span>
                    <span class="detail-value">${new Date(application.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div class="message">
                  ${
                    isApproved
                      ? <p><strong>Congratulations!</strong> Your application has been approved by ${application.incubation_centre}. You now have access to all the benefits.</p>
                      : <p>We’re sorry to inform you that your application was not approved at this time. Please feel free to reach out for feedback.</p>
                  }
                </div>
                ${
                  isApproved
                    ? <a href="${Deno.env.get("SUPABASE_URL")?.replace("/functions/v1", "")}/login" class="cta-button">Access Your Benefits →</a>
                    : <a href="mailto:support@dreamersincubation.com" class="cta-button">Contact Support</a>
                }
              </div>
              <div class="footer">
                <p>© 2025 Dreamers Incubation. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // 4. Send the email
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Dreamers Incubation <noreply@resend.dev>",
        to: [application.email],
        subject: 🎉 Your Application has been ${statusText}!,
        html: emailHtml,
      });

      if (emailError) {
        console.error("Resend error:", emailError);
        return new Response(
          JSON.stringify({ error: "Failed to send status email" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Status notification sent, message ID:", emailData.id);

      return new Response(
        JSON.stringify({ success: true, message: Email sent to ${application.email} }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.error("Unexpected Resend error:", err);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (err) {
    console.error("Error in send-status-notification function:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});



send status application
