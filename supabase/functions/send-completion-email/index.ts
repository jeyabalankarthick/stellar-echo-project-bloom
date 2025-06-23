
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  applicationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { applicationId }: EmailRequest = await req.json();

    console.log('Sending completion email for application:', applicationId);

    // Get application details
    const { data: application, error: appError } = await supabaseClient
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.error('Application not found:', appError);
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Sending completion email to:', application.email);

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
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .card {
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: #10b981;
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header .icon {
              font-size: 48px;
              margin-bottom: 20px;
              display: block;
            }
            .content {
              padding: 40px 30px;
            }
            .status-badge {
              display: inline-block;
              background: #10b981;
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
            .next-steps {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
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
                <span class="icon">🎉</span>
                <h1>Application Submitted!</h1>
              </div>
              
              <div class="content">
                <div class="status-badge">SUBMITTED SUCCESSFULLY</div>
                
                <div class="message">
                  <p><strong>Thank you, ${application.founder_name}!</strong></p>
                  <p>Your startup application for <strong>${application.startup_name}</strong> has been successfully submitted to <strong>${application.incubation_centre}</strong>.</p>
                </div>

                <div class="details">
                  <div class="detail-item">
                    <span class="detail-label">Application ID:</span>
                    <span class="detail-value">${application.id}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Startup Name:</span>
                    <span class="detail-value">${application.startup_name}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Incubation Centre:</span>
                    <span class="detail-value">${application.incubation_centre}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Submission Date:</span>
                    <span class="detail-value">${new Date(application.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div class="next-steps">
                  <h3 style="margin-top: 0; color: #92400e;">📋 What happens next?</h3>
                  <ul style="margin: 10px 0; padding-left: 20px; color: #92400e;">
                    <li>Your application will be reviewed by ${application.incubation_centre}</li>
                    <li>You will receive an email notification once a decision is made</li>
                    <li>The review process typically takes 5-7 business days</li>
                  </ul>
                </div>

                <div class="message">
                  <p><strong>Important:</strong> Please keep this email for your records. You can reference your Application ID if you need to contact support.</p>
                </div>
              </div>
              
              <div class="footer">
                <p>© 2024 Dreamers Incubation. All rights reserved.</p>
                <p>Need help? Contact us at <a href="mailto:support@dreamersincubation.com">support@dreamersincubation.com</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: "Dreamers Incubation <noreply@resend.dev>",
      to: [application.email],
      subject: `✅ Application Submitted Successfully - ${application.startup_name}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending completion email:', emailError);
      return new Response(JSON.stringify({ error: 'Failed to send completion email' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Completion email sent successfully to:", application.email);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Completion email sent to ${application.email}`,
      emailResponse 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in send-completion-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
