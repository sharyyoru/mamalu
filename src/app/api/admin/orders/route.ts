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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = supabase
      .from("product_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate + "T23:59:59");
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get count of new orders
    const { count: newOrdersCount } = await supabase
      .from("product_orders")
      .select("*", { count: "exact", head: true })
      .eq("is_new", true);

    // Calculate stats
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    const paidOrders = orders?.filter(o => o.payment_status === "paid").length || 0;
    const deliveredOrders = orders?.filter(o => o.status === "delivered").length || 0;

    return NextResponse.json({
      orders: orders || [],
      stats: {
        totalOrders,
        totalRevenue,
        paidOrders,
        deliveredOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
      newOrdersCount: newOrdersCount || 0,
    });
  } catch (error: any) {
    console.error("Orders API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update order status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { orderId, status, trackingNumber } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    
    if (status) {
      updates.status = status;
      if (status === "shipped") {
        updates.shipped_at = new Date().toISOString();
      } else if (status === "delivered") {
        updates.delivered_at = new Date().toISOString();
      }
    }
    
    if (trackingNumber !== undefined) {
      updates.tracking_number = trackingNumber;
    }

    // Mark as not new when viewed/updated
    updates.is_new = false;

    const { data, error } = await supabase
      .from("product_orders")
      .update(updates)
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order: data });
  } catch (error: any) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Mark orders as viewed (clear new flag)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { action, orderIds } = body;

    if (action === "markViewed") {
      if (orderIds && orderIds.length > 0) {
        await supabase
          .from("product_orders")
          .update({ is_new: false })
          .in("id", orderIds);
      } else {
        // Mark all as viewed
        await supabase
          .from("product_orders")
          .update({ is_new: false })
          .eq("is_new", true);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Orders action error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
