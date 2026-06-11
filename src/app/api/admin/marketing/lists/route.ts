import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface BookingCategory {
  key: string;
  name: string;
  color: string;
  serviceName: string;
}

const BOOKING_CATEGORIES: BookingCategory[] = [
  { key: "mini-classics", name: "Mini Chef - Our Classics", color: "#FF8C6B", serviceName: "Mini Chef - Our Classics" },
  { key: "mini-monthly", name: "Mini Chef - Monthly Specials", color: "#F59E0B", serviceName: "Mini Chef - Monthly Specials" },
  { key: "mini-mommy-me", name: "Mini Chef - Mommy & Me", color: "#EC4899", serviceName: "Mini Chef - Mommy & Me" },
  { key: "mini-birthdays", name: "Mini Chef - Birthdays", color: "#EF4444", serviceName: "Mini Chef - Birthdays" },
  { key: "mini-packages", name: "Mini Chef - Packages", color: "#8B5CF6", serviceName: "Mini Chef - Packages" },
  { key: "mini-summer-camp", name: "Mini Chef - Summer Camp", color: "#10B981", serviceName: "Mini Chef - Summer Camp" },
  { key: "big-corporate", name: "Big Chef - Corporate / Private", color: "#3B82F6", serviceName: "Big Chef - Corporate / Private" },
  { key: "big-classics", name: "Big Chef - Our Classics", color: "#6366F1", serviceName: "Big Chef - Our Classics" },
  { key: "big-monthly", name: "Big Chef - Monthly Specials", color: "#06B6D4", serviceName: "Big Chef - Monthly Specials" },
  { key: "big-teenager", name: "Big Chef - Teenager Course", color: "#F97316", serviceName: "Big Chef - Teenager Course" },
  { key: "big-nanny", name: "Big Chef - Nanny Class", color: "#14B8A6", serviceName: "Big Chef - Nanny Class" },
];

const categoryDescription = (key: string) => `Auto-synced booking category: ${key}`;
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Unknown error";

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

    // Get member counts for each list
    const listsWithCounts = await Promise.all(
      (data || []).map(async (list) => {
        const { count } = await supabase
          .from("contact_list_members")
          .select("*", { count: "exact", head: true })
          .eq("list_id", list.id);
        return { ...list, member_count: count || 0 };
      })
    );

    return NextResponse.json({ lists: listsWithCounts });
  } catch (error: unknown) {
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
    const { action, name, description, color, contacts } = body;

    if (action === "syncBookingCategories") {
      const { data: serviceBookings, error: serviceError } = await supabase
        .from("service_bookings")
        .select("customer_email, service_name")
        .in("status", ["confirmed", "completed"]);

      if (serviceError) {
        return NextResponse.json({ error: serviceError.message }, { status: 500 });
      }

      const categories = BOOKING_CATEGORIES.map((category) => ({
        ...category,
        emails: [
          ...new Set(
            (serviceBookings || [])
              .filter((booking) =>
                String(booking.service_name || "").trim().toLowerCase() === category.serviceName.toLowerCase()
              )
              .map((booking) => String(booking.customer_email || "").trim().toLowerCase())
              .filter(Boolean)
          ),
        ],
      }));

      const currentDescriptions = categories.map((category) => categoryDescription(category.key));
      const { data: generatedLists } = await supabase
        .from("contact_lists")
        .select("id, description")
        .like("description", "Auto-synced booking category:%");

      const obsoleteListIds = (generatedLists || [])
        .filter((list) => !currentDescriptions.includes(list.description))
        .map((list) => list.id);

      if (obsoleteListIds.length > 0) {
        await supabase.from("contact_lists").delete().in("id", obsoleteListIds);
      }

      for (const category of categories) {
        const description = categoryDescription(category.key);
        const { data: existingList } = await supabase
          .from("contact_lists")
          .select("id")
          .eq("description", description)
          .maybeSingle();

        let listId = existingList?.id;
        if (!listId) {
          const { data: createdList, error: createError } = await supabase
            .from("contact_lists")
            .insert({ name: category.name, description, color: category.color })
            .select("id")
            .single();

          if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 500 });
          }
          listId = createdList.id;
        } else {
          await supabase
            .from("contact_lists")
            .update({ name: category.name, color: category.color, updated_at: new Date().toISOString() })
            .eq("id", listId);
        }

        await supabase.from("contact_list_members").delete().eq("list_id", listId);

        if (category.emails.length > 0) {
          const { error: memberError } = await supabase.from("contact_list_members").insert(
            category.emails.map((email) => ({
              list_id: listId,
              email,
              contact_source: "booking_category",
            }))
          );

          if (memberError) {
            return NextResponse.json({ error: memberError.message }, { status: 500 });
          }
        }
      }

      return NextResponse.json({ success: true });
    }

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
  } catch (error: unknown) {
    console.error("Error creating list:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
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
  } catch (error: unknown) {
    console.error("Error updating list:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
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
  } catch (error: unknown) {
    console.error("Error deleting list:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
