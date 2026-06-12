import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BLOCKING_STATUSES = ["confirmed", "pending", "deposit_paid", "completed"];
const FULL_DAY_PACKAGE = "full day rental";

export async function GET() {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ blockedDates: [] });
    }

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dubai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const { data, error } = await supabase
      .from("service_bookings")
      .select("event_date, package_name")
      .gte("event_date", today)
      .in("status", BLOCKING_STATUSES)
      .ilike("service_name", "%rental%");

    if (error) {
      console.error("Rental availability query error:", error);
      return NextResponse.json(
        { error: "Could not check rental availability" },
        { status: 500 }
      );
    }

    const blockedDates = [...new Set(
      (data || [])
        .filter((booking) => booking.package_name?.trim().toLowerCase() === FULL_DAY_PACKAGE)
        .map((booking) => booking.event_date)
        .filter((date): date is string => Boolean(date))
    )].sort();

    return NextResponse.json({ blockedDates });
  } catch (error) {
    console.error("Rental availability error:", error);
    return NextResponse.json(
      { error: "Failed to check rental availability" },
      { status: 500 }
    );
  }
}
