import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "0");
    const year = parseInt(searchParams.get("year") || "0");

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("calendar_items")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Calendar fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch calendar" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || null);
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { month, year, image_url, title } = await request.json();

    if (!month || !year || !image_url) {
      return NextResponse.json(
        { error: "Month, year, and image_url are required" },
        { status: 400 }
      );
    }

    // Upsert - update if exists, insert if not
    const { data, error } = await supabase
      .from("calendar_items")
      .upsert(
        {
          month,
          year,
          image_url,
          title: title || `${month}/${year} Schedule`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "month,year" }
      )
      .select()
      .single();

    if (error) {
      console.error("Calendar save error:", error);
      return NextResponse.json(
        { error: "Failed to save calendar" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
