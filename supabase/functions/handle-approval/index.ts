
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response('Missing token', { status: 400, headers: corsHeaders });
    }

    // Get the approval token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('approval_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        `<!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Invalid or Expired Token</h1>
            <p>This approval link is no longer valid.</p>
          </body>
        </html>`,
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "text/html" }
        }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        `<!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Token Expired</h1>
            <p>This approval link has expired.</p>
          </body>
        </html>`,
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "text/html" }
        }
      );
    }

    const action = tokenData.action;
    const applicationId = tokenData.application_id;

    // Update application status
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected'
    };

    if (action === 'approve') {
      updateData.approved_at = new Date().toISOString();
    } else {
      updateData.rejected_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseClient
      .from('applications')
      .update(updateData)
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error updating application:', updateError);
      return new Response('Error updating application', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Mark token as used
    await supabaseClient
      .from('approval_tokens')
      .update({ used: true })
      .eq('token', token);

    // Send status notification email to applicant
    try {
      await supabaseClient.functions.invoke('send-status-notification', {
        body: { 
          applicationId: applicationId, 
          status: action === 'approve' ? 'approved' : 'rejected' 
        }
      });
    } catch (emailError) {
      console.error('Error sending status notification:', emailError);
    }

    const statusText = action === 'approve' ? 'Approved' : 'Rejected';
    const successColor = action === 'approve' ? '#10b981' : '#ef4444';

    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Application ${statusText}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              margin: 0;
            }
            .card {
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              max-width: 500px;
              margin: 0 auto;
            }
            .success-icon {
              font-size: 64px;
              color: ${successColor};
              margin-bottom: 20px;
            }
            h1 {
              color: ${successColor};
              margin-bottom: 20px;
            }
            p {
              color: #666;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success-icon">${action === 'approve' ? '✅' : '❌'}</div>
            <h1>Application ${statusText}!</h1>
            <p>The application has been successfully ${action === 'approve' ? 'approved' : 'rejected'}.</p>
            <p>The applicant will receive an email notification about this decision.</p>
          </div>
        </body>
      </html>`,
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      }
    );

  } catch (error: any) {
    console.error("Error in handle-approval function:", error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
};

serve(handler);
