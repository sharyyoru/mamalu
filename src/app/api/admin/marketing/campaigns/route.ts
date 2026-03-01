import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    let query = supabase
      .from("marketing_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ campaigns: data || [] });
  } catch (error: any) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      subject,
      html_content,
      email_design,
      audience_filter,
      audience_name,
      scheduled_at,
      start_date,
      end_date,
    } = body;

    // Build insert object with only provided fields
    const insertData: Record<string, unknown> = {
      name,
      type: type || "email",
      subject,
      html_content,
      status: "draft",
    };
    
    // Add optional fields if provided
    if (description) insertData.description = description;
    if (email_design) insertData.email_design = email_design;
    if (audience_filter) insertData.audience_filter = audience_filter;
    if (audience_name) insertData.audience_name = audience_name;
    if (scheduled_at) insertData.scheduled_at = scheduled_at;
    if (start_date) insertData.start_date = start_date;
    if (end_date) insertData.end_date = end_date;

    const { data, error } = await supabase
      .from("marketing_campaigns")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ campaign: data });
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("marketing_campaigns")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ campaign: data });
  } catch (error: any) {
    console.error("Error updating campaign:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("marketing_campaigns")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
