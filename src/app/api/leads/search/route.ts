import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/api-auth";

// GET: Search leads for smart search functionality
export async function GET(request: NextRequest) {
  // Verify user has admin access
  const authResult = await requireAuth(request, ["staff", "admin", "super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ leads: [] });
    }

    // Search leads by name, email, phone, or company
    const { data: leads, error } = await supabase
      .from("leads")
      .select("id, name, email, phone, company, status, source")
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,company.ilike.%${query}%`)
      .order("name", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Search leads error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads: leads || [] });
  } catch (error) {
    console.error("Search leads error:", error);
    return NextResponse.json({ error: "Failed to search leads" }, { status: 500 });
  }
}
