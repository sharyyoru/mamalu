import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Failed to create Supabase client");
    const body = await request.json();
    const { name, email, phone, source, type, message } = body;

    // Create the inquiry/contact submission
    const { data: inquiry, error: inquiryError } = await supabase
      .from("contact_submissions")
      .insert({
        name,
        email,
        phone,
        subject: type === "website_chat" ? "Live Chat Inquiry" : "Website Inquiry",
        message: message || "Initial contact",
        is_read: false,
      })
      .select()
      .single();

    if (inquiryError) {
      console.error("Error creating inquiry:", inquiryError);
    }

    const serviceSupabase = createServiceClient();
    if (!serviceSupabase) throw new Error("Failed to create Supabase service client");

    const isContactPageInquiry = source === "contact_page";
    const leadPayload = isContactPageInquiry
      ? {
          name,
          email,
          phone,
          source: "website",
          status: "new",
          lead_type: "contact_inquiry",
          notes: [
            `Subject: ${type || "General Inquiry"}`,
            "Original source: contact_page",
            `Message: ${message || "N/A"}`,
          ].join("\n"),
        }
      : {
          name,
          email,
          phone,
          source: source || "website",
          status: "new",
          lead_type: type || "website",
          notes: `Source: ${source || "website"}\nInitial message: ${message || "N/A"}`,
        };

    // Also create a lead for tracking. Use the service client so public
    // inquiry submissions are not blocked by leads RLS policies.
    const { data: lead, error: leadError } = await serviceSupabase
      .from("leads")
      .insert(leadPayload)
      .select()
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      throw leadError;
    }

    return NextResponse.json({
      success: true,
      inquiry,
      lead,
    });
  } catch (error) {
    console.error("Error in inquiries API:", error);
    return NextResponse.json(
      { error: "Failed to create inquiry" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Failed to create Supabase client");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status === "unread") {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ inquiries: data });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Failed to create Supabase client");
    const body = await request.json();
    const { id, is_read, replied_at } = body;

    const updateData: Record<string, unknown> = {};
    if (is_read !== undefined) updateData.is_read = is_read;
    if (replied_at) updateData.replied_at = replied_at;

    const { data, error } = await supabase
      .from("contact_submissions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ inquiry: data });
  } catch (error) {
    console.error("Error updating inquiry:", error);
    return NextResponse.json(
      { error: "Failed to update inquiry" },
      { status: 500 }
    );
  }
}
