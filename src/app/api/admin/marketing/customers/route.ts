import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { filters } = body;

    // Start with base query - use only columns that exist
    let query = supabase
      .from("profiles")
      .select("id, email, full_name, phone, created_at");

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    // Also get newsletter leads count for total contacts
    const { count: newsletterCount } = await supabase
      .from("newsletter_leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "subscribed");

    return NextResponse.json({
      customers: data || [],
      count: (data?.length || 0) + (newsletterCount || 0),
      profileCount: data?.length || 0,
      newsletterCount: newsletterCount || 0,
    });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get customer variables for email templates
export async function GET() {
  const variables = [
    { name: "first_name", label: "First Name", example: "John" },
    { name: "full_name", label: "Full Name", example: "John Smith" },
    { name: "email", label: "Email", example: "john@example.com" },
    { name: "phone", label: "Phone", example: "+971 50 123 4567" },
    { name: "total_spend", label: "Total Spend", example: "AED 2,500" },
    { name: "total_classes", label: "Classes Attended", example: "12" },
    { name: "referral_code", label: "Referral Code", example: "JOHN1234" },
    { name: "last_order_date", label: "Last Order Date", example: "Dec 15, 2024" },
    { name: "days_since_order", label: "Days Since Last Order", example: "30" },
    { name: "birthday", label: "Birthday", example: "March 15" },
    { name: "membership_duration", label: "Member Since", example: "6 months" },
  ];

  return NextResponse.json({ variables });
}
