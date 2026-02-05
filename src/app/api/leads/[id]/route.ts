import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET single lead with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    // Fetch lead with assigned user details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select(`
        *,
        assigned_user:assigned_to(id, full_name, email)
      `)
      .eq("id", id)
      .single();

    if (leadError) throw leadError;

    // Fetch lead's manual bookings
    const { data: leadBookings } = await supabase
      .from("lead_bookings")
      .select("*")
      .eq("lead_id", id)
      .order("event_date", { ascending: false });

    // Fetch service bookings linked to this lead
    const { data: serviceBookings } = await supabase
      .from("service_bookings")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false });

    // Fetch invoices linked to this lead
    const { data: invoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false });

    // Calculate total revenue
    const manualRevenue = (leadBookings || [])
      .filter((b: any) => b.payment_status === "paid")
      .reduce((sum: number, b: any) => sum + (parseFloat(b.amount) || 0), 0);

    const bookingRevenue = (serviceBookings || [])
      .filter((b: any) => b.payment_status === "paid" || b.payment_status === "deposit_paid")
      .reduce((sum: number, b: any) => sum + (parseFloat(b.total_amount) || 0), 0);

    const totalRevenue = manualRevenue + bookingRevenue;

    return NextResponse.json({
      lead,
      leadBookings: leadBookings || [],
      serviceBookings: serviceBookings || [],
      invoices: invoices || [],
      stats: {
        totalRevenue,
        manualRevenue,
        bookingRevenue,
        totalBookings: (leadBookings?.length || 0) + (serviceBookings?.length || 0),
        totalInvoices: invoices?.length || 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

// PUT update lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");
    
    const body = await request.json();
    const { assigned_user, ...updateData } = body; // Remove nested objects

    const { data, error } = await supabase
      .from("leads")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ lead: data });
  } catch (error: any) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Failed to create Supabase client");

    // Delete associated lead_bookings first
    await supabase.from("lead_bookings").delete().eq("lead_id", id);

    // Delete the lead
    const { error } = await supabase.from("leads").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete lead" },
      { status: 500 }
    );
  }
}
