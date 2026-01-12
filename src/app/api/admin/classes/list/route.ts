import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/api-auth";

/**
 * GET: Fetch list of classes for dropdown/filter
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

    // Get distinct classes from bookings
    const { data: bookings, error } = await supabase
      .from("class_bookings")
      .select("class_id, class_title")
      .order("class_title");

    if (error) {
      console.error("Fetch classes error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unique classes
    const classMap = new Map<string, { id: string; title: string }>();
    (bookings || []).forEach(b => {
      if (b.class_id && !classMap.has(b.class_id)) {
        classMap.set(b.class_id, { id: b.class_id, title: b.class_title });
      }
    });

    const classes = Array.from(classMap.values());

    return NextResponse.json({ classes });
  } catch (error: unknown) {
    console.error("Get classes error:", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}
