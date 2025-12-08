import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Fetch all bookings with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("payment_method");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    let query = supabase
      .from("class_bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (paymentMethod && paymentMethod !== "all") {
      if (paymentMethod === "pending") {
        query = query.is("paid_at", null);
      } else {
        query = query.eq("payment_method", paymentMethod);
      }
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const { data: allBookings } = await supabase
      .from("class_bookings")
      .select("status, paid_at, total_amount, payment_method, receipt_url, receipt_verified");

    const stats = {
      total: allBookings?.length || 0,
      confirmed: allBookings?.filter((b) => b.status === "confirmed").length || 0,
      pending: allBookings?.filter((b) => b.status === "pending").length || 0,
      pendingReceipts:
        allBookings?.filter(
          (b) => b.payment_method === "cash" && b.receipt_url && !b.receipt_verified
        ).length || 0,
      revenue:
        allBookings
          ?.filter((b) => b.paid_at)
          .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
    };

    return NextResponse.json({ bookings, stats });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
