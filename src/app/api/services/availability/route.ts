import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Buffer time after each booking for preparation/cleaning (in minutes)
const BUFFER_MINUTES = 60;

// Default service duration (in minutes) - can be overridden by service-specific duration
const DEFAULT_DURATION_MINUTES = 120;

// Available time slots (9 AM to 5 PM)
const ALL_TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

interface BookedSlot {
  event_time: string;
  duration_minutes: number;
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function isTimeSlotBlocked(
  slotTime: string,
  bookedSlots: BookedSlot[],
  requestedDuration: number
): boolean {
  const slotStart = parseTime(slotTime);
  const slotEnd = slotStart + requestedDuration + BUFFER_MINUTES;

  for (const booking of bookedSlots) {
    if (!booking.event_time) continue;
    
    const bookingStart = parseTime(booking.event_time);
    const bookingDuration = booking.duration_minutes || DEFAULT_DURATION_MINUTES;
    const bookingEnd = bookingStart + bookingDuration + BUFFER_MINUTES;

    // Check if the requested slot overlaps with existing booking (including buffer)
    // Overlap occurs if: slotStart < bookingEnd AND slotEnd > bookingStart
    if (slotStart < bookingEnd && slotEnd > bookingStart) {
      return true;
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const duration = searchParams.get("duration");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const requestedDuration = duration ? parseInt(duration, 10) : DEFAULT_DURATION_MINUTES;

    // Fetch all confirmed bookings for the given date
    const { data: bookings, error } = await supabase
      .from("service_bookings")
      .select("event_time, duration_minutes")
      .eq("event_date", date)
      .in("status", ["confirmed", "pending", "deposit_paid"]);

    if (error) {
      console.error("Error fetching bookings:", error);
      return NextResponse.json(
        { error: "Failed to fetch availability" },
        { status: 500 }
      );
    }

    const bookedSlots: BookedSlot[] = (bookings || []).map((b) => ({
      event_time: b.event_time || "",
      duration_minutes: b.duration_minutes || DEFAULT_DURATION_MINUTES,
    }));

    // Calculate available time slots
    const availableSlots = ALL_TIME_SLOTS.filter(
      (slot) => !isTimeSlotBlocked(slot, bookedSlots, requestedDuration)
    );

    // Also return blocked slots for UI feedback
    const blockedSlots = ALL_TIME_SLOTS.filter(
      (slot) => isTimeSlotBlocked(slot, bookedSlots, requestedDuration)
    );

    return NextResponse.json({
      date,
      availableSlots,
      blockedSlots,
      bufferMinutes: BUFFER_MINUTES,
      requestedDuration,
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
