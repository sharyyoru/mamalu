import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/api-auth";

/**
 * Reports API - Comprehensive business analytics
 * Provides client details, class types, booking analytics
 */

export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAuth(request, ["staff", "admin", "super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "overview";
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const period = searchParams.get("period") || "month"; // week, month, quarter, year

    // Calculate date range
    const { from, to } = getDateRange(period, startDate, endDate);

    switch (reportType) {
      case "overview":
        return NextResponse.json(await getOverviewReport(supabase, from, to));
      case "clients":
        return NextResponse.json(await getClientReport(supabase, from, to));
      case "classes":
        return NextResponse.json(await getClassReport(supabase, from, to));
      case "revenue":
        return NextResponse.json(await getRevenueReport(supabase, from, to));
      case "bookings":
        return NextResponse.json(await getBookingsReport(supabase, from, to));
      default:
        return NextResponse.json(await getOverviewReport(supabase, from, to));
    }
  } catch (error: any) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

function getDateRange(period: string, startDate?: string | null, endDate?: string | null) {
  const now = new Date();
  let from: Date;
  let to: Date = new Date(now);

  if (startDate && endDate) {
    from = new Date(startDate);
    to = new Date(endDate);
  } else {
    switch (period) {
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

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

/**
 * Overview Report - High-level business metrics
 */
async function getOverviewReport(supabase: any, from: string, to: string) {
  // Get booking stats
  const { data: bookings } = await supabase
    .from("class_bookings")
    .select("id, status, total_amount, payment_method, created_at, number_of_guests")
    .gte("created_at", from)
    .lte("created_at", to);

  // Get previous period for comparison
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const periodLength = toDate.getTime() - fromDate.getTime();
  const prevFrom = new Date(fromDate.getTime() - periodLength).toISOString();
  const prevTo = from;

  const { data: prevBookings } = await supabase
    .from("class_bookings")
    .select("id, status, total_amount")
    .gte("created_at", prevFrom)
    .lte("created_at", prevTo);

  // Calculate metrics
  const totalBookings = bookings?.length || 0;
  const confirmedBookings = bookings?.filter((b: any) => b.status === "confirmed" || b.status === "completed").length || 0;
  const pendingBookings = bookings?.filter((b: any) => b.status === "pending").length || 0;
  const cancelledBookings = bookings?.filter((b: any) => b.status === "cancelled").length || 0;
  
  const totalRevenue = bookings
    ?.filter((b: any) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0) || 0;

  const totalGuests = bookings?.reduce((sum: number, b: any) => sum + (b.number_of_guests || 1), 0) || 0;

  const prevTotalBookings = prevBookings?.length || 0;
  const prevRevenue = prevBookings
    ?.filter((b: any) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0) || 0;

  // Get unique customers
  const { count: newCustomers } = await supabase
    .from("profiles")
    .select("id", { count: "exact" })
    .gte("created_at", from)
    .lte("created_at", to);

  // Payment method breakdown
  const paymentMethods: Record<string, number> = {};
  bookings?.forEach((b: any) => {
    const method = b.payment_method || "pending";
    paymentMethods[method] = (paymentMethods[method] || 0) + 1;
  });

  return {
    period: { from, to },
    summary: {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue,
      totalGuests,
      newCustomers: newCustomers || 0,
      averageBookingValue: totalBookings > 0 ? totalRevenue / confirmedBookings : 0,
      conversionRate: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0,
    },
    comparison: {
      bookingsChange: prevTotalBookings > 0 
        ? ((totalBookings - prevTotalBookings) / prevTotalBookings) * 100 
        : 0,
      revenueChange: prevRevenue > 0 
        ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 
        : 0,
    },
    paymentMethods,
  };
}

/**
 * Client Report - Customer analytics and demographics
 */
async function getClientReport(supabase: any, from: string, to: string) {
  // Get all clients with bookings
  const { data: bookings } = await supabase
    .from("class_bookings")
    .select(`
      id,
      attendee_name,
      attendee_email,
      attendee_phone,
      class_type,
      total_amount,
      status,
      created_at,
      number_of_guests,
      notes
    `)
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: false });

  // Aggregate client data
  const clientMap = new Map<string, any>();
  
  bookings?.forEach((booking: any) => {
    const email = booking.attendee_email?.toLowerCase();
    if (!email) return;

    if (!clientMap.has(email)) {
      clientMap.set(email, {
        email,
        name: booking.attendee_name,
        phone: booking.attendee_phone,
        totalBookings: 0,
        confirmedBookings: 0,
        totalSpent: 0,
        totalGuests: 0,
        classTypes: new Set<string>(),
        firstBooking: booking.created_at,
        lastBooking: booking.created_at,
      });
    }

    const client = clientMap.get(email);
    client.totalBookings++;
    if (booking.status === "confirmed" || booking.status === "completed") {
      client.confirmedBookings++;
      client.totalSpent += booking.total_amount || 0;
    }
    client.totalGuests += booking.number_of_guests || 1;
    if (booking.class_type) {
      client.classTypes.add(booking.class_type);
    }
    if (new Date(booking.created_at) < new Date(client.firstBooking)) {
      client.firstBooking = booking.created_at;
    }
    if (new Date(booking.created_at) > new Date(client.lastBooking)) {
      client.lastBooking = booking.created_at;
    }
  });

  // Convert to array and categorize
  const clients = Array.from(clientMap.values()).map(client => ({
    ...client,
    classTypes: Array.from(client.classTypes),
    customerType: categorizeCustomer(client),
  }));

  // Sort by total spent
  clients.sort((a, b) => b.totalSpent - a.totalSpent);

  // Customer type distribution
  const customerTypes: Record<string, number> = {
    new: 0,
    returning: 0,
    vip: 0,
    inactive: 0,
  };

  clients.forEach(client => {
    customerTypes[client.customerType] = (customerTypes[client.customerType] || 0) + 1;
  });

  // Top clients by spend
  const topClients = clients.slice(0, 10);

  // Class type preferences
  const classTypePreferences: Record<string, number> = {};
  clients.forEach(client => {
    client.classTypes.forEach((type: string) => {
      classTypePreferences[type] = (classTypePreferences[type] || 0) + 1;
    });
  });

  return {
    period: { from, to },
    totalClients: clients.length,
    customerTypes,
    topClients: topClients.map(c => ({
      name: c.name,
      email: c.email,
      totalBookings: c.totalBookings,
      totalSpent: c.totalSpent,
      customerType: c.customerType,
      classTypes: c.classTypes,
    })),
    classTypePreferences,
    averageSpendPerClient: clients.length > 0 
      ? clients.reduce((sum, c) => sum + c.totalSpent, 0) / clients.length 
      : 0,
    averageBookingsPerClient: clients.length > 0
      ? clients.reduce((sum, c) => sum + c.totalBookings, 0) / clients.length
      : 0,
    allClients: clients.map(c => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      totalBookings: c.totalBookings,
      totalSpent: c.totalSpent,
      customerType: c.customerType,
      lastBooking: c.lastBooking,
    })),
  };
}

