import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range
    const now = new Date();
    let from: Date;
    let to: Date = new Date(now);

    if (startDate && endDate) {
      from = new Date(startDate);
      to = new Date(endDate);
      to.setHours(23, 59, 59, 999);
    } else {
      switch (period) {
        case "today":
          from = new Date(now);
          from.setHours(0, 0, 0, 0);
          break;
        case "week":
          from = new Date(now);
          from.setDate(from.getDate() - 7);
          break;
        case "quarter":
          from = new Date(now);
          from.setMonth(from.getMonth() - 3);
          break;
        case "year":
          from = new Date(now);
          from.setFullYear(from.getFullYear() - 1);
          break;
        case "month":
        default:
          from = new Date(now);
          from.setMonth(from.getMonth() - 1);
          break;
      }
    }

    // Also get previous period for comparison
    const periodLength = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodLength);
    const prevTo = new Date(from.getTime() - 1);

    const fromISO = from.toISOString();
    const toISO = to.toISOString();
    const prevFromISO = prevFrom.toISOString();
    const prevToISO = prevTo.toISOString();

    // Get service bookings (current period)
    const { data: serviceBookings } = await supabase
      .from("service_bookings")
      .select("*")
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .in("status", ["confirmed", "completed"]);

    // Get service bookings (previous period)
    const { data: prevServiceBookings } = await supabase
      .from("service_bookings")
      .select("total_amount, guest_count")
      .gte("created_at", prevFromISO)
      .lte("created_at", prevToISO)
      .in("status", ["confirmed", "completed"]);

    // Get class bookings (current period)
    const { data: classBookings } = await supabase
      .from("class_bookings")
      .select("*")
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .in("status", ["confirmed", "completed"]);

    // Get class bookings (previous period)
    const { data: prevClassBookings } = await supabase
      .from("class_bookings")
      .select("total_amount")
      .gte("created_at", prevFromISO)
      .lte("created_at", prevToISO)
      .in("status", ["confirmed", "completed"]);

    // Get payment links (current period)
    const { data: paymentLinks } = await supabase
      .from("payment_links")
      .select("*")
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .eq("status", "paid");

    // Get new customers (current period)
    const { data: newCustomers } = await supabase
      .from("profiles")
      .select("id")
      .gte("created_at", fromISO)
      .lte("created_at", toISO);

    // Get new customers (previous period)
    const { data: prevNewCustomers } = await supabase
      .from("profiles")
      .select("id")
      .gte("created_at", prevFromISO)
      .lte("created_at", prevToISO);

    // Calculate revenue totals
    const serviceRevenue = serviceBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    const classRevenue = classBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    const paymentLinkRevenue = paymentLinks?.reduce((sum, p) => sum + (p.paid_amount || p.amount || 0), 0) || 0;
    const totalRevenue = serviceRevenue + classRevenue + paymentLinkRevenue;

    const prevServiceRevenue = prevServiceBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    const prevClassRevenue = prevClassBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    const prevTotalRevenue = prevServiceRevenue + prevClassRevenue;

    const revenueChange = prevTotalRevenue > 0 
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue * 100).toFixed(1)
      : totalRevenue > 0 ? "100" : "0";

    // Calculate bookings
    const totalBookings = (serviceBookings?.length || 0) + (classBookings?.length || 0);
    const prevTotalBookings = (prevServiceBookings?.length || 0) + (prevClassBookings?.length || 0);
    const bookingsChange = prevTotalBookings > 0
      ? ((totalBookings - prevTotalBookings) / prevTotalBookings * 100).toFixed(1)
      : totalBookings > 0 ? "100" : "0";

    // Calculate guests
    const totalGuests = (serviceBookings?.reduce((sum, b) => sum + (b.guest_count || 1), 0) || 0) +
                        (classBookings?.reduce((sum, b) => sum + (b.sessions_booked || 1), 0) || 0);
    const prevTotalGuests = prevServiceBookings?.reduce((sum, b) => sum + (b.guest_count || 1), 0) || 0;
    const guestsChange = prevTotalGuests > 0
      ? ((totalGuests - prevTotalGuests) / prevTotalGuests * 100).toFixed(1)
      : totalGuests > 0 ? "100" : "0";

    // New customers change
    const customerChange = (prevNewCustomers?.length || 0) > 0
      ? (((newCustomers?.length || 0) - (prevNewCustomers?.length || 0)) / (prevNewCustomers?.length || 1) * 100).toFixed(1)
      : (newCustomers?.length || 0) > 0 ? "100" : "0";

    // Revenue breakdown by category
    const birthdayRevenue = serviceBookings?.filter(b => b.service_type === "birthday_deck").reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    const corporateRevenue = serviceBookings?.filter(b => b.service_type === "corporate_deck").reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    const nannyRevenue = serviceBookings?.filter(b => b.service_type === "nanny_class").reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    const walkinRevenue = serviceBookings?.filter(b => b.service_type === "walkin_menu").reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

    // Monthly revenue data (last 12 months)
    const monthlyRevenue: Array<{ month: string; value: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthServices = serviceBookings?.filter(b => {
        const d = new Date(b.created_at);
        return d >= monthDate && d <= monthEnd;
      }).reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      
      const monthClasses = classBookings?.filter(b => {
        const d = new Date(b.created_at);
        return d >= monthDate && d <= monthEnd;
      }).reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      monthlyRevenue.push({
        month: monthDate.toLocaleString("default", { month: "short" }),
        value: monthServices + monthClasses,
      });
    }

    // Top performing classes/services
    const serviceStats: Record<string, { name: string; bookings: number; revenue: number }> = {};
    serviceBookings?.forEach(b => {
      const name = b.package_name || b.service_name || b.service_type;
      if (!serviceStats[name]) {
        serviceStats[name] = { name, bookings: 0, revenue: 0 };
      }
      serviceStats[name].bookings++;
      serviceStats[name].revenue += b.total_amount || 0;
    });
    classBookings?.forEach(b => {
      const name = b.class_title;
      if (!serviceStats[name]) {
        serviceStats[name] = { name, bookings: 0, revenue: 0 };
      }
      serviceStats[name].bookings++;
      serviceStats[name].revenue += b.total_amount || 0;
    });

    const topPerformers = Object.values(serviceStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // KPIs
    const avgOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const prevAvgOrderValue = prevTotalBookings > 0 ? prevTotalRevenue / prevTotalBookings : 0;

    return NextResponse.json({
      period: { from: fromISO, to: toISO },
      stats: {
        totalRevenue,
        revenueChange: parseFloat(revenueChange as string),
        totalBookings,
        bookingsChange: parseFloat(bookingsChange as string),
        totalGuests,
        guestsChange: parseFloat(guestsChange as string),
        newCustomers: newCustomers?.length || 0,
        customerChange: parseFloat(customerChange as string),
      },
      revenueBreakdown: [
        { name: "Birthdays", value: birthdayRevenue, percentage: totalRevenue > 0 ? Math.round(birthdayRevenue / totalRevenue * 100) : 0, color: "bg-pink-500" },
        { name: "Corporate", value: corporateRevenue, percentage: totalRevenue > 0 ? Math.round(corporateRevenue / totalRevenue * 100) : 0, color: "bg-indigo-500" },
        { name: "Classes", value: classRevenue, percentage: totalRevenue > 0 ? Math.round(classRevenue / totalRevenue * 100) : 0, color: "bg-violet-500" },
        { name: "Nanny", value: nannyRevenue, percentage: totalRevenue > 0 ? Math.round(nannyRevenue / totalRevenue * 100) : 0, color: "bg-emerald-500" },
        { name: "Walk-in", value: walkinRevenue, percentage: totalRevenue > 0 ? Math.round(walkinRevenue / totalRevenue * 100) : 0, color: "bg-amber-500" },
        { name: "Payment Links", value: paymentLinkRevenue, percentage: totalRevenue > 0 ? Math.round(paymentLinkRevenue / totalRevenue * 100) : 0, color: "bg-cyan-500" },
      ].filter(r => r.value > 0),
      monthlyRevenue,
      topPerformers,
      kpis: {
        avgOrderValue: Math.round(avgOrderValue),
        prevAvgOrderValue: Math.round(prevAvgOrderValue),
        conversionRate: 0, // Would need more data
        repeatCustomerRate: 0, // Would need more data
      },
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
