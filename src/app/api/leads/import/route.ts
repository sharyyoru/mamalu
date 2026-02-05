import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST: Bulk import leads from Excel/CSV data
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { leads, clearExisting } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads data provided" }, { status: 400 });
    }

    // Optionally clear existing leads
    if (clearExisting) {
      await supabase.from("leads").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }

    // Prepare leads for insertion
    const leadsToInsert = leads.map((lead: any) => ({
      name: lead.name || lead.Name || lead.CUSTOMER || lead.customer || "Unknown",
      email: lead.email || lead.Email || lead.EMAIL || null,
      phone: lead.phone || lead.Phone || lead.PHONE || lead.mobile || lead.Mobile || lead.MOBILE || null,
      company: lead.company || lead.Company || lead.COMPANY || null,
      lead_type: lead.lead_type || lead.type || lead.Type || lead.category || lead.Category || null,
      source: mapSource(lead.source || lead.Source || lead.SOURCE || "website"),
      status: mapStatus(lead.status || lead.Status || lead.STATUS || "new"),
      interests: lead.interests || (lead.interest ? [lead.interest] : null),
      budget_range: lead.budget_range || lead.budget || lead.Budget || null,
      notes: lead.notes || lead.Notes || lead.NOTES || lead.remarks || lead.Remarks || null,
      created_at: lead.created_at || lead.date || lead.Date || new Date().toISOString(),
    }));

    // Insert in batches of 100
    const batchSize = 100;
    let inserted = 0;
    let errors: string[] = [];

    for (let i = 0; i < leadsToInsert.length; i += batchSize) {
      const batch = leadsToInsert.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("leads")
        .insert(batch)
        .select();

      if (error) {
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
      }
    }

    return NextResponse.json({
      success: true,
      imported: inserted,
      total: leadsToInsert.length,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error: any) {
    console.error("Error importing leads:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import leads" },
      { status: 500 }
    );
  }
}

// Map source strings to valid enum values
function mapSource(source: string): string {
  const sourceMap: Record<string, string> = {
    instagram: "instagram",
    ig: "instagram",
    facebook: "facebook",
    fb: "facebook",
    website: "website",
    web: "website",
    whatsapp: "whatsapp",
    wa: "whatsapp",
    phone: "phone",
    call: "phone",
    walkin: "walkin",
    "walk-in": "walkin",
    "walk in": "walkin",
    referral: "referral",
    ref: "referral",
  };
  return sourceMap[source.toLowerCase()] || "website";
}

// Map status strings to valid enum values
function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    new: "new",
    contacted: "contacted",
    qualified: "qualified",
    proposal: "proposal",
    negotiation: "negotiation",
    won: "won",
    lost: "lost",
    converted: "won",
    closed: "won",
  };
  return statusMap[status.toLowerCase()] || "new";
}

// DELETE: Clear all leads
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { error } = await supabase
      .from("leads")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;

    return NextResponse.json({ success: true, message: "All leads cleared" });
  } catch (error: any) {
    console.error("Error clearing leads:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear leads" },
      { status: 500 }
    );
  }
}
