import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { campaignId, testEmail, sendTest } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Send test email
    if (sendTest && testEmail) {
      if (!resend) {
        return NextResponse.json({ 
          error: "Email service not configured. Please add RESEND_API_KEY to environment variables." 
        }, { status: 500 });
      }

      try {
        const { data, error } = await resend.emails.send({
          from: process.env.EMAIL_FROM || "Mamalu Kitchen <noreply@mamalu.ae>",
          to: testEmail,
          subject: `[TEST] ${campaign.subject}`,
          html: replaceVariables(campaign.html_content, {
            first_name: "Test",
            full_name: "Test User",
            email: testEmail,
            total_spend: "AED 1,000",
            total_classes: "5",
            referral_code: "TEST1234",
          }),
        });

        if (error) {
          console.error("Resend error:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          message: `Test email sent to ${testEmail}`,
          emailId: data?.id 
        });
      } catch (emailError: any) {
        console.error("Email send error:", emailError);
        return NextResponse.json({ error: emailError.message }, { status: 500 });
      }
    }

    // Send campaign to all recipients
    if (!resend) {
      return NextResponse.json({ 
        error: "Email service not configured. Please add RESEND_API_KEY to environment variables." 
      }, { status: 500 });
    }

    // Get recipients based on audience filter
    const { data: recipients, error: recipientsError } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone, total_spend, total_classes_attended, referral_code")
      .eq("email_enabled", true);

    if (recipientsError) throw recipientsError;

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // Update campaign status
    await supabase
      .from("marketing_campaigns")
      .update({ 
        status: "active", 
        started_at: new Date().toISOString(),
        estimated_recipients: recipients.length 
      })
      .eq("id", campaignId);

    // Send emails in batches
    let sent = 0;
    let failed = 0;
    const batchSize = 10;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (recipient) => {
          try {
            const firstName = recipient.full_name?.split(" ")[0] || "Friend";
            const variables = {
              first_name: firstName,
              full_name: recipient.full_name || "Valued Customer",
              email: recipient.email,
              total_spend: `AED ${(recipient.total_spend || 0).toLocaleString()}`,
              total_classes: String(recipient.total_classes_attended || 0),
              referral_code: recipient.referral_code || "",
            };

            await resend.emails.send({
              from: process.env.EMAIL_FROM || "Mamalu Kitchen <noreply@mamalu.ae>",
              to: recipient.email,
              subject: replaceVariables(campaign.subject, variables),
              html: replaceVariables(campaign.html_content, variables),
            });

            // Track recipient
            await supabase.from("campaign_recipients").insert({
              campaign_id: campaignId,
              profile_id: recipient.id,
              email: recipient.email,
              sent_at: new Date().toISOString(),
            });

            sent++;
          } catch (error) {
            console.error(`Failed to send to ${recipient.email}:`, error);
            failed++;
          }
        })
      );
    }

    // Update campaign stats
    await supabase
      .from("marketing_campaigns")
      .update({ 
        total_sent: sent,
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("id", campaignId);

    return NextResponse.json({ 
      success: true, 
      sent,
      failed,
      message: `Campaign sent to ${sent} recipients` 
    });
  } catch (error: any) {
    console.error("Error sending campaign:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function replaceVariables(content: string, variables: Record<string, string>): string {
  if (!content) return "";
  
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
    result = result.replace(regex, value || "");
  });
  return result;
}
