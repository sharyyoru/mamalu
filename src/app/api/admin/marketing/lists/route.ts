import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("contact_lists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // Table might not exist yet
      console.error("Error fetching lists:", error);
      return NextResponse.json({ lists: [] });
    }

    return NextResponse.json({ lists: data || [] });
  } catch (error: any) {
    console.error("Error fetching lists:", error);
    return NextResponse.json({ lists: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { name, description, color, contacts } = body;

    if (!name) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 });
    }

    // Create list
    const { data: list, error: listError } = await supabase
      .from("contact_lists")
      .insert({ name, description, color: color || "#8B5CF6" })
      .select()
      .single();

    if (listError) {
      console.error("Error creating list:", listError);
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    // Add contacts if provided
    if (contacts && contacts.length > 0) {
      const members = contacts.map((contact: { email: string; id?: string; source?: string }) => ({
        list_id: list.id,
        email: contact.email,
        contact_id: contact.id || null,
        contact_source: contact.source || null,
      }));

      const { error: membersError } = await supabase
        .from("contact_list_members")
        .insert(members);

      if (membersError) {
        console.error("Error adding members:", membersError);
      }
    }

    return NextResponse.json({ list });
  } catch (error: any) {
    console.error("Error creating list:", error);
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
    const { id, name, description, color } = body;

    if (!id) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("contact_lists")
      .update({ name, description, color, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ list: data });
  } catch (error: any) {
    console.error("Error updating list:", error);
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
      return NextResponse.json({ error: "List ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("contact_lists")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting list:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
