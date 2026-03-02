import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  source: string;
  total_spend?: number;
  booking_count?: number;
  last_booking?: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter"); // smart filter type
    const serviceType = searchParams.get("serviceType"); // birthday, corporate, nanny, rental
    const bookingMonth = searchParams.get("bookingMonth"); // YYYY-MM format
    const classTitle = searchParams.get("classTitle"); // specific class/menu

    // If using smart filters, query from bookings
    if (filter || serviceType || bookingMonth || classTitle) {
      return await getFilteredContacts(supabase, { filter, serviceType, bookingMonth, classTitle, search });
    }

    // Default: return all contacts
    const contacts: Contact[] = [];
    const emailSet = new Set<string>();

    // Get newsletter leads (all, not just subscribed)
    const { data: leads } = await supabase
      .from("newsletter_leads")
      .select("id, email, first_name, last_name")
      .neq("status", "unsubscribed")
      .order("created_at", { ascending: false });

    leads?.forEach(lead => {
      if (lead.email && !emailSet.has(lead.email.toLowerCase())) {
        emailSet.add(lead.email.toLowerCase());
        contacts.push({
          id: lead.id,
          email: lead.email,
          first_name: lead.first_name || undefined,
          last_name: lead.last_name || undefined,
          full_name: lead.first_name && lead.last_name 
            ? `${lead.first_name} ${lead.last_name}` 
            : lead.first_name || undefined,
          source: "newsletter_leads",
        });
      }
    });

    // Get profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .order("created_at", { ascending: false });

    profiles?.forEach(profile => {
      if (profile.email && !emailSet.has(profile.email.toLowerCase())) {
        emailSet.add(profile.email.toLowerCase());
        contacts.push({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || undefined,
          source: "profiles",
        });
      }
    });

    // Filter by search if provided
    let filteredContacts = contacts;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContacts = contacts.filter(c =>
        c.email.toLowerCase().includes(searchLower) ||
        (c.first_name && c.first_name.toLowerCase().includes(searchLower)) ||
        (c.last_name && c.last_name.toLowerCase().includes(searchLower)) ||
        (c.full_name && c.full_name.toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({
      contacts: filteredContacts,
      total: contacts.length,
    });
  } catch (error: any) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getFilteredContacts(
  supabase: any,
  options: {
    filter?: string | null;
    serviceType?: string | null;
    bookingMonth?: string | null;
    classTitle?: string | null;
    search?: string;
  }
) {
  const { filter, serviceType, bookingMonth, classTitle, search } = options;
  const contacts: Contact[] = [];
  const emailMap = new Map<string, Contact>();

  // Get class bookings
  let classQuery = supabase
    .from("class_bookings")
    .select("attendee_email, attendee_name, total_amount, created_at, class_title, status")
    .in("status", ["confirmed", "completed"]);

  if (classTitle) {
    classQuery = classQuery.ilike("class_title", `%${classTitle}%`);
  }
  if (bookingMonth) {
    const startDate = `${bookingMonth}-01`;
    const endDate = `${bookingMonth}-31`;
    classQuery = classQuery.gte("created_at", startDate).lte("created_at", endDate + "T23:59:59");
  }

  const { data: classBookings } = await classQuery;

  // Get service bookings
  let serviceQuery = supabase
    .from("service_bookings")
    .select("customer_email, customer_name, total_amount, created_at, service_type, service_name, status")
    .in("status", ["confirmed", "completed"]);

  if (serviceType) {
    if (serviceType === "birthday" || serviceType === "minichef") {
      serviceQuery = serviceQuery.eq("service_type", "birthday_deck");
    } else if (serviceType === "corporate" || serviceType === "bigchef") {
      serviceQuery = serviceQuery.eq("service_type", "corporate_deck");
    } else if (serviceType === "nanny") {
      serviceQuery = serviceQuery.eq("service_type", "nanny_class");
    } else if (serviceType === "walkin") {
      serviceQuery = serviceQuery.eq("service_type", "walkin_menu");
    }
  }
  if (bookingMonth) {
    const startDate = `${bookingMonth}-01`;
    const endDate = `${bookingMonth}-31`;
    serviceQuery = serviceQuery.gte("created_at", startDate).lte("created_at", endDate + "T23:59:59");
  }

  const { data: serviceBookings } = await serviceQuery;

  // Get rental bookings if filtering for rentals
  let rentalBookings: any[] = [];
  if (!serviceType || serviceType === "rental") {
    try {
      let rentalQuery = supabase
        .from("rental_bookings")
        .select("customer_email, customer_name, total_amount, created_at, status")
        .in("status", ["confirmed", "completed"]);

      if (bookingMonth) {
        const startDate = `${bookingMonth}-01`;
        const endDate = `${bookingMonth}-31`;
        rentalQuery = rentalQuery.gte("created_at", startDate).lte("created_at", endDate + "T23:59:59");
      }

      const { data } = await rentalQuery;
      rentalBookings = data || [];
    } catch (e) {
      // Table might not exist
    }
  }

  // Aggregate by email
  const processBooking = (email: string, name: string, amount: number, date: string, source: string) => {
    if (!email) return;
    const emailLower = email.toLowerCase();
    const existing = emailMap.get(emailLower);
    if (existing) {
      existing.total_spend = (existing.total_spend || 0) + (amount || 0);
      existing.booking_count = (existing.booking_count || 0) + 1;
      if (!existing.last_booking || date > existing.last_booking) {
        existing.last_booking = date;
      }
    } else {
      emailMap.set(emailLower, {
        id: emailLower,
        email: email,
        full_name: name || undefined,
        source,
        total_spend: amount || 0,
        booking_count: 1,
        last_booking: date,
      });
    }
  };

  // Process class bookings (only if not filtering by service type OR if it matches)
  if (!serviceType || serviceType === "class") {
    classBookings?.forEach((b: any) => {
      processBooking(b.attendee_email, b.attendee_name, b.total_amount, b.created_at, "class_booking");
    });
  }

  // Process service bookings
  if (!serviceType || ["birthday", "minichef", "corporate", "bigchef", "nanny", "walkin"].includes(serviceType)) {
    serviceBookings?.forEach((b: any) => {
      processBooking(b.customer_email, b.customer_name, b.total_amount, b.created_at, b.service_type);
    });
  }

  // Process rental bookings
  if (!serviceType || serviceType === "rental") {
    rentalBookings?.forEach((b: any) => {
      processBooking(b.customer_email, b.customer_name, b.total_amount, b.created_at, "rental");
    });
  }

  // Convert map to array
  let result = Array.from(emailMap.values());

  // Apply smart filters
  if (filter === "top100_spend") {
    result.sort((a, b) => (b.total_spend || 0) - (a.total_spend || 0));
    result = result.slice(0, 100);
  } else if (filter === "top100_recent") {
    result.sort((a, b) => {
      const dateA = a.last_booking || "";
      const dateB = b.last_booking || "";
      return dateB.localeCompare(dateA);
    });
    result = result.slice(0, 100);
  } else if (filter === "top100_orders") {
    result.sort((a, b) => (b.booking_count || 0) - (a.booking_count || 0));
    result = result.slice(0, 100);
  }

  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    result = result.filter(c =>
      c.email.toLowerCase().includes(searchLower) ||
      (c.full_name && c.full_name.toLowerCase().includes(searchLower))
    );
  }

  return NextResponse.json({
    contacts: result,
    total: result.length,
  });
}

