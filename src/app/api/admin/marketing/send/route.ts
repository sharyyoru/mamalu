import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { campaignId, testEmail, sendTest, sendToAll, listId } = body;

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

    // Send campaign to recipients
    if (!resend) {
      return NextResponse.json({ 
        error: "Email service not configured. Please add RESEND_API_KEY to environment variables." 
      }, { status: 500 });
    }

    let crmContacts: any[] = [];
    let profileRecipients: any[] = [];

    // If sending to a specific list, get contacts from that list
    if (listId) {
      try {
        const { data, error } = await supabase
          .from("contact_list_members")
          .select("email, contact_id, contact_source")
          .eq("list_id", listId);
        if (!error && data) {
          // Convert list members to recipients format
          crmContacts = data.map(m => ({
            id: m.contact_id || m.email,
            email: m.email,
            first_name: null,
            last_name: null,
          }));
        }
      } catch (e) {
        console.error("Error fetching list members:", e);
      }
    } else {
      // Get recipients from newsletter_leads (CRM contacts) - subscribed only
      try {
        const { data, error } = await supabase
          .from("newsletter_leads")
          .select("id, email, first_name, last_name")
          .eq("status", "subscribed");
        if (!error) crmContacts = data || [];
      } catch (e) {
        console.error("Error fetching CRM contacts:", e);
      }

      // Also get recipients from profiles
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, full_name");
        if (!error) profileRecipients = data || [];
      } catch (e) {
        console.error("Error fetching profile recipients:", e);
      }
    }

    // Combine and deduplicate by email
    const emailSet = new Set<string>();
    const recipients: Array<{
      id: string;
      email: string;
      first_name?: string;
      full_name?: string;
      total_spend?: number;
      total_classes_attended?: number;
      referral_code?: string;
      source: string;
    }> = [];

    // Add CRM contacts first
    (crmContacts || []).forEach(contact => {
      if (contact.email && !emailSet.has(contact.email.toLowerCase())) {
        emailSet.add(contact.email.toLowerCase());
        recipients.push({
          id: contact.id,
          email: contact.email,
          first_name: contact.first_name || undefined,
          full_name: contact.first_name && contact.last_name 
            ? `${contact.first_name} ${contact.last_name}` 
            : contact.first_name || undefined,
          source: "newsletter_leads"
        });
      }
    });

    // Add profile recipients (will skip duplicates)
    (profileRecipients || []).forEach(profile => {
      if (profile.email && !emailSet.has(profile.email.toLowerCase())) {
        emailSet.add(profile.email.toLowerCase());
        recipients.push({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || undefined,
          total_spend: profile.total_spend,
          total_classes_attended: profile.total_classes_attended,
          referral_code: profile.referral_code,
          source: "profiles"
        });
      }
    });

    if (recipients.length === 0) {
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
            const firstName = recipient.first_name || recipient.full_name?.split(" ")[0] || "Friend";
            const variables = {
              first_name: firstName,
              full_name: recipient.full_name || firstName || "Valued Customer",
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

            // Track recipient - skip if table doesn't exist
            try {
              const recipientRecord: Record<string, unknown> = {
                campaign_id: campaignId,
                email: recipient.email,
                sent_at: new Date().toISOString(),
                status: "sent",
              };
              if (recipient.source === "profiles") {
                recipientRecord.profile_id = recipient.id;
              }
              await supabase.from("campaign_recipients").insert(recipientRecord);
            } catch (e) {
              // Table might not exist, continue
            }

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
