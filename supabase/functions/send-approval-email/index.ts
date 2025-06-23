/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend }        from "https://esm.sh/resend@2.0.0";

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY            = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend   = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin":   "*",
  "Access-Control-Allow-Headers":  "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1) Extract the token from the query string
    const url   = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response("Missing token", { status: 400, headers: corsHeaders });
    }

    // 2) Look up & validate the token
    const { data: tok, error: tokErr } = await supabase
      .from("approval_tokens")
      .select("application_id, action, expires_at, used")
      .eq("token", token)
      .single();

    if (tokErr || !tok) {
      return new Response("Invalid or expired link", { status: 400, headers: corsHeaders });
    }
    if (tok.used) {
      return new Response("This link has already been used.", { status: 400, headers: corsHeaders });
    }
    if (new Date(tok.expires_at) < new Date()) {
      return new Response("This link has expired.", { status: 400, headers: corsHeaders });
    }

    // 3) Fetch the application row
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("startup_name, founder_name, incubation_centre, email, created_at")
      .eq("id", tok.application_id)
      .single();

    if (appErr || !app) {
      return new Response("Application not found", { status: 404, headers: corsHeaders });
    }

    // 4) Update its status
    const isApproved = tok.action === "approve";
    const newStatus  = isApproved ? "approved" : "rejected";
    await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", tok.application_id);

    // 5) Mark the token used
    await supabase
      .from("approval_tokens")
      .update({ used: true })
      .eq("token", token);

    // 6) *Send the email to the USER* at app.email
    const statusText = isApproved ? "Approved" : "Rejected";
    const subject    = Your Dreamers application has been ${statusText}!;
    const emailHtml  = `
      <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:20px">
        <h2>Hi ${app.founder_name},</h2>
        <p>Your application to <strong>${app.incubation_centre}</strong> has been <strong>${statusText}</strong>.</p>
        ${
          isApproved
            ? <p>🎉 Congratulations! We look forward to supporting your startup.</p>
            : <p>😔 We’re sorry—your application was not approved at this time.</p>
        }
        <p>Thank you for applying to Dreamers Incubation.</p>
      </body></html>
    `;

    const { error: emailErr } = await resend.emails.send({
      from:    "Dreamers Incubation <noreply@dreamersincubation.com>",
      to:      [app.email],
      subject,
      html:    emailHtml,
    });

    if (emailErr) {
      console.error("❌ Failed to send applicant email:", emailErr);
    } else {
      console.log("✅ Applicant notified, message sent to:", app.email);
    }

    // 7) Return the HTML confirmation for the admin
    const pageHtml = `
      <!DOCTYPE html><html><head>
        <meta charset="utf-8"><meta name="viewport" content="width=device-width">
        <title>Application ${statusText}</title>
        <style>
          body {
            margin:0;padding:40px 20px;
            background:linear-gradient(135deg,#667eea,#764ba2);
            font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
            display:flex;align-items:center;justify-content:center;
            min-height:100vh;
          }
          .box {
            background:#fff;padding:40px;border-radius:20px;
            box-shadow:0 20px 40px rgba(0,0,0,0.1);
            text-align:center;
          }
          .icon { font-size:64px;margin-bottom:20px;}
          .badge {
            display:inline-block;padding:8px 20px;border-radius:25px;
            background:${ isApproved ? "#10B981" : "#EF4444" };color:#fff;
            font-weight:600;margin:20px 0;
          }
        </style>
      </head><body>
        <div class="box">
          <div class="icon">${ isApproved ? "🎉" : "😔" }</div>
          <h1>Application ${statusText}!</h1>
          <div class="badge">${statusText.toUpperCase()}</div>
          <p>The applicant at <strong>${app.email}</strong> has been notified.</p>
        </div>
      </body></html>
    `;

    return new Response(pageHtml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });

  } catch (err) {
    console.error("handle-approval error:", err);
    return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
  }
});