function categorizeCustomer(client: any): string {
  if (client.totalSpent >= 5000 || client.confirmedBookings >= 5) {
    return "vip";
  }
  if (client.confirmedBookings >= 2) {
    return "returning";
  }
  const daysSinceLastBooking = (Date.now() - new Date(client.lastBooking).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLastBooking > 90) {
    return "inactive";
  }
  return "new";
}

/**
 * Class Report - Class performance analytics
 */
async function getClassReport(supabase: any, from: string, to: string) {
  const { data: bookings } = await supabase
    .from("class_bookings")
    .select(`
      id,
      class_id,
      class_title,
      class_type,
      total_amount,
      status,
      number_of_guests,
      created_at
    `)
    .gte("created_at", from)
    .lte("created_at", to);

  // Aggregate by class
  const classMap = new Map<string, any>();

  bookings?.forEach((booking: any) => {
    const classId = booking.class_id;
    if (!classId) return;

    if (!classMap.has(classId)) {
      classMap.set(classId, {
        classId,
        title: booking.class_title,
        type: booking.class_type,
        totalBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        totalGuests: 0,
      });
    }

    const cls = classMap.get(classId);
    cls.totalBookings++;
    cls.totalGuests += booking.number_of_guests || 1;
    
    if (booking.status === "confirmed" || booking.status === "completed") {
      cls.confirmedBookings++;
      cls.totalRevenue += booking.total_amount || 0;
    } else if (booking.status === "cancelled") {
      cls.cancelledBookings++;
    }
  });

  const classes = Array.from(classMap.values());
  classes.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Class type breakdown
  const classTypes: Record<string, { bookings: number; revenue: number; guests: number }> = {};
  classes.forEach(cls => {
    const type = cls.type || "other";
    if (!classTypes[type]) {
      classTypes[type] = { bookings: 0, revenue: 0, guests: 0 };
    }
    classTypes[type].bookings += cls.confirmedBookings;
    classTypes[type].revenue += cls.totalRevenue;
    classTypes[type].guests += cls.totalGuests;
  });

  return {
    period: { from, to },
    totalClasses: classes.length,
    topClasses: classes.slice(0, 10).map(c => ({
      title: c.title,
      type: c.type,
      totalBookings: c.totalBookings,
      confirmedBookings: c.confirmedBookings,
      totalRevenue: c.totalRevenue,
      totalGuests: c.totalGuests,
      conversionRate: c.totalBookings > 0 ? (c.confirmedBookings / c.totalBookings) * 100 : 0,
    })),
    classTypes,
    allClasses: classes,
  };
}

