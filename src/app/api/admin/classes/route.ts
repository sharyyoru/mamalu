import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanityClient } from "@/lib/sanity/client";

// GET: Fetch classes from Sanity with booking stats and instructor data from Supabase
export async function GET() {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Fetch classes from Sanity (now using instructorId instead of reference)
    const classes = await sanityClient.fetch(`
      *[_type == "cookingClass"] | order(startDate desc) {
        _id,
        title,
        "slug": slug.current,
        classType,
        numberOfSessions,
        sessionDuration,
        pricePerSession,
        fullPrice,
        startDate,
        spotsAvailable,
        maxSpots,
        location,
        featured,
        active,
        instructorId,
        "image": mainImage.asset->url
      }
    `);

    // Collect all instructor IDs
    const instructorIds = [...new Set(classes.map((c: { instructorId?: string }) => c.instructorId).filter(Boolean))];

    // Fetch instructor data from Supabase
    let instructorsMap: Record<string, {
      id: string;
      full_name: string;
      instructor_title: string | null;
      instructor_image_url: string | null;
      avatar_url: string | null;
    }> = {};

    if (instructorIds.length > 0) {
      const { data: instructors } = await supabase
        .from("profiles")
        .select("id, full_name, instructor_title, instructor_image_url, avatar_url")
        .in("id", instructorIds);

      if (instructors) {
        instructorsMap = Object.fromEntries(instructors.map(i => [i.id, i]));
      }
    }

    // Fetch booking counts from Supabase
    const { data: bookings } = await supabase
      .from("class_bookings")
      .select("class_id, status");

    // Calculate stats per class
    const bookingStats: Record<string, { total: number; confirmed: number; pending: number; revenue: number }> = {};
    
    if (bookings) {
      for (const booking of bookings) {
        if (!bookingStats[booking.class_id]) {
          bookingStats[booking.class_id] = { total: 0, confirmed: 0, pending: 0, revenue: 0 };
        }
        bookingStats[booking.class_id].total++;
        if (booking.status === 'confirmed' || booking.status === 'completed') {
          bookingStats[booking.class_id].confirmed++;
        } else if (booking.status === 'pending') {
          bookingStats[booking.class_id].pending++;
        }
      }
    }

    // Merge Sanity data with instructor info and booking stats
    const classesWithStats = classes.map((cls: { _id: string; instructorId?: string }) => {
      const instructor = cls.instructorId ? instructorsMap[cls.instructorId] : null;
      return {
        ...cls,
        instructor: instructor ? {
          id: instructor.id,
          name: instructor.full_name,
          title: instructor.instructor_title,
          image: instructor.instructor_image_url || instructor.avatar_url,
        } : null,
        bookings: bookingStats[cls._id] || { total: 0, confirmed: 0, pending: 0, revenue: 0 },
      };
    });

    // Overall stats
    const totalClasses = classes.length;
    const activeClasses = classes.filter((c: { active?: boolean }) => c.active).length;
    const totalBookings = bookings?.length || 0;
    const confirmedBookings = bookings?.filter(b => b.status === 'confirmed' || b.status === 'completed').length || 0;

    return NextResponse.json({
      classes: classesWithStats,
      stats: {
        totalClasses,
        activeClasses,
        totalBookings,
        confirmedBookings,
      }
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}
