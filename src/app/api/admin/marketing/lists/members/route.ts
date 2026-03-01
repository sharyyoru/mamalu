import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId");

    if (!listId) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("contact_list_members")
      .select("*")
      .eq("list_id", listId)
      .order("added_at", { ascending: false });

    if (error) {
      return NextResponse.json({ members: [] });
    }

    return NextResponse.json({ members: data || [] });
  } catch (error: any) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ members: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { listId, contacts } = body;

    if (!listId || !contacts || contacts.length === 0) {
      return NextResponse.json({ error: "List ID and contacts are required" }, { status: 400 });
    }

    const members = contacts.map((contact: { email: string; id?: string; source?: string }) => ({
      list_id: listId,
      email: contact.email,
      contact_id: contact.id || null,
      contact_source: contact.source || null,
    }));

    const { data, error } = await supabase
      .from("contact_list_members")
      .upsert(members, { onConflict: "list_id,email" })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ added: data?.length || 0 });
  } catch (error: any) {
    console.error("Error adding members:", error);
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
    const listId = searchParams.get("listId");
    const email = searchParams.get("email");

    if (!listId || !email) {
      return NextResponse.json({ error: "List ID and email are required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("contact_list_members")
      .delete()
      .eq("list_id", listId)
      .eq("email", email);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