/**
 * Revenue Report - Financial analytics
 */
async function getRevenueReport(supabase: any, from: string, to: string) {
  const { data: bookings } = await supabase
    .from("class_bookings")
    .select(`
      id,
      total_amount,
      payment_method,
      status,
      created_at,
      paid_at,
      class_type
    `)
    .gte("created_at", from)
    .lte("created_at", to)
    .in("status", ["confirmed", "completed"]);

  // Daily revenue breakdown
  const dailyRevenue: Record<string, number> = {};
  const monthlyRevenue: Record<string, number> = {};

  bookings?.forEach((booking: any) => {
    const date = new Date(booking.created_at).toISOString().split("T")[0];
    const month = date.substring(0, 7);
    
    dailyRevenue[date] = (dailyRevenue[date] || 0) + (booking.total_amount || 0);
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (booking.total_amount || 0);
  });

  // Revenue by payment method
  const revenueByPayment: Record<string, number> = {};
  bookings?.forEach((booking: any) => {
    const method = booking.payment_method || "other";
    revenueByPayment[method] = (revenueByPayment[method] || 0) + (booking.total_amount || 0);
  });

  // Revenue by class type
  const revenueByClassType: Record<string, number> = {};
  bookings?.forEach((booking: any) => {
    const type = booking.class_type || "other";
    revenueByClassType[type] = (revenueByClassType[type] || 0) + (booking.total_amount || 0);
  });

  const totalRevenue = bookings?.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0) || 0;

  return {
    period: { from, to },
    totalRevenue,
    averageTransactionValue: bookings?.length > 0 ? totalRevenue / bookings.length : 0,
    totalTransactions: bookings?.length || 0,
    dailyRevenue: Object.entries(dailyRevenue)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    monthlyRevenue: Object.entries(monthlyRevenue)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    revenueByPayment,
    revenueByClassType,
  };
}

/**
 * Bookings Report - Detailed booking analytics
 */
async function getBookingsReport(supabase: any, from: string, to: string) {
  const { data: bookings } = await supabase
    .from("class_bookings")
    .select(`
      id,
      booking_number,
      class_title,
      class_type,
      attendee_name,
      attendee_email,
      total_amount,
      status,
      payment_method,
      number_of_guests,
      created_at,
      checked_in_at,
      booking_source
    `)
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: false });

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  bookings?.forEach((b: any) => {
    statusBreakdown[b.status] = (statusBreakdown[b.status] || 0) + 1;
  });

  // Booking source breakdown
  const sourceBreakdown: Record<string, number> = {};
  bookings?.forEach((b: any) => {
    const source = b.booking_source || "website";
    sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
  });

  // Check-in rate
  const confirmedBookings = bookings?.filter((b: any) => 
    b.status === "confirmed" || b.status === "completed"
  ) || [];
  const checkedInBookings = confirmedBookings.filter((b: any) => b.checked_in_at);

  // Daily bookings trend
  const dailyBookings: Record<string, number> = {};
  bookings?.forEach((b: any) => {
    const date = new Date(b.created_at).toISOString().split("T")[0];
    dailyBookings[date] = (dailyBookings[date] || 0) + 1;
  });

  return {
    period: { from, to },
    totalBookings: bookings?.length || 0,
    statusBreakdown,
    sourceBreakdown,
    checkInRate: confirmedBookings.length > 0 
      ? (checkedInBookings.length / confirmedBookings.length) * 100 
      : 0,
    dailyBookings: Object.entries(dailyBookings)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    recentBookings: bookings?.slice(0, 20).map((b: any) => ({
      bookingNumber: b.booking_number,
      classTitle: b.class_title,
      classType: b.class_type,
      attendeeName: b.attendee_name,
      totalAmount: b.total_amount,
      status: b.status,
      paymentMethod: b.payment_method,
      guests: b.number_of_guests,
      createdAt: b.created_at,
      checkedIn: !!b.checked_in_at,
    })),
  };
}
