import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Buffer time after each booking for preparation/cleaning (in minutes)
const BUFFER_MINUTES = 60;

// Mamalu Schedule Time Slots with their durations
// Each slot has a start time, end time, duration, and days available
// days: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
const MAMALU_TIME_SLOTS = [
  { start: "11:00", end: "12:30", duration: 90, label: "11:00 AM - 12:30 PM", days: [0, 1, 2, 3, 4, 5, 6] }, // Mon-Sun
  { start: "13:30", end: "15:00", duration: 90, label: "1:30 PM - 3:00 PM", days: [0, 1, 2, 3, 4, 5, 6] }, // Mon-Sun
  { start: "16:00", end: "17:30", duration: 90, label: "4:00 PM - 5:30 PM", days: [0, 1, 2, 3, 4, 5, 6] }, // Mon-Sun
  { start: "18:30", end: "20:00", duration: 90, label: "6:30 PM - 8:00 PM", days: [0, 1, 2, 3, 4, 5, 6] }, // Mon-Sun
  { start: "21:00", end: "22:30", duration: 90, label: "9:00 PM - 10:30 PM", days: [4, 5] }, // Thu & Fri only
];

interface BookedSlot {
  event_time: string;
  duration_minutes: number;
}

interface TimeSlotInfo {
  start: string;
  end: string;
  duration: number;
  label: string;
  days: number[];
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function isSlotBlockedByBooking(
  slot: TimeSlotInfo,
  bookedSlots: BookedSlot[]
): boolean {
  const slotStart = parseTime(slot.start);
  const slotEnd = parseTime(slot.end) + BUFFER_MINUTES; // Add buffer after slot ends

  for (const booking of bookedSlots) {
    if (!booking.event_time) continue;
    
    const bookingStart = parseTime(booking.event_time);
    // Use the slot's duration or booking's stored duration
    const bookingDuration = booking.duration_minutes || 120;
    const bookingEnd = bookingStart + bookingDuration + BUFFER_MINUTES;

    // Check if the slot overlaps with existing booking (including buffer)
    // Overlap occurs if: slotStart < bookingEnd AND slotEnd > bookingStart
    if (slotStart < bookingEnd && slotEnd > bookingStart) {
      return true;
    }
  }

  return false;
}

function getSlotsForDay(dayOfWeek: number): TimeSlotInfo[] {
  return MAMALU_TIME_SLOTS.filter(slot => slot.days.includes(dayOfWeek));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    // Get day of week from date (0=Sunday, 1=Monday, ..., 6=Saturday)
    const dateObj = new Date(date + "T00:00:00");
    const dayOfWeek = dateObj.getDay();

    // Get slots available for this day of the week
    const slotsForDay = getSlotsForDay(dayOfWeek);

    const supabase = createAdminClient();
    if (!supabase) {
      // Return all slots for the day if DB not configured
      return NextResponse.json({
        date,
        dayOfWeek,
        allSlots: slotsForDay,
        availableSlots: slotsForDay,
        blockedSlots: [],
        bufferMinutes: BUFFER_MINUTES,
      });
    }

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
      duration_minutes: b.duration_minutes || 120,
    }));

    // Calculate available and blocked time slots
    const availableSlots = slotsForDay.filter(
      (slot) => !isSlotBlockedByBooking(slot, bookedSlots)
    );

    const blockedSlots = slotsForDay.filter(
      (slot) => isSlotBlockedByBooking(slot, bookedSlots)
    );

    return NextResponse.json({
      date,
      dayOfWeek,
      allSlots: slotsForDay,
      availableSlots,
      blockedSlots,
      bufferMinutes: BUFFER_MINUTES,
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
