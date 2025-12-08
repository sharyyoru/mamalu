import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Fetch all users with role 'instructor'
export async function GET() {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: instructors, error } = await supabase
      .from("profiles")
      .select(`
        id, 
        email, 
        full_name, 
        phone, 
        avatar_url,
        instructor_title,
        instructor_bio,
        instructor_specialties,
        instructor_experience_years,
        instructor_image_url
      `)
      .eq("role", "instructor")
      .order("full_name", { ascending: true });

    if (error) {
      console.error("Error fetching instructors:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ instructors: instructors || [] });
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return NextResponse.json({ error: "Failed to fetch instructors" }, { status: 500 });
  }
}
