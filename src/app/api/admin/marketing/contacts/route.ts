import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const source = searchParams.get("source");

    const contacts: Array<{
      id: string;
      email: string;
      first_name?: string;
      last_name?: string;
      full_name?: string;
      source: string;
    }> = [];

    const emailSet = new Set<string>();

    // Get newsletter leads (all, not just subscribed)
    if (!source || source === "newsletter_leads") {
      const { data: leads } = await supabase
        .from("newsletter_leads")
        .select("id, email, first_name, last_name")
        .order("created_at", { ascending: false });

      leads?.forEach(lead => {
        if (lead.email && !emailSet.has(lead.email.toLowerCase())) {
          emailSet.add(lead.email.toLowerCase());
          contacts.push({
            id: lead.id,
            email: lead.email,
            first_name: lead.first_name || undefined,
            last_name: lead.last_name || undefined,
            full_name: lead.first_name && lead.last_name 
              ? `${lead.first_name} ${lead.last_name}` 
              : lead.first_name || undefined,
            source: "newsletter_leads",
          });
        }
      });
    }

    // Get profiles
    if (!source || source === "profiles") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("created_at", { ascending: false });

      profiles?.forEach(profile => {
        if (profile.email && !emailSet.has(profile.email.toLowerCase())) {
          emailSet.add(profile.email.toLowerCase());
          contacts.push({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name || undefined,
            source: "profiles",
          });
        }
      });
    }

    // Filter by search if provided
    let filteredContacts = contacts;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContacts = contacts.filter(c =>
        c.email.toLowerCase().includes(searchLower) ||
        (c.first_name && c.first_name.toLowerCase().includes(searchLower)) ||
        (c.last_name && c.last_name.toLowerCase().includes(searchLower)) ||
        (c.full_name && c.full_name.toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({
      contacts: filteredContacts,
      total: contacts.length,
    });
  } catch (error: any) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
