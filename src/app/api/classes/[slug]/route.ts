import { NextRequest, NextResponse } from "next/server";
import { sanityClient, urlFor } from "@/lib/sanity/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch class from Sanity
    const classData = await sanityClient.fetch(`
      *[_type == "cookingClass" && slug.current == $slug][0] {
        _id,
        title,
        slug,
        description,
        mainImage,
        classType,
        numberOfSessions,
        sessionDuration,
        pricePerSession,
        fullPrice,
        startDate,
        spotsAvailable,
        maxSpots,
        location,
        instructorId
      }
    `, { slug });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Fetch instructor from database if instructorId exists
    let instructor = null;
    if (classData.instructorId) {
      const supabase = createAdminClient();
      if (supabase) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, instructor_title, instructor_image_url, avatar_url")
          .eq("id", classData.instructorId)
          .single();

        if (data) {
          instructor = {
            id: data.id,
            name: data.full_name,
            title: data.instructor_title,
            image: data.instructor_image_url || data.avatar_url,
          };
        }
      }
    }

    // Get image URL
    const image = classData.mainImage 
      ? urlFor(classData.mainImage).width(800).height(450).url()
      : null;

    return NextResponse.json({
      class: {
        ...classData,
        image,
        instructor,
      }
    });
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 });
  }
}
