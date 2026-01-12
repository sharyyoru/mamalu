import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/api-auth";

/**
 * GET: Fetch all bookings with check-in status for admin dashboard
 */
export async function GET(request: NextRequest) {
  // Verify user is staff/admin
  const authResult = await requireAuth(request, ["staff", "admin", "super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("class_bookings")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (classId) {
      query = query.eq("class_id", classId);
    }

    if (status) {
      if (status === "checked_in") {
        query = query.not("checked_in_at", "is", null);
      } else if (status === "not_checked_in") {
        query = query.is("checked_in_at", null).eq("status", "confirmed");
      } else {
        query = query.eq("status", status);
      }
    }

    const { data: bookings, error, count } = await query;

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      bookings: bookings || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: unknown) {
    console.error("Get attendees error:", error);
    return NextResponse.json({ error: "Failed to fetch attendees" }, { status: 500 });
  }
}
