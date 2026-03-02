import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get count of new product orders
    const { count: newOrdersCount } = await supabase
      .from("product_orders")
      .select("*", { count: "exact", head: true })
      .eq("is_new", true);

    // Get recent new orders for preview
    const { data: recentOrders } = await supabase
      .from("product_orders")
      .select("id, order_number, customer_name, total_amount, created_at")
      .eq("is_new", true)
      .order("created_at", { ascending: false })
      .limit(3);

    // Get count of unread inquiries
    const { count: newInquiriesCount } = await supabase
      .from("contact_submissions")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    // Get recent unread inquiries for preview
    const { data: recentInquiries } = await supabase
      .from("contact_submissions")
      .select("id, name, subject, created_at")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(3);

    const totalNotifications = (newOrdersCount || 0) + (newInquiriesCount || 0);

    return NextResponse.json({
      newOrdersCount: newOrdersCount || 0,
      recentOrders: recentOrders || [],
      newInquiriesCount: newInquiriesCount || 0,
      recentInquiries: recentInquiries || [],
      totalNotifications,
    });
  } catch (error: any) {
    console.error("Notifications API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
