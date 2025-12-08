import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile to check email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    // Fetch bookings for this user (by user_id or email)
    const { data: bookings, error } = await supabase
      .from("class_bookings")
      .select("*")
      .or(`user_id.eq.${user.id},attendee_email.eq.${profile?.email || user.email}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    console.error("Get user bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
