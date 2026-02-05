import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/api-auth";

// POST: Match payment links with leads and create missing leads
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request, ["admin", "super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get all payment links with customer info
    const { data: paymentLinks, error: linksError } = await supabase
      .from("payment_links")
      .select("id, customer_name, customer_email, customer_phone, status, paid_at, amount")
      .not("customer_phone", "is", null)
      .order("created_at", { ascending: false });

    if (linksError) throw linksError;

    // Get all existing leads
    const { data: existingLeads, error: leadsError } = await supabase
      .from("leads")
      .select("id, name, email, phone");

    if (leadsError) throw leadsError;

    // Create lookup maps for faster matching
    const phoneToLead = new Map<string, any>();
    const emailToLead = new Map<string, any>();
    
    existingLeads?.forEach(lead => {
      if (lead.phone) {
        // Normalize phone by removing spaces, dashes, and keeping only digits
        const normalizedPhone = lead.phone.replace(/[\s\-\(\)]/g, '');
        phoneToLead.set(normalizedPhone, lead);
      }
      if (lead.email) {
        emailToLead.set(lead.email.toLowerCase(), lead);
      }
    });

    let matched = 0;
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process payment links in batches
    const newLeads: any[] = [];
    const seenPhones = new Set<string>();

    for (const link of paymentLinks || []) {
      try {
        const normalizedPhone = link.customer_phone?.replace(/[\s\-\(\)]/g, '') || '';
        const normalizedEmail = link.customer_email?.toLowerCase() || '';

        // Check if already matched by phone or email
        let existingLead = normalizedPhone ? phoneToLead.get(normalizedPhone) : null;
        if (!existingLead && normalizedEmail) {
          existingLead = emailToLead.get(normalizedEmail);
        }

        if (existingLead) {
          matched++;
          continue;
        }

        // Skip if we've already seen this phone in this batch
        if (normalizedPhone && seenPhones.has(normalizedPhone)) {
          skipped++;
          continue;
        }

        if (normalizedPhone) {
          seenPhones.add(normalizedPhone);
        }

        // Determine status based on payment link status
        let leadStatus = 'new';
        if (link.status === 'paid' || link.paid_at) {
          leadStatus = 'won';
        } else if (link.status === 'active') {
          leadStatus = 'proposal';
        }

        // Create new lead
        newLeads.push({
          name: link.customer_name || 'Unknown',
          email: link.customer_email || null,
          phone: link.customer_phone || null,
          source: 'whatsapp',
          status: leadStatus,
          notes: `Auto-created from payment link. Amount: AED ${link.amount}`,
          lead_type: 'individual',
        });

      } catch (err: any) {
        errors.push(`Error processing link ${link.id}: ${err.message}`);
      }
    }

    // Insert new leads in batches of 100
    if (newLeads.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < newLeads.length; i += batchSize) {
        const batch = newLeads.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from("leads")
          .insert(batch);

        if (insertError) {
          errors.push(`Batch insert error: ${insertError.message}`);
        } else {
          created += batch.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      matched,
      created,
      skipped,
      total: paymentLinks?.length || 0,
      errors: errors.length > 0 ? errors : null,
    });

  } catch (error: any) {
    console.error("Match payment links error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to match payment links" },
      { status: 500 }
    );
  }
}

// GET: Preview what would be matched/created without actually doing it
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, ["admin", "super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get all payment links with customer info
    const { data: paymentLinks, error: linksError } = await supabase
      .from("payment_links")
      .select("id, customer_name, customer_email, customer_phone, status, paid_at, amount")
      .not("customer_phone", "is", null);

    if (linksError) throw linksError;

    // Get all existing leads
    const { data: existingLeads, error: leadsError } = await supabase
      .from("leads")
      .select("id, name, email, phone");

    if (leadsError) throw leadsError;

    // Create lookup maps
    const phoneToLead = new Map<string, any>();
    const emailToLead = new Map<string, any>();
    
    existingLeads?.forEach(lead => {
      if (lead.phone) {
        const normalizedPhone = lead.phone.replace(/[\s\-\(\)]/g, '');
        phoneToLead.set(normalizedPhone, lead);
      }
      if (lead.email) {
        emailToLead.set(lead.email.toLowerCase(), lead);
      }
    });

    let wouldMatch = 0;
    let wouldCreate = 0;
    const seenPhones = new Set<string>();
    const unmatchedSample: any[] = [];

    for (const link of paymentLinks || []) {
      const normalizedPhone = link.customer_phone?.replace(/[\s\-\(\)]/g, '') || '';
      const normalizedEmail = link.customer_email?.toLowerCase() || '';

      let existingLead = normalizedPhone ? phoneToLead.get(normalizedPhone) : null;
      if (!existingLead && normalizedEmail) {
        existingLead = emailToLead.get(normalizedEmail);
      }

      if (existingLead) {
        wouldMatch++;
      } else if (normalizedPhone && !seenPhones.has(normalizedPhone)) {
        seenPhones.add(normalizedPhone);
        wouldCreate++;
        if (unmatchedSample.length < 10) {
          unmatchedSample.push({
            name: link.customer_name,
            phone: link.customer_phone,
            email: link.customer_email,
            status: link.status,
          });
        }
      }
    }

    return NextResponse.json({
      totalPaymentLinks: paymentLinks?.length || 0,
      totalExistingLeads: existingLeads?.length || 0,
      wouldMatch,
      wouldCreate,
      unmatchedSample,
    });

  } catch (error: any) {
    console.error("Preview match error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to preview match" },
      { status: 500 }
    );
  }
}