// Get available filter options (class titles, months with bookings)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "getFilterOptions") {
      // Get unique class titles
      const { data: classBookings } = await supabase
        .from("class_bookings")
        .select("class_title")
        .in("status", ["confirmed", "completed"]);

      const classTitles = [...new Set(classBookings?.map((b: any) => b.class_title).filter(Boolean))].sort();

      // Get unique service names
      const { data: serviceBookings } = await supabase
        .from("service_bookings")
        .select("service_name, service_type")
        .in("status", ["confirmed", "completed"]);

      const serviceNames = [...new Set(serviceBookings?.map((b: any) => b.service_name).filter(Boolean))].sort();

      // Get months with bookings (last 24 months)
      const months: string[] = [];
      const now = new Date();
      for (let i = 0; i < 24; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }

      return NextResponse.json({
        classTitles,
        serviceNames,
        months,
        serviceTypes: [
          { value: "birthday", label: "Birthday Parties (Mini Chef)" },
          { value: "corporate", label: "Corporate Events (Big Chef)" },
          { value: "nanny", label: "Nanny Classes" },
          { value: "walkin", label: "Walk-in Menu" },
          { value: "rental", label: "Kitchen Rentals" },
        ],
        smartFilters: [
          { value: "top100_spend", label: "Top 100 by Total Spend" },
          { value: "top100_recent", label: "Top 100 Recent Customers" },
          { value: "top100_orders", label: "Top 100 by Order Count" },
        ],
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
