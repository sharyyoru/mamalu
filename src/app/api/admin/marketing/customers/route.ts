import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { filters } = body;

    // Start with base query
    let query = supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        phone,
        date_of_birth,
        birthday_month,
        birthday_day,
        total_spend,
        total_classes_attended,
        last_booking_at,
        marketing_consent,
        email_enabled,
        sms_enabled,
        push_enabled,
        referral_code,
        created_at
      `)
      .eq("email_enabled", true);

    // Apply filters
    if (filters) {
      // Birthday filter
      if (filters.birthdayMonth) {
        query = query.eq("birthday_month", parseInt(filters.birthdayMonth));
      }
      if (filters.birthdayDay) {
        query = query.eq("birthday_day", parseInt(filters.birthdayDay));
      }
      if (filters.birthdayThisMonth) {
        const currentMonth = new Date().getMonth() + 1;
        query = query.eq("birthday_month", currentMonth);
      }
      if (filters.birthdayThisWeek) {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        const endDay = currentDay + 7;
        query = query
          .eq("birthday_month", currentMonth)
          .gte("birthday_day", currentDay)
          .lte("birthday_day", endDay);
      }

      // Purchase level filter
      if (filters.minSpend) {
        query = query.gte("total_spend", parseFloat(filters.minSpend));
      }
      if (filters.maxSpend) {
        query = query.lte("total_spend", parseFloat(filters.maxSpend));
      }

      // Spending tiers
      if (filters.spendingTier) {
        switch (filters.spendingTier) {
          case "vip":
            query = query.gte("total_spend", 5000);
            break;
          case "premium":
            query = query.gte("total_spend", 2000).lt("total_spend", 5000);
            break;
          case "regular":
            query = query.gte("total_spend", 500).lt("total_spend", 2000);
            break;
          case "new":
            query = query.lt("total_spend", 500);
            break;
        }
      }

      // Classes attended
      if (filters.minClasses) {
        query = query.gte("total_classes_attended", parseInt(filters.minClasses));
      }
      if (filters.maxClasses) {
        query = query.lte("total_classes_attended", parseInt(filters.maxClasses));
      }

      // Last activity filter (inactive customers)
      if (filters.inactiveDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(filters.inactiveDays));
        query = query.lt("last_booking_at", cutoffDate.toISOString());
      }

      // Active customers
      if (filters.activeDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(filters.activeDays));
        query = query.gte("last_booking_at", cutoffDate.toISOString());
      }

      // Has referral code
      if (filters.hasReferralCode) {
        query = query.not("referral_code", "is", null);
      }

      // Marketing consent
      if (filters.marketingConsent) {
        query = query.eq("marketing_consent", true);
      }

      // Channel preferences
      if (filters.emailEnabled) {
        query = query.eq("email_enabled", true);
      }
      if (filters.smsEnabled) {
        query = query.eq("sms_enabled", true);
      }
      if (filters.pushEnabled) {
        query = query.eq("push_enabled", true);
      }
    }

    const { data, error } = await query.order("total_spend", { ascending: false });

    if (error) throw error;

    // Get order frequency for each customer
    const customersWithFrequency = await Promise.all(
      (data || []).map(async (customer) => {
        const { count: orderCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", customer.id);

        const { count: bookingCount } = await supabase
          .from("class_bookings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", customer.id);

        return {
          ...customer,
          order_count: orderCount || 0,
          booking_count: bookingCount || 0,
          total_orders: (orderCount || 0) + (bookingCount || 0),
        };
      })
    );

    // Apply order frequency filters after fetching
    let filteredCustomers = customersWithFrequency;
    if (filters?.minOrders) {
      filteredCustomers = filteredCustomers.filter(
        c => c.total_orders >= parseInt(filters.minOrders)
      );
    }
    if (filters?.maxOrders) {
      filteredCustomers = filteredCustomers.filter(
        c => c.total_orders <= parseInt(filters.maxOrders)
      );
    }

    // Frequency tiers
    if (filters?.frequencyTier) {
      switch (filters.frequencyTier) {
        case "frequent":
          filteredCustomers = filteredCustomers.filter(c => c.total_orders >= 10);
          break;
        case "regular":
          filteredCustomers = filteredCustomers.filter(c => c.total_orders >= 3 && c.total_orders < 10);
          break;
        case "occasional":
          filteredCustomers = filteredCustomers.filter(c => c.total_orders >= 1 && c.total_orders < 3);
          break;
        case "first-time":
          filteredCustomers = filteredCustomers.filter(c => c.total_orders === 1);
          break;
        case "never":
          filteredCustomers = filteredCustomers.filter(c => c.total_orders === 0);
          break;
      }
    }

    return NextResponse.json({
      customers: filteredCustomers,
      count: filteredCustomers.length,
    });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get customer variables for email templates
export async function GET() {
  const variables = [
    { name: "first_name", label: "First Name", example: "John" },
    { name: "full_name", label: "Full Name", example: "John Smith" },
    { name: "email", label: "Email", example: "john@example.com" },
    { name: "phone", label: "Phone", example: "+971 50 123 4567" },
    { name: "total_spend", label: "Total Spend", example: "AED 2,500" },
    { name: "total_classes", label: "Classes Attended", example: "12" },
    { name: "referral_code", label: "Referral Code", example: "JOHN1234" },
    { name: "last_order_date", label: "Last Order Date", example: "Dec 15, 2024" },
    { name: "days_since_order", label: "Days Since Last Order", example: "30" },
    { name: "birthday", label: "Birthday", example: "March 15" },
    { name: "membership_duration", label: "Member Since", example: "6 months" },
  ];

  return NextResponse.json({ variables });
}
